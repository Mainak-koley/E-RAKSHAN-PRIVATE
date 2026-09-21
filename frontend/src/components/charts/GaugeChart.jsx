import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

/* Single-value radial gauge (shelter occupancy etc.). */
export default function GaugeChart({ value, color = '#22d3ee', height = 150, label, sublabel }) {
  const data = [{ value: Math.min(100, value * 100), fill: color }];
  return (
    <div style={{ position: 'relative', height }}>
      <ResponsiveContainer width="100%" height={height}>
        <RadialBarChart data={data} innerRadius="72%" outerRadius="100%" startAngle={220} endAngle={-40} barSize={11}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'rgba(95,115,145,.18)' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <div className="mono" style={{ fontSize: 21, fontWeight: 700, color }}>{Math.round(value * 100)}%</div>
          {label && <div className="tiny text-dim">{label}</div>}
          {sublabel && <div className="tiny text-faint">{sublabel}</div>}
        </div>
      </div>
    </div>
  );
}
