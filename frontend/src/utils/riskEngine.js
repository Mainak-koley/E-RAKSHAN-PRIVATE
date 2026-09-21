/* =====================================================================
   E-RAKSHAN Risk & Priority Engine (in-browser implementation of the documented
   analytical framework):
     hazard    = Σ wᵢ · factorᵢ        (all factors normalized 0–1)
     priority  = f(hazard, vulnerability, exposed population)
   Banding follows the recommended classification:
     0–0.25 Monitor · 0.25–0.5 Prepare · 0.5–0.75 Issue Warning
     0.75–1.0 Evacuate / Relocate
   ===================================================================== */
import { clamp01 } from './format';
import { RISK_BANDS, PRIORITY_WEIGHTS } from '../constants/risk';

export function effectiveRainfall(hab, scenario) {
  const base = hab.properties.rainfall24_mm ?? 0;
  if (!scenario?.eventActive) return base;
  // Local factor: hill-facing settlements receive more of the event rain.
  const local = 0.7 + (hab.properties.event_exposure ?? 0.6);
  return base + (scenario.rainfall ?? 0) * local * (scenario.riverLevel === 'receding' ? 0.6 : 1);
}

export function factorContributions(hab, stats, weights, scenario) {
  const p = hab.properties;
  const rain = clamp01(effectiveRainfall(hab, scenario) / 140);
  const slope = clamp01((p.slope_deg ?? 5) / 30);
  // Rising river stage extends the effective flood-reach distance (CWC practice).
  const stageBonus = scenario?.eventActive
    ? (scenario.riverLevel === 'rising' ? 1.7 : scenario.riverLevel === 'steady' ? 1.35 : 1.0)
    : 1.0;
  const river = clamp01(1 - (p.dist_river_km ?? 5) / (3.5 * stageBonus));
  const drainage = clamp01(1 - (p.drainage_index ?? 0.6));
  const elev = clamp01((stats.maxElev - (p.elevation_m ?? stats.midElev)) / Math.max(1, stats.maxElev - stats.minElev));
  const hist = clamp01((p.hist_events ?? 0) / 6);
  return { rainfall: rain, slope, riverProximity: river, drainage, lowElevation: elev, historical: hist };
}

export function hazardScore(hab, stats, weights, scenario) {
  const c = factorContributions(hab, stats, weights, scenario);
  let s = 0; let tw = 0;
  Object.entries(weights).forEach(([k, w]) => { s += (c[k] ?? 0) * w; tw += w; });
  return { score: clamp01(tw ? s / tw : 0), contributions: c };
}

export function vulnerabilityScore(hab, vw = null) {
  const p = hab.properties;
  const vulnerableShare = clamp01(((p.elderly_pct ?? 8) + (p.children_pct ?? 12) + (p.disabled_pct ?? 2)) / 100 * 1.4);
  const fragile = clamp01((p.fragile_housing_pct ?? 20) / 100);
  const noVehicle = clamp01((p.no_vehicle_pct ?? 30) / 100);
  const hospital = clamp01((p.dist_hospital_km ?? 5) / 12);
  const parts = {
    vulnerableShare, fragileHousing: fragile, noVehicle, hospitalAccess: hospital,
  };
  const w = vw || { vulnerableShare: 0.4, fragileHousing: 0.25, noVehicle: 0.2, hospitalAccess: 0.15 };
  let s = 0; let tw = 0;
  Object.entries(parts).forEach(([k, v]) => { s += v * (w[k] ?? 0); tw += w[k] ?? 0; });
  return { score: clamp01(tw ? s / tw : 0), parts };
}

export function riskBand(score) {
  return RISK_BANDS.find((b) => score < b.max) || RISK_BANDS[RISK_BANDS.length - 1];
}

export function riskColor(score) {
  return riskBand(score).color;
}

/* Enrich a habitation feature with the full analytical chain. */
export function evaluateHabitation(hab, stats, hazardWeights, vulnWeights, scenario, maxPop) {
  const hz = hazardScore(hab, stats, hazardWeights, scenario);
  const vul = vulnerabilityScore(hab, vulnWeights);
  const exposure = clamp01(Math.sqrt((hab.properties.population ?? 0) / Math.max(1, maxPop)));
  const priority = clamp01(
    PRIORITY_WEIGHTS.hazard * hz.score + PRIORITY_WEIGHTS.vulnerability * vul.score + PRIORITY_WEIGHTS.exposure * exposure,
  );
  return {
    hazard: hz.score,
    hazardParts: hz.contributions,
    vulnerability: vul.score,
    vulnParts: vul.parts,
    exposure,
    priority,
    band: riskBand(hz.score),
    action: riskBand(hz.score).action,
    rainfallNow: effectiveRainfall(hab, scenario),
  };
}

/* Confidence model for citizen/field observations (OSIRIS-style):
   confidence = reliability × recency × verification × authority */
export function observationConfidence(inc) {
  const p = inc.properties ?? inc;
  const reliability = { 'Citizen SOS': 0.6, 'Field Officer': 0.9, 'Weather Station': 0.95, 'CCTV Watchtower': 0.75, 'Satellite Pass': 0.88 }[p.source] ?? 0.5;
  const ageH = (Date.now() - new Date(p.reported_at ?? Date.now()).getTime()) / 36e5;
  const recency = clamp01(1 - ageH / 48);
  const verification = p.status === 'verified' || p.status === 'responding' ? 0.9 : p.status === 'resolved' ? 1 : 0.35;
  const authority = p.authority_confirmed ? 1 : 0;
  return clamp01(reliability * (0.75 + 0.25 * recency) * (0.55 + 0.45 * verification) * (0.7 + 0.3 * authority));
}
