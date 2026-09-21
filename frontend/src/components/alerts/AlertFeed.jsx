import { useMemo, useState } from 'react';
import AlertItem from './AlertItem';
import { Radio } from 'lucide-react';
import { useAlerts } from '../../context/AlertContext';
import { Toggle } from '../common/Inputs';

const SEVS = ['all', 'critical', 'high', 'medium', 'low'];

export default function AlertFeed({ height = 560 }) {
  const { alerts, acknowledge, resolve, simulate, setSimulate } = useAlerts();
  const [sev, setSev] = useState('all');
  const [statusF, setStatusF] = useState('active');
  const filtered = useMemo(() => alerts.filter((a) => (sev === 'all' || a.severity === sev)
    && (statusF === 'all' ? true : statusF === 'active' ? a.status !== 'resolved' : a.status === statusF)), [alerts, sev, statusF]);

  return (
    <div>
      <div className="row between gap-2 mb-2 wrap">
        <span className="row gap-1 wrap">
          {SEVS.map((s) => (
            <button key={s} type="button" className={`chip-toggle ${sev === s ? 'on' : ''}`} onClick={() => setSev(s)}>{s}</button>
          ))}
        </span>
        <span className="row gap-3">
          <span className="row gap-1">
            {['active', 'resolved', 'all'].map((s) => (
              <button key={s} type="button" className={`chip-toggle ${statusF === s ? 'on' : ''}`} onClick={() => setStatusF(s)}>{s}</button>
            ))}
          </span>
          <Toggle checked={simulate} onChange={setSimulate} label="live feed" />
        </span>
      </div>
      <div style={{ maxHeight: height, overflowY: 'auto' }}>
        {filtered.length === 0 && <div className="empty"><Radio size={26} />No alerts match — feed is quiet.</div>}
        {filtered.map((a) => (
          <AlertItem key={a.id} alert={a} onAck={() => acknowledge(a.id)} onResolve={() => resolve(a.id)} />
        ))}
      </div>
    </div>
  );
}
