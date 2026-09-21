import { X } from 'lucide-react';

export default function Drawer({ title, subtitle, onClose, children }) {
  return (
    <div className="drawer-mask" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <aside className="drawer">
        <div className="drawer-head">
          <div>
            <h3 style={{ fontSize: 16 }}>{title}</h3>
            {subtitle && <div className="card-sub">{subtitle}</div>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={15} /></button>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  );
}
