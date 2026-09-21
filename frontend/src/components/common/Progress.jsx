/* Horizontal score / capacity bar. */
export default function Progress({ value, color = 'var(--cyan)', height = 8, track, style }) {
  return (
    <div className="progress" style={{ height, background: track || 'var(--bg-4)', ...style }}>
      <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}

export function ScoreBar({ value, color, width = '100%' }) {
  return (
    <div className="scorebar" style={{ width }}>
      <div style={{ width: `${Math.round(value * 100)}%`, background: color }} />
    </div>
  );
}
