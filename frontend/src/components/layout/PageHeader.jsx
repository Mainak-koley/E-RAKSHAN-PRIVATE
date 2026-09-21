export default function PageHeader({ kicker, title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        {kicker && <div className="kicker">{kicker}</div>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <div className="page-sub">{subtitle}</div>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}
