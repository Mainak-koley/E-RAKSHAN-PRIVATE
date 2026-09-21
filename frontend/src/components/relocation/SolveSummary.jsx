import Badge from '../common/Badge';
import { fmtInt, fmtPct } from '../../utils/format';

export default function SolveSummary({ result }) {
  const { totals, status } = result;
  return (
    <div>
      <div className="row gap-2 wrap mb-3">
        <Badge tone={status === 'feasible' ? 'green' : 'amber'} dot pulse={status !== 'feasible'}>
          {status === 'feasible' ? 'STATUS: FEASIBLE — full allocation found' : 'STATUS: SHORTFALL — capacity deficit'}
        </Badge>
        <Badge tone="purple">objective {result.objective}</Badge>
      </div>
      <div className="stat-grid">
        <div className="card stat-card" style={{ padding: 12 }}>
          <div><div className="stat-value mono text-green">{fmtInt(totals.assignedPop)}</div><div className="stat-label">Assigned</div></div>
        </div>
        <div className="card stat-card" style={{ padding: 12 }}>
          <div><div className="stat-value mono" style={{ color: totals.unassignedPop ? 'var(--red)' : 'var(--green)' }}>{fmtInt(totals.unassignedPop)}</div><div className="stat-label">Unallocated</div></div>
        </div>
        <div className="card stat-card" style={{ padding: 12 }}>
          <div><div className="stat-value mono text-cyan">{totals.avgDist.toFixed(1)} km</div><div className="stat-label">Avg distance</div></div>
        </div>
        <div className="card stat-card" style={{ padding: 12 }}>
          <div><div className="stat-value mono text-amber">{fmtPct(totals.maxCrowd)}</div><div className="stat-label">Max crowding</div></div>
        </div>
      </div>
      {result.warnings.map((w, i) => (
        <div key={i} className="glass-bar mt-3" style={{ padding: '9px 12px', borderColor: 'rgba(251,191,36,.4)' }}>
          <span className="tiny text-amber strong">⚠ FALLBACK PROTOCOL</span>
          <div className="tiny text-dim mt-1">{w}</div>
        </div>
      ))}
      {result.unassigned.length > 0 && (
        <div className="mt-3">
          {result.unassigned.map((u) => (
            <div key={u.sourceId} className="row between" style={{ padding: '7px 10px', border: '1px solid rgba(248,113,113,.35)', borderRadius: 8, marginBottom: 6 }}>
              <span className="small strong">{u.sourceName}</span>
              <span className="tiny text-red">{fmtInt(u.population)} unallocated — {u.reason}</span>
            </div>
          ))}
          <div className="tiny text-faint mt-1">Recommendation: notify district control to open temporary shelters near the flagged settlements (escalation alert raised on the Alert Center).</div>
        </div>
      )}
    </div>
  );
}
