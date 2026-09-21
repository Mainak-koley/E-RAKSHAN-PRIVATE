import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, footer, width }) {
  return (
    <div className="modal-mask" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="modal" style={width ? { maxWidth: width } : undefined} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3 style={{ fontSize: 16 }}>{title}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={15} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="row gap-2 between" style={{ padding: '0 18px 16px' }}>{footer}</div>}
      </div>
    </div>
  );
}
