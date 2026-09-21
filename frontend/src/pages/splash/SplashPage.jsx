import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LifeBuoy, MapPinned, ShieldCheck } from 'lucide-react';

import '../../styles/splash.css';

export default function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate('/login', { replace: true });
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <main className="er-splash-screen">
      <div className="er-splash-grid" aria-hidden="true" />
      <div className="er-splash-glow er-splash-glow-cyan" aria-hidden="true" />
      <div className="er-splash-glow er-splash-glow-purple" aria-hidden="true" />

      <section className="er-splash-content" aria-label="E-Rakshan loading">
        <div className="er-splash-logo">
          <LifeBuoy size={42} strokeWidth={2.4} />
        </div>

        <div className="er-splash-brand">
          <h1>E-<span>RAKSHAN</span></h1>
          <p>Hazard-to-Relocation Decision Support</p>
        </div>

        <div className="er-splash-visual" aria-hidden="true">
          <div className="er-splash-map">
            <span className="er-map-line line-one" />
            <span className="er-map-line line-two" />
            <span className="er-map-line line-three" />
            <span className="er-map-node node-one" />
            <span className="er-map-node node-two" />
            <span className="er-map-node node-three" />
            <MapPinned size={24} />
          </div>

          <div className="er-splash-shield">
            <ShieldCheck size={27} strokeWidth={2.5} />
          </div>
        </div>

        <div className="er-splash-loading">
          <p>Preparing operational intelligence...</p>
          <div className="er-splash-loader" role="progressbar" aria-label="Loading">
            <div className="er-splash-loader-progress" />
          </div>
        </div>

        <span className="er-splash-status">
          <i />
          Secure response environment
        </span>
      </section>
    </main>
  );
}
