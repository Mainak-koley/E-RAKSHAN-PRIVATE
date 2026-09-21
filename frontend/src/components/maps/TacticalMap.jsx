import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import BaseMap from './BaseMap';
import { useMapCtx } from '../../context/MapContext';
import { useDemo } from '../../context/DemoContext';
import { useApp } from '../../context/AppContext';
import { centroidOf, haversineKm } from '../../utils/geo';
import { fmtInt, fmtPct, fmtTime, clamp01 } from '../../utils/format';
import { ROAD_STATUS, SEVERITIES } from '../../constants/layers';
import LayerPanel from './LayerPanel';
import { MAP_CENTER, MAP_ZOOM } from '../../constants/layers';
import MapLegend from './MapLegend';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const bandColor = (s) => (s < 0.25 ? '#34d399' : s < 0.5 ? '#fbbf24' : s < 0.75 ? '#fb923c' : '#f87171');

const VEHICLE_SVG = {
  helicopter: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2" stroke-linecap="round"><path d="M12 5v9"/><path d="M8 14h8l-2 5h-4z"/><path d="M3 5h18"/><circle cx="12" cy="4" r="1.6" fill="#c084fc"/></svg>',
  ambulance: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2" stroke-linecap="round"><rect x="2" y="8" width="13" height="9" rx="1.5"/><path d="M15 11h4l3 3v3h-7z"/><circle cx="7" cy="18.5" r="1.8"/><circle cx="17.5" cy="18.5" r="1.8"/><path d="M7.5 10.5v4M5.5 12.5h4" stroke="#f87171"/></svg>',
  truck: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2" stroke-linecap="round"><rect x="2" y="7" width="12" height="9" rx="1"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18.5" r="1.8"/><circle cx="17.5" cy="18.5" r="1.8"/></svg>',
};
const vehicleSvg = (t) => VEHICLE_SVG[t] || VEHICLE_SVG.truck;

/* ---------- popup builders (per layer) ---------- */
function popupActions(actions) {
  return `<div class="feature-popup-actions">${actions.join('')}</div>`;
}
const btn = (action, label, extra = '') => `<button class="btn btn-ghost btn-sm" data-action="${action}" ${extra}>${label}</button>`;

function habPopup(f, analysis, isolated) {
  const p = f.properties;
  return `<div>
    <div class="feature-popup-title">${esc(p.name)}</div>
    <div class="tiny text-faint" style="margin-bottom:6px">${esc(p.panchayath || '')} · ${p.id}</div>
    <div class="feature-popup-row"><span>Population</span><b>${fmtInt(p.population)}</b></div>
    <div class="feature-popup-row"><span>Hazard score</span><b style="color:${bandColor(analysis.hazard)}">${analysis.hazard.toFixed(2)} · ${analysis.band.label}</b></div>
    <div class="feature-popup-row"><span>Vulnerability</span><b>${analysis.vulnerability.toFixed(2)}</b></div>
    <div class="feature-popup-row"><span>Priority index</span><b>${analysis.priority.toFixed(2)}</b></div>
    <div class="feature-popup-row"><span>Rainfall now</span><b>${analysis.rainfallNow.toFixed(0)} mm/24h</b></div>
    ${isolated ? '<div class="badge badge-red badge-dot mt-2">ISOLATED — NO SAFE LAND ROUTE</div>' : ''}
    ${popupActions([
      btn('zoom', 'Zoom', `data-lat="${f.properties._lat}" data-lng="${f.properties._lng}"`),
      btn('details', 'Details', `data-type="habitation" data-id="${p.id}"`),
      btn('route', 'Plan relocation', `data-type="relocate" data-id="${p.id}"`),
    ])}
  </div>`;
}

