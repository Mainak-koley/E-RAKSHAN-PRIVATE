/* Endpoint map mirroring the recommended API structure so the demo can be
   swapped for the live backend by flipping VITE_DEMO_MODE=false. */
export const ENDPOINTS = {
  currentHazards: '/hazards/current',
  simulateHazard: '/hazards/simulate',
  settlementPriorities: '/settlements/priorities',
  shelters: '/shelters',
  shelterCapacity: (id) => `/shelters/${id}/capacity`,
  relocationSolve: '/relocation/solve',
  relocationAssignments: '/relocation/assignments',
  incidents: '/incidents',
  verifyIncident: (id) => `/incidents/${id}/verify`,
  route: (o, d) => `/routes/${o}/${d}`,
  dashboardSummary: '/dashboard/summary',
  eventsWs: '/events',
};
