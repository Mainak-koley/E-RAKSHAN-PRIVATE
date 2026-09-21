import { Inbox, Loader2 } from 'lucide-react';

export function Spinner({ label, center = true }) {
  return (
    <div className={`row gap-2 ${center ? 'center' : ''}`} style={{ padding: 26 }}>
      <Loader2 size={17} className="text-cyan" style={{ animation: 'spin 0.9s linear infinite' }} />
      <span className="text-dim small">{label || 'Loading…'}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, hint }) {
  return (
    <div className="empty">
      <Icon size={30} />
      <div className="strong">{title || 'Nothing here yet'}</div>
      {hint && <div className="tiny">{hint}</div>}
    </div>
  );
}
