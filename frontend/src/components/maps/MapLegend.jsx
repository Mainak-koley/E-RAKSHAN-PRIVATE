import { Info, Minus } from 'lucide-react';
import { useDemo } from '../../context/DemoContext';
import { ROAD_STATUS } from '../../constants/layers';
import { fmtInt } from '../../utils/format';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useMediaQuery } from '../../hooks/useMediaQuery';

/* Hazard legend — collapsible; auto-minimises on small screens. */
export default function MapLegend() {
  const demo = useDemo();
  const narrow = useMediaQuery('(max-width: 860px)');
  const [pref, setPref] = useLocalStorage('panel-legend', null);
  const collapsed = pref == null ? narrow : pref;

  if (collapsed) {
    return (
      <button type="button" className="map-panel panel-mini" title="Show legend" onClick={() => setPref(false)}>
        <Info size={15} />
      </button>
    );
  }

  const critical = demo.evaluated.filter((f) => f.analysis.band.id === 'critical').length;
  const isolated = demo.evaluated.filter((f) => demo.isIsolated(f.properties.id)).length;
  return (
    <div className="map-panel" style={{ padding: '8px 12px 9px', maxWidth: 250, width: 'max-content' }}>
      <div className="row between gap-3">
        <span className="tiny strong upper text-cyan">{demo.district?.name} · {demo.district?.state}</span>
        <button type="button" className="icon-btn" style={{ width: 20, height: 20, minWidth: 20, border: 0 }} title="Minimise" onClick={() => setPref(true)}><Minus size={11} /></button>
      </div>
      <div className="tiny strong upper text-dim mb-1">Hazard score</div>
      <div className="heat-gradient" style={{ width: 170 }} />
      <div className="row between tiny text-faint" style={{ width: 170 }}>
        <span>0 Monitor</span><span>.5 Warn</span><span>1 Evacuate</span>
      </div>
      <div className="divider" style={{ margin: '7px 0' }} />
      <div className="legend-row"><span className="layer-swatch" style={{ background: '#22d3ee', color: '#22d3ee', borderRadius: '50%' }} /> Habitation (size = population)</div>
      <div className="legend-row"><span className="layer-swatch" style={{ background: '#f87171', color: '#f87171' }} /> Dynamic red zone</div>
      <div className="legend-row"><span className="layer-swatch" style={{ background: '#34d399', color: '#34d399', borderRadius: '50%' }} /> Relief shelter</div>
      <div className="legend-row"><span className="layer-swatch" style={{ background: '#a3e635', color: '#a3e635', transform: 'rotate(45deg)' }} /> Safe relocation site</div>
      {Object.entries(ROAD_STATUS).map(([k, v]) => (
        <div className="legend-row" key={k}><span className="layer-swatch" style={{ background: v.color, color: v.color, height: 3, borderRadius: 2 }} /> {v.label}</div>
      ))}
      <div className="divider" style={{ margin: '7px 0' }} />
      <div className="row gap-2 wrap">
        <span className="badge badge-red">{critical} critical habitations</span>
        {isolated > 0 && <span className="badge badge-red badge-pulse">{isolated} isolated</span>}
      </div>
      <div className="tiny text-faint mt-1">Exposed in zones: {fmtInt(demo.effectiveRedzones.features.reduce((a, f) => a + (f.properties.population_exposed || 0), 0))}</div>
    </div>
  );
}
