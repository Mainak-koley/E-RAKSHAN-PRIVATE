import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, ShieldAlert, Tent, AlertTriangle, Zap, Play, Pause, CloudRain, Waves,
  Radio, Satellite, Video, Activity, Droplets, Siren, Gauge, ChevronRight,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Ticker from '../../components/layout/Ticker';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import RiskBarChart from '../../components/charts/RiskBarChart';
import TrendLineChart from '../../components/charts/TrendLineChart';
import DonutChart from '../../components/charts/DonutChart';
import GaugeChart from '../../components/charts/GaugeChart';
import TacticalMap from '../../components/maps/TacticalMap';
import { rainfallSeries } from '../../utils/simulate';
import { SCENARIO_PRESETS } from '../../data/demo/scenario';
import { OSIRIS_SOURCES } from '../../constants/risk';
import { fmtInt, fmtPct } from '../../utils/format';
import { useDemo } from '../../context/DemoContext';
import { useAlerts } from '../../context/AlertContext';
import { useMapCtx } from '../../context/MapContext';
import { centroidOf } from '../../utils/geo';

export default function DashboardPage() {
  const demo = useDemo();
  const { alerts, active, injectBurst, unread } = useAlerts();
  const { flyTo } = useMapCtx();
  const nav = useNavigate();
  const [simRunning, setSimRunning] = useState(true);

  const kpis = useMemo(() => {
    const critical = demo.evaluated.filter((f) => f.analysis.band.id === 'critical');
    const high = demo.evaluated.filter((f) => f.analysis.band.id === 'high');
    const popAtRisk = critical.reduce((a, f) => a + f.properties.population, 0);
    const totalCap = demo.shelters.features.reduce((a, f) => a + f.properties.capacity, 0);
    const totalOcc = demo.shelters.features.reduce((a, f) => a + f.properties.occupancy, 0);
    const activeIncidents = demo.incidents.features.filter((f) => f.properties.status !== 'resolved');
    const isolated = demo.evaluated.filter((f) => demo.isIsolated(f.properties.id));
    return { critical, high, popAtRisk, totalCap, totalOcc, activeIncidents, isolated };
  }, [demo]);

  const topRisk = useMemo(() => [...demo.evaluated]
    .sort((a, b) => b.analysis.hazard - a.analysis.hazard)
    .slice(0, 8)
    .map((f) => ({ name: f.properties.name, value: f.analysis.hazard * 100, band: f.analysis.band.id })), [demo]);

  const incidentDonut = useMemo(() => {
    const byStatus = { unverified: 0, verified: 0, responding: 0, resolved: 0 };
    demo.incidents.features.forEach((f) => { byStatus[f.properties.status] = (byStatus[f.properties.status] || 0) + 1; });
    return Object.entries(byStatus).map(([name, value]) => ({ name, value }));
  }, [demo.incidents]);

  const rain = useMemo(() => rainfallSeries(7, 24), []);
  const occupancy = kpis.totalCap ? kpis.totalOcc / kpis.totalCap : 0;

  const dropPreset = (p) => demo.applyPreset(p.id);

  if (demo.loading) {
    return <div className="page"><Card><div className="empty"><Activity size={26} /><div>Loading demo geodata… {demo.progress}</div></div></Card></div>;
  }
  if (demo.error) {
    return <div className="page"><Card><div className="empty"><AlertTriangle size={26} /><div>Failed to load demo data: {demo.error}</div></div></Card></div>;
  }

  return (
    <div className="page">
      <PageHeader
        kicker={`Common Operational Picture · ${demo.district?.name} (${demo.district?.state}) — demo district`}
        title="Command Dashboard"
        subtitle={<>Decision chain: <b className="text-cyan">Hazard → Vulnerability → Priority → Safe Site → Capacity → Route → Relocation</b></>}
        actions={(
          <div className="row gap-2 wrap">
            {SCENARIO_PRESETS.map((p) => (
              <button key={p.id} type="button" className={`chip-toggle ${demo.scenario.rainfall === p.rainfall && demo.scenario.eventActive === p.eventActive && demo.scenario.riverLevel === p.riverLevel ? 'on' : ''}`} onClick={() => dropPreset(p)} title={p.desc}>
                {p.label}
              </button>
            ))}
          </div>
        )}
      />

      <Ticker />

      <div className="stat-grid mt-4">
        <StatCard icon={Siren} accent="red" label="Population to evacuate" value={fmtInt(kpis.popAtRisk)} delta={demo.scenario.eventActive ? 'event active' : 'baseline'} deltaDir={demo.scenario.eventActive ? 'up' : undefined} sub={`${kpis.critical.length} critical · ${kpis.high.length} on watch`} onClick={() => nav('/risk')} />
        <StatCard icon={ShieldAlert} accent="orange" label="Dynamic red zones" value={demo.effectiveRedzones.features.filter((f) => f.properties.severity > 0.5).length} sub={`of ${demo.effectiveRedzones.features.length} tracked zones`} onClick={() => nav('/risk')} />
        <StatCard icon={AlertTriangle} accent="amber" label="Active incidents" value={kpis.activeIncidents.length} sub={`${demo.incidents.features.filter((f) => f.properties.status === 'unverified').length} unverified`} onClick={() => nav('/alerts')} />
        <StatCard icon={Tent} accent="green" label="Shelter network load" value={fmtPct(occupancy)} sub={`${fmtInt(kpis.totalCap - kpis.totalOcc)} beds free`} onClick={() => nav('/capacity')} />
        <StatCard icon={Users} accent={kpis.isolated.length ? 'red' : 'cyan'} label="Isolated habitations" value={kpis.isolated.length} sub="no safe land route" onClick={() => nav('/habitations')} />
      </div>

      <div className="grid-split mt-4">
        <Card
          title="Tactical picture" icon={Satellite} accent
          subtitle="Dynamic red zones · priority habitation dots · blocked road segments"
          actions={<Button size="sm" variant="ghost" onClick={() => nav('/map')}>Open full map <ChevronRight size={12} /></Button>}
          flush
        >
          <TacticalMap height={430} />
        </Card>

        <div className="col gap-3">
          <Card title="Simulation triggers" icon={Zap} accent subtitle="Run the demo workflow live">
            <div className="col gap-2">
              <div className="row between gap-2">
                <span className="small text-dim">Event rainfall</span>
                <span className="mono small text-cyan">{demo.scenario.eventActive ? `+${demo.scenario.rainfall} mm` : 'baseline'}</span>
              </div>
              <input type="range" className="range range-lg" min={0} max={200} step={10} value={demo.scenario.rainfall}
                onChange={(e) => demo.setScenario((s) => ({ ...s, rainfall: +e.target.value, eventActive: +e.target.value > 0 }))} />
              <div className="row gap-1 wrap">
                {['rising', 'steady', 'receding'].map((lvl) => (
                  <button key={lvl} type="button" className={`chip-toggle ${demo.scenario.riverLevel === lvl ? 'on' : ''}`} onClick={() => demo.setScenario((s) => ({ ...s, riverLevel: lvl }))}>
                    <Waves size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />{lvl}
                  </button>
                ))}
              </div>
              <div className="row gap-2 mt-1 wrap">
                <Button size="sm" onClick={() => demo.simEvent('ROAD_BLOCK')} icon={Play}>Block a road</Button>
                <Button size="sm" variant="ghost" onClick={() => demo.simEvent('SOS_BURST')}>SOS burst</Button>
                <Button size="sm" variant="ghost" onClick={injectBurst}>Alert burst</Button>
                <Button size="sm" variant={simRunning ? 'danger' : 'primary'} icon={simRunning ? Pause : Play} onClick={() => setSimRunning((v) => !v)}>{simRunning ? 'Pause feeds' : 'Resume feeds'}</Button>
              </div>
              <div className="tiny text-faint">Every trigger instantly recomputes hazard scores, priorities, isolation and shelter pressure across all modules.</div>
            </div>
          </Card>

          <Card title="Live telemetry" icon={Radio} subtitle="OSIRIS ingestion status">
            <div className="grid-2">
              {[['River stage', `${demo.telemetry.riverLevelCm} cm`, Waves, 'cyan'], ['Rainfall', `${demo.telemetry.rainfallMmHr} mm/hr`, CloudRain, 'purple'], ['Wind', `${demo.telemetry.windKmph} km/h`, Gauge, 'blue'], ['AWS stations', `${demo.telemetry.stationsUp}/12 up`, Activity, 'green']].map(([l, v, Icon, accent]) => (
                <div key={l} className="row gap-2" style={{ padding: '4px 0' }}>
                  <span className={`stat-icon accent-${accent}`} style={{ width: 28, height: 28, minWidth: 28 }}><Icon size={14} /></span>
                  <span><span className="tiny text-faint" style={{ display: 'block' }}>{l}</span><span className="mono small strong">{v}</span></span>
                </div>
              ))}
            </div>
            <div className="divider" />
            <div className="col gap-1">
              {OSIRIS_SOURCES.slice(0, 5).map((s) => (
                <div key={s.id} className="row between">
                  <span className="tiny text-dim row gap-2"><Droplets size={11} className="text-cyan" />{s.label}</span>
                  <Badge tone={s.status === 'live' ? 'green' : s.status === 'degraded' ? 'amber' : 'gray'}>{s.status} · r={s.reliability}</Badge>
                </div>
              ))}
              <div className="tiny text-faint mt-1"><Video size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }} />CCTV streams optional — pipeline operates without them (graceful degradation).</div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid-3 mt-4">
        <Card title="Top hazard scores" icon={ShieldAlert} subtitle="Recomputed with current weights & scenario">
          <RiskBarChart
            data={topRisk}
            colorFn={(d) => ({ critical: '#f87171', high: '#fb923c', moderate: '#fbbf24', low: '#34d399' }[d.band])}
          />
        </Card>
        <Card title="24h rainfall series" icon={CloudRain} subtitle="Upper catchment AWS blend (simulated)">
          <TrendLineChart data={rain} warnAt={100} />
        </Card>
        <Card title="Incident pipeline" icon={AlertTriangle} subtitle="Verification workflow state">
          <DonutChart data={incidentDonut} colors={['#8296b3', '#22d3ee', '#a78bfa', '#34d399']} height={230} />
        </Card>
      </div>

      <div className="grid-split-eq mt-4">
        <Card title="Evacuation priority queue" icon={Users} subtitle="Top-5 settlements by priority index" flush>
          <div style={{ padding: '6px 0' }}>
            {[...demo.evaluated].sort((a, b) => b.analysis.priority - a.analysis.priority).slice(0, 5).map((f, i) => (
              <div key={f.properties.id} className="row between gap-3" style={{ padding: '9px 16px', borderBottom: '1px solid var(--border-soft)', cursor: 'pointer' }}
                onClick={() => { flyTo(centroidOf(f.geometry), 13); nav('/habitations', { state: { focusId: f.properties.id } }); }}>
                <span className="row gap-3">
                  <b className="mono text-faint">{String(i + 1).padStart(2, '0')}</b>
                  <span><b className="small">{f.properties.name}</b><span className="tiny text-faint"> · {fmtInt(f.properties.population)} people</span></span>
                </span>
                <span className="row gap-2">
                  <Badge tone={f.analysis.band.badge}>{f.analysis.priority.toFixed(2)}</Badge>
                  <span className="tiny text-cyan">→</span>
                </span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Shelter capacity snapshot" icon={Tent} subtitle="Network occupancy vs total capacity">
          <div className="row gap-4">
            <div style={{ width: 150 }}>
              <GaugeChart value={occupancy} color={occupancy > 0.9 ? '#f87171' : occupancy > 0.7 ? '#fbbf24' : '#34d399'} height={150} label="network occupancy" sublabel={`${fmtInt(kpis.totalOcc)} / ${fmtInt(kpis.totalCap)}`} />
            </div>
            <div className="flex-1 col gap-1">
              {demo.shelters.features.slice().sort((a, b) => (b.properties.occupancy / b.properties.capacity) - (a.properties.occupancy / a.properties.capacity)).slice(0, 4).map((f) => {
                const o = f.properties.occupancy / f.properties.capacity;
                return (
                  <div key={f.properties.id} className="row between gap-2">
                    <span className="small text-dim ellipsis">{f.properties.name}</span>
                    <Badge tone={o > 0.9 ? 'red' : o > 0.7 ? 'amber' : 'green'}>{Math.round(o * 100)}%</Badge>
                  </div>
                );
              })}
              <Button size="sm" variant="ghost" className="mt-2" onClick={() => nav('/capacity')}>Manage capacity →</Button>
            </div>
          </div>
        </Card>
      </div>

      {unread > 0 && (
        <div className="glass-bar mt-4 row between gap-3" style={{ padding: '10px 16px', borderColor: 'rgba(248,113,113,.45)' }}>
          <span className="row gap-2"><Siren size={16} className="text-red" /><span className="small strong">{unread} new alert{unread > 1 ? 's' : ''} need acknowledgement</span></span>
          <Button size="sm" variant="danger" onClick={() => nav('/alerts')}>Open Alert Center</Button>
        </div>
      )}
    </div>
  );
}
