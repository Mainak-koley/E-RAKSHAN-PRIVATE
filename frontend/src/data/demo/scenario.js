/* Baseline simulation scenario for the district-scale MVP demo
   (heavy-rainfall event over the selected district, per the documented demo workflow). */
export const BASELINE_SCENARIO = {
  rainfall: 40,
  riverLevel: 'rising',
  eventActive: false,
};

export const SCENARIO_PRESETS = [
  { id: 'baseline', label: 'Baseline Patrol', rainfall: 40, riverLevel: 'steady', eventActive: false, desc: 'Normal monsoon watch. No active trigger.' },
  { id: 'imt', label: 'Heavy Rainfall Watch', rainfall: 70, riverLevel: 'rising', eventActive: true, desc: 'IMD warning: 70mm event rainfall over upper catchment.' },
  { id: 'extreme', label: 'Extreme Event (Demo Trigger)', rainfall: 160, riverLevel: 'rising', eventActive: true, desc: 'Red alert simulation: 160mm event, river rising. Triggers red-zone recomputation.' },
  { id: 'receding', label: 'Receding Waters', rainfall: 30, riverLevel: 'receding', eventActive: true, desc: 'Rainfall tapering, river receding. Monitor return movements.' },
];

export const SIM_EVENTS = {
  ROAD_BLOCK: { id: 'road_block', label: 'Simulate Road Blockage', desc: 'Marks a major road segment blocked and recalculates routes / isolation.' },
  SHELTER_SURGE: { id: 'shelter_surge', label: 'Shelter Inflow Surge', desc: 'Pushes occupancy up at the largest shelters to stress capacity planning.' },
  SOS_BURST: { id: 'sos_burst', label: 'Citizen SOS Burst', desc: 'Injects a burst of citizen SOS reports needing verification.' },
};
