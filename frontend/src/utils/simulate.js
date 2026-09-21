/* Event / feed simulators backing the mock websocket channel. */
import { mulberry32, randInt, pick } from './rng';
import { uid } from './rng';

const ALERT_TEMPLATES = [
  { sev: 'critical', type: 'Red Zone Expansion', src: 'Hazard Engine', msg: (r) => `Red zone ${pick(r, ['RZ-01', 'RZ-02', 'RZ-03'])} expanded after updated rainfall inputs — review evacuation priorities.` },
  { sev: 'critical', type: 'River Gauge', src: 'CWC / Bhuvan', msg: () => 'River level crossed warning mark at Panamaram gauge; inflow rising 14 cm/hr.' },
  { sev: 'high', type: 'Citizen SOS', src: 'Citizen Channel', msg: () => 'Crowdsourced SOS: water entering houses near the bridge, requesting evacuation support.' },
  { sev: 'high', type: 'Road Blockage', src: 'Field Officer', msg: () => 'Segment reported waterlogged — rerouting recommendations will update automatically.' },
  { sev: 'medium', type: 'CCTV Watchtower', src: 'OSIRIS CV (optional)', msg: () => 'Possible surface runoff on culvert — flagged for analyst verification.' },
  { sev: 'medium', type: 'Rainfall', src: 'IMD AWS', msg: () => 'Sustained rainfall 42 mm/hr over upper catchment for the last hour.' },
  { sev: 'low', type: 'Telemetry', src: 'AWS Network', msg: () => 'Automatic weather station heartbeat normal. All stations reporting.' },
  { sev: 'high', type: 'Shelter Load', src: 'Capacity Monitor', msg: () => 'Shelter approaching 90% occupancy — prepare overflow arrangements.' },
];

export function generateAlert(seed = Date.now()) {
  const rng = mulberry32(seed >>> 0);
  const t = pick(rng, ALERT_TEMPLATES);
  return {
    id: uid('ALR'),
    severity: t.sev,
    type: t.type,
    source: t.src,
    message: t.msg(rng),
    time: new Date().toISOString(),
    status: 'new',
    confidence: 0.55 + Math.round(rng() * 40) / 100,
  };
}

export function generateTelemetry(seed = Date.now()) {
  const rng = mulberry32(seed >>> 0);
  return {
    time: new Date().toISOString(),
    riverLevelCm: 180 + randInt(rng, -6, 14),
    rainfallMmHr: randInt(rng, 2, 60),
    windKmph: randInt(rng, 5, 38),
    stationsUp: randInt(rng, 10, 12),
    cctvUp: randInt(rng, 4, 8),
  };
}

export function rainfallSeries(seed = 7, n = 24) {
  const rng = mulberry32(seed);
  const out = [];
  let v = 4;
  for (let i = 0; i < n; i += 1) {
    v = Math.max(0, v + (rng() - 0.42) * 14 + (i > n - 6 ? 8 : 0));
    out.push({ t: `${String((i + 24 - n) % 24).padStart(2, '0')}:00`, rainfall: +v.toFixed(1) });
  }
  return out;
}
