export const TILE_PROVIDERS = [
  {
    id: 'dark',
    label: 'Esri Dark Canvas (tactical)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, HERE, Garmin, FAO, NOAA, USGS',
    maxZoom: 16,
  },
  {
    id: 'satellite',
    label: 'Esri World Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, Maxar, Earthstar Geographics',
    maxZoom: 18,
  },
  {
    id: 'osm',
    label: 'OpenStreetMap Standard',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  {
    id: 'topo',
    label: 'OpenTopoMap (terrain)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap (CC-BY-SA)',
    maxZoom: 17,
    subdomains: 'abc',
  },
];

export const MAP_CENTER = [11.72, 76.13]; // Wayanad district, Kerala (demo district)
export const MAP_ZOOM = 11;

export const LAYER_DEFS = [
  { id: 'habitations', label: 'Habitations', color: 'var(--layer-habitation)' },
  { id: 'redzones', label: 'Dynamic Red Zones', color: 'var(--layer-redzone)' },
  { id: 'safesites', label: 'Safe Sites', color: 'var(--layer-safesite)' },
  { id: 'shelters', label: 'Relief Shelters', color: 'var(--layer-shelter)' },
  { id: 'roads', label: 'Road Network', color: 'var(--layer-road)' },
  { id: 'incidents', label: 'Incidents / SOS', color: 'var(--layer-incident)' },
  { id: 'vehicles', label: 'OSIRIS Live Tracks', color: 'var(--layer-vehicle)', live: true },
  { id: 'assignments', label: 'Relocation Routes', color: 'var(--layer-vehicle)', live: true },
];

export const SEVERITIES = {
  critical: { label: 'Critical', color: '#f87171', badge: 'red' },
  high: { label: 'High', color: '#fb923c', badge: 'orange' },
  medium: { label: 'Medium', color: '#fbbf24', badge: 'amber' },
  low: { label: 'Low', color: '#34d399', badge: 'green' },
};

export const INCIDENT_TYPES = [
  'Flooded Road', 'Landslide', 'Blocked Bridge', 'House Collapse', 'Medical SOS', 'Tree Fall', 'Missing Persons',
];

export const INCIDENT_SOURCES = ['Citizen SOS', 'Field Officer', 'Weather Station', 'CCTV Watchtower', 'Satellite Pass'];

export const INCIDENT_STATUSES = ['unverified', 'verified', 'responding', 'resolved'];

export const ALERT_SEVERITIES = ['critical', 'high', 'medium', 'low'];

export const ROAD_STATUS = {
  open: { label: 'Open', color: '#34d399' },
  partial: { label: 'Partial / Waterlogged', color: '#fbbf24' },
  blocked: { label: 'Blocked', color: '#f87171' },
};

export const VEHICLE_TYPES = {
  helicopter: { label: 'Rescue Helicopter', icon: 'helicopter' },
  ambulance: { label: 'Ambulance', icon: 'ambulance' },
  truck: { label: 'Rescue Truck', icon: 'truck' },
};
