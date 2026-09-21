import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loadDistrict, getDistrict, DISTRICTS } from '../data/geojson';
import { BASELINE_SCENARIO, SCENARIO_PRESETS } from '../data/demo/scenario';
import { DEFAULT_HAZARD_WEIGHTS, DEFAULT_VULN_WEIGHTS } from '../constants/risk';
import { evaluateHabitation, effectiveRainfall } from '../utils/riskEngine';
import { centroidOf, haversineKm } from '../utils/geo';
import { clamp01 } from '../utils/format';
import { generateAlert } from '../utils/simulate';
import { uid } from '../utils/rng';
import { useApp } from './AppContext';
import { loadLS, saveLS } from '../utils/storage';

const DemoContext = createContext(null);
export const useDemo = () => useContext(DemoContext);

/* Live OSIRIS tracks: rescue assets patrolling between key nodes. */
function buildVehicles(data) {
  const nodes = (data?.habitations?.features || []).slice(0, 14).map((f) => centroidOf(f.geometry));
  if (nodes.length < 4) return [];
  const pickNode = (i) => nodes[i % nodes.length];
  const mk = (id, type, label, a, b) => ({
    id, type, label,
    from: a, to: b,
    fromLabel: 'Base', toLabel: 'Patrol leg',
  });
  return [
    mk('HELI-1', 'helicopter', 'Chetak Rescue 1', pickNode(0), pickNode(5)),
    mk('HELI-2', 'helicopter', 'ALH Dhruv 2', pickNode(3), pickNode(9)),
    mk('AMB-1', 'ambulance', '108 Ambulance Alpha', pickNode(2), pickNode(7)),
    mk('TRK-1', 'truck', 'SRDF Truck 1', pickNode(4), pickNode(11)),
  ];
}

