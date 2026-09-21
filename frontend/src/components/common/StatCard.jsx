import Badge from './Badge';

export default function StatCard({ icon: Icon, label, value, sub, delta, deltaDir, accent = 'cyan', onClick }) {
  return (
    <div className={`card stat-card ${onClick ? 'clickable' : ''}`} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined} role={onClick ? 'button' : undefined}>
      <div className={`stat-icon accent-${accent}`}>{Icon && <Icon size={19} />}</div>
      <div className="flex-1">
        <div className="stat-value mono">{value}</div>
        <div className="stat-label">{label}</div>
        {(delta || sub) && (
          <div className="stat-delta">
            {delta && (
              <Badge tone={deltaDir === 'up' ? 'red' : deltaDir === 'down' ? 'green' : 'gray'}>
                {deltaDir === 'up' ? '▲' : deltaDir === 'down' ? '▼' : '•'} {delta}
              </Badge>
            )}
            {sub && <span className="text-faint tiny">{sub}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
