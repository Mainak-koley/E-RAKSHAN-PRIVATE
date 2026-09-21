const TONES = ['cyan', 'green', 'lime', 'amber', 'orange', 'red', 'purple', 'blue', 'gray'];

export default function Badge({ tone = 'gray', dot, pulse, children, className = '' }) {
  const t = TONES.includes(tone) ? tone : 'gray';
  return (
    <span className={`badge badge-${t} ${dot ? 'badge-dot' : ''} ${pulse ? 'badge-pulse' : ''} ${className}`}>
      {children}
    </span>
  );
}