function redzonePopup(f) {
  const p = f.properties;
  return `<div>
    <div class="feature-popup-title">${esc(p.name)}</div>
    <div class="tiny text-faint" style="margin-bottom:6px">${esc(p.hazard_type)} · ${p.id}</div>
    <div class="feature-popup-row"><span>Severity (dynamic)</span><b style="color:${bandColor(p.severity)}">${p.severity.toFixed(2)}</b></div>
    <div class="feature-popup-row"><span>Probability</span><b>${fmtPct(p.probability)}</b></div>
    <div class="feature-popup-row"><span>Exposed population</span><b>${fmtInt(p.population_exposed)}</b></div>
    <div class="feature-popup-row"><span>Source</span><b>${esc(p.source || 'Hazard Engine')}</b></div>
    ${popupActions([btn('zoom', 'Zoom', `data-lat="${p._lat}" data-lng="${p._lng}"`), btn('details', 'Details', `data-type="redzone" data-id="${p.id}"`)])}
  </div>`;
}

function shelterPopup(f) {
  const p = f.properties;
  const occ = p.capacity ? p.occupancy / p.capacity : 0;
  const col = occ > 0.9 ? '#f87171' : occ > 0.7 ? '#fbbf24' : '#34d399';
  return `<div>
    <div class="feature-popup-title">${esc(p.name)}</div>
    <div class="tiny text-faint" style="margin-bottom:6px">${esc(p.type)} · ${p.id}</div>
    <div class="feature-popup-row"><span>Occupancy</span><b>${fmtInt(p.occupancy)} / ${fmtInt(p.capacity)} (${Math.round(occ * 100)}%)</b></div>
    <div class="scorebar" style="margin:4px 0 6px"><div style="width:${Math.round(occ * 100)}%;background:${col}"></div></div>
    <div class="feature-popup-row"><span>Medical</span><b>${p.medical_support ? '✓ Yes' : '✖ No'}</b></div>
    <div class="feature-popup-row"><span>Operational</span><b>${p.operational ? '✓' : '✖ (closed)'}</b></div>
    ${popupActions([btn('zoom', 'Zoom', `data-lat="${p._lat}" data-lng="${p._lng}"`), btn('details', 'Details', `data-type="shelter" data-id="${p.id}"`), btn('toggle-op', p.operational ? 'Set non-operational' : 'Reopen shelter', `data-id="${p.id}"`)])}
  </div>`;
}

function sitePopup(f) {
  const p = f.properties;
  return `<div>
    <div class="feature-popup-title">${esc(p.name)}</div>
    <div class="tiny text-faint" style="margin-bottom:6px">${esc(p.type)} · ${p.id}</div>
    <div class="feature-popup-row"><span>Suitability</span><b style="color:${bandColor(1 - p.suitability / 100)}">${p.suitability}/100</b></div>
    <div class="feature-popup-row"><span>Area</span><b>${p.area_ha} ha</b></div>
    <div class="feature-popup-row"><span>Amenities</span><b>${(p.amenities || []).join(', ') || '—'}</b></div>
    ${popupActions([btn('zoom', 'Zoom', `data-lat="${p._lat}" data-lng="${p._lng}"`), btn('details', 'Details', `data-type="site" data-id="${p.id}"`)])}
  </div>`;
}

function roadPopup(f) {
  const p = f.properties;
  return `<div>
    <div class="feature-popup-title">${esc(p.name)}</div>
    <div class="tiny text-faint" style="margin-bottom:6px">${esc(p.class)} road · ${p.id}</div>
    <div class="feature-popup-row"><span>Status</span><b style="color:${ROAD_STATUS[p.status]?.color}">${ROAD_STATUS[p.status]?.label || p.status}</b></div>
    <div class="feature-popup-row"><span>Flood depth</span><b>${p.flood_depth_cm} cm</b></div>
    <div class="feature-popup-row"><span>Connects</span><b>${(p.connects || []).length} habitations</b></div>
    ${popupActions([
      p.status !== 'blocked' ? btn('road-block', 'Simulate blockage', `data-id="${p.id}"`) : btn('road-open', 'Reopen road', `data-id="${p.id}"`),
    ])}
  </div>`;
}

