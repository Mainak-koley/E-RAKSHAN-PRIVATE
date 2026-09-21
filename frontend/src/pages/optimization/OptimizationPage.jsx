import { useEffect, useMemo, useState } from 'react';
import { Calculator, Play, Download, BarChart3 } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConvergenceChart from '../../components/charts/ConvergenceChart';
import ContributionBar from '../../components/charts/ContributionBar';
import { SelectInput, RangeInput } from '../../components/common/Inputs';
import { useDemo } from '../../context/DemoContext';
import { useSolver } from '../../hooks/useSolver';
import { useMapCtx } from '../../context/MapContext';
import { useAlerts } from '../../context/AlertContext';
import { centroidOf } from '../../utils/geo';
import { DEFAULT_SOLVER_WEIGHTS } from '../../constants/risk';
import { exportCSV } from '../../utils/csv';
import { fmtInt, fmtPct } from '../../utils/format';

/* Scenario presets for the optimiser page — compare strategies side by side. */
const STRATEGIES = {
  balanced: { label: 'Balanced', w: DEFAULT_SOLVER_WEIGHTS, cap: 0.95 },
  speed: { label: 'Speed-first', w: { distance: 0.7, routeRisk: 0.15, crowding: 0.05, medical: 0.1 }, cap: 0.95 },
  safety: { label: 'Safety-first', w: { distance: 0.15, routeRisk: 0.55, crowding: 0.15, medical: 0.15 }, cap: 0.85 },
  comfort: { label: 'Comfort-first', w: { distance: 0.2, routeRisk: 0.2, crowding: 0.5, medical: 0.1 }, cap: 0.8 },
};

