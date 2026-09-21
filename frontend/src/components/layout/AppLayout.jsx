import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useApp, TOAST_ICONS } from '../../context/AppContext';
import { X } from 'lucide-react';
import SahayAssistant from '../sahay/SahayAssistant';

export default function AppLayout() {
  const { toasts, dismissToast, mobileNavOpen, setMobileNavOpen } = useApp();
  return (
    <div className="app-shell">
      <Sidebar />
      {mobileNavOpen && <div className="nav-backdrop" onClick={() => setMobileNavOpen(false)} />}
      <div className="main-area">
        <Topbar />
        <Outlet />
      </div>
      <div className="toast-stack">
        {toasts.map((t) => {
          const Icon = TOAST_ICONS[t.type] || TOAST_ICONS.info;
          return (
            <div key={t.id} className={`toast ${t.type}`}>
              <Icon size={16} />
              <div className="flex-1">
                <div className="toast-title">{t.title}</div>
                {t.msg && <div className="toast-msg">{t.msg}</div>}
              </div>
              <button type="button" className="icon-btn" style={{ width: 24, height: 24, minWidth: 24, border: 0 }} onClick={() => dismissToast(t.id)}><X size={12} /></button>
            </div>
          );
        })}
      </div>
      <SahayAssistant />
    </div>
  );
}
