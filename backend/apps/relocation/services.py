"""
E-Rakshan Constrained Relocation Solver (Backend)
===================================================
Greedy capacity-constrained assignment + pair-swap local improvement.
Output format matches frontend optimizer.js exactly so the frontend
RelocationPage.jsx can consume it directly.

Output schema:
{
  "status": "feasible" | "shortfall",
  "assignments": [
    { sourceId, sourceName, shelterId, shelterName, population,
      distanceKm, routeRisk, cost, blockedRoute, overflow }
  ],
  "unassigned": [{ sourceId, sourceName, population, reason }],
  "warnings": [...strings],
  "iterations": [int, ...],          ← objective convergence trace for animation
  "objective": int,
  "totals": { totalPop, assignedPop, unassignedPop, avgDist, maxCrowd }
}
"""
import math
from django.contrib.gis.geos import Point
from .models import RelocationPlan, RelocationAssignment
from apps.habitations.models import Habitation
from apps.shelters.models import Shelter


def _haversine_km(a, b):
    """
    Haversine distance between two (lat, lng) tuples, in km.
    a = (lat, lng), b = (lat, lng)
    """
    R = 6371.0
    lat1, lng1 = math.radians(a[0]), math.radians(a[1])
    lat2, lng2 = math.radians(b[0]), math.radians(b[1])
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a_ = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a_))


def _clamp01(x):
    return max(0.0, min(1.0, float(x or 0)))


def _route_risk(dist_km, has_blocked_road=False):
    """Simple route risk estimate (0–1). Higher if road is blocked."""
    base = _clamp01(dist_km / 50.0) * 0.4
    return _clamp01(base + (0.4 if has_blocked_road else 0))


