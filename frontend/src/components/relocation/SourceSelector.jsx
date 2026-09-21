import { useDemo } from '../../context/DemoContext';
import Badge from '../common/Badge';
import { fmtInt } from '../../utils/format';

/* Pick which high-priority habitations enter the relocation problem. */
export default function SourceSelector({ selectedIds, onToggle, onAll, onNone }) {
  const { evaluated } = useDemo();
  const ranked = [...evaluated].sort((a, b) => b.analysis.priority - a.analysis.priority).slice(0, 14);
  return (
    <div>
      <div className="row between mb-2">
        <span className="small strong">Source settlements ({selectedIds.size} selected)</span>
        <span className="row gap-1">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onAll}>Suggested 6</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onNone}>Clear</button>
        </span>
      </div>
      <div className="col gap-1" style={{ maxHeight: 240, overflowY: 'auto' }}>
        {ranked.map((f) => {
          const p = f.properties;
          const on = selectedIds.has(p.id);
          return (
            <label key={p.id} className="row gap-2 between" style={{ padding: '6px 8px', borderRadius: 8, border: `1px solid ${on ? 'rgba(34,211,238,.4)' : 'var(--border-soft)'}`, background: on ? 'var(--cyan-soft)' : 'transparent', cursor: 'pointer' }}>
              <span className="row gap-2">
                <input type="checkbox" checked={on} onChange={() => onToggle(p.id)} style={{ accentColor: 'var(--cyan)' }} />
                <span>
                  <span className="small strong">{p.name}</span>
                  <span className="tiny text-faint"> · P{fmtInt(p.population)}</span>
                </span>
              </span>
              <Badge tone={f.analysis.band.badge}>{f.analysis.priority.toFixed(2)}</Badge>
            </label>
          );
        })}
      </div>
    </div>
  );
}
