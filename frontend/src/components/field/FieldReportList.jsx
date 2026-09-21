import { useState } from 'react';
import Badge from '../common/Badge';
import { fmtDateTime, fmtPct } from '../../utils/format';
import { observationConfidence } from '../../utils/riskEngine';

const FLOW = ['unverified', 'verified', 'responding', 'resolved'];

export default function FieldReportList({ incidents, onStatus }) {
  const [filter, setFilter] = useState('all');
  const rows = [...incidents]
    .filter((f) => (filter === 'all' ? true : f.properties.status === filter))
    .sort((a, b) => new Date(b.properties.reported_at) - new Date(a.properties.reported_at));

  return (
    <div>
      <div className="row gap-1 mb-3 wrap">
        {['all', ...FLOW].map((s) => (
          <button key={s} type="button" className={`chip-toggle ${filter === s ? 'on' : ''}`} onClick={() => setFilter(s)}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>
      {rows.length === 0 && <div className="empty">No reports in this state.</div>}
      {rows.map((f) => {
        const p = f.properties;
        const conf = observationConfidence(f);
        const step = FLOW.indexOf(p.status);
        return (
          <div key={p.id} className="card" style={{ padding: '11px 13px', marginBottom: 9 }}>
            <div className="row between gap-2 wrap">
              <span className="row gap-2">
                <b className="small">{p.type}</b>
                <Badge tone={{ critical: 'red', high: 'orange', medium: 'amber', low: 'green' }[p.severity]} dot>{p.severity}</Badge>
                <Badge tone={p.status === 'resolved' ? 'green' : p.status === 'unverified' ? 'gray' : 'cyan'}>{p.status}</Badge>
              </span>
              <span className="tiny text-faint">{fmtDateTime(p.reported_at)} · {p.id}</span>
            </div>
            <div className="tiny text-dim mt-1">{p.description}</div>
            <div className="row between gap-2 mt-2 wrap">
              <span className="tiny text-faint">{p.location_name} · source {p.source} · confidence <b className="mono" style={{ color: conf > 0.7 ? 'var(--green)' : conf > 0.45 ? 'var(--amber)' : 'var(--red)' }}>{conf.toFixed(2)}</b></span>
              <span className="row gap-1">
                {FLOW.slice(step + 1).map((next) => (
                  <button key={next} type="button" className={`btn btn-sm ${next === 'verified' ? '' : 'btn-ghost'}`} onClick={() => onStatus(p.id, next)}>
                    → {next}
                  </button>
                ))}
                {p.status === 'resolved' && <Badge tone="green">closed ✓</Badge>}
              </span>
            </div>
            <div className="scorebar mt-2" style={{ height: 4 }}>
              <div style={{ width: `${conf * 100}%`, background: conf > 0.7 ? 'var(--green)' : 'var(--amber)' }} />
            </div>
            <div className="tiny text-faint mt-1">OSIRIS confidence = reliability × recency × verification × authority — verification by an authority raises this above the red-zone threshold.</div>
          </div>
        );
      })}
    </div>
  );
}
