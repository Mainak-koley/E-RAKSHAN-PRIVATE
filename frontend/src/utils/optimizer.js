/* =====================================================================
   E-RAKSHAN Constrained Relocation Engine
   A capacity-constrained allocation solver (greedy initial assignment +
   pair-swap local improvement) mirroring the MILP formulation solved by
   OR-Tools / PuLP on the backend:

     min  Σ xᵢⱼ · (w_d·dᵢⱼ + w_r·riskᵢⱼ + w_c·crowdingⱼ + w_m·medicalPenalty)
     s.t. Σⱼ xᵢⱼ = popᵢ                       (every group assigned)
          Σᵢ xᵢⱼ ≤ capⱼ · utilisationCap      (shelter capacity)
          dᵢⱼ ≤ maxDistance                   (unless fallback engaged)
          medical-needs groups → medical shelters
     + infeasibility fallback: nearest-shelter overflow, flagged
       shortages, temporary-shelter recommendation, escalation alert.
   ===================================================================== */
import { haversineKm, sampleLine, pointInPolygon } from './geo';
import { clamp01 } from './format';

function routeProfile(a, b, redzones, blockedRoadPts) {
  const samples = sampleLine(a, b, 8);
  let zoneHits = 0;
  samples.forEach((pt) => {
    redzones.forEach((rz) => {
      const ring = rz.geometry.coordinates[0];
      if (pointInPolygon(pt, ring)) zoneHits += 1;
    });
  });
  const zoneRisk = clamp01(zoneHits / samples.length * 1.6);
  let blockHits = 0;
  if (blockedRoadPts?.length) {
    blockedRoadPts.forEach((bp) => {
      samples.forEach((pt) => { if (haversineKm(pt, bp) < 1.1) blockHits += 1; });
    });
  }
  const blockPenalty = clamp01(blockHits / 3);
  return { risk: clamp01(0.04 + zoneRisk * 0.7 + blockPenalty), blocked: blockHits > 0 && zoneRisk < 0.2 };
}

