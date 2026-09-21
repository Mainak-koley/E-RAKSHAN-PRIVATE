/* Property schemas for each demo layer — used by tables, popups and forms. */
export const HABITATION_SCHEMA = {
  idField: 'id',
  titleField: 'name',
  fields: [
    { key: 'id', label: 'ID' }, { key: 'name', label: 'Habitation' }, { key: 'panchayath', label: 'Panchayath' },
    { key: 'population', label: 'Population', type: 'int' }, { key: 'households', label: 'Households', type: 'int' },
    { key: 'elderly_pct', label: 'Elderly %', type: 'num' }, { key: 'children_pct', label: 'Children %', type: 'num' },
    { key: 'disabled_pct', label: 'Disabled %', type: 'num' }, { key: 'fragile_housing_pct', label: 'Fragile Housing %', type: 'num' },
    { key: 'no_vehicle_pct', label: 'No Vehicle %', type: 'num' }, { key: 'dist_hospital_km', label: 'Hospital (km)', type: 'num' },
    { key: 'elevation_m', label: 'Elevation (m)', type: 'int' }, { key: 'slope_deg', label: 'Slope (°)', type: 'num' },
    { key: 'dist_river_km', label: 'River (km)', type: 'num' }, { key: 'drainage_index', label: 'Drainage Index', type: 'num' },
    { key: 'rainfall24_mm', label: 'Rainfall 24h (mm)', type: 'num' }, { key: 'hist_events', label: 'Historical Events', type: 'int' },
  ],
};

export const SHELTER_SCHEMA = {
  idField: 'id',
  titleField: 'name',
  fields: [
    { key: 'id', label: 'ID' }, { key: 'name', label: 'Shelter' }, { key: 'type', label: 'Type' },
    { key: 'capacity', label: 'Capacity', type: 'int' }, { key: 'occupancy', label: 'Occupancy', type: 'int' },
    { key: 'medical_support', label: 'Medical', type: 'bool' }, { key: 'water_kl', label: 'Water (kL)', type: 'int' },
    { key: 'sanitation_ok', label: 'Sanitation', type: 'bool' }, { key: 'operational', label: 'Operational', type: 'bool' },
    { key: 'managed_by', label: 'Managed By' },
  ],
};

export const SITE_SCHEMA = {
  idField: 'id',
  titleField: 'name',
  fields: [
    { key: 'id', label: 'ID' }, { key: 'name', label: 'Site' }, { key: 'type', label: 'Type' },
    { key: 'area_ha', label: 'Area (ha)', type: 'num' }, { key: 'hazard_safety', label: 'Hazard Safety', type: 'num' },
    { key: 'capacity_score', label: 'Capacity Score', type: 'num' }, { key: 'connectivity', label: 'Connectivity', type: 'num' },
    { key: 'terrain', label: 'Terrain', type: 'num' }, { key: 'livelihood', label: 'Livelihood', type: 'num' },
    { key: 'services', label: 'Services', type: 'num' },
  ],
};

export const ROAD_SCHEMA = {
  idField: 'id', titleField: 'name',
  fields: [
    { key: 'id', label: 'ID' }, { key: 'name', label: 'Road' }, { key: 'class', label: 'Class' },
    { key: 'status', label: 'Status' }, { key: 'flood_depth_cm', label: 'Flood Depth (cm)', type: 'int' },
    { key: 'surface', label: 'Surface' },
  ],
};

export const INCIDENT_SCHEMA = {
  idField: 'id', titleField: 'type',
  fields: [
    { key: 'id', label: 'ID' }, { key: 'type', label: 'Type' }, { key: 'severity', label: 'Severity' },
    { key: 'status', label: 'Status' }, { key: 'source', label: 'Source' }, { key: 'description', label: 'Description' },
    { key: 'reported_at', label: 'Reported', type: 'datetime' }, { key: 'location_name', label: 'Location' },
  ],
};

export const REDZONE_SCHEMA = {
  idField: 'id', titleField: 'name',
  fields: [
    { key: 'id', label: 'ID' }, { key: 'name', label: 'Zone' }, { key: 'hazard_type', label: 'Hazard' },
    { key: 'severity', label: 'Severity', type: 'num' }, { key: 'probability', label: 'Probability', type: 'num' },
    { key: 'population_exposed', label: 'Exposed Population', type: 'int' },
  ],
};
