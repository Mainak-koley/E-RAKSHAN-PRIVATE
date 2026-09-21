import Badge from '../common/Badge';
import GaugeChart from '../charts/GaugeChart';
import { useMapCtx } from '../../context/MapContext';
import { centroidOf } from '../../utils/geo';
import { fmtPct } from '../../utils/format';

const FACTOR_LABELS = {
  hazardSafety: 'Hazard safety', capacity: 'Space capacity', connectivity: 'Connectivity',
  terrain: 'Terrain', livelihood: 'Livelihood', services: 'Services',
};

export default function SiteCard({ site }) {
  const p = site.properties;
  const { flyTo, select } = useMapCtx();
  const tone = p.suitability > 75 ? 'green' : p.suitability > 55 ? 'lime' : 'amber';
  return (
    <div className="card card-accent" style={{ padding: 14, cursor: 'pointer' }} onClick={() => { flyTo(centroidOf(site.geometry), 13); select('site', p.id); }}>
      <div className="row between gap-3">
        <div className="flex-1">
          <div className="strong">{p.name}</div>
          <div className="tiny text-faint">{p.type} · {p.id} · {p.area_ha} ha</div>
          <div className="row gap-1 mt-2 wrap">
            {(p.amenities || []).map((a) => <Badge key={a} tone="cyan">{a}</Badge>)}
          </div>
        </div>
        <div style={{ width: 110 }}>
          <GaugeChart value={p.suitability / 100} height={110} color={tone === 'green' ? '#34d399' : tone === 'lime' ? '#a3e635' : '#fbbf24'} label="suitability" />
        </div>
      </div>
      <div className="divider" />
      {Object.entries(FACTOR_LABELS).map(([k, label]) => (
        <div key={k} className="row between gap-2" style={{ padding: '2px 0' }}>
          <span className="tiny text-dim">{label}</span>
          <span className="tiny mono text-dim">{fmtPct(p[k] / 100)}</span>
        </div>
      ))}
    </div>
  );
}
