import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Route as RouteIcon, Play, RotateCcw, ListChecks } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import SourceSelector from '../../components/relocation/SourceSelector';
import ConstraintPanel from '../../components/relocation/ConstraintPanel';
import AssignmentTable from '../../components/relocation/AssignmentTable';
import SolveSummary from '../../components/relocation/SolveSummary';
import ConvergenceChart from '../../components/charts/ConvergenceChart';
import { useDemo } from '../../context/DemoContext';
import { useMapCtx } from '../../context/MapContext';
import { useAlerts } from '../../context/AlertContext';
import { useSolver } from '../../hooks/useSolver';
import { centroidOf } from '../../utils/geo';
import { DEFAULT_SOLVER_WEIGHTS } from '../../constants/risk';
import { fmtInt } from '../../utils/format';

export default function RelocationPage() {
  const demo = useDemo();
  const { setAssignments, visible, toggleLayer } = useMapCtx();
  const { pushAlert } = useAlerts();
  const loc = useLocation();
  const solver = useSolver();

  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [weights, setWeights] = useState(DEFAULT_SOLVER_WEIGHTS);
  const [constraints, setConstraints] = useState({
    maxDistanceKm: 14, utilisationCap: 0.95, allowOverflow: true, maxIterations: 60,
  });

  /* Preselect from priority table / map popups */
  useEffect(() => {
    const pre = loc.state?.preselect;
    if (pre) setSelectedIds((s) => new Set([...s, pre]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.state]);

  useEffect(() => {
    if (selectedIds.size === 0) {
      const feasible = demo.evaluated.slice()
        .filter((f) => f.properties.population <= 12000)
        .sort((a, b) => b.analysis.priority - a.analysis.priority)
        .slice(0, 3)
        .map((f) => f.properties.id);
      setSelectedIds(new Set(feasible));
    } /* eslint-disable-next-line */
  }, [demo.evaluated]);

  const sources = useMemo(() => [...selectedIds].map((id) => {
    const f = demo.habById[id];
    if (!f) return null;
    const c = centroidOf(f.geometry);
    return {
      id: f.properties.id, name: f.properties.name,
      population: Math.round(f.properties.population * (f.analysis.band.id === 'critical' ? 0.5 : 0.35)),
      priority: f.analysis.priority,
      medicalNeeds: Math.round(f.properties.population * 0.04 * ((f.properties.elderly_pct + f.properties.children_pct) / 20)),
      center: c,
    };
  }).filter(Boolean), [selectedIds, demo.habById]);

  const shelters = useMemo(() => demo.shelters.features.map((f) => ({
    id: f.properties.id, name: f.properties.name,
    capacity: f.properties.capacity, load: f.properties.occupancy,
    operational: f.properties.operational, medical_support: f.properties.medical_support,
    suitability: 0.7,
    center: centroidOf(f.geometry),
  })), [demo.shelters]);

  const blockedPts = useMemo(() => demo.roads.features
    .filter((r) => r.properties.status === 'blocked')
    .flatMap((r) => {
      const cs = r.geometry.coordinates;
      const mid = cs[Math.floor(cs.length / 2)];
      return [[mid[1], mid[0]]];
    }), [demo.roads]);

  const run = () => {
    if (!sources.length) return;
    solver.run({
      sources, shelters,
      redzones: demo.effectiveRedzones.features,
      blockedRoadPts: blockedPts,
      weights, constraints,
    });
  };

  useEffect(() => {
    if (solver.result) {
      setAssignments(solver.result);
      if (!visible.assignments) toggleLayer('assignments');
      if (solver.result.status !== 'feasible') {
        pushAlert({
          severity: 'critical', type: 'Relocation Shortfall', source: 'Relocation Engine',
          message: `Capacity deficit: ${fmtInt(solver.result.totals.unassignedPop)} people could not be allocated — open temporary shelters (escalation raised automatically).`,
          confidence: 0.99,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solver.result]);

  return (
    <div className="page">
      <PageHeader
        kicker="Constrained Relocation Engine"
        title="Relocation Planner"
        subtitle="Capacity-constrained allocation: greedy initial assignment + pair-swap improvement (MILP formulation, OR-Tools on the backend)."
        actions={(
          <>
            <Button variant="ghost" icon={RotateCcw} onClick={() => { solver.reset(); setAssignments(null); }}>Clear plan</Button>
            <Button variant="primary" size="lg" icon={Play} disabled={solver.running || sources.length === 0} onClick={run}>
              {solver.running ? `Solving… ${solver.progress}%` : `Solve relocation (${fmtInt(sources.reduce((a, s) => a + s.population, 0))} people)`}
            </Button>
          </>
        )}
      />

      <div className="grid-split">
        <div className="col gap-3">
          <Card
            title="Allocation plan"
            icon={ListChecks}
            accent
            subtitle={solver.result ? `${solver.result.assignments.length} assignment legs · ${solver.result.iterations.length - 1} improvement iterations` : 'Configure sources & constraints, then run the solver'}
            actions={solver.result && <Badge tone="purple">objective {solver.result.objective}</Badge>}
          >
            {solver.running && (
              <div className="mt-2">
                <div className="progress mb-2"><div style={{ width: `${solver.progress}%`, background: 'var(--grad-primary)' }} /></div>
                <ConvergenceChart values={solver.revealed} height={170} />
                <div className="solver-log mt-2">
                  {solver.revealed.map((v, i) => <div key={i}>[{String(i).padStart(2, '0')}] iteration · objective = {v}</div>)}
                </div>
              </div>
            )}
            {!solver.running && !solver.result && (
              <div className="empty">
                <RouteIcon size={28} />
                <div className="strong">No plan yet</div>
                <div className="tiny">Pick source settlements on the right, tune objective weights, then hit Solve.</div>
              </div>
            )}
            {!solver.running && solver.result && <SolveSummary result={solver.result} />}
          </Card>

          {solver.result && (
            <Card title="Assignments" icon={ListChecks} subtitle="Colour flags explain every allocation (explainable AI for the jury)">
              <AssignmentTable assignments={solver.result.assignments} />
              <div className="tiny text-faint mt-2">Routes are drawn on the tactical map — thickness ∝ population, colour ∝ route risk (red-zone exposure + blockage proximity).</div>
            </Card>
          )}
        </div>

        <div className="col gap-3">
          <Card title="Source settlements" icon={ListChecks}>
            <SourceSelector
              selectedIds={selectedIds}
              onToggle={(id) => setSelectedIds((s) => { const n = new Set(s); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; })}
              onAll={() => setSelectedIds(new Set(demo.evaluated.slice().filter((f) => f.properties.population <= 12000).sort((a, b) => b.analysis.priority - a.analysis.priority).slice(0, 6).map((f) => f.properties.id)))}
              onNone={() => setSelectedIds(new Set())}
            />
            <div className="tiny text-faint mt-2">Evacuation load = 50% of population for critical settlements, 35% otherwise (phased evacuation assumption).</div>
          </Card>
          <Card title="Solver configuration" icon={ListChecks}>
            <ConstraintPanel weights={weights} setWeights={setWeights} constraints={constraints} setConstraints={setConstraints} />
          </Card>
          <div className="glass-bar" style={{ padding: 12 }}>
            <span className="tiny text-dim">Enforced constraints: capacity ≤ utilisation cap · operational shelters only · medical-needs groups → medical shelters · red-zone / blockage route penalties · max travel distance (fallback can exceed with warnings).</span>
          </div>
        </div>
      </div>
    </div>
  );
}