export function DemoProvider({ children }) {
  const { notify } = useApp();
  const [districtId, setDistrictIdState] = useState(() => loadLS('district', 'wayanad'));
  const cacheRef = useRef({});
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');
  const [scenario, setScenario] = useState(BASELINE_SCENARIO);
  const [hazardWeights, setHazardWeights] = useState(DEFAULT_HAZARD_WEIGHTS);
  const [vulnWeights] = useState(DEFAULT_VULN_WEIGHTS);
  const [telemetry, setTelemetry] = useState({
    riverLevelCm: 182, rainfallMmHr: 6, windKmph: 12, stationsUp: 11, cctvUp: 6, time: new Date().toISOString(),
  });

  useEffect(() => {
    if (cacheRef.current[districtId]) {
      setData(cacheRef.current[districtId]);
      setError(null);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    setProgress('');
    let cancelled = false;
    loadDistrict(districtId, setProgress)
      .then((layers) => {
        if (cancelled) return;
        cacheRef.current[districtId] = layers;
        setData(layers);
        setError(null);
      })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [districtId]);

  const setDistrict = useCallback((id) => {
    if (id === districtId) return;
    setDistrictIdState(id);
    saveLS('district', id);
  }, [districtId]);

  const district = getDistrict(districtId);

  /* ---------------- Derived analytics ---------------- */
  const stats = useMemo(() => {
    const hs = (data?.habitations?.features || []).map((f) => f.properties.elevation_m ?? 700);
    return {
      minElev: Math.min(...hs, 700), maxElev: Math.max(...hs, 701),
      midElev: hs.length ? hs.reduce((a, b) => a + b, 0) / hs.length : 700,
      maxPop: Math.max(1, ...(data?.habitations?.features || []).map((f) => f.properties.population ?? 0)),
    };
  }, [data]);

  /* Roads / shelters / incidents / sites as mutable state once loaded */
  const [roads, setRoads] = useState(null);
  const [shelters, setShelters] = useState(null);
  const [incidents, setIncidents] = useState(null);
  const [safeSites, setSafeSites] = useState(null);
  useEffect(() => {
    if (!data) return;
    setRoads(data.roads); setShelters(data.shelters); setIncidents(data.incidents); setSafeSites(data.safeSites);
  }, [data]);

  const evaluated = useMemo(() => (data?.habitations?.features || []).map((f) => ({
    ...f,
    analysis: evaluateHabitation(f, stats, hazardWeights, vulnWeights, scenario, stats.maxPop),
  })), [data, stats, hazardWeights, vulnWeights, scenario]);

  const habById = useMemo(() => Object.fromEntries(evaluated.map((f) => [f.properties.id, f])), [evaluated]);

  /* Dynamic red zones — severity shifts with the active scenario. */
  const effectiveRedzones = useMemo(() => ({
    ...data?.redzones,
    features: (data?.redzones?.features || []).map((f) => {
      const drift = scenario.eventActive
        ? (scenario.rainfall / 400) * (f.properties.hazard_type === 'Landslide' ? 0.9 : 1.1)
        : -0.06;
      return { ...f, properties: { ...f.properties, base_severity: f.properties.severity, severity: clamp01(f.properties.severity + drift) } };
    }),
  }), [data, scenario]);

  /* Isolation detection: a habitation is isolated when every road connecting
     it is blocked (research doc §9 — "ISOLATED — NO SAFE LAND ROUTE"). */
  const isolation = useMemo(() => {
    const map = {};
    (roads?.features || []).forEach((r) => {
      const ids = r.properties.connects || [];
      const blocked = r.properties.status === 'blocked';
      ids.forEach((id) => {
        map[id] = map[id] || { total: 0, blocked: 0 };
        map[id].total += 1;
        if (blocked) map[id].blocked += 1;
      });
    });
    return map;
  }, [roads]);

  const isIsolated = useCallback((habId) => {
    const m = isolation[habId];
    return !!m && m.total > 0 && m.blocked === m.total;
  }, [isolation]);

  /* ---------------- Mutations ---------------- */
  const setRoadStatus = useCallback((roadId, status) => {
    setRoads((rs) => ({
      ...rs,
      features: rs.features.map((f) => (f.properties.id === roadId
        ? { ...f, properties: { ...f.properties, status } } : f)),
    }));
  }, []);

  const addIncident = useCallback((partial) => {
    const feature = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: partial.coordinates },
      properties: {
        id: uid('INC'),
        type: partial.type || 'Flooded Road',
        severity: partial.severity || 'medium',
        status: 'unverified',
        source: partial.source || 'Field Officer',
        description: partial.description || '',
        location_name: partial.location_name || '',
        reported_at: new Date().toISOString(),
        authority_confirmed: false,
        reportedBy: partial.reportedBy || 'Field Officer',
      },
    };
    setIncidents((is) => ({ ...is, features: [feature, ...(is?.features || [])] }));
    return feature;
  }, []);

  const setIncidentStatus = useCallback((incidentId, status) => {
    setIncidents((is) => ({
      ...is,
      features: is.features.map((f) => (f.properties.id === incidentId
        ? { ...f, properties: { ...f.properties, status, authority_confirmed: status !== 'unverified' ? true : f.properties.authority_confirmed } } : f)),
    }));
  }, []);

  const setShelterOccupancy = useCallback((shelterId, occupancy) => {
    setShelters((ss) => ({
      ...ss,
      features: ss.features.map((f) => (f.properties.id === shelterId
        ? { ...f, properties: { ...f.properties, occupancy: Math.max(0, Math.min(f.properties.capacity, Math.round(occupancy))) } } : f)),
    }));
  }, []);

  const toggleShelterOperational = useCallback((shelterId) => {
    setShelters((ss) => ({
      ...ss,
      features: ss.features.map((f) => (f.properties.id === shelterId
        ? { ...f, properties: { ...f.properties, operational: !f.properties.operational } } : f)),
    }));
  }, []);

  const applyPreset = useCallback((presetId) => {
    const p = SCENARIO_PRESETS.find((x) => x.id === presetId);
    if (p) setScenario({ rainfall: p.rainfall, riverLevel: p.riverLevel, eventActive: p.eventActive });
  }, []);

  const simEvent = useCallback((eventId) => {
    if (eventId === 'ROAD_BLOCK') {
      const candidates = (roads?.features || []).filter((r) => r.properties.class !== 'Village' && r.properties.status === 'open');
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      if (target) {
        setRoadStatus(target.properties.id, 'blocked');
        notify('warn', 'Road blocked', `${target.properties.name} marked BLOCKED — routes & isolation recalculated.`);
        notify('error', 'Escalation', generateAlert().message);
      }
    } else if (eventId === 'SHELTER_SURGE') {
      setShelters((ss) => ({
        ...ss,
        features: ss.features.map((f) => (f.properties.capacity > 300
          ? { ...f, properties: { ...f.properties, occupancy: Math.min(f.properties.capacity, Math.round(f.properties.occupancy + f.properties.capacity * 0.18)) } } : f)),
      }));
      notify('warn', 'Shelter surge', 'Occupancy jumped ~18% at large relief centres.');
    } else if (eventId === 'SOS_BURST') {
      const types = ['Flooded Road', 'Medical SOS', 'House Collapse', 'Blocked Bridge'];
      const names = ['Chooralmala', 'Mundakkai', 'Kambalakkad', 'Muttil', 'Thariyode'];
      setIncidents((is) => ({
        ...is,
        features: Array.from({ length: 3 }, (_, i) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [76.05 + Math.random() * 0.28, 11.58 + Math.random() * 0.3] },
          properties: {
            id: uid('INC'), type: types[Math.floor(Math.random() * types.length)],
            severity: Math.random() > 0.5 ? 'high' : 'critical', status: 'unverified',
            source: 'Citizen SOS', description: 'Crowdsourced SOS via citizen channel — needs field verification.',
            location_name: names[i % names.length], reported_at: new Date().toISOString(),
            authority_confirmed: false, reportedBy: 'Citizen',
          },
        })).concat(is?.features || []),
      }));
      notify('error', 'SOS burst', '3 citizen reports received — verification workflow pending.');
    }
  }, [roads, setRoadStatus, notify]);

  const nearestShelters = useCallback((point, k = 4) => {
    const list = (shelters?.features || [])
      .filter((s) => s.properties.operational)
      .map((s) => ({ shelter: s, dist: haversineKm(point, centroidOf(s.geometry)), free: s.properties.capacity - s.properties.occupancy }))
      .sort((a, b) => a.dist - b.dist);
    return list.slice(0, k);
  }, [shelters]);

  const vehicles = useMemo(() => buildVehicles(data), [data]);

  const value = useMemo(() => ({
    data, loading, error, progress,
    districtId, district, districts: DISTRICTS, setDistrict,
    scenario, setScenario, applyPreset,
    hazardWeights, setHazardWeights, vulnWeights,
    stats, evaluated, habById, effectiveRedzones,
    roads: roads || data?.roads || { type: 'FeatureCollection', features: [] },
    shelters: shelters || data?.shelters || { type: 'FeatureCollection', features: [] },
    incidents: incidents || data?.incidents || { type: 'FeatureCollection', features: [] },
    safeSites: safeSites || data?.safeSites || { type: 'FeatureCollection', features: [] },
    isolation, isIsolated,
    setRoadStatus, addIncident, setIncidentStatus, setShelterOccupancy, toggleShelterOperational,
    simEvent, nearestShelters,
    telemetry, setTelemetry,
    vehicles,
    rainAt: (hab) => effectiveRainfall(hab, scenario),
  }), [data, loading, error, progress, districtId, district, scenario, hazardWeights, vulnWeights, stats, evaluated, habById, effectiveRedzones, roads, shelters, incidents, safeSites, isolation, isIsolated, applyPreset, addIncident, setIncidentStatus, setShelterOccupancy, toggleShelterOperational, simEvent, nearestShelters, telemetry, vehicles, setDistrict]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