def solve_relocation(
    source_ids,
    max_distance_km=15.0,
    utilisation_cap=0.95,
    allow_overflow=False,
    weights=None,
):
    """
    Solve relocation for a list of habitation IDs.
    Returns a dict matching the frontend optimizer.js output schema.
    """
    weights = weights or {"distance": 0.4, "routeRisk": 0.3, "crowding": 0.2, "medical": 0.1}

    sources = list(
        Habitation.objects.filter(id__in=source_ids).order_by("-priority_score")
    )
    if not sources:
        return {"error": "No valid source habitations found"}

    # Use shelters from the same district as the first source
    district = sources[0].district
    shelters = list(Shelter.objects.filter(district=district, operational=True))

    if not shelters:
        return {
            "status": "shortfall",
            "assignments": [],
            "unassigned": [
                {"sourceId": h.id, "sourceName": h.name, "population": h.population,
                 "reason": "No operational shelters available in district"}
                for h in sources
            ],
            "warnings": ["No operational shelters found in district"],
            "iterations": [0],
            "objective": 0,
            "totals": {
                "totalPop": sum(h.population for h in sources),
                "assignedPop": 0,
                "unassignedPop": sum(h.population for h in sources),
                "avgDist": 0,
                "maxCrowd": 0,
            },
        }

    # ── Build cost matrix ────────────────────────────────────────────────
    shelter_state = {
        s.id: {
            "shelter": s,
            "load": s.current_occupancy,
            "capacity": s.capacity,
        }
        for s in shelters
    }

    def cap_of(sh_id):
        st = shelter_state[sh_id]
        return max(0, st["capacity"] * utilisation_cap - st["load"])

    def centroid(obj):
        loc = obj.location
        if loc:
            return (loc.y, loc.x)  # (lat, lng)
        return (0.0, 0.0)

    links = {}
    for src in sources:
        src_pt = centroid(src)
        rows = []
        for sh in shelters:
            sh_pt = centroid(sh)
            dist = _haversine_km(src_pt, sh_pt)
            route_risk = _route_risk(dist)
            medical_penalty = 0.0
            if not sh.medical_support:
                medical_penalty = 0.3
            cost = (
                weights["distance"] * _clamp01(dist / max(max_distance_km, 1))
                + weights["routeRisk"] * route_risk
                + weights["medical"] * medical_penalty
                + weights["crowding"] * _clamp01(sh.current_occupancy / max(sh.capacity, 1))
            )
            rows.append({
                "shelterId": sh.id,
                "shelterName": sh.name,
                "dist": dist,
                "routeRisk": route_risk,
                "medicalPenalty": medical_penalty,
                "cost": cost,
                "blocked": False,
            })
        links[src.id] = sorted(rows, key=lambda r: r["cost"])

    # ── Phase 1: Greedy assignment ────────────────────────────────────────
    assignments = []
    unassigned = []
    feasible = True
    log = []
    iterations = []

    for src in sources:
        remaining = src.population
        cands = [r for r in links[src.id] if r["dist"] <= max_distance_km]
        fallback = len(cands) == 0
        pool = cands if cands else links[src.id]

        for link in pool:
            if remaining <= 0:
                break
            sh_id = link["shelterId"]
            st = shelter_state[sh_id]
            space = int(cap_of(sh_id))
            overflow_space = int(max(0, st["capacity"] * 1.1 - st["load"]))
            give = min(remaining, space)
            if give <= 0 and allow_overflow and fallback:
                give = min(remaining, overflow_space)
            if give <= 0:
                continue
            st["load"] += give
            remaining -= give
            assignments.append({
                "sourceId": src.id,
                "sourceName": src.name,
                "shelterId": sh_id,
                "shelterName": link["shelterName"],
                "population": give,
                "distanceKm": round(link["dist"], 2),
                "routeRisk": round(link["routeRisk"], 3),
                "cost": round(link["cost"], 4),
                "blockedRoute": link["blocked"],
                "medicalPenalty": link["medicalPenalty"] > 0,
                "overflow": give > space or fallback,
            })

        if remaining > 0:
            feasible = False
            unassigned.append({
                "sourceId": src.id,
                "sourceName": src.name,
                "population": remaining,
                "reason": "No shelter within max travel distance" if fallback else "All reachable shelters at capacity",
            })

    # ── Objective function ────────────────────────────────────────────────
    def objective():
        return sum(a["population"] * a["cost"] for a in assignments) + len(unassigned) * 5000

    best = objective()
    iterations.append(round(best))

    # ── Phase 2: Pair-swap local improvement ──────────────────────────────
    max_iter = 60
    for it in range(max_iter):
        improved = False
        for i, asg in enumerate(assignments):
            si = next((j for j, s in enumerate(sources) if s.id == asg["sourceId"]), None)
            if si is None:
                continue
            current_link = asg
            for link in links[asg["sourceId"]]:
                if link["shelterId"] == asg["shelterId"]:
                    continue
                st = shelter_state[link["shelterId"]]
                space = int(cap_of(link["shelterId"]))
                if space <= 0:
                    continue
                move = min(asg["population"], space)
                delta = move * (link["cost"] - asg["cost"])
                if delta < -1:
                    # Apply swap
                    shelter_state[asg["shelterId"]]["load"] -= move
                    st["load"] += move
                    leftover = asg["population"] - move
                    if leftover > 0:
                        assignments.insert(i + 1, {**asg, "population": leftover})
                    asg["shelterId"] = link["shelterId"]
                    asg["shelterName"] = link["shelterName"]
                    asg["population"] = move
                    asg["distanceKm"] = round(link["dist"], 2)
                    asg["routeRisk"] = round(link["routeRisk"], 3)
                    asg["cost"] = round(link["cost"], 4)
                    asg["blockedRoute"] = link["blocked"]
                    improved = True
                    break

        cur = objective()
        iterations.append(round(cur))
        if not improved or abs(best - cur) < 1:
            best = cur
            break
        best = cur

    # ── Totals ────────────────────────────────────────────────────────────
    total_pop = sum(src.population for src in sources)
    assigned_pop = sum(a["population"] for a in assignments)
    avg_dist = (
        sum(a["distanceKm"] * a["population"] for a in assignments) / assigned_pop
        if assigned_pop
        else 0
    )
    max_crowd = max(
        (st["load"] / max(st["capacity"], 1) for st in shelter_state.values()),
        default=0,
    )

    warnings = []
    if not feasible:
        warnings.append(
            "Solver could not fully allocate all people — capacity deficit detected. "
            "Recommendation: open temporary shelters near unallocated settlements."
        )

    # ── Persist to DB ──────────────────────────────────────────────────────
    plan = RelocationPlan.objects.create(
        status="feasible" if feasible else "shortfall",
        total_population=total_pop,
        assigned_population=assigned_pop,
        unassigned_population=total_pop - assigned_pop,
        objective_cost=round(best, 2),
        convergence_trace=iterations,
        warnings=warnings,
    )
    for a in assignments:
        if a["population"] <= 0:
            continue
        try:
            src_hab = next(s for s in sources if s.id == a["sourceId"])
            tgt_sh = shelter_state[a["shelterId"]]["shelter"]
            RelocationAssignment.objects.create(
                plan=plan,
                source_habitation=src_hab,
                target_shelter=tgt_sh,
                population_allocated=a["population"],
                distance_km=a["distanceKm"],
                route_risk=a["routeRisk"],
                overflow_engaged=a["overflow"],
            )
        except (StopIteration, KeyError):
            pass

    return {
        "plan_id": plan.pk,
        "status": plan.status,
        "assignments": [a for a in assignments if a["population"] > 0],
        "unassigned": unassigned,
        "warnings": warnings,
        "log": [],
        "iterations": iterations,
        "objective": round(best),
        "totals": {
            "totalPop": total_pop,
            "assignedPop": assigned_pop,
            "unassignedPop": total_pop - assigned_pop,
            "avgDist": round(avg_dist, 2),
            "maxCrowd": round(max_crowd, 3),
        },
    }
