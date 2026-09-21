import { DEFAULT_SOLVER_WEIGHTS } from '../../constants/risk';
import { RotateCcw } from 'lucide-react';
import { RangeInput, SelectInput, Toggle } from '../common/Inputs';
import { fmtPct } from '../../utils/format';

export default function ConstraintPanel({ weights, setWeights, constraints, setConstraints }) {
  const setW = (k, v) => setWeights((w) => ({ ...w, [k]: v }));
  const setC = (k, v) => setConstraints((c) => ({ ...c, [k]: v }));
  return (
    <div>
      <div className="row between mb-2">
        <span className="small strong">Objective weights (MILP cost)</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setWeights(DEFAULT_SOLVER_WEIGHTS)}><RotateCcw size={12} /> Reset</button>
      </div>
      <RangeInput label="w₁ · Travel distance" value={weights.distance} display={fmtPct(weights.distance)} min={0} max={0.8} step={0.05} onChange={(v) => setW('distance', v)} />
      <RangeInput label="w₂ · Route risk (red-zone exposure)" value={weights.routeRisk} display={fmtPct(weights.routeRisk)} min={0} max={0.8} step={0.05} onChange={(v) => setW('routeRisk', v)} />
      <RangeInput label="w₃ · Shelter crowding penalty" value={weights.crowding} display={fmtPct(weights.crowding)} min={0} max={0.8} step={0.05} onChange={(v) => setW('crowding', v)} />
      <RangeInput label="w₄ · Medical capability mismatch" value={weights.medical} display={fmtPct(weights.medical)} min={0} max={0.8} step={0.05} onChange={(v) => setW('medical', v)} />
      <div className="divider" />
      <SelectInput
        label="Max travel distance"
        value={constraints.maxDistanceKm}
        onChange={(e) => setC('maxDistanceKm', parseFloat(e.target.value))}
        options={[6, 8, 10, 14, 20, 30].map((v) => ({ value: v, label: `${v} km` }))}
        hint="Routes beyond this are only used by the infeasibility fallback."
      />
      <div className="field">
        <span className="row between">
          <span className="label">Shelter utilisation cap</span>
          <span className="mono small text-cyan">{Math.round(constraints.utilisationCap * 100)}%</span>
        </span>
        <input type="range" className="range" min={0.5} max={1} step={0.05} value={constraints.utilisationCap} onChange={(e) => setC('utilisationCap', parseFloat(e.target.value))} />
      </div>
      <Toggle checked={constraints.allowOverflow} onChange={(v) => setC('allowOverflow', v)} label="Fallback: allow 110% overflow at nearest shelters" />
      <div className="field mt-2">
        <span className="row between">
          <span className="label">Solver iterations (improvement phase)</span>
          <span className="mono small text-cyan">{constraints.maxIterations}</span>
        </span>
        <input type="range" className="range" min={10} max={120} step={10} value={constraints.maxIterations} onChange={(e) => setC('maxIterations', parseInt(e.target.value, 10))} />
      </div>
    </div>
  );
}
