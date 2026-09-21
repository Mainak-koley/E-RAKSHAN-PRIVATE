import { useNavigate } from 'react-router-dom';
import DataTable from '../common/DataTable';
import Badge from '../common/Badge';
import { ScoreBar } from '../common/Progress';
import { fmtInt } from '../../utils/format';

/* Evacuation priority queue: hazard + vulnerability + exposure → rank. */
export default function PriorityTable({ rows, max = 12, onZoom }) {
  const nav = useNavigate();
  const data = [...rows]
    .sort((a, b) => b.analysis.priority - a.analysis.priority)
    .slice(0, max);

  return (
    <DataTable
      rows={data}
      rowKey={(r) => r.properties.id}
      columns={[
        { key: 'rank', label: '#', width: 40, sortable: false, render: (r) => <span className="mono text-dim">{String(rows.indexOf(r) + 1).padStart(2, '0')}</span> },
        { key: 'name', label: 'Habitation', render: (r) => (
          <span>
            <b>{r.properties.name}</b>
            <span className="text-faint"> · {r.properties.panchayath}</span>
            {rows.find((x) => x.properties.id === r.properties.id) && null}
          </span>
        ) },
        { key: 'population', label: 'Population', numeric: true, render: (r) => fmtInt(r.properties.population) },
        { key: 'hazard', label: 'Hazard', numeric: true, sortValue: (r) => r.analysis.hazard, render: (r) => <span className="row gap-2 center"><ScoreBar value={r.analysis.hazard} color={r.analysis.band.color} width={56} /><span className="mono small">{r.analysis.hazard.toFixed(2)}</span></span> },
        { key: 'vulnerability', label: 'Vuln.', numeric: true, sortValue: (r) => r.analysis.vulnerability, render: (r) => <span className="mono small">{r.analysis.vulnerability.toFixed(2)}</span> },
        { key: 'priority', label: 'Priority', numeric: true, sortValue: (r) => r.analysis.priority, render: (r) => <b className="mono" style={{ color: r.analysis.band.color }}>{r.analysis.priority.toFixed(2)}</b> },
        { key: 'action', label: 'Recommended action', render: (r) => (
          <span className="row gap-2">
            <Badge tone={r.analysis.band.badge}>{r.analysis.band.label}</Badge>
            <span className="tiny text-dim ellipsis" style={{ maxWidth: 130 }}>{r.analysis.action}</span>
          </span>
        ) },
        { key: 'go', label: '', sortable: false, render: (r) => (
          <span className="row gap-1">
            <button type="button" className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); onZoom?.(r); }}>Locate</button>
            <button type="button" className="btn btn-sm" onClick={(e) => { e.stopPropagation(); nav('/relocation', { state: { preselect: r.properties.id } }); }}>Relocate</button>
          </span>
        ) },
      ]}
    />
  );
}
