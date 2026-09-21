import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { mockSocket } from '../services/websocket/socketClient';
import { generateAlert, generateTelemetry } from '../utils/simulate';
import { useDemo } from './DemoContext';
import { useApp } from './AppContext';

const AlertContext = createContext(null);
export const useAlerts = () => useContext(AlertContext);

const SEED_ALERTS = () => [
  { id: 'ALR-seed1', severity: 'critical', type: 'Red Zone Expansion', source: 'Hazard Engine', message: 'A primary red zone crossed the 0.80 critical threshold under rising rainfall — review evacuation priorities.', time: new Date(Date.now() - 11 * 6e4).toISOString(), status: 'new', confidence: 0.93 },
  { id: 'ALR-seed2', severity: 'high', type: 'Citizen SOS', source: 'Citizen Channel', message: 'Report of waterlogging across a junction culvert — field verification pending.', time: new Date(Date.now() - 26 * 6e4).toISOString(), status: 'new', confidence: 0.57 },
  { id: 'ALR-seed3', severity: 'medium', type: 'Rainfall', source: 'IMD AWS', message: 'Upper catchment recording sustained 38 mm/hr for the last 40 minutes.', time: new Date(Date.now() - 52 * 6e4).toISOString(), status: 'acknowledged', confidence: 0.9 },
  { id: 'ALR-seed4', severity: 'low', type: 'Telemetry', source: 'AWS Network', message: 'Automatic weather stations reporting; 2 CCTV towers degraded.', time: new Date(Date.now() - 80 * 6e4).toISOString(), status: 'acknowledged', confidence: 0.98 },
];

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState(SEED_ALERTS);
  const [simulate, setSimulate] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const { setTelemetry } = useDemo();
  const { notify } = useApp();
  const simulateRef = useRef(simulate);
  simulateRef.current = simulate;

  useEffect(() => {
    const onAlert = (payload) => {
      if (!simulateRef.current) return;
      setAlerts((as) => [{ ...payload, id: payload.id || `ALR-${Date.now()}` }, ...as].slice(0, 80));
      if (payload.severity === 'critical') notify('error', `CRITICAL · ${payload.type}`, payload.message);
      else if (payload.severity === 'high') notify('warn', payload.type, payload.message);
    };
    const onTelemetry = (payload) => {
      if (!simulateRef.current) return;
      setTelemetry((t) => ({ ...t, ...payload }));
    };
    mockSocket.connect();
    const off1 = mockSocket.on('alert', onAlert);
    const off2 = mockSocket.on('telemetry', onTelemetry);
    return () => { off1(); off2(); };
  }, [notify, setTelemetry]);

  const pushAlert = useCallback((partial) => {
    const a = { ...generateAlert(), ...partial, id: `ALR-${Date.now()}`, time: new Date().toISOString(), status: 'new' };
    setAlerts((as) => [a, ...as].slice(0, 80));
    return a;
  }, []);

  const acknowledge = useCallback((id) => setAlerts((as) => as.map((a) => (a.id === id ? { ...a, status: a.status === 'new' ? 'acknowledged' : a.status } : a))), []);
  const resolve = useCallback((id) => setAlerts((as) => as.map((a) => (a.id === id ? { ...a, status: 'resolved' } : a))), []);
  const injectBurst = useCallback(() => {
    Array.from({ length: 3 }).forEach((_, i) => setTimeout(() => pushAlert({ severity: ['high', 'critical', 'medium'][i] }), i * 500));
  }, [pushAlert]);

  const unread = alerts.filter((a) => a.status === 'new').length;
  const active = useMemo(() => alerts.filter((a) => a.status !== 'resolved'), [alerts]);

  const value = useMemo(() => ({
    alerts, active, unread, acknowledge, resolve, pushAlert, injectBurst,
    simulate, setSimulate, soundOn, setSoundOn,
  }), [alerts, active, unread, acknowledge, resolve, pushAlert, injectBurst, simulate, soundOn]);

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
}
