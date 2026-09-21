import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LifeBuoy, Lock, Mail, Radio, ShieldCheck, TrendingUp, Route as RouteIcon, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { APP, DECISION_CHAIN, ROLE_META, DEMO_USERS } from '../../constants/app';
import Button from '../../components/common/Button';

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    setBusy(true); setErr('');
    try {
      await login(email, password);
      nav('/dashboard');
    } catch (ex) {
      setErr(ex.message);
    } finally { setBusy(false); }
  };

  const quick = (u) => { setEmail(u.email); setPassword(u.password); };

  return (
    <div className="auth-shell">
      <div className="auth-art">
        <div className="auth-grid-bg" />
        <div style={{ position: 'relative' }}>
          <div className="row gap-3">
            <div className="brand-mark" style={{ width: 46, height: 46, minWidth: 46, borderRadius: 12 }}><LifeBuoy size={26} strokeWidth={2.2} /></div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30 }} className="grad-text">{APP.name}</div>
              <div className="kicker">{APP.tagline}</div>
            </div>
          </div>
          <p className="text-dim mt-4" style={{ maxWidth: 430, lineHeight: 1.7 }}>
            An explainable, confidence-aware disaster decision-support system that converts
            heterogeneous geospatial and incident data into prioritised evacuation and
            shelter-allocation decisions — the full <span className="text-cyan">Hazard → Vulnerability → Priority → Safe Site → Capacity → Route → Relocation</span> chain for district-scale response.
          </p>
          <div className="row gap-2 mt-4 wrap">
            {DECISION_CHAIN.map((c, i) => (
              <span key={c} className="row gap-2">
                <span className="badge badge-cyan">{c}</span>
                {i < DECISION_CHAIN.length - 1 && <span className="text-faint tiny">→</span>}
              </span>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative' }} className="grid-3">
          {[[Radio, 'OSIRIS aggregation', 'Multi-source feeds with confidence scoring'],
            [RouteIcon, 'Constrained relocation', 'Capacity-aware MILP allocation'],
            [AlertTriangle, 'Explainable alerts', 'Every score shows its evidence']].map(([Icon, t, s]) => (
            <div key={t} className="glass-bar" style={{ padding: 12 }}>
              <Icon size={16} className="text-cyan" />
              <div className="small strong mt-1">{t}</div>
              <div className="tiny text-faint mt-1">{s}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <h2 style={{ fontSize: 24 }}>Sign in to the command centre</h2>
          <p className="text-dim small mt-1 mb-4">District-scale demo · pick a persona below or use your credentials.</p>

          <label className="field">
            <span className="label">Official email</span>
            <span className="row" style={{ position: 'relative' }}>
              <input className="input" style={{ paddingLeft: 34 }} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@district.kerala.gov.in" autoComplete="username" />
              <Mail size={14} style={{ position: 'absolute', left: 11, top: 10, color: 'var(--text-faint)' }} />
            </span>
          </label>
          <label className="field">
            <span className="label">Password</span>
            <span className="row" style={{ position: 'relative' }}>
              <input className="input" style={{ paddingLeft: 34 }} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
              <Lock size={14} style={{ position: 'absolute', left: 11, top: 10, color: 'var(--text-faint)' }} />
            </span>
          </label>

          {err && <div className="glass-bar" style={{ padding: '8px 12px', borderColor: 'rgba(248,113,113,.5)', marginBottom: 12 }}><span className="tiny text-red strong">{err}</span></div>}

          <Button variant="primary" size="lg" block disabled={busy} onClick={submit} icon={ShieldCheck}>
            {busy ? 'Authenticating…' : 'Enter command centre'}
          </Button>

          <div className="divider" />
          <div className="kicker mb-2" style={{ fontSize: 10 }}>Demo personas — click to autofill</div>
          <div className="col gap-2">
            {DEMO_USERS.map((u) => (
              <button type="button" key={u.email} className="card row between gap-2" style={{ padding: '9px 12px', cursor: 'pointer' }} onClick={() => quick(u)}>
                <span className="row gap-2">
                  <span className="avatar" style={{ width: 30, height: 30, minWidth: 30 }}>{u.name.split(' ').map((s) => s[0]).join('')}</span>
                <span>
                  <span className="strong" style={{ display: 'block', color: '#ffffff', fontSize: 14, letterSpacing: '0.01em', textShadow: '0 0 12px rgba(34,211,238,.25)' }}>{u.name}</span>
                  <span className="tiny text-cyan" style={{ display: 'block', marginTop: 1 }}>{u.email}</span>
                  <span className="tiny text-dim" style={{ display: 'block', marginTop: 1 }}>{ROLE_META[u.role].scope}</span>
                </span>
                </span>
                <span className={`badge badge-${ROLE_META[u.role].color}`}>{ROLE_META[u.role].label}</span>
              </button>
            ))}
          </div>
          <div className="tiny text-faint mt-3 row gap-2"><TrendingUp size={12} /> Simulated environment — no live external feeds are contacted.</div>
        </form>
      </div>
    </div>
  );
}
