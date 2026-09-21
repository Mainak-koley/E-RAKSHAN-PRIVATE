import { useMemo, useState } from 'react';
import { Settings2, Users, Database, RefreshCcw, Plus, Radio, Trash2 } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import StatCard from '../../components/common/StatCard';
import { TextInput, SelectInput, Toggle, RangeInput } from '../../components/common/Inputs';
import DataTable from '../../components/common/DataTable';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useDemo } from '../../context/DemoContext';
import { useAlerts } from '../../context/AlertContext';
import { useMapCtx } from '../../context/MapContext';
import { DEMO_USERS, ROLE_META, APP } from '../../constants/app';
import { loadLS, saveLS } from '../../utils/storage';
import { SIM_EVENTS } from '../../data/demo/scenario';
import { BHUVAN_PORTAL, FIRMS_PORTAL } from '../../services/providers/tileProviders';

export default function AdminPage() {
  const { notify } = useApp();
  const { user } = useAuth();
  const demo = useDemo();
  const { simulate, setSimulate } = useAlerts();
  const { basemap, setBasemap, providers } = useMapCtx();

  const [team, setTeam] = useState(() => loadLS('team', DEMO_USERS.map((u, i) => ({
    id: `USR-${i + 1}`, name: u.name, email: u.email, role: u.role, active: true,
  }))));
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'field' });
  const [wsInterval, setWsInterval] = useState(6);

  const saveTeam = (rows) => { setTeam(rows); saveLS('team', rows); };

  const addUser = () => {
    if (!newUser.name.trim() || !newUser.email.trim()) { notify('warn', 'Missing fields', 'Name and email are required.'); return; }
    saveTeam([...team, { id: `USR-${Date.now().toString(36)}`, ...newUser, active: true }]);
    setNewUser({ name: '', email: '', role: 'field' });
    notify('success', 'Member added', `${newUser.name} can access the console (demo — no real account created).`);
  };

  const dataStats = useMemo(() => ([
    ['Habitations', demo.evaluated.length],
    ['Red zones', demo.effectiveRedzones.features.length],
    ['Safe sites', demo.safeSites.features.length],
    ['Shelters', demo.shelters.features.length],
    ['Road segments', demo.roads.features.length],
    ['Incidents', demo.incidents.features.length],
  ]), [demo]);

  return (
    <div className="page">
      <PageHeader
        kicker="System administration"
        title="Administration"
        subtitle={`Console configuration · signed in as ${user?.name} (${ROLE_META[user?.role]?.label})`}
      />

      <div className="stat-grid">
        <StatCard icon={Users} accent="cyan" label="Registered officials" value={team.filter((t) => t.active).length} sub={`${team.length} total`} />
        <StatCard icon={Database} accent="purple" label="Demo layers loaded" value={dataStats.length} sub="geojson feature sets" />
        <StatCard icon={Radio} accent={simulate ? 'green' : 'amber'} label="Mock WS channel" value={simulate ? 'LIVE' : 'PAUSED'} sub={`${wsInterval}s cadence`} />
        <StatCard icon={Settings2} accent="orange" label="Build" value={APP.version} sub="Vite + React 18" />
      </div>

      <div className="grid-split mt-4">
        <div className="col gap-3">
          <Card title="Team & roles (RBAC)" icon={Users} flush actions={(
            <span className="tiny text-faint">role gates nav items — commanders see Administration</span>
          )}>
            <DataTable
              rows={team}
              rowKey={(r) => r.id}
              columns={[
                { key: 'name', label: 'Name', render: (r) => <span className="persona-name">{r.name}</span> },
                { key: 'email', label: 'Email', render: (r) => <span className="tiny text-dim">{r.email}</span> },
                { key: 'role', label: 'Role', render: (r) => (
                  <select className="select" style={{ padding: '4px 26px 4px 8px', fontSize: 12 }} value={r.role}
                    onChange={(e) => saveTeam(team.map((t) => (t.id === r.id ? { ...t, role: e.target.value } : t)))}>
                    {Object.keys(ROLE_META).map((k) => <option key={k} value={k}>{ROLE_META[k].label}</option>)}
                  </select>
                ) },
                { key: 'active', label: 'Active', render: (r) => <Toggle checked={r.active} onChange={(v) => saveTeam(team.map((t) => (t.id === r.id ? { ...t, active: v } : t)))} /> },
                { key: 'del', label: '', sortable: false, render: (r) => (
                  <button type="button" className="icon-btn" title="Remove" onClick={() => saveTeam(team.filter((t) => t.id !== r.id))}><Trash2 size={13} /></button>
                ) },
              ]}
            />
            <div className="row gap-2 wrap" style={{ padding: 14 }}>
              <input className="input" style={{ maxWidth: 150 }} placeholder="Full name" value={newUser.name} onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))} />
              <input className="input" style={{ maxWidth: 210 }} placeholder="official@district.gov.in" value={newUser.email} onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))} />
              <select className="select" style={{ maxWidth: 170 }} value={newUser.role} onChange={(e) => setNewUser((u) => ({ ...u, role: e.target.value }))}>
                {Object.keys(ROLE_META).map((k) => <option key={k} value={k}>{ROLE_META[k].label}</option>)}
              </select>
              <Button icon={Plus} onClick={addUser}>Add member</Button>
            </div>
          </Card>

          <Card title="Demo data registers" icon={Database} subtitle="Layers served from /public/demo-data (GeoJSON)">
            <div className="grid-3">
              {dataStats.map(([label, count]) => (
                <div key={label} className="card" style={{ padding: '10px 12px' }}>
                  <div className="tiny text-faint upper">{label}</div>
                  <div className="mono strong" style={{ fontSize: 18 }}>{count}</div>
                </div>
              ))}
            </div>
            <div className="row gap-2 mt-3">
              <Button variant="ghost" onClick={() => window.location.reload()}><RefreshCcw size={14} /> Reload layers from disk</Button>
            </div>
          </Card>
        </div>

        <div className="col gap-3">
          <Card title="Simulation & feeds" icon={Radio}>
            <Toggle checked={simulate} onChange={setSimulate} label="Mock websocket feed (alerts + telemetry)" />
            <div className="mt-3">
              <RangeInput label="Feed interval" min={2} max={20} step={1} value={wsInterval} display={`${wsInterval}s`} onChange={(v) => setWsInterval(v)} />
            </div>
            <div className="divider" />
            <div className="small strong mb-2">One-click scenario events</div>
            <div className="col gap-2">
              {Object.values(SIM_EVENTS).map((e) => (
                <div key={e.id} className="row between gap-2">
                  <span><span className="small strong" style={{ display: 'block' }}>{e.label}</span><span className="tiny text-faint">{e.desc}</span></span>
                  <Button size="sm" onClick={() => demo.simEvent(e.id)}>Run</Button>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Mapping defaults" icon={Settings2}>
            <SelectInput
              label="Default basemap"
              value={basemap}
              onChange={(e) => { setBasemap(e.target.value); notify('info', 'Basemap switched', `Tiles now served from ${providers.find((p) => p.id === e.target.value)?.label}`); }}
              options={providers.map((p) => ({ value: p.id, label: p.label }))}
            />
            <div className="divider" />
            <div className="small strong mb-2">External portals (reference)</div>
            <div className="col gap-1">
              <a className="tiny" href={BHUVAN_PORTAL} target="_blank" rel="noreferrer">ISRO Bhuvan — flood layers ↗</a>
              <a className="tiny" href={FIRMS_PORTAL} target="_blank" rel="noreferrer">NASA FIRMS — active hotspots ↗</a>
            </div>
            <div className="tiny text-faint mt-2">Live ingestion from these portals is future scope; the demo uses clearly labelled simulated feeds.</div>
          </Card>

          <div className="glass-bar" style={{ padding: 12 }}>
            <div className="tiny text-dim"><b>Demo boundaries.</b> District-scale decision-support prototype. Census-based population shown as estimates; shelter capacities are simulated and flagged for verification; CCTV/satellite integrations are optional extensions.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
