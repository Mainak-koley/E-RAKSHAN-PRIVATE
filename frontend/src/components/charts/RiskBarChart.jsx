import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { AXIS, TOOLTIP_STYLE } from './chartTheme';

/* Top-N habitations by a score (hazard / priority), colored by band. */
export default function RiskBarChart({ data, dataKey = 'value', nameKey = 'name', height = 250, colorFn }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 34, left: 8, bottom: 0 }}>
        <XAxis type="number" domain={[0, 100]} {...AXIS} />
        <YAxis type="category" dataKey={nameKey} width={104} {...AXIS} tick={{ fill: '#c7d6ec', fontSize: 10.5 }} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${Math.round(v)} / 100`, 'Score']} />
        <Bar dataKey={dataKey} radius={[0, 5, 5, 0]} barSize={13}>
          {data.map((d, i) => <Cell key={i} fill={colorFn ? colorFn(d) : '#22d3ee'} />)}
          <LabelList dataKey={dataKey} position="right" fill="#9fb2cc" fontSize={10} formatter={(v) => Math.round(v)} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
