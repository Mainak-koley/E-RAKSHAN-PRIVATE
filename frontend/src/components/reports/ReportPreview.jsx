import Badge from '../common/Badge';
import { fmtDateTime, fmtInt } from '../../utils/format';
import { useDemo } from '../../context/DemoContext';
import { useAuth } from '../../context/AuthContext';
import { ROLE_META } from '../../constants/app';

/* Printable situation report (demo of the report-export workflow step). */
export default function ReportPreview({
  sections, riskRows = [], incidentRows = [], assignmentRows = [], warnings = [], generatedAt,
}) {
  const { district } = useDemo();
  const { user } = useAuth();
  const dName = (district?.name || 'DISTRICT').toUpperCase();
  return (
    <div>
      <div className="row between wrap gap-3">
        <div>
          <div className="kicker">E-RAKSHAN · DISTRICT EMERGENCY OPERATIONS · {dName} (DEMO)</div>
          <h3 style={{ fontSize: 18 }}>Situation & Relocation Report — {district?.name}</h3>
          <div className="tiny text-faint">Decision-support prototype — all figures from simulated/demo data</div>
        </div>
        <div className="text-right">
          <div className="tiny text-faint">Generated</div>
          <div className="mono small">{fmtDateTime(generatedAt)}</div>
          <div className="tiny text-faint mt-1">Prepared by <span className="persona-name" style={{ fontSize: 11.5 }}>{user?.name || '—'}</span> · {ROLE_META[user?.role]?.label}</div>
        </div>
      </div>
      <div className="divider" />

      {sections.includes('risk') && (
        <div className="mt-3">
          <h4 style={{ fontSize: 13.5 }}>1 · Priority habitations & red zones</h4>
          <table className="table mt-2" style={{ fontSize: 11.5 }}>
            <thead><tr><th>Rank</th><th>Habitation</th><th style={{ textAlign: 'right' }}>Population</th><th style={{ textAlign: 'right' }}>Hazard</th><th style={{ textAlign: 'right' }}>Priority</th><th>Action</th></tr></thead>
            <tbody>
              {riskRows.slice(0, 10).map((r, i) => (
                <tr key={r.properties.id}>
                  <td className="mono">{String(i + 1).padStart(2, '0')}</td>
                  <td>{r.properties.name}</td>
                  <td className="num">{fmtInt(r.properties.population)}</td>
                  <td className="num">{r.analysis.hazard.toFixed(2)}</td>
                  <td className="num">{r.analysis.priority.toFixed(2)}</td>
                  <td>{r.analysis.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sections.includes('incidents') && (
        <div className="mt-4">
          <h4 style={{ fontSize: 13.5 }}>2 · Incident log ({incidentRows.length} active/unresolved)</h4>
          <table className="table mt-2" style={{ fontSize: 11.5 }}>
            <thead><tr><th>ID</th><th>Type</th><th>Location</th><th>Source</th><th>Status</th></tr></thead>
            <tbody>
              {incidentRows.slice(0, 12).map((f) => (
                <tr key={f.properties.id}>
                  <td className="mono tiny">{f.properties.id}</td>
                  <td>{f.properties.type}</td>
                  <td>{f.properties.location_name || '—'}</td>
                  <td>{f.properties.source}</td>
                  <td>{f.properties.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sections.includes('assignments') && (
        <div className="mt-4">
          <h4 style={{ fontSize: 13.5 }}>3 · Relocation allocation plan</h4>
          {assignmentRows.length ? (
            <table className="table mt-2" style={{ fontSize: 11.5 }}>
              <thead><tr><th>Settlement</th><th>Shelter</th><th style={{ textAlign: 'right' }}>People</th><th style={{ textAlign: 'right' }}>Distance</th><th style={{ textAlign: 'right' }}>Route risk</th></tr></thead>
              <tbody>
                {assignmentRows.map((a, i) => (
                  <tr key={i}>
                    <td>{a.sourceName}</td><td>{a.shelterName}</td>
                    <td className="num">{fmtInt(a.population)}</td>
                    <td className="num">{a.distanceKm.toFixed(1)} km</td>
                    <td className="num">{a.routeRisk.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="tiny text-amber mt-1">No solver output yet — run the Relocation Engine / Optimiser to attach an allocation plan.</div>
          )}
        </div>
      )}

      {sections.includes('sources') && (
        <div className="mt-4">
          <h4 style={{ fontSize: 13.5 }}>4 · Data sources, assumptions & caveats</h4>
          <ul style={{ fontSize: 11.5, color: 'var(--text-dim)', paddingLeft: 18, lineHeight: 1.7 }}>
            <li>Rainfall: IMD-style simulated observation feed (event rainfall clearly labelled).</li>
            <li>Terrain: SRTM/CartoDEM-derived elevation &amp; slope attributes per settlement.</li>
            <li>Roads: OSM baseline network; blockages via field reports (status shown).</li>
            <li>Population: Census baseline with documented growth estimate — shown as estimates.</li>
            <li>Shelter capacities: simulated values <b>requiring verification</b> by district officials.</li>
            <li>Weights are a proposed analytical framework, not official government standards.</li>
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mt-3">
          <Badge tone="amber">Solver warnings attached to decision log</Badge>
        </div>
      )}
      <div className="mt-4 row gap-2 wrap">
        <Badge tone="purple">Decision log v1</Badge>
        <Badge tone="cyan">Generated by E-Rakshan</Badge>
        <Badge tone="gray">demo data · not for operational use</Badge>
      </div>
    </div>
  );
}
