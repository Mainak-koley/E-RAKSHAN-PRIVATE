import { useNavigate } from 'react-router-dom';
import DataTable from '../common/DataTable';
import Badge from '../common/Badge';
import { ScoreBar } from '../common/Progress';
import { fmtInt } from '../../utils/format';

export default function HabitationTable({ rows, selectedId, onSelect }) {
  const nav = useNavigate();
  return (
    <DataTable
      rows={rows}
      rowKey={(r) => r.properties.id}
      selectedKey={selectedId}
      onRowClick={onSelect}
      columns={[
        { key: 'id', label: 'ID', render: (r) => <span className="mono tiny text-faint">{r.properties.id}</span> },
        { key: 'name', label: 'Habitation', render: (r) => <span><b>{r.properties.name}</b><span className="text-faint"> · {r.properties.panchayath}</span></span> },
        { key: 'population', label: 'Pop.', numeric: true, render: (r) => fmtInt(r.properties.population) },
        { key: 'rain', label: 'Rain 24h', numeric: true, sortValue: (r) => r.analysis.rainfallNow, render: (r) => <span className="mono small">{r.analysis.rainfallNow.toFixed(0)} mm</span> },
        { key: 'hazard', label: 'Hazard', numeric: true, sortValue: (r) => r.analysis.hazard, render: (r) => <span className="row gap-2 center"><ScoreBar value={r.analysis.hazard} color={r.analysis.band.color} width={52} /><span className="mono tiny">{r.analysis.hazard.toFixed(2)}</span></span> },
        { key: 'vuln', label: 'Vuln.', numeric: true, sortValue: (r) => r.analysis.vulnerability, render: (r) => <span className="mono tiny">{r.analysis.vulnerability.toFixed(2)}</span> },
        { key: 'priority', label: 'Priority', numeric: true, sortValue: (r) => r.analysis.priority, render: (r) => <b className="mono" style={{ color: r.analysis.band.color }}>{r.analysis.priority.toFixed(2)}</b> },
        { key: 'band', label: 'Status', sortValue: (r) => r.analysis.hazard, render: (r) => <Badge tone={r.analysis.band.badge}>{r.analysis.band.label}</Badge> },
        { key: 'iso', label: 'Flags', sortable: false, render: (r) => r._isolated ? <Badge tone="red" pulse>ISOLATED</Badge> : <span className="text-faint tiny">—</span> },
        { key: 'act', label: '', sortable: false, render: (r) => (
          <button type="button" className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); nav('/relocation', { state: { preselect: r.properties.id } }); }}>Relocate →</button>
        ) },
      ]}
    />
  );
}
