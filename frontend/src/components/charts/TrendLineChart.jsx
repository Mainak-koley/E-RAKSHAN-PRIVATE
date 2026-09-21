import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { AXIS, GRID, TOOLTIP_STYLE } from './chartTheme';

export default function TrendLineChart({ data, xKey = 't', yKey = 'rainfall', color = '#22d3ee', height = 210, unit = 'mm', warnAt }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 12, left: -14, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${yKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.45} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID} vertical={false} />
        <XAxis dataKey={xKey} {...AXIS} />
        <YAxis {...AXIS} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v} ${unit}`, 'Rainfall']} />
        {warnAt != null && <ReferenceLine y={warnAt} stroke="#f87171" strokeDasharray="5 4" label={{ value: 'red-alert', fill: '#f87171', fontSize: 10, position: 'insideTopRight' }} />}
        <Area type="monotone" dataKey={yKey} stroke={color} strokeWidth={2} fill={`url(#grad-${yKey})`} dot={false} activeDot={{ r: 3.5 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