function incidentPopup(f) {
  const p = f.properties;
  return `<div>
    <div class="feature-popup-title">${esc(p.type)}</div>
    <div class="tiny text-faint" style="margin-bottom:6px">${esc(p.location_name || '')} · ${p.id}</div>
    <div class="feature-popup-row"><span>Source</span><b>${esc(p.source)}</b></div>
    <div class="feature-popup-row"><span>Severity</span><b style="color:${SEVERITIES[p.severity]?.color}">${esc(p.severity)}</b></div>
    <div class="feature-popup-row"><span>Status</span><b>${esc(p.status)}</b></div>
    <div class="feature-popup-row"><span>Reported</span><b>${fmtTime(p.reported_at)}</b></div>
    <div class="feature-popup-row"><span>Description</span><span>${esc(p.description)}</span></div>
    ${popupActions([
      p.status === 'unverified' ? btn('inc-verify', 'Verify', `data-id="${p.id}"`) : '',
      p.status === 'verified' ? btn('inc-respond', 'Dispatch', `data-id="${p.id}"`) : '',
      p.status !== 'resolved' ? btn('inc-resolve', 'Resolve', `data-id="${p.id}"`) : '',
    ].filter(Boolean))}
  </div>`;
}

export default function TacticalMap({ height, onIncidentDrop }) {
  const mapCtx = useMapCtx();
  const demo = useDemo();
  const app = useApp();
  const nav = useNavigate();
  const mapRef = useRef(null);
  const groups = useRef({});
  const vehicleTimer = useRef(null);
  const vehicleState = useRef({});
  const [mapReady, setMapReady] = useState(false);
  const { visible, selected, setSelected } = mapCtx;

  const G = (name) => {
    if (!groups.current[name]) groups.current[name] = L.layerGroup();
    return groups.current[name];
  };

  /* ---- (re)draw all layers on data / selection change ---- */
  const redraw = () => {
    const map = mapRef.current;
    if (!map || !demo.data) return;

    /* habitations */
    const gh = G('habitations').clearLayers();
    demo.evaluated.forEach((f) => {
      const [lat, lng] = centroidOf(f.geometry);
      f.properties._lat = lat; f.properties._lng = lng;
      const r = 5 + Math.sqrt((f.properties.population || 0) / 450);
      const color = bandColor(f.analysis.hazard);
      const isSel = selected?.type === 'habitation' && selected.id === f.properties.id;
      const m = L.circleMarker([lat, lng], {
        radius: isSel ? r + 3 : r, color, weight: isSel ? 3.5 : 2, fillColor: color, fillOpacity: 0.75,
      });
      m.bindTooltip(`${f.properties.name} · risk ${Math.round(f.analysis.hazard * 100)}`, { direction: 'top', offset: [0, -6] });
      m.bindPopup(() => habPopup(f, f.analysis, demo.isIsolated(f.properties.id)));
      m.addTo(gh);
    });
    if (visible.habitations) gh.addTo(map);

    /* redzones */
    const gr = G('redzones').clearLayers();
    demo.effectiveRedzones.features.forEach((f) => {
      const [lat, lng] = centroidOf(f.geometry);
      f.properties._lat = lat; f.properties._lng = lng;
      const sev = f.properties.severity;
      const poly = L.polygon(f.geometry.coordinates, {
        color: bandColor(sev), weight: 1.6, dashArray: '5 4',
        fillColor: bandColor(sev), fillOpacity: mapCtx.opacities.redzones,
      });
      poly.bindTooltip(`${f.properties.name} · severity ${sev.toFixed(2)}`, { sticky: true });
      poly.bindPopup(() => redzonePopup(f));
      poly.addTo(gr);
    });
    if (visible.redzones) gr.addTo(map);

    /* safe sites */
    const gs = G('safesites').clearLayers();
    demo.safeSites.features.forEach((f) => {
      const [lat, lng] = centroidOf(f.geometry);
      f.properties._lat = lat; f.properties._lng = lng;
      const size = 9 + (f.properties.suitability / 100) * 6;
      const icon = L.divIcon({
        className: '', html: `<div class="shelter-marker" style="width:${size}px;height:${size}px;color:var(--layer-safesite);background:rgba(163,230,53,.5)"></div>`,
        iconSize: [size, size], iconAnchor: [size / 2, size / 2],
      });
      const m = L.marker([lat, lng], { icon });
      m.bindTooltip(`Safe site · ${f.properties.name}`, { direction: 'top', offset: [0, -8] });
      m.bindPopup(() => sitePopup(f));
      m.addTo(gs);
    });
    if (visible.safesites) gs.addTo(map);

    /* shelters */
    const gsh = G('shelters').clearLayers();
    demo.shelters.features.forEach((f) => {
      const [lat, lng] = centroidOf(f.geometry);
      f.properties._lat = lat; f.properties._lng = lng;
      const occ = f.properties.capacity ? f.properties.occupancy / f.properties.capacity : 0;
      const color = !f.properties.operational ? '#8296b3' : occ > 0.9 ? '#f87171' : occ > 0.7 ? '#fbbf24' : '#34d399';
      const icon = L.divIcon({
        className: '', html: `<div class="risk-dot" style="width:13px;height:13px;color:${color};background:${color}"></div>`,
        iconSize: [13, 13], iconAnchor: [7, 7],
      });
      const m = L.marker([lat, lng], { icon });
      m.bindTooltip(`Shelter · ${f.properties.name} (${Math.round(occ * 100)}%)`, { direction: 'top', offset: [0, -8] });
      m.bindPopup(() => shelterPopup(f));
      m.addTo(gsh);
    });
    if (visible.shelters) gsh.addTo(map);

    /* roads */
    const gro = G('roads').clearLayers();
    demo.roads.features.forEach((f) => {
      const p = f.properties;
      const w = { NH: 4, SH: 3, District: 2.2, Village: 1.6 }[p.class] || 1.8;
      const line = L.polyline(f.geometry.coordinates.map(([lng, lat]) => [lat, lng]), {
        color: ROAD_STATUS[p.status]?.color || '#60a5fa', weight: w, opacity: p.status === 'open' ? 0.38 : 0.85,
        dashArray: p.status === 'blocked' ? '2 7' : p.status === 'partial' ? '8 5' : undefined,
      });
      line.bindTooltip(`${p.name} · ${ROAD_STATUS[p.status]?.label}`, { sticky: true });
      line.bindPopup(() => roadPopup(f));
      line.addTo(gro);
    });
    if (visible.roads) gro.addTo(map);

    /* incidents */
    const gi = G('incidents').clearLayers();
    demo.incidents.features.filter((f) => f.properties.status !== 'resolved').forEach((f) => {
      const p = f.properties;
      const [lng, lat] = f.geometry.coordinates;
      p._lat = lat; p._lng = lng;
      const color = SEVERITIES[p.severity]?.color || '#fb923c';
      const verified = p.status !== 'unverified';
      const icon = L.divIcon({
        className: '', html: `<div class="pulse-marker" style="width:13px;height:13px;color:${color};background:${color};border:2px solid #06121f;border-radius:50%;opacity:${verified ? 1 : 0.75}"></div>`,
        iconSize: [13, 13], iconAnchor: [7, 7],
      });
      const m = L.marker([lat, lng], { icon });
      m.bindTooltip(`${p.type} · ${p.status}`, { direction: 'top', offset: [0, -8] });
      m.bindPopup(() => incidentPopup(f));
      m.addTo(gi);
    });
    if (visible.incidents) gi.addTo(map);

    /* relocation assignment routes */
    const ga = G('assignments').clearLayers();
    if (mapCtx.assignments?.assignments?.length) {
      mapCtx.assignments.assignments.forEach((a) => {
        const srcF = demo.habById[a.sourceId];
        const shF = demo.shelters.features.find((s) => s.properties.id === a.shelterId);
        if (!srcF || !shF) return;
        const a1 = centroidOf(srcF.geometry);
        const a2 = centroidOf(shF.geometry);
        const riskCol = a.routeRisk > 0.5 ? '#f87171' : a.routeRisk > 0.25 ? '#fbbf24' : '#34d399';
        const line = L.polyline([a1, a2], {
          color: riskCol, weight: Math.min(9, 2 + a.population / 140), opacity: 0.8, className: 'route-line',
        });
        line.bindTooltip(`${a.sourceName} → ${a.shelterName} · ${fmtInt(a.population)} people`, { sticky: true });
        line.bindPopup(`<div>
          <div class="feature-popup-title">${esc(a.sourceName)} → ${esc(a.shelterName)}</div>
          <div class="feature-popup-row"><span>Population</span><b>${fmtInt(a.population)}</b></div>
          <div class="feature-popup-row"><span>Distance</span><b>${a.distanceKm.toFixed(1)} km</b></div>
          <div class="feature-popup-row"><span>Route risk</span><b style="color:${riskCol}">${a.routeRisk.toFixed(2)}</b></div>
          ${a.overflow ? '<div class="badge badge-amber mt-2">overflow / fallback allocation</div>' : ''}
        </div>`);
        line.addTo(ga);
      });
    }
    if (visible.assignments && mapCtx.assignments) ga.addTo(map);
  };

  useEffect(() => {
    if (mapReady) redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, demo.evaluated, demo.roads, demo.shelters, demo.incidents, demo.safeSites, demo.effectiveRedzones, mapCtx.assignments, visible.habitations, visible.redzones, visible.safesites, visible.shelters, visible.roads, visible.incidents, visible.assignments, mapCtx.opacities.redzones, selected]);

  /* ---- Sahay AI location marker ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapCtx.aiMarker) return undefined;
    const marker = mapCtx.aiMarker;
    const icon = L.divIcon({
      className: 'sahay-ai-location-marker',
      html: '<span></span>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    const pin = L.marker([marker.lat, marker.lng], { icon, zIndexOffset: 1600 });
    pin.bindTooltip(`${marker.label}${marker.source ? ` · ${marker.source}` : ''}`, { direction: 'top', offset: [0, -8] });
    pin.addTo(map);
    map.flyTo([marker.lat, marker.lng], Math.max(map.getZoom(), 14), { duration: 0.9 });
    return () => { try { map.removeLayer(pin); } catch { /* map already disposed */ } };
  }, [mapCtx.aiMarker, mapReady]);

  /* ---- fly to newly selected district ---- */
  const prevDistrict = useRef(demo.districtId);
  useEffect(() => {
    if (!mapRef.current) return;
    if (prevDistrict.current !== demo.districtId) {
      prevDistrict.current = demo.districtId;
      mapRef.current.flyTo(demo.district?.center || MAP_CENTER, demo.district?.zoom || 10, { duration: 1.2 });
    }
  }, [demo.districtId, demo.district]);

  /* ---- popup action delegation (events bubble to map container) ---- */
  useEffect(() => {
    if (!mapReady) return undefined;
    const map = mapRef.current;
    const handler = (e) => {
      const btnEl = e.target.closest?.('[data-action]');
      if (!btnEl) return;
      const action = btnEl.dataset.action;
      const id = btnEl.dataset.id;
      if (action === 'details') {
        const type = btnEl.dataset.type;
        mapCtx.select(type, id);
        if (type === 'redzone') nav('/risk');
        if (type === 'site') nav('/sites');
        if (type === 'shelter') nav('/capacity');
        if (type === 'habitation') nav('/habitations');
      } else if (action === 'route') {
        nav('/relocation', { state: { preselect: id } });
      } else if (action === 'road-block') { demo.setRoadStatus(id, 'blocked'); app.notify('warn', 'Road blockage simulated', 'Routes and isolation status recalculated.'); setTimeout(redraw, 30); }
      else if (action === 'road-open') { demo.setRoadStatus(id, 'open'); app.notify('success', 'Road reopened', `${id} back in the routing graph.`); setTimeout(redraw, 30); }
      else if (action === 'toggle-op') { demo.toggleShelterOperational(id); setTimeout(redraw, 30); }
      else if (action === 'inc-verify') { demo.setIncidentStatus(id, 'verified'); app.notify('success', 'Incident verified', `${id} confirmed — confidence raised.`); setTimeout(redraw, 30); }
      else if (action === 'inc-respond') { demo.setIncidentStatus(id, 'responding'); app.notify('info', 'Team dispatched', `${id} marked RESPONDING.`); setTimeout(redraw, 30); }
      else if (action === 'inc-resolve') { demo.setIncidentStatus(id, 'resolved'); app.notify('success', 'Incident resolved', `${id} closed.`); setTimeout(redraw, 30); }
    };
    map.getContainer().addEventListener('click', handler);
    return () => map.getContainer().removeEventListener('click', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, demo]);

  /* ---- OSIRIS live vehicle animation ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return undefined;
    const gv = G('vehicles');
    gv.clearLayers();
    if (!visible.vehicles || !demo.vehicles.length) { gv.remove(); return undefined; }
    gv.addTo(map);

    vehicleState.current = {};
    const markers = {};
    demo.vehicles.forEach((v) => {
      vehicleState.current[v.id] = { t: Math.random() * 0.5, speed: 0.0028 + Math.random() * 0.0022 };
      const icon = L.divIcon({
        className: 'vehicle-marker',
        html: vehicleSvg(v.type),
        iconSize: [22, 22], iconAnchor: [11, 11],
      });
      const m = L.marker(v.from, { icon, zIndexOffset: 500 }).addTo(gv);
      m.bindTooltip(`${v.label} · OSIRIS track`, { direction: 'top', offset: [0, -8] });
      markers[v.id] = m;
      L.polyline([v.from, v.to], { color: '#c084fc', weight: 1.2, opacity: 0.35, dashArray: '2 6' }).addTo(gv);
    });

    vehicleTimer.current = setInterval(() => {
      demo.vehicles.forEach((v) => {
        const st = vehicleState.current[v.id];
        st.t += st.speed;
        if (st.t >= 1) { st.t = 0; }
        const lat = v.from[0] + (v.to[0] - v.from[0]) * st.t;
        const lng = v.from[1] + (v.to[1] - v.from[1]) * st.t;
        markers[v.id]?.setLatLng([lat, lng]);
      });
    }, 120);
    return () => { clearInterval(vehicleTimer.current); gv.clearLayers(); gv.remove(); };
  }, [mapReady, demo.vehicles, visible.vehicles]);

  const layersInLegend = useMemo(() => ([
    ...['low', 'moderate', 'high', 'critical'].map((b) => null).filter(Boolean),
  ]), []);

  return (
    <div className="map-page" style={height ? { height } : undefined}>
      <BaseMap
        center={demo.district?.center}
        zoom={demo.district?.zoom}
        onClick={(latlng) => onIncidentDrop?.(latlng)}
        onReady={(map) => { mapRef.current = map; setMapReady(true); }}
      />
      {/* top-right controls — no fixed width, so the minimised button hugs the corner too */}
      <div className="map-overlay" style={{ top: 12, right: 12 }}>
        <LayerPanel />
      </div>
      {/* bottom-left legend */}
      <div className="map-overlay" style={{ bottom: 24, left: 12 }}>
        <MapLegend />
      </div>
      {mapCtx.mode === 'incident' && (
        <div className="map-overlay glass-bar" style={{ top: 12, left: 12, padding: '8px 14px', display: 'flex', gap: 10, alignItems: 'center', borderColor: 'var(--orange)' }}>
          <span className="small text-orange strong">Click the map to drop the incident pin</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => mapCtx.setMode('view')}>Cancel</button>
        </div>
      )}
    </div>
  );
}
