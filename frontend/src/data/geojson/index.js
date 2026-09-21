/* District registry + loader for the static demo layers in /public/demo-data. */
export const DISTRICTS = [
  {
    id: 'wayanad',
    name: 'Wayanad',
    state: 'Kerala',
    division: 'Western Ghats highlands',
    center: [11.72, 76.13],
    zoom: 11,
    hazards: ['Landslide', 'Riverine Flood'],
  },
  {
    id: 'raigad',
    name: 'Raigad',
    state: 'Maharashtra',
    division: 'Konkan coast + Sahyadri escarpment',
    center: [18.42, 73.19],
    zoom: 10,
    hazards: ['Landslide', 'Riverine Flood', 'Coastal Surge'],
  },
];

export const getDistrict = (id) => DISTRICTS.find((d) => d.id === id) || DISTRICTS[0];

export const DEMO_FILES = {
  habitations: 'habitations.geojson',
  redzones: 'redzones.geojson',
  safeSites: 'safe-sites.geojson',
  shelters: 'shelters.geojson',
  roads: 'roads.geojson',
  incidents: 'incidents.geojson',
};

export async function loadDemoLayer(districtId, name) {
  const res = await fetch(`${import.meta.env.BASE_URL}demo-data/${districtId}/${DEMO_FILES[name]}`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Failed to load ${districtId}/${DEMO_FILES[name]} (${res.status})`);
  return res.json();
}

export async function loadDistrict(districtId, onProgress = () => {}) {
  const out = {};
  for (const name of Object.keys(DEMO_FILES)) {
    onProgress(name);
    out[name] = await loadDemoLayer(districtId, name);
  }
  return out;
}

/* Back-compat alias */
export const loadAllDemoLayers = loadDistrict;
