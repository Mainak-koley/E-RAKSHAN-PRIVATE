import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Download, Grid3X3 } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import CriteriaSliders from '../../components/risk/CriteriaSliders';
import PriorityTable from '../../components/risk/PriorityTable';
import ZoneList from '../../components/risk/ZoneList';
import ContributionBar from '../../components/charts/ContributionBar';
import { exportCSV } from '../../utils/csv';
import { useDemo } from '../../context/DemoContext';
import { useMapCtx } from '../../context/MapContext';
import { centroidOf } from '../../utils/geo';
import { RISK_BANDS, HAZARD_CRITERIA } from '../../constants/risk';
import { fmtInt } from '../../utils/format';

export default function RiskPage() {
  const demo = useDemo();
  const { flyTo } = useMapCtx();
  const nav = useNavigate();

  const counts = useMemo(() => {
    const c = { low: 0, moderate: 0, high: 0, critical: 0 };
    demo.evaluated.forEach((f) => { c[f.analysis.band.id] += 1; });
    return c;
  }, [demo.evaluated]);

  const matrix = useMemo(() => {
    // hazard (rows) x vulnerability (cols) 3x3 binned matrix
    const bin = (v) => (v < 0.34 ? 0 : v < 0.67 ? 1 : 2);
    const m = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    demo.evaluated.forEach((f) => { m[2 - bin(f.analysis.hazard)][bin(f.analysis.vulnerability)] += 1; });
    return m;
  }, [demo.evaluated]);

  const avgContrib = useMemo(() => {
    const sum = {}; let n = 0;
    demo.evaluated.forEach((f) => {
      Object.entries(f.analysis.hazardParts).forEach(([k, v]) => { sum[k] = (sum[k] || 0) + v; });
      n += 1;
    });
    return Object.fromEntries(Object.entries(sum).map(([k, v]) => [k, v / Math.max(1, n)]));
  }, [demo.evaluated]);

  const critLabels = Object.fromEntries(HAZARD_CRITERIA.map((c) => [c.id, c.label]));

  return (
    <div className="page">
      <PageHeader
        kicker="Vulnerability & Red-Zone Indexer"
        title="Risk Engine"
        subtitle="Dynamic multi-criteria scoring — tune the weights and watch every module recompute instantly."
        actions={(
          <button type="button" className="btn" onClick={() => exportCSV('red-zone-index.csv', [...demo.evaluated]
            .sort((a, b) => b.analysis.hazard - a.analysis.hazard)
            .map((f) => ({ id: f.properties.id, name: f.properties.name, hazard: f.analysis.hazard.toFixed(3), band: f.analysis.band.label, action: f.analysis.action, priority: f.analysis.priority.toFixed(3) })))}>
            <Download size={14} /> Export index
          </button>
        )}
      />

      <div className="grid-split">
        <div className="col gap-3">
          <Card title="Score classification" icon={ShieldAlert} subtitle="Recommended banding with dashboard colours & actions">
            <div className="grid-4">
              {RISK_BANDS.map((b) => (
                <div key={b.id} className="card" style={{ padding: 12, borderColor: `${b.color}44` }}>
                  <div className="row between">
                    <Badge tone={b.badge} dot pulse={b.id === 'critical'}>{b.label}</Badge>
                    <span className="mono tiny text-faint">{b.id === 'low' ? '0.00' : RISK_BANDS[RISK_BANDS.indexOf(b) - 1].max.toFixed(2)}–{Math.min(1, b.max).toFixed(2)}</span>
                  </div>
                  <div className="mono strong mt-2" style={{ fontSize: 20, color: b.color }}>{counts[b.id]}</div>
                  <div className="tiny text-faint">{b.action}</div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <PriorityTable rows={demo.evaluated} max={10} onZoom={(f) => flyTo(centroidOf(f.geometry), 13)} />
            </div>
          </Card>

          <div className="grid-split-eq">
            <Card title="Hazard × Vulnerability matrix" icon={Grid3X3} subtitle="Settlement counts by risk cell">
              <table className="table" style={{ fontSize: 12 }}>
                <thead>
                  <tr><th>H ↓ / Vuln →</th><th className="num">Low (&lt;.34)</th><th className="num">Mid</th><th className="num">High (&gt;.67)</th></tr>
                </thead>
                <tbody>
                  {matrix.map((row, i) => (
                    <tr key={i}>
                      <td>{['High hazard', 'Mid hazard', 'Low hazard'][i]}</td>
                      {row.map((v, j) => (
                        <td key={j} className="num">
                          <span className="badge" style={{ background: `rgba(248,113,113,${0.08 + (v / Math.max(1, ...matrix.flat())) * 0.5})`, color: v > 0 ? 'var(--text)' : 'var(--text-faint)', borderColor: 'var(--border)' }}>{v || '·'}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="tiny text-faint mt-2">Top-right cells = high hazard + high vulnerability → first in the evacuation queue.</div>
            </Card>
            <Card title="District-average factor contributions" icon={ShieldAlert} subtitle="Explainability — what drives the scores">
              <ContributionBar
                parts={Object.fromEntries(Object.entries(avgContrib).map(([k, v]) => [critLabels[k] || k, v]))}
                height={200}
                colorFn={(d) => (d.value > 0.5 ? '#f87171' : d.value > 0.35 ? '#fb923c' : '#22d3ee')}
              />
              <div className="tiny text-faint">Rainfall dominates under the current scenario — consistent with the monsoon trigger.</div>
            </Card>
          </div>
        </div>

        <div className="col gap-3">
          <Card title="Weight tuning" icon={ShieldAlert} accent>
            <CriteriaSliders />
          </Card>
          <Card title="Dynamic red zones" icon={ShieldAlert} subtitle="Severity drifts with the active rainfall scenario" flush>
            <div style={{ padding: 12 }}><ZoneList /></div>
          </Card>
          <div className="glass-bar" style={{ padding: 12 }}>
            <span className="tiny text-faint">Weights are a <b className="text-dim">proposed analytical framework</b> for the prototype, not official standards. Scores feed the priority queue used by the Relocation Engine.</span>
          </div>
          <button type="button" className="btn btn-block" onClick={() => nav('/relocation')}>Continue to Relocation Engine →</button>
        </div>
      </div>
    </div>
  );
}
