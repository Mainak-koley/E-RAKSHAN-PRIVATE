/* Analytical framework weights — proposed for this prototype,
   NOT official government standards (as documented in the research PDF). */

export const DEFAULT_HAZARD_WEIGHTS = {
  rainfall: 0.25,
  slope: 0.20,
  riverProximity: 0.20,
  drainage: 0.15,
  lowElevation: 0.10,
  historical: 0.10,
};

export const HAZARD_CRITERIA = [
  { id: 'rainfall', label: 'Rainfall Intensity', desc: '24h rainfall vs 180mm extreme cap' },
  { id: 'slope', label: 'Slope Risk', desc: 'Terrain slope vs 40° landslide cap' },
  { id: 'riverProximity', label: 'River Proximity', desc: 'River distance (≤3.5km; reach widens as river rises)' },
  { id: 'drainage', label: 'Drainage Deficit', desc: 'Inverse of drainage index (1 = poor)' },
  { id: 'lowElevation', label: 'Low Elevation', desc: 'Relative position in district elevation range' },
  { id: 'historical', label: 'Historical Events', desc: 'Past hazard occurrences (≤6 events)' },
];

export const RISK_BANDS = [
  { id: 'low', max: 0.25, label: 'Low', action: 'Monitor', color: '#34d399', badge: 'green' },
  { id: 'moderate', max: 0.5, label: 'Moderate', action: 'Prepare', color: '#fbbf24', badge: 'amber' },
  { id: 'high', max: 0.75, label: 'High', action: 'Issue Warning', color: '#fb923c', badge: 'orange' },
  { id: 'critical', max: 1.01, label: 'Critical', action: 'Evacuate / Relocate', color: '#f87171', badge: 'red' },
];

export const PRIORITY_WEIGHTS = { hazard: 0.45, vulnerability: 0.35, exposure: 0.2 };

export const DEFAULT_VULN_WEIGHTS = {
  vulnerableShare: 0.4,   // elderly + children + disabled
  fragileHousing: 0.25,
  noVehicle: 0.2,
  hospitalAccess: 0.15,
};

export const DEFAULT_SUITABILITY_WEIGHTS = {
  hazardSafety: 0.3,
  capacity: 0.2,
  connectivity: 0.15,
  terrain: 0.15,
  livelihood: 0.1,
  services: 0.1,
};

export const SUITABILITY_FACTORS = [
  { id: 'hazardSafety', label: 'Hazard Safety' },
  { id: 'capacity', label: 'Housing / Space Capacity' },
  { id: 'connectivity', label: 'Connectivity & Access' },
  { id: 'terrain', label: 'Terrain / Buildability' },
  { id: 'livelihood', label: 'Livelihood Suitability' },
  { id: 'services', label: 'Services / Infrastructure' },
];

export const DEFAULT_SOLVER_WEIGHTS = {
  distance: 0.4,
  routeRisk: 0.3,
  crowding: 0.2,
  medical: 0.1,
};

export const OSIRIS_SOURCES = [
  { id: 'weather', label: 'IMD Weather / Rainfall', reliability: 0.95, status: 'live' },
  { id: 'dem', label: 'SRTM / CartoDEM Terrain', reliability: 0.99, status: 'static' },
  { id: 'osm', label: 'OSM Roads & Buildings', reliability: 0.85, status: 'static' },
  { id: 'bhuvan', label: 'ISRO Bhuvan / NRSC Flood Layers', reliability: 0.9, status: 'live' },
  { id: 'firms', label: 'NASA FIRMS / Sentinel-2', reliability: 0.88, status: 'delayed' },
  { id: 'census', label: 'Census Population Baseline', reliability: 0.8, status: 'static' },
  { id: 'citizen', label: 'Citizen SOS Channel', reliability: 0.6, status: 'live' },
  { id: 'cctv', label: 'CCTV Watchtowers (optional)', reliability: 0.75, status: 'degraded' },
];
