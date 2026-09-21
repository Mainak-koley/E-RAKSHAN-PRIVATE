import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, LogOut, MapPin, Menu, PanelLeftClose, PanelLeftOpen, Radio, Search, Shield, Tent, Users, X, Zap, Map as MapIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ROLE_META } from '../../constants/app';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';
import { useDemo } from '../../context/DemoContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { timeAgo, fmtInt, centroidOf } from '../../utils';
import Badge from '../common/Badge';

function severityBadgeTone(sev) {
  return { critical: 'red', high: 'orange', medium: 'amber', low: 'green' }[sev] || 'gray';
}

export default function Topbar() {
  const { searchQuery, setSearchQuery, clock, sidebarCollapsed, toggleSidebar, mobileNavOpen, setMobileNavOpen } = useApp();
  const { user, logout } = useAuth();
  const { alerts, unread, acknowledge, resolve, simulate, setSimulate } = useAlerts();
  const demo = useDemo();
  const nav = useNavigate();
  const { notify } = useApp();
  const [openMenu, setOpenMenu] = useState(null); // 'alerts' | 'user'
  const wrapRef = useRef(null);
  useClickOutside(wrapRef, () => setOpenMenu(null), openMenu !== null);

  const results = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return null;
    const habs = demo.evaluated
      .filter((f) => f.properties.name.toLowerCase().includes(q) || f.properties.panchayath?.toLowerCase().includes(q))
      .slice(0, 5)
      .map((f) => ({ kind: 'habitation', id: f.properties.id, name: f.properties.name, sub: `Population ${fmtInt(f.properties.population)} · risk ${Math.round(f.analysis.hazard * 100)}` }));
    const shl = demo.shelters.features
      .filter((f) => f.properties.name.toLowerCase().includes(q))
      .slice(0, 4)
      .map((f) => ({ kind: 'shelter', id: f.properties.id, name: f.properties.name, sub: `Capacity ${fmtInt(f.properties.capacity)}` }));
    const sites = demo.safeSites.features
      .filter((f) => f.properties.name.toLowerCase().includes(q))
      .slice(0, 4)
      .map((f) => ({ kind: 'site', id: f.properties.id, name: f.properties.name, sub: `Safe site · ${f.properties.type}` }));
    const inc = demo.incidents.features
      .filter((f) => (f.properties.type + f.properties.description).toLowerCase().includes(q))
      .slice(0, 4)
      .map((f) => ({ kind: 'incident', id: f.properties.id, name: f.properties.type, sub: f.properties.location_name || f.properties.description.slice(0, 40) }));
    return { habs, shl, sites, inc, total: habs.length + shl.length + sites.length + inc.length };
  }, [searchQuery, demo]);

  const go = (kind, id) => {
    const mapRoutes = { habitation: '/map', shelter: '/map', site: '/sites', incident: '/alerts' };
    nav(mapRoutes[kind] || '/map', { state: { focusId: id, kind } });
    setSearchQuery('');
    setOpenMenu(null);
  };

  return (
    <header className="topbar" ref={wrapRef}>
      <button type="button" className="icon-btn mobile-only" onClick={() => setMobileNavOpen(!mobileNavOpen)} aria-label="Toggle navigation">
        <Menu size={16} />
      </button>
      <button
        type="button"
        className="icon-btn desktop-only"
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
      </button>

      <div className="topbar-search">
        <span className="search-icon"><Search size={14} /></span>
        <input
          className="input"
          placeholder="Search habitations, shelters, safe sites, incidents…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {results && (
          <div className="search-dropdown">
            {results.total === 0 && <div className="empty" style={{ padding: 18 }}>No matches for “{searchQuery}”</div>}
            {[['Habitations', results.habs, Users, 'habitation'], ['Shelters', results.shl, Tent, 'shelter'], ['Safe Sites', results.sites, Shield, 'site'], ['Incidents', results.inc, MapPin, 'incident']].map(([label, arr, Icon, kind]) => arr.length > 0 && (
              <div key={label}>
                <div className="search-group-title">{label}</div>
                {arr.map((r) => (
                  <button type="button" key={r.id} className="search-row" onClick={() => go(kind, r.id)}>
                    <Icon size={14} />
                    <span className="flex-1"><b>{r.name}</b><span className="text-faint"> · {r.sub}</span></span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1" />

      <MapIcon size={13} className="text-faint hide-sm" />
      <select
        className="select district-select"
        value={demo.districtId}
        title="Switch demo district"
        onChange={(e) => {
          const d = demo.districts.find((x) => x.id === e.target.value);
          demo.setDistrict(e.target.value);
          notify('info', 'District switched', `Loading ${d?.name} (${d?.state}) operational picture…`);
        }}
      >
        {demo.districts.map((d) => (
          <option key={d.id} value={d.id}>{d.name} · {d.state}</option>
        ))}
      </select>

      <div className="sim-clock" title="Live operations clock">
        <span className="pulse-dot text-cyan" />
        <span><b>{clock.toLocaleTimeString('en-IN', { hour12: false })}</b> IST</span>
      </div>

      <button
        type="button"
        className={`icon-btn ${simulate ? 'accent' : ''}`}
        title={simulate ? 'Live feed simulation ON — click to pause' : 'Feed simulation paused — click to resume'}
        onClick={() => { setSimulate(!simulate); }}
      >
        <Radio size={15} />
      </button>

      <button type="button" className="icon-btn" onClick={() => setOpenMenu(openMenu === 'alerts' ? null : 'alerts')} aria-label="Alerts">
        <Bell size={15} />
        {unread > 0 && <span className="bell-dot">{unread}</span>}
      </button>

      {openMenu === 'alerts' && (
        <div className="dropdown" style={{ width: 340 }}>
          <div className="row between gap-2" style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
            <b className="small">Live Alert Feed</b>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { alerts.filter((a) => a.status === 'new').forEach((a) => acknowledge(a.id)); }}>
              <CheckCheck size={13} /> Ack all
            </button>
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {alerts.slice(0, 8).map((a) => (
              <div key={a.id} style={{ padding: '9px 12px', borderBottom: '1px solid var(--border-soft)' }}>
                <div className="row gap-2 between">
                  <Badge tone={severityBadgeTone(a.severity)} dot pulse={a.status === 'new' && a.severity === 'critical'}>{a.type}</Badge>
                  <span className="tiny text-faint">{timeAgo(a.time)}</span>
                </div>
                <div className="tiny text-dim mt-1" style={{ lineHeight: 1.4 }}>{a.message}</div>
                {a.status === 'new' && (
                  <div className="row gap-2 mt-2">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => acknowledge(a.id)}>Acknowledge</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => resolve(a.id)}>Resolve</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-ghost btn-sm btn-block" style={{ borderRadius: 0 }} onClick={() => { nav('/alerts'); setOpenMenu(null); }}>Open Alert Center</button>
        </div>
      )}

      <button type="button" className="user-chip" onClick={() => setOpenMenu(openMenu === 'user' ? null : 'user')}>
        <span className="avatar">{(user?.name || 'A').split(' ').map((s) => s[0]).slice(0, 2).join('')}</span>
        <span className="small persona-name user-chip-name">{user?.name?.split(' ')[0]}</span>
      </button>

      {openMenu === 'user' && (
        <div className="dropdown">
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
            <div className="persona-name" style={{ fontSize: 14.5 }}>{user?.name}</div>
            <div className="tiny text-dim">{user?.email}</div>
            <div className="mt-2"><Badge tone="cyan">{ROLE_META[user?.role]?.label}</Badge></div>
          </div>
          <div className="dropdown-pad">
            <button type="button" className="btn btn-ghost btn-sm btn-block" onClick={logout}><LogOut size={13} /> Sign out</button>
          </div>
        </div>
      )}
    </header>
  );
}
