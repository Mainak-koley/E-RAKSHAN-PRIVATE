import { useMemo } from 'react';
import { BellRing, Zap, Siren, CheckCheck, ShieldCheck } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';
import AlertFeed from '../../components/alerts/AlertFeed';
import Ticker from '../../components/layout/Ticker';
import { useAlerts } from '../../context/AlertContext';
import { OSIRIS_SOURCES } from '../../constants/risk';
import Badge from '../../components/common/Badge';

export default function AlertsPage() {
  const { alerts, acknowledge, resolve, injectBurst, simulate, setSimulate, unread } = useAlerts();

  const stats = useMemo(() => ({
    critical: alerts.filter((a) => a.severity === 'critical' && a.status !== 'resolved').length,
    unack: unread,
    resolved: alerts.filter((a) => a.status === 'resolved').length,
    total: alerts.length,
  }), [alerts, unread]);

  return (
    <div className="page">
      <PageHeader
        kicker="Evidence & notification centre"
        title="Alert Center"
        subtitle="Every alert carries source, timestamp, location context and confidence. Authority actions are logged."
        actions={(
          <>
            <Button variant="ghost" icon={Zap} onClick={injectBurst}>Inject test burst</Button>
            <Button variant={simulate ? 'danger' : 'primary'} icon={Siren} onClick={() => setSimulate(!simulate)}>
              {simulate ? 'Pause live feed' : 'Resume live feed'}
            </Button>
          </>
        )}
      />

      <Ticker />

      <div className="stat-grid mt-4">
        <StatCard icon={Siren} accent="red" label="Critical active" value={stats.critical} sub="needs immediate action" />
        <StatCard icon={BellRing} accent="amber" label="Unacknowledged" value={stats.unack} sub="new since last review" />
        <StatCard icon={ShieldCheck} accent="green" label="Resolved" value={stats.resolved} sub={`of ${stats.total} total`} />
        <StatCard icon={BellRing} accent="purple" label="Feed state" value={simulate ? 'LIVE' : 'PAUSED'} sub="mock WS /api/v1/events" />
      </div>

      <div className="grid-split mt-4">
        <Card title="Alert stream" icon={BellRing} flush>
          <div style={{ padding: 14 }}>
            <AlertFeed height={520} />
          </div>
        </Card>
        <div className="col gap-3">
          <Card title="Quick actions" icon={Zap}>
            <div className="col gap-2">
              <Button block variant="ghost" icon={CheckCheck} onClick={() => alerts.filter((a) => a.status === 'new').forEach((a) => acknowledge(a.id))}>Acknowledge all new</Button>
              <Button block variant="ghost" icon={ShieldCheck} onClick={() => alerts.filter((a) => a.status !== 'resolved').forEach((a) => resolve(a.id))}>Resolve all active</Button>
            </div>
            <div className="divider" />
            <div className="small strong mb-2">OSIRIS source register</div>
            <div className="col gap-1">
              {OSIRIS_SOURCES.map((s) => (
                <div key={s.id} className="row between">
                  <span className="tiny text-dim">{s.label}</span>
                  <Badge tone={s.status === 'live' ? 'green' : s.status === 'degraded' ? 'amber' : 'gray'}>{s.status} · r={s.reliability}</Badge>
                </div>
              ))}
            </div>
            <div className="tiny text-faint mt-2">One failed source degrades confidence — it never breaks the pipeline.</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