export default function OptimizationPage() {
  const demo = useDemo();
  const solver = useSolver();
  const { setAssignments } = useMapCtx();
  const { pushAlert } = useAlerts();
  const [strategy, setStrategy] = useState('balanced');
  const [maxDistanceKm, setMaxDistanceKm] = useState(10);
  const [iterations, setIterations] = useState(80);

  const st = STRATEGIES[strategy];
  const [wOverride, setWOverride] = useState(null);
  const effW = wOverride || st.w;

  const sources = useMemo(() => [...demo.evaluated]
    .filter((f) => f.properties.population <= 12000)
    .sort((a, b) => b.analysis.priority - a.analysis.priority)
    .slice(0, 3)
    .map((f) => {
      const c = centroidOf(f.geometry);
      return {
        id: f.properties.id, name: f.properties.name,
        population: Math.round(f.properties.population * (f.analysis.band.id === 'critical' ? 0.5 : 0.35)),
        priority: f.analysis.priority,
        medicalNeeds: Math.round(f.properties.population * 0.04 * ((f.properties.elderly_pct + f.properties.children_pct) / 20)),
        center: c,
      };
    }), [demo.evaluated]);

  const shelters = useMemo(() => demo.shelters.features.map((f) => ({
    id: f.properties.id, name: f.properties.name, capacity: f.properties.capacity,
    load: f.properties.occupancy, operational: f.properties.operational,
    medical_support: f.properties.medical_support, suitability: 0.7, center: centroidOf(f.geometry),
  })), [demo.shelters]);

  const blockedPts = useMemo(() => demo.roads.features.filter((r) => r.properties.status === 'blocked')
    .map((r) => { const c = r.geometry.coordinates; const m = c[Math.floor(c.length / 2)]; return [m[1], m[0]]; }), [demo.roads]);

  const runStrategy = (key) => {
    const s = STRATEGIES[key];
    const weights = key === strategy && wOverride ? wOverride : s.w;
    solver.run({
      sources, shelters,
      redzones: demo.effectiveRedzones.features,
      blockedRoadPts: blockedPts,
      weights,
      constraints: { maxDistanceKm, utilisationCap: s.cap, allowOverflow: true, maxIterations: iterations },
    });
  };

  useEffect(() => {
    if (solver.result) setAssignments(solver.result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solver.result]);

  const utilisation = useMemo(() => {
    if (!solver.result) return [];
    const per = {};
    solver.result.assignments.forEach((a) => { per[a.shelterId] = (per[a.shelterId] || 0) + a.population; });
    return demo.shelters.features
      .filter((f) => per[f.properties.id])
      .map((f) => ({ name: f.properties.name.replace(' Relief Centre', '').slice(0, 18), value: Math.round(((f.properties.occupancy + per[f.properties.id]) / f.properties.capacity) * 100) }))
      .sort((a, b) => b.value - a.value);
  }, [solver.result, demo.shelters]);

  return (
    <div className="page">
      <PageHeader
        kicker="OR-Tools / PuLP workbench (simulated in-browser)"
        title="Optimiser · MILP"
        subtitle="Compare objective strategies on the same scenario — convergence trace, utilisation pressure and fallback behaviour."
        actions={(
          <Button variant="primary" size="lg" icon={Play} disabled={solver.running} onClick={() => runStrategy(strategy)}>
            {solver.running ? `Optimising… ${solver.progress}%` : 'Run optimisation'}
          </Button>
        )}
      />

      <div className="grid-split">
        <div className="col gap-3">
          <Card title="Solver run" icon={Calculator} accent subtitle={solver.result ? `status ${solver.result.status} · objective ${solver.result.objective}` : 'choose a strategy and run'} flush>
            <div style={{ padding: 14 }}>
              {solver.running && (
                <>
                  <div className="progress mb-2"><div style={{ width: `${solver.progress}%`, background: 'var(--grad-primary)' }} /></div>
                  <ConvergenceChart values={solver.revealed} height={200} color="#22d3ee" />
                  <div className="solver-log mt-2">
                    <div><span className="hi">■ model</span> min Σ xᵢⱼ · (w₁·dᵢⱼ + w₂·riskᵢⱼ + w₃·crowd + w₄·medical)</div>
                    {solver.revealed.map((v, i) => <div key={i}>[{String(i).padStart(2, '0')}] obj = {v}</div>)}
                  </div>
                </>
              )}
              {!solver.running && !solver.result && <div className="empty"><Calculator size={26} /><div>No run yet</div><div className="tiny">The solver assigns population to shelters under capacity, distance, route-risk and medical constraints.</div></div>}
              {!solver.running && solver.result && (
                <>
                  <div className="row gap-2 wrap mb-3">
                    <Badge tone={solver.result.status === 'feasible' ? 'green' : 'amber'} dot>{solver.result.status}</Badge>
                    <Badge tone="purple">objective {solver.result.objective}</Badge>
                    <Badge tone="cyan">{solver.result.assignments.length} legs</Badge>
                    <Badge tone="gray">{solver.result.iterations.length - 1} iterations</Badge>
                    <Badge tone={solver.result.totals.unassignedPop ? 'red' : 'green'}>{fmtInt(solver.result.totals.unassignedPop)} unallocated</Badge>
                  </div>
                  <div className="small strong mb-1">Convergence trace</div>
                  <ConvergenceChart values={solver.result.iterations} height={190} />
                </>
              )}
            </div>
          </Card>

          {solver.result && (
            <Card title="Shelter utilisation after allocation" icon={BarChart3} subtitle="occupancy + assigned load as % of capacity">
              <ContributionBar
                parts={Object.fromEntries(utilisation.map((u) => [u.name, u.value / 100]))}
                height={Math.max(170, utilisation.length * 26)}
                colorFn={(d) => (d.value > 0.95 ? '#f87171' : d.value > 0.8 ? '#fbbf24' : '#34d399')}
              />
              <div className="row gap-2 mt-2">
                <button type="button" className="btn" onClick={() => exportCSV('allocation-plan.csv', solver.result.assignments.map((a) => ({
                  settlement: a.sourceName, shelter: a.shelterName, people: a.population,
                  distance_km: a.distanceKm.toFixed(2), route_risk: a.routeRisk.toFixed(3), flags: [a.overflow && 'fallback', a.blockedRoute && 'blocked-adjacent', a.medicalPenalty && 'no-medical'].filter(Boolean).join('|') || 'clean',
                })))}><Download size={14} /> Export plan CSV</button>
              </div>
            </Card>
          )}
        </div>

        <div className="col gap-3">
          <Card title="Strategy presets" icon={Calculator}>
            <div className="row gap-1 wrap mb-3">
              {Object.entries(STRATEGIES).map(([k, v]) => (
                <button key={k} type="button" className={`chip-toggle ${strategy === k ? 'on' : ''}`} onClick={() => { setStrategy(k); setWOverride(null); }}>{v.label}</button>
              ))}
            </div>
            <RangeInput label="w₁ travel distance" value={effW.distance} display={fmtPct(effW.distance)} min={0} max={1} step={0.05} onChange={(v) => setWOverride((w) => ({ ...(w || st.w), distance: v }))} />
            <RangeInput label="w₂ route risk" value={effW.routeRisk} display={fmtPct(effW.routeRisk)} min={0} max={1} step={0.05} onChange={(v) => setWOverride((w) => ({ ...(w || st.w), routeRisk: v }))} />
            <RangeInput label="w₃ crowding penalty" value={effW.crowding} display={fmtPct(effW.crowding)} min={0} max={1} step={0.05} onChange={(v) => setWOverride((w) => ({ ...(w || st.w), crowding: v }))} />
            <RangeInput label="w₄ medical mismatch" value={effW.medical} display={fmtPct(effW.medical)} min={0} max={1} step={0.05} onChange={(v) => setWOverride((w) => ({ ...(w || st.w), medical: v }))} />
            <div className="tiny text-faint mt-1">Utilisation cap for this strategy: {Math.round(st.cap * 100)}%</div>
          </Card>
          <Card title="Problem size" icon={Calculator}>
            <div className="col gap-2">
              <div className="row between"><span className="small text-dim">Source groups (top-3 priority)</span><b className="mono small">{sources.length}</b></div>
              <div className="row between"><span className="small text-dim">Population to allocate</span><b className="mono small">{fmtInt(sources.reduce((a, s) => a + s.population, 0))}</b></div>
              <div className="row between"><span className="small text-dim">Shelters (decision vars ≈ groups×shelters)</span><b className="mono small">{shelters.length} <span className="text-faint">({sources.length * shelters.length})</span></b></div>
              <div className="row between"><span className="small text-dim">Blocked segments penalised</span><b className="mono small">{blockedPts.length}</b></div>
              <RangeInput label="Max travel distance" value={maxDistanceKm} display={`${maxDistanceKm} km`} min={6} max={30} step={1} onChange={setMaxDistanceKm} />
              <RangeInput label="Improvement iterations" value={iterations} display={String(iterations)} min={10} max={120} step={10} onChange={setIterations} />
            </div>
          </Card>
          <div className="glass-bar" style={{ padding: 12 }}>
            <span className="tiny text-dim">Infeasible instances never return an empty plan: nearest-shelter overflow, flagged shortages, temporary-shelter recommendation and an automatic escalation alert — exactly the fallback the research doc demands.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
