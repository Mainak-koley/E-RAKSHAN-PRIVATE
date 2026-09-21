import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TOOLTIP_STYLE } from './chartTheme';

export default function DonutChart({ data, nameKey = 'name', valueKey = 'value', height = 220, colors }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey={valueKey} nameKey={nameKey} innerRadius="52%" outerRadius="78%" paddingAngle={3} stroke="rgba(6,11,22,.8)">
          {data.map((d, i) => <Cell key={i} fill={(colors && colors[i]) || '#22d3ee'} />)}
        </Pie>
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#9fb2cc' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
