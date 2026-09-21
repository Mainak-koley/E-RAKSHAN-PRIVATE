import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle } from 'lucide-react';
import { uid } from '../utils/rng';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clock, setClock] = useState(() => new Date());
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
  }, []);

  const notify = useCallback((type, title, msg, ttl = 5200) => {
    const id = uid('t');
    setToasts((ts) => [...ts.slice(-4), { id, type, title, msg }]);
    timers.current[id] = setTimeout(() => dismissToast(id), ttl);
  }, [dismissToast]);

  const value = useMemo(() => ({
    sidebarCollapsed, toggleSidebar: () => setSidebarCollapsed((v) => !v),
    mobileNavOpen, setMobileNavOpen,
    searchQuery, setSearchQuery,
    clock,
    toasts, notify, dismissToast,
  }), [sidebarCollapsed, mobileNavOpen, searchQuery, clock, toasts, notify, dismissToast]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const TOAST_ICONS = { success: CheckCircle2, error: XCircle, warn: AlertTriangle, info: Info };
