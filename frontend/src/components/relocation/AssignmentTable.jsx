import DataTable from '../common/DataTable';
import Badge from '../common/Badge';
import { fmtInt } from '../../utils/format';

export default function AssignmentTable({ assignments }) {
  return (
    <DataTable
      rows={assignments}
      rowKey={(a, i) => `${a.sourceId}-${a.shelterId}-${i}`}
      columns={[
        { key: 'sourceName', label: 'From settlement', render: (a) => <b>{a.sourceName}</b> },
        { key: 'shelterName', label: 'To shelter', render: (a) => <span>{a.shelterName}</span> },
        { key: 'population', label: 'People', numeric: true, render: (a) => <b className="mono">{fmtInt(a.population)}</b> },
        { key: 'distanceKm', label: 'Distance', numeric: true, render: (a) => <span className="mono small">{a.distanceKm.toFixed(1)} km</span> },
        { key: 'routeRisk', label: 'Route risk', numeric: true, render: (a) => <span className="mono small" style={{ color: a.routeRisk > 0.5 ? 'var(--red)' : a.routeRisk > 0.25 ? 'var(--amber)' : 'var(--green)' }}>{a.routeRisk.toFixed(2)}</span> },
        { key: 'flags', label: 'Flags', sortable: false, render: (a) => (
          <span className="row gap-1">
            {a.routeRisk > 0.5 && <Badge tone="red">red-zone exposure</Badge>}
            {a.blockedRoute && <Badge tone="red">blocked-adjacent</Badge>}
            {a.overflow && <Badge tone="amber">fallback</Badge>}
            {a.medicalPenalty && <Badge tone="purple">no-medical</Badge>}
            {a.routeRisk <= 0.5 && !a.blockedRoute && !a.overflow && !a.medicalPenalty && <Badge tone="green">clean route</Badge>}
          </span>
        ) },
      ]}
    />
  );
}
