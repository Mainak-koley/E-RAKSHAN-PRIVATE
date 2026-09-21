import { CheckCheck, ShieldCheck } from 'lucide-react';
import Badge from '../common/Badge';
import { timeAgo } from '../../utils/format';

export default function AlertItem({ alert, onAck, onResolve }) {
  const tone = { critical: 'red', high: 'orange', medium: 'amber', low: 'green' }[alert.severity] || 'gray';
  return (
    <div className="card" style={{ padding: '11px 13px', marginBottom: 9, borderColor: alert.status === 'new' && alert.severity === 'critical' ? 'rgba(248,113,113,.5)' : undefined }}>
      <div className="row between gap-2 wrap">
        <span className="row gap-2 wrap">
          <Badge tone={tone} dot pulse={alert.status === 'new' && alert.severity === 'critical'}>{alert.severity}</Badge>
          <b className="small">{alert.type}</b>
          <Badge tone="gray">{alert.source}</Badge>
        </span>
        <span className="tiny text-faint">{timeAgo(alert.time)}</span>
      </div>
      <div className="small text-dim mt-1" style={{ lineHeight: 1.45 }}>{alert.message}</div>
      <div className="row between gap-2 mt-2">
        <span className="tiny text-faint">confidence <b className="mono">{alert.confidence?.toFixed?.(2) ?? alert.confidence}</b> · {alert.id}</span>
        <span className="row gap-1">
          {alert.status === 'new' && <button type="button" className="btn btn-ghost btn-sm" onClick={onAck}><CheckCheck size={12} /> Acknowledge</button>}
          {alert.status !== 'resolved' && <button type="button" className="btn btn-ghost btn-sm" onClick={onResolve}><ShieldCheck size={12} /> Resolve</button>}
          {alert.status === 'resolved' && <Badge tone="green">resolved</Badge>}
        </span>
      </div>
    </div>
  );
}
