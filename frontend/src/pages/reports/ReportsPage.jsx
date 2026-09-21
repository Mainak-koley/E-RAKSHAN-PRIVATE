import { useEffect, useMemo, useState } from 'react';
import { FileBarChart, Printer, Download, FileText } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import { CheckRow } from '../../components/common/Inputs';
import ReportPreview from '../../components/reports/ReportPreview';
import Button from '../../components/common/Button';
import { useDemo } from '../../context/DemoContext';
import { useMapCtx } from '../../context/MapContext';
import { exportCSV } from '../../utils/csv';

const SECTIONS = [
  { id: 'risk', label: 'Priority habitations & red zones' },
  { id: 'incidents', label: 'Incident log' },
  { id: 'assignments', label: 'Relocation allocation plan' },
  { id: 'sources', label: 'Data sources & caveats' },
];

export default function ReportsPage() {
  const demo = useDemo();
  const { assignments } = useMapCtx();
  const [sections, setSections] = useState(['risk', 'incidents', 'assignments', 'sources']);
  const [generatedAt, setGeneratedAt] = useState(() => new Date().toISOString());
  const [title, setTitle] = useState(() => `Situation & Relocation Report — ${demo.district?.name || 'District'} (demo)`);

  useEffect(() => {
    setTitle(`Situation & Relocation Report — ${demo.district?.name || 'District'} (demo)`);
  }, [demo.districtId]);

  const riskRows = useMemo(() => [...demo.evaluated].sort((a, b) => b.analysis.priority - a.analysis.priority).slice(0, 10), [demo.evaluated]);
  const incidentRows = useMemo(() => demo.incidents.features.filter((f) => f.properties.status !== 'resolved'), [demo.incidents]);

  const toggle = (id) => setSections((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="page">
      <PageHeader
        kicker="Decision log & exports"
        title="Incident Reports"
        subtitle="Compile the operational picture into a printable, evidence-backed report (final step of the demo workflow)."
        actions={(
          <>
            <Button variant="ghost" icon={FileText} onClick={() => setGeneratedAt(new Date().toISOString())}>Regenerate timestamp</Button>
            <Button icon={Download} onClick={() => exportCSV('situation-report.csv', [
              ...riskRows.map((r) => ({ section: 'priority', item: r.properties.name, detail: `hazard ${r.analysis.hazard.toFixed(2)} priority ${r.analysis.priority.toFixed(2)}`, action: r.analysis.action })),
              ...incidentRows.map((f) => ({ section: 'incident', item: f.properties.type, detail: f.properties.location_name, action: f.properties.status })),
              ...(assignments?.assignments || []).map((a) => ({ section: 'allocation', item: `${a.sourceName} → ${a.shelterName}`, detail: `${a.population} people, ${a.distanceKm.toFixed(1)} km`, action: `risk ${a.routeRisk.toFixed(2)}` })),
            ])}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Download size={14} /> Export CSV</span></Button>
            <Button variant="primary" icon={Printer} onClick={() => window.print()}>Print / PDF</Button>
          </>
        )}
      />

      <div className="grid-split">
        <Card title={title} icon={FileBarChart} accent subtitle={`Compiled ${new Date(generatedAt).toLocaleString('en-IN')}`}>
          <ReportPreview
            sections={sections}
            riskRows={riskRows}
            incidentRows={incidentRows}
            assignmentRows={assignments?.assignments || []}
            warnings={assignments?.warnings || []}
            generatedAt={generatedAt}
          />
        </Card>

        <div className="col gap-3">
          <Card title="Report builder" icon={FileBarChart}>
            <label className="field">
              <span className="label">Report title</span>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <div className="small strong mb-2">Sections</div>
            <div className="col gap-2">
              {SECTIONS.map((s) => (
                <CheckRow key={s.id} checked={sections.includes(s.id)} onChange={() => toggle(s.id)}>{s.label}</CheckRow>
              ))}
            </div>
            <div className="divider" />
            <div className="tiny text-faint">The print stylesheet strips navigation & controls — what you preview is what the PDF contains. A decision log with solver warnings is appended automatically.</div>
          </Card>
          <Card title="Attached decision log" icon={FileText}>
            {assignments?.warnings?.length
              ? assignments.warnings.map((w, i) => <div key={i} className="tiny text-amber mb-1">⚠ {w}</div>)
              : <div className="tiny text-faint">No solver warnings in the current plan.</div>}
            {assignments && (
              <div className="tiny text-dim mt-2 mono">
                objective {assignments.objective} · assigned {assignments.totals.assignedPop}/{assignments.totals.totalPop} · max crowd {Math.round(assignments.totals.maxCrowd * 100)}%
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
