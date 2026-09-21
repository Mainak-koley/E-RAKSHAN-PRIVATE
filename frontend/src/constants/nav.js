import {
  LayoutDashboard, Map as MapIcon, Users, ShieldAlert, Route, Tent, Target,
  Calculator, ClipboardList, BellRing, FileBarChart, Settings2,
} from 'lucide-react';

export const NAV_SECTIONS = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Command Dashboard', icon: LayoutDashboard, end: true },
      { to: '/map', label: 'Tactical Map', icon: MapIcon },
    ],
  },
  {
    id: 'analysis',
    label: 'Risk & Analysis',
    items: [
      { to: '/habitations', label: 'Habitations', icon: Users },
      { to: '/risk', label: 'Red-Zone Indexer', icon: ShieldAlert },
    ],
  },
  {
    id: 'operations',
    label: 'Relocation Ops',
    items: [
      { to: '/relocation', label: 'Relocation Engine', icon: Route },
      { to: '/sites', label: 'Safe Sites', icon: Tent },
      { to: '/capacity', label: 'Shelter Capacity', icon: Users },
      { to: '/optimization', label: 'Optimiser (MILP)', icon: Calculator },
    ],
  },
  {
    id: 'response',
    label: 'Response',
    items: [
      { to: '/alerts', label: 'Alerts & Evidence', icon: BellRing },
      { to: '/field', label: 'Field Reports', icon: ClipboardList },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    items: [
      { to: '/reports', label: 'Incident Reports', icon: FileBarChart },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { to: '/admin', label: 'Administration', icon: Settings2, roles: ['commander'] },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items.map((i) => ({ ...i, section: s.label })));
