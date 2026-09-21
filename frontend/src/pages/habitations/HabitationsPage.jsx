import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Download, SlidersHorizontal } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import HabitationTable from '../../components/habitations/HabitationTable';
import HabitationDetail from '../../components/habitations/HabitationDetail';
import Drawer from '../../components/common/Drawer';
import { SelectInput, RangeInput } from '../../components/common/Inputs';
import { exportCSV } from '../../utils/csv';
import { useDemo } from '../../context/DemoContext';
import { centroidOf } from '../../utils/geo';
import { fmtInt } from '../../utils/format';

export default function HabitationsPage() {
  const demo = useDemo();
  const loc = useLocation();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [band, setBand] = useState(() => loc.state?.aiFilter || 'all');
  const [panch, setPanch] = useState('all');
  const [minPop, setMinPop] = useState(0);
  const [focus, setFocus] = useState(() => loc.state?.focusId || null);

  useEffect(() => {
    if (loc.state?.aiFilter) setBand(loc.state.aiFilter);
    if (loc.state?.focusId) setFocus(loc.state.focusId);
  }, [loc.state]);

  const panchayaths = useMemo(() => [...new Set(demo.evaluated.map((f) => f.properties.panchayath))].sort(), [demo.evaluated]);

  const rows = useMemo(() => demo.evaluated.map((f) => ({ ...f, _isolated: demo.isIsolated(f.properties.id) }))
    .filter((f) => (band === 'all' || f.analysis.band.id === band)
      && (panch === 'all' || f.properties.panchayath === panch)
      && f.properties.population >= minPop
      && (q === '' || (f.properties.name + f.properties.panchayath).toLowerCase().includes(q.toLowerCase()))), [demo, band, panch, minPop, q]);

  const focusFeature = focus ? rows.find((f) => f.properties.id === focus) || demo.habById[focus] : null;

  const stats = useMemo(() => {
    const pop = rows.reduce((a, f) => a + f.properties.population, 0);
    const crit = rows.filter((f) => f.analysis.band.id === 'critical').length;
    return { pop, crit };
  }, [rows]);

  return (
    <div className="page">
      <PageHeader
        kicker="Exposure & vulnerability register"
        title="Habitations"
        subtitle={`${rows.length} of ${demo.evaluated.length} settlements · ${fmtInt(stats.pop)} residents in view · ${stats.crit} critical`}
        actions={(
          <button type="button" className="btn" onClick={() => exportCSV('habitations-risk.csv', rows.map((f) => ({
            id: f.properties.id, name: f.properties.name, panchayath: f.properties.panchayath,
            population: f.properties.population, hazard: f.analysis.hazard.toFixed(3),
            vulnerability: f.analysis.vulnerability.toFixed(3), priority: f.analysis.priority.toFixed(3),
            band: f.analysis.band.label, action: f.analysis.action, isolated: f._isolated ? 'YES' : 'no',
          })))}><Download size={14} /> Export CSV</button>
        )}
      />

      <Card flush>
        <div className="table-toolbar">
          <input className="input" style={{ maxWidth: 240 }} placeholder="Search name / panchayath…" value={q} onChange={(e) => setQ(e.target.value)} />
          <SelectInput value={band} onChange={(e) => setBand(e.target.value)} options={[
            { value: 'all', label: 'All risk bands' },
            { value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' },
            { value: 'moderate', label: 'Moderate' }, { value: 'low', label: 'Low' }]}
          />
          <SelectInput value={panch} onChange={(e) => setPanch(e.target.value)} options={[{ value: 'all', label: 'All panchayaths' }, ...panchayaths.map((p) => ({ value: p, label: p }))]} />
          <div style={{ width: 170 }}>
            <RangeInput label="Min population" min={0} max={4000} step={100} value={minPop} onChange={setMinPop} display={fmtInt(minPop)} />
          </div>
          <span className="row gap-2 ml-auto" style={{ marginLeft: 'auto' }}>
            <SlidersHorizontal size={13} className="text-faint" />
            <span className="tiny text-faint">click a row for the full risk breakdown</span>
          </span>
        </div>
        <HabitationTable rows={rows} selectedId={focus} onSelect={(f) => setFocus(f.properties.id)} />
      </Card>

      {focusFeature && (
        <Drawer
          title={focusFeature.properties.name}
          subtitle={`${focusFeature.properties.id} · ${focusFeature.properties.panchayath}`}
          onClose={() => { setFocus(null); }}
        >
          <HabitationDetail
            feature={focusFeature}
            analysis={focusFeature.analysis}
            isolated={demo.isIsolated(focusFeature.properties.id)}
            nearest={demo.nearestShelters(centroidOf(focusFeature.geometry))}
          />
          <button type="button" className="btn mt-3" onClick={() => nav('/relocation', { state: { preselect: focusFeature.properties.id } })}>Plan relocation for this settlement →</button>
        </Drawer>
      )}
    </div>
  );
}
