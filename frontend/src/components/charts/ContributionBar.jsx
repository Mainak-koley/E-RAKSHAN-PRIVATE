import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { AXIS, TOOLTIP_STYLE } from './chartTheme';

/* Explainability chart: factor contributions behind a score
   (research doc: "show the component contribution behind each score"). */
export default function ContributionBar({ parts = {}, height = 190, max = 1, colorFn }) {
  const data = Object.entries(parts).map(([k, v]) => ({ name: k, value: +(v * (max === 1 ? 1 : 1)).toFixed(3) }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 2, right: 40, left: 6, bottom: 0 }}>
        <XAxis type="number" domain={[0, 1]} {...AXIS} />
        <YAxis type="category" dataKey="name" width={112} {...AXIS} tick={{ fill: '#c7d6ec', fontSize: 10 }} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Contribution']} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={11}>
          {data.map((d, i) => <Cell key={i} fill={colorFn ? colorFn(d) : '#22d3ee'} />)}
          <LabelList dataKey="value" position="right" fill="#9fb2cc" fontSize={9.5} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
