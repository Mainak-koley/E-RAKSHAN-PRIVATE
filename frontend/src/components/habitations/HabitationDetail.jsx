import Badge from '../common/Badge';
import { ScoreBar } from '../common/Progress';
import ContributionBar from '../charts/ContributionBar';
import { HAZARD_CRITERIA } from '../../constants/risk';
import { fmtInt } from '../../utils/format';

export default function HabitationDetail({ feature, analysis, isolated, nearest }) {
  const p = feature.properties;
  const critMap = Object.fromEntries(HAZARD_CRITERIA.map((c) => [c.id, c.label]));
  const vulnParts = [
    ['Vulnerable share', analysis.vulnParts?.vulnerableShare ?? 0],
    ['Fragile housing', analysis.vulnParts?.fragileHousing ?? 0],
    ['No vehicle', analysis.vulnParts?.noVehicle ?? 0],
    ['Hospital access', analysis.vulnParts?.hospitalAccess ?? 0],
  ];
  return (
    <div>
      <div className="row gap-2 wrap">
        <Badge tone={analysis.band.badge} dot pulse={analysis.band.id === 'critical'}>{analysis.band.label} · {analysis.action}</Badge>
        {isolated && <Badge tone="red" pulse>ISOLATED — NO SAFE LAND ROUTE</Badge>}
        <Badge tone="cyan">{p.panchayath}</Badge>
      </div>

      <div className="grid-2 mt-4">
        {[['Population', fmtInt(p.population)], ['Households', fmtInt(p.households)], ['Elevation', `${p.elevation_m} m`], ['Slope', `${p.slope_deg}°`],
          ['River distance', `${p.dist_river_km} km`], ['Drainage index', p.drainage_index.toFixed(2)], ['Rainfall 24h', `${analysis.rainfallNow.toFixed(0)} mm`], ['Historical events', p.hist_events]].map(([k, v]) => (
          <div key={k} className="card" style={{ padding: '8px 12px' }}>
            <div className="tiny text-faint upper">{k}</div>
            <div className="mono strong">{v}</div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="row between">
          <span className="small strong">Hazard score {analysis.hazard.toFixed(2)}</span>
          <ScoreBar value={analysis.hazard} color={analysis.band.color} width={120} />
        </div>
        <div className="tiny text-faint mb-1">Factor contributions (explainable scoring)</div>
        <ContributionBar
          parts={Object.fromEntries(Object.entries(analysis.hazardParts || {}).map(([k, v]) => [critMap[k] || k, v]))}
          height={170}
          colorFn={(d) => (d.value > 0.66 ? '#f87171' : d.value > 0.4 ? '#fb923c' : d.value > 0.2 ? '#fbbf24' : '#34d399')}
        />
      </div>

      <div className="mt-4">
        <div className="small strong mb-2">Vulnerability {analysis.vulnerability.toFixed(2)}</div>
        {vulnParts.map(([k, v]) => (
          <div key={k} className="row between gap-3 mb-1">
            <span className="small text-dim">{k}</span>
            <span className="row gap-2 center flex-1" style={{ justifyContent: 'flex-end' }}><ScoreBar value={v} color="var(--purple)" width={90} /><span className="mono tiny" style={{ width: 30, textAlign: 'right' }}>{v.toFixed(2)}</span></span>
          </div>
        ))}
      </div>

      {nearest?.length > 0 && (
        <div className="mt-4">
          <div className="small strong mb-2">Nearest operational shelters</div>
          {nearest.map(({ shelter, dist, free }) => (
            <div key={shelter.properties.id} className="row between gap-3" style={{ padding: '6px 0', borderBottom: '1px solid var(--border-soft)' }}>
              <span className="small">{shelter.properties.name}</span>
              <span className="tiny text-dim mono">{dist.toFixed(1)} km · {fmtInt(free)} free</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
