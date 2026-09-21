export function TextInput({ label, hint, ...rest }) {
  return (
    <label className="field">
      {label && <span className="label">{label}</span>}
      <input className="input" {...rest} />
      {hint && <span className="tiny text-faint">{hint}</span>}
    </label>
  );
}

export function TextArea({ label, hint, ...rest }) {
  return (
    <label className="field">
      {label && <span className="label">{label}</span>}
      <textarea className="textarea" {...rest} />
      {hint && <span className="tiny text-faint">{hint}</span>}
    </label>
  );
}

export function SelectInput({ label, options = [], hint, ...rest }) {
  return (
    <label className="field">
      {label && <span className="label">{label}</span>}
      <select className="select" {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {hint && <span className="tiny text-faint">{hint}</span>}
    </label>
  );
}

export function RangeInput({ label, value, display, min = 0, max = 1, step = 0.01, onChange, large }) {
  return (
    <div className="field" style={{ marginBottom: 10 }}>
      <span className="row between">
        <span className="label" style={{ textTransform: 'none', letterSpacing: 0 }}>{label}</span>
        <span className="mono small text-cyan">{display ?? value}</span>
      </span>
      <input
        type="range"
        className={`range ${large ? 'range-lg' : ''}`}
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="row gap-2" style={{ cursor: 'pointer' }}>
      <span className="switch">
        <input type="checkbox" className="switch-input" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="switch-track" />
      </span>
      {label && <span className="small text-dim">{label}</span>}
    </label>
  );
}

export function CheckRow({ checked, onChange, children }) {
  return (
    <label className="check-row">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}
