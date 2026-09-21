import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AXIS, GRID, TOOLTIP_STYLE } from './chartTheme';

/* Objective value per solver iteration (improvement phase trace). */
export default function ConvergenceChart({ values = [], height = 190, color = '#a78bfa' }) {
  const data = values.map((v, i) => ({ i, obj: v }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 14, left: -8, bottom: 0 }}>
        <CartesianGrid {...GRID} vertical={false} />
        <XAxis dataKey="i" {...AXIS} tick={{ fill: '#9fb2cc', fontSize: 10 }} />
        <YAxis {...AXIS} tick={{ fill: '#9fb2cc', fontSize: 10 }} width={54} domain={['dataMin - 50', 'dataMax + 50']} />
        <Tooltip {...TOOLTIP_STYLE} labelFormatter={(i) => `Iteration ${i}`} formatter={(v) => [Math.round(v), 'Objective']} />
        <Line type="monotone" dataKey="obj" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