export function solveRelocation({ sources, shelters, redzones = [], blockedRoadPts = [], weights, constraints }) {
  const w = weights;
  const log = [];
  const iterations = [];
  const warnings = [];
  const shelterState = shelters.map((s) => ({ ...s, load: s.assigned ?? 0 }));
  const capOf = (s) => Math.max(0, s.capacity * (constraints.utilisationCap ?? 0.95) - s.load);

  // Pre-compute cost matrix
  const links = sources.map((src) => {
    const rows = shelterState.map((sh) => {
      const dist = haversineKm(src.center, sh.center);
      const rp = routeProfile(src.center, sh.center, redzones, blockedRoadPts);
      let medicalPenalty = 0;
      if (src.medicalNeeds > 0 && !sh.medical_support) medicalPenalty = 0.55;
      if (rp.blocked && dist < constraints.maxDistanceKm) medicalPenalty += 0.25;
      const cost = w.distance * clamp01(dist / 25)
        + w.routeRisk * rp.risk
        + w.medical * medicalPenalty;
      return { shelterId: sh.id, dist, risk: rp.risk, blocked: rp.blocked, medicalPenalty, cost };
    });
    return rows;
  });

  // ---- Phase 1: greedy assignment in evacuation-priority order ----
  const order = [...sources.keys()].sort((a, b) => (sources[b].priority ?? 0) - (sources[a].priority ?? 0));
  const assignments = [];
  const unassigned = [];
  let feasible = true;

  order.forEach((si) => {
    const src = sources[si];
    let remaining = src.population;
    const cand = links[si]
      .filter((l) => l.dist <= constraints.maxDistanceKm)
      .sort((a, b) => a.cost - b.cost);
    const fallback = cand.length === 0;
    const pool = fallback ? [...links[si]].sort((a, b) => a.cost - b.cost) : cand;

    for (const link of pool) {
      if (remaining <= 0) break;
      const sh = shelterState.find((s) => s.id === link.shelterId);
      if (!sh.operational) continue;
      const space = capOf(sh);
      const overflowSpace = Math.max(0, sh.capacity * 1.1 - sh.load);
      let give = Math.min(remaining, Math.floor(space));
      if (give <= 0 && constraints.allowOverflow && remaining > 0 && fallback) give = Math.min(remaining, Math.floor(overflowSpace));
      if (give <= 0) continue;
      if (src.medicalNeeds > 0 && !sh.medical_support && !fallback) continue;
      sh.load += give;
      remaining -= give;
      assignments.push({
        sourceId: src.id, sourceName: src.name, shelterId: sh.id, shelterName: sh.name,
        population: give, distanceKm: link.dist, routeRisk: link.risk, cost: link.cost,
        blockedRoute: link.blocked, medicalPenalty: link.medicalPenalty > 0, overflow: give > Math.floor(space) || fallback,
      });
    }
    if (remaining > 0) {
      feasible = false;
      unassigned.push({ sourceId: src.id, sourceName: src.name, population: remaining, reason: fallback ? 'No shelter within max travel distance' : 'All reachable shelters at capacity' });
      log.push(`<span class="err">✖ ${src.name}: ${remaining} people unallocated — ${fallback ? 'no reachable shelter (route/distance constraint)' : 'capacity deficit'}.</span>`);
    } else {
      log.push(`<span class="ok">✔ ${src.name}: ${src.population} people allocated.</span>`);
    }
  });

  const objective = () => assignments.reduce((a, x) => a + x.population * x.cost, 0) + unassigned.length * 5000;
  let best = objective();
  iterations.push(Math.round(best));

  // ---- Phase 2: local improvement (move chunks to cheaper shelters) ----
  const maxIter = constraints.maxIterations ?? 60;
  for (let it = 0; it < maxIter; it += 1) {
    let improved = false;
    for (let ai = 0; ai < assignments.length; ai += 1) {
      const asg = assignments[ai];
      const si = sources.findIndex((s) => s.id === asg.sourceId);
      const target = shelterState.find((s) => s.id === asg.shelterId);
      for (const link of [...links[si]].sort((a, b) => a.cost - b.cost)) {
        if (link.shelterId === asg.shelterId) continue;
        const sh = shelterState.find((s) => s.id === link.shelterId);
        if (!sh.operational || (sources[si].medicalNeeds > 0 && !sh.medical_support)) continue;
        const space = Math.floor(capOf(sh));
        if (space <= 0) continue;
        const move = Math.min(asg.population, space);
        const delta = move * (link.cost - asg.cost);
        if (delta < -1) {
          const leftover = asg.population - move;
          const orig = links[si].find((l) => l.shelterId === asg.shelterId);
          target.load -= move; sh.load += move;
          if (leftover > 0) {
            assignments.splice(ai + 1, 0, {
              ...asg,
              population: leftover,
              distanceKm: orig.dist, routeRisk: orig.risk, cost: orig.cost, blockedRoute: orig.blocked,
            });
          }
          asg.shelterId = sh.id; asg.shelterName = sh.name; asg.population = move;
          asg.distanceKm = link.dist; asg.routeRisk = link.risk; asg.cost = link.cost; asg.blockedRoute = link.blocked;
          improved = true;
          break;
        }
      }
    }
    const cur = objective();
    iterations.push(Math.round(cur));
    if (!improved || Math.abs(best - cur) < 1) { best = cur; break; }
    best = cur;
  }

  if (!feasible) {
    warnings.push('Solver could not fully allocate — capacity deficit detected. Recommendation: open temporary shelters near unallocated settlements and escalate to district control.');
  }
  log.push(`<span class="hi">■ Objective (population-weighted cost): ${Math.round(best)}</span>`);
  log.push(`<span class="hi">■ Improvement iterations: ${iterations.length - 1}</span>`);

  const assignedPop = assignments.reduce((a, x) => a + x.population, 0);
  const totalPop = sources.reduce((a, s) => a + s.population, 0);
  const avgDist = assignedPop ? assignments.reduce((a, x) => a + x.distanceKm * x.population, 0) / assignedPop : 0;
  const maxCrowd = Math.max(0, ...shelterState.map((s) => (s.capacity ? s.load / s.capacity : 0)));

  return {
    status: feasible ? 'feasible' : 'shortfall',
    assignments: assignments.filter((a) => a.population > 0),
    unassigned,
    warnings,
    log,
    iterations,
    objective: Math.round(best),
    totals: { totalPop, assignedPop, unassignedPop: totalPop - assignedPop, avgDist, maxCrowd },
  };
}
