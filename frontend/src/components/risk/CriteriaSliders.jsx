import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { HAZARD_CRITERIA, DEFAULT_HAZARD_WEIGHTS } from '../../constants/risk';
import { useDemo } from '../../context/DemoContext';
import { fmtPct } from '../../utils/format';
import { RangeInput } from '../common/Inputs';

const PRESETS = {
  Flood: { rainfall: 0.4, slope: 0.05, riverProximity: 0.3, drainage: 0.15, lowElevation: 0.1, historical: 0 },
  Landslide: { rainfall: 0.3, slope: 0.4, riverProximity: 0.05, drainage: 0.1, lowElevation: 0, historical: 0.15 },
  Balanced: DEFAULT_HAZARD_WEIGHTS,
};

export default function CriteriaSliders() {
  const { hazardWeights, setHazardWeights } = useDemo();
  const set = (id, v) => setHazardWeights((w) => ({ ...w, [id]: v }));
  const total = Object.values(hazardWeights).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="row between mb-2">
        <span className="row gap-2 small strong"><SlidersHorizontal size={13} className="text-cyan" /> Hazard factor weights</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setHazardWeights(DEFAULT_HAZARD_WEIGHTS)}><RotateCcw size={12} /> Reset</button>
      </div>
      <div className="row gap-1 mb-3 wrap">
        {Object.entries(PRESETS).map(([name, w]) => (
          <button key={name} type="button" className="chip-toggle" onClick={() => setHazardWeights(w)}>{name} preset</button>
        ))}
      </div>
      {HAZARD_CRITERIA.map((c) => (
        <RangeInput
          key={c.id}
          label={c.label}
          value={hazardWeights[c.id]}
          display={fmtPct(total ? hazardWeights[c.id] / total : 0)}
          min={0} max={0.6} step={0.01}
          onChange={(v) => set(c.id, v)}
        />
      ))}
      <div className={`tiny mt-2 ${Math.abs(total - 1) < 0.02 ? 'text-green' : 'text-amber'}`}>
        Σ weights = {total.toFixed(2)} {Math.abs(total - 1) >= 0.02 ? '(auto-normalised in engine)' : '· normalised ✓'}
      </div>
      <div className="tiny text-faint mt-1">Proposed analytical weights — not official government standards (per documented research notes).</div>
    </div>
  );
}
