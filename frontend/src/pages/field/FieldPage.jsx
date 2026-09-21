import { useMemo } from 'react';
import { ClipboardList, ClipboardPlus } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import FieldReportForm from '../../components/field/FieldReportForm';
import FieldReportList from '../../components/field/FieldReportList';
import { useDemo } from '../../context/DemoContext';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function FieldPage() {
  const demo = useDemo();
  const { notify } = useApp();
  const { user } = useAuth();

  const incidents = demo.incidents.features;
  const counts = useMemo(() => ({
    unverified: incidents.filter((f) => f.properties.status === 'unverified').length,
    responding: incidents.filter((f) => f.properties.status === 'responding').length,
    resolved: incidents.filter((f) => f.properties.status === 'resolved').length,
    mine: incidents.filter((f) => f.properties.source === 'Field Officer').length,
  }), [incidents]);

  const submit = (form) => {
    demo.addIncident({
      coordinates: form.coordinates,
      type: form.type, severity: form.severity,
      description: form.description, location_name: form.location_name,
      source: user?.role === 'field' ? 'Field Officer' : 'Citizen SOS',
    });
    notify('success', 'Report submitted', `${form.type} at ${form.location_name} — enters verification queue.`);
  };

  const setStatus = (id, status) => {
    demo.setIncidentStatus(id, status);
    notify('info', `Status → ${status}`, `${id} updated by ${user?.name}.`);
  };

  return (
    <div className="page">
      <PageHeader
        kicker="Crowdsourced & field intelligence"
        title="Field Reports"
        subtitle="Citizen SOS + officer observations enter one verification pipeline. Verification raises OSIRIS confidence and unlocks red-zone influence."
      />

      <div className="stat-grid">
        <StatCard icon={ClipboardList} accent="amber" label="Awaiting verification" value={counts.unverified} sub="needs authority action" />
        <StatCard icon={ClipboardPlus} accent="purple" label="Responding" value={counts.responding} sub="teams deployed" />
        <StatCard icon={ClipboardList} accent="green" label="Resolved" value={counts.resolved} sub="closed tickets" />
        <StatCard icon={ClipboardList} accent="cyan" label="Officer-originated" value={counts.mine} sub="field-officer reports" />
      </div>

      <div className="grid-split mt-4">
        <Card title="Report queue" icon={ClipboardList} flush bodyClass="">
          <div style={{ padding: 14 }}>
            <FieldReportList incidents={incidents} onStatus={setStatus} />
          </div>
        </Card>
        <div className="col gap-3">
          <Card title="New field report" icon={ClipboardPlus} accent>
            <FieldReportForm onSubmit={submit} />
          </Card>
          <div className="glass-bar" style={{ padding: 12 }}>
            <div className="tiny text-dim"><b>OSIRIS confidence model</b><br />
              confidence = reliability × recency × verification × authority<br />
              Citizen SOS ≈ 0.57 until verified — it can influence the map but never auto-create a red zone.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
