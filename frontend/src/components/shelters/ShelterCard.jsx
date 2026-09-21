import Badge from '../common/Badge';
import GaugeChart from '../charts/GaugeChart';
import { useDemo } from '../../context/DemoContext';
import { useMapCtx } from '../../context/MapContext';
import { centroidOf } from '../../utils/geo';
import { fmtInt } from '../../utils/format';
import { Minus, Plus, Power } from 'lucide-react';

export default function ShelterCard({ shelter }) {
  const p = shelter.properties;
  const demo = useDemo();
  const { flyTo } = useMapCtx();
  const occ = p.capacity ? p.occupancy / p.capacity : 0;
  const tone = !p.operational ? '#8296b3' : occ > 0.9 ? '#f87171' : occ > 0.7 ? '#fbbf24' : '#34d399';
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="row between gap-2">
        <div>
          <div className="strong">{p.name}</div>
          <div className="tiny text-faint">{p.type} · {p.id} · {p.managed_by}</div>
        </div>
        <div className="row gap-1">
          {p.medical_support ? <Badge tone="green">medical</Badge> : <Badge tone="gray">no medical</Badge>}
          {!p.operational && <Badge tone="red">closed</Badge>}
        </div>
      </div>
      <div className="row gap-3 mt-2">
        <div style={{ width: 128 }}>
          <GaugeChart value={occ} color={tone} height={128} label={`${fmtInt(p.occupancy)} / ${fmtInt(p.capacity)}`} sublabel={`${fmtInt(Math.max(0, p.capacity - p.occupancy))} free`} />
        </div>
        <div className="flex-1">
          <div className="tiny text-faint mb-1">Live occupancy controls</div>
          <div className="row gap-1 mb-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => demo.setShelterOccupancy(p.id, p.occupancy - 25)}><Minus size={12} /> 25</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => demo.setShelterOccupancy(p.id, p.occupancy + 25)}><Plus size={12} /> 25</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => demo.setShelterOccupancy(p.id, p.occupancy + 100)}><Plus size={12} /> 100</button>
          </div>
          <input type="range" className="range" min={0} max={p.capacity} value={p.occupancy} onChange={(e) => demo.setShelterOccupancy(p.id, +e.target.value)} />
          <div className="row between mt-2">
            <span className="tiny text-dim">water {fmtInt(p.water_kl)} kL · sanitation {p.sanitation_ok ? 'OK' : 'strained'}</span>
          </div>
        </div>
      </div>
      <div className="row gap-2 mt-3">
        <button type="button" className="btn btn-sm flex-1" onClick={() => flyTo(centroidOf(shelter.geometry), 14)}>Locate on map</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => demo.toggleShelterOperational(p.id)}><Power size={12} /> {p.operational ? 'Close' : 'Reopen'}</button>
      </div>
    </div>
  );
}
