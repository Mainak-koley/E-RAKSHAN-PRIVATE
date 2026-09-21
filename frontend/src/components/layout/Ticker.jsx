import { AlertTriangle } from 'lucide-react';
import { useAlerts } from '../../context/AlertContext';
import { useDemo } from '../../context/DemoContext';
import { timeAgo } from '../../utils';

export default function Ticker() {
  const { alerts } = useAlerts();
  const demo = useDemo();
  const criticalHabs = demo.evaluated
    .filter((f) => f.analysis.band.id === 'critical')
    .slice(0, 4)
    .map((f) => `${f.properties.name} · risk ${Math.round(f.analysis.hazard * 100)}`);
  const items = [
    ...alerts.filter((a) => a.status === 'new').slice(0, 6).map((a) => `${a.severity === 'critical' ? '🔴' : '🟠'} ${a.type}: ${a.message} (${timeAgo(a.time)})`),
    ...criticalHabs.map((c) => `⚠ Critical red-zone habitation — ${c}`),
    `🌤 Telemetry: river ${demo.telemetry.riverLevelCm} cm · rainfall ${demo.telemetry.rainfallMmHr} mm/hr · wind ${demo.telemetry.windKmph} km/h`,
  ];
  if (items.length === 0) items.push('✅ No active alerts — monitoring nominal.');
  const track = [...items, ...items];
  return (
    <div className="ticker no-print">
      <span className="ticker-label"><AlertTriangle size={12} /> LIVE SITREP</span>
      <div className="ticker-viewport">
        <div className="ticker-track">
          {track.map((t, i) => <span className="ticker-item" key={i}><b>{t}</b></span>)}
        </div>
      </div>
    </div>
  );
}
