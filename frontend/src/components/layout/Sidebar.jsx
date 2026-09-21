import { NavLink, useLocation } from 'react-router-dom';
import { LifeBuoy, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NAV_SECTIONS } from '../../constants/nav';
import { APP } from '../../constants/app';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';
import { useDemo } from '../../context/DemoContext';
import { ROLE_META } from '../../constants/app';

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileNavOpen, setMobileNavOpen } = useApp();
  const { user, can } = useAuth();
  const { unread } = useAlerts();
  const { district, loading } = useDemo();
  const loc = useLocation();

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileNavOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-mark"><LifeBuoy size={20} strokeWidth={2.4} /></div>
        {!sidebarCollapsed && (
          <div>
            <div className="brand-name grad-text">{APP.name}</div>
            <div className="brand-sub">Disaster Response Platform</div>
          </div>
        )}
      </div>

      <nav style={{ flex: 1 }}>
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter((i) => can(i.roles));
          if (!items.length) return null;
          return (
            <div className="nav-section" key={section.id}>
              <div className="nav-section-title">{section.label}</div>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileNavOpen(false)}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={17} />
                    <span className="sidebar-label">{item.label}</span>
                    {item.to === '/alerts' && unread > 0 && <span className="nav-badge">{unread}</span>}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-foot">
        <button type="button" className="btn btn-ghost btn-sm btn-block" onClick={toggleSidebar}>
          {sidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          <span className="sidebar-label">{sidebarCollapsed ? '' : 'Collapse'}</span>
        </button>
        <div className="sidebar-label">
          <div className="row gap-2 mt-2">
            <span className="mono tiny">{APP.version}</span>
            <span className="tiny text-faint">· {district ? `${district.name} demo` : 'demo'}</span>
          </div>
          <span className="demo-pill"><span className="pulse-dot" />{loading ? 'LOADING LAYERS…' : 'DEMO DATA · SIMULATED FEEDS'}</span>
          {user && (
            <div className="row gap-2 center mt-2">
              <span className="avatar" style={{ width: 24, height: 24, minWidth: 24, fontSize: 10 }}>{user.name.split(' ').map((x) => x[0]).slice(0, 2).join('')}</span>
              <span>
                <span className="persona-name" style={{ display: 'block', fontSize: 12 }}>{user.name}</span>
                <span className="tiny text-cyan" style={{ display: 'block' }}>{ROLE_META[user.role]?.label}</span>
              </span>
            </div>
          )}
        </div>
      </div>
      {/* location prevents unused warnings */}
      <span style={{ display: 'none' }}>{loc.pathname}</span>
    </aside>
  );
}
