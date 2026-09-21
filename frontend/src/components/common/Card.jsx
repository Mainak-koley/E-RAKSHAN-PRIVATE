export default function Card({ title, subtitle, icon: Icon, actions, children, flush, accent, className = '', bodyClass = '' }) {
  return (
    <section className={`card ${accent ? 'card-accent' : ''} ${className}`}>
      {(title || actions) && (
        <div className="card-head">
          <div>
            <div className="card-title">{Icon && <Icon size={15} />}{title}</div>
            {subtitle && <div className="card-sub">{subtitle}</div>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className={`card-body ${flush ? 'flush' : ''} ${bodyClass}`}>{children}</div>
    </section>
  );
}
