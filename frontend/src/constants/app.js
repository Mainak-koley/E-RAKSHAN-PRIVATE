export const APP = {
  name: 'E-Rakshan',
  tagline: 'Hazard-to-Relocation Decision Support',
  fullName: 'E-Rakshan · Disaster Decision-Support Platform',
  version: 'v1.0.0-demo',
  district: 'Wayanad · Raigad (demo districts)',
  osiris: 'Operational Situation & Risk Intelligence System',
};

export const DECISION_CHAIN = [
  'Hazard', 'Vulnerability', 'Priority', 'Safe Site', 'Capacity', 'Route', 'Relocation Decision',
];

export const ROLES = {
  COMMANDER: 'commander',
  FIELD: 'field',
  ANALYST: 'analyst',
};

export const ROLE_META = {
  commander: { label: 'District Commander', scope: 'Full access · issue & verify decisions', color: 'cyan' },
  field: { label: 'Field Officer', scope: 'Reports, incidents, shelter updates', color: 'orange' },
  analyst: { label: 'Risk Analyst', scope: 'Risk engine, optimisation, reports', color: 'purple' },
};

export const DEMO_USERS = [
  { email: 'commander@erakshan.in', password: 'demo123', name: 'Meera Nair', role: 'commander' },
  { email: 'field@erakshan.in', password: 'demo123', name: 'Arjun Pillai', role: 'field' },
  { email: 'analyst@erakshan.in', password: 'demo123', name: 'Divya Raghavan', role: 'analyst' },
];

export const SIM_DEFAULTS = {
  rainfall: 40,        // mm event rainfall added over baseline
  riverLevel: 'rising',// rising | steady | receding
  eventActive: false,
};
