import { useMapCtx } from '../../context/MapContext';
import { useDemo } from '../../context/DemoContext';
import Badge from '../common/Badge';
import { ScoreBar } from '../common/Progress';
import { centroidOf, fmtInt, fmtPct } from '../../utils';

export default function ZoneList() {
  const { effectiveRedzones } = useDemo();
  const { flyTo, select } = useMapCtx();
  const zones = [...effectiveRedzones.features].sort((a, b) => b.properties.severity - a.properties.severity);
  return (
    <div className="col gap-2">
      {zones.map((f) => {
        const p = f.properties;
        const [lat, lng] = centroidOf(f.geometry);
        return (
          <button
            key={p.id}
            type="button"
            className="card row between gap-3"
            style={{ padding: '10px 12px', cursor: 'pointer' }}
            onClick={() => { flyTo([lat, lng], 12.5); select('redzone', p.id); }}
          >
            <div style={{ textAlign: 'left' }}>
              <div className="small strong">{p.name}</div>
              <div className="tiny text-faint">{p.hazard_type} · {fmtInt(p.population_exposed)} exposed · P(recur) {fmtPct(p.probability)}</div>
              <div className="row gap-2 mt-1 center">
                <ScoreBar value={p.severity} color={p.severity > 0.75 ? 'var(--red)' : p.severity > 0.5 ? 'var(--orange)' : 'var(--amber)'} width={90} />
                <span className="mono tiny text-dim">sev {p.severity.toFixed(2)}</span>
                {p.base_severity != null && Math.abs(p.severity - p.base_severity) > 0.02 && (
                  <Badge tone={p.severity > p.base_severity ? 'red' : 'green'}>{p.severity > p.base_severity ? '▲' : '▼'} drifting</Badge>
                )}
              </div>
            </div>
            <span className="tiny text-cyan">zoom →</span>
          </button>
        );
      })}
    </div>
  );
}
