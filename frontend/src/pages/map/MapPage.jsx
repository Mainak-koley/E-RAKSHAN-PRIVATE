import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import TacticalMap from '../../components/maps/TacticalMap';
import Drawer from '../../components/common/Drawer';
import Badge from '../../components/common/Badge';
import HabitationDetail from '../../components/habitations/HabitationDetail';
import { useDemo } from '../../context/DemoContext';
import { useMapCtx } from '../../context/MapContext';
import { centroidOf } from '../../utils/geo';
import { fmtInt, fmtPct } from '../../utils/format';

export default function MapPage() {
  const demo = useDemo();
  const mapCtx = useMapCtx();
  const loc = useLocation();
  const [drawer, setDrawer] = useState(null); // {type, id}

  useEffect(() => {
    const focusId = loc.state?.focusId;
    if (!focusId) return;
    if (demo.habById[focusId]) {
      const f = demo.habById[focusId];
      mapCtx.flyTo(centroidOf(f.geometry), 13);
      mapCtx.select('habitation', focusId);
    } else {
      const sh = demo.shelters.features.find((x) => x.properties.id === focusId)
        || demo.safeSites.features.find((x) => x.properties.id === focusId);
      if (sh) { mapCtx.flyTo(centroidOf(sh.geometry), 14); mapCtx.select('shelter', focusId); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.state, demo.habById]);

  /* Deep-link drawer from map popups */
  useEffect(() => {
    if (mapCtx.selected && ['habitation', 'redzone', 'shelter', 'site'].includes(mapCtx.selected.type)) {
      setDrawer(mapCtx.selected);
    }
  }, [mapCtx.selected]);

  const closeDrawer = () => { setDrawer(null); mapCtx.setSelected(null); };

  const renderDrawer = () => {
    if (!drawer) return null;
    if (drawer.type === 'habitation') {
      const f = demo.habById[drawer.id];
      if (!f) return null;
      const c = centroidOf(f.geometry);
      return (
        <Drawer title={f.properties.name} subtitle={`Habitation ${f.properties.id} · ${f.properties.panchayath}`} onClose={closeDrawer}>
          <HabitationDetail
            feature={f}
            analysis={f.analysis}
            isolated={demo.isIsolated(f.properties.id)}
            nearest={demo.nearestShelters(c)}
          />
        </Drawer>
      );
    }
    if (drawer.type === 'redzone') {
      const f = demo.effectiveRedzones.features.find((x) => x.properties.id === drawer.id);
      if (!f) return null;
      const p = f.properties;
      return (
        <Drawer title={p.name} subtitle={`Red zone ${p.id} · ${p.hazard_type}`} onClose={closeDrawer}>
          <div className="col gap-2">
            <Badge tone={p.severity > 0.75 ? 'red' : p.severity > 0.5 ? 'orange' : 'amber'} dot pulse={p.severity > 0.75}>severity {p.severity.toFixed(2)} (dynamic)</Badge>
            <div className="card" style={{ padding: 12 }}><span className="tiny text-faint">Probability of recurrence</span><div className="mono strong">{fmtPct(p.probability)}</div></div>
            <div className="card" style={{ padding: 12 }}><span className="tiny text-faint">Population inside zone</span><div className="mono strong">{fmtInt(p.population_exposed)}</div></div>
            <div className="card" style={{ padding: 12 }}><span className="tiny text-faint">Model source</span><div className="small">{p.source || 'Hazard Engine — rainfall + slope + drainage blend'}</div></div>
            <div className="tiny text-faint mt-2">Zones are recomputed whenever rainfall inputs, river state or factor weights change — this is the dynamic red-zone indexer.</div>
          </div>
        </Drawer>
      );
    }
    if (drawer.type === 'shelter') {
      const f = demo.shelters.features.find((x) => x.properties.id === drawer.id);
      if (!f) return null;
      const p = f.properties;
      return (
        <Drawer title={p.name} subtitle={`Shelter ${p.id} · ${p.type}`} onClose={closeDrawer}>
          <div className="col gap-2">
            <div className="card" style={{ padding: 12 }}><span className="tiny text-faint">Occupancy</span><div className="mono strong">{fmtInt(p.occupancy)} / {fmtInt(p.capacity)}</div></div>
            <div className="card" style={{ padding: 12 }}><span className="tiny text-faint">Amenities</span><div className="small">medical {p.medical_support ? '✓' : '✖'} · water {fmtInt(p.water_kl)} kL · sanitation {p.sanitation_ok ? 'OK' : 'strained'}</div></div>
          </div>
        </Drawer>
      );
    }
    return null;
  };

  return (
    <div className="page">
      <PageHeader
        kicker="Common Operational Picture"
        title="Tactical Map"
        subtitle="Toggle layers, click any feature for evidence popups, drop incident pins, simulate road blockages."
      />
      <TacticalMap
        onIncidentDrop={(latlng) => {
          demo.addIncident({
            coordinates: [latlng.lng, latlng.lat],
            type: 'Flooded Road', severity: 'high',
            source: 'Field Officer', description: 'Dropped from tactical map — update details in Field Reports.',
            location_name: `${latlng.lat.toFixed(3)}°N ${latlng.lng.toFixed(3)}°E`,
          });
          mapCtx.setMode('view');
        }}
      />
      {renderDrawer()}
    </div>
  );
}
