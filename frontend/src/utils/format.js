export const fmtInt = (n) => (n ?? 0).toLocaleString('en-IN');

export const fmtNum = (n, d = 1) => (n == null || Number.isNaN(+n) ? '—' : (+n).toFixed(d));

export const fmtPct = (n, d = 0) => (n == null ? '—' : `${(+n * 100).toFixed(d)}%`);

export const fmtKm = (km) => (km == null ? '—' : `${km < 10 ? km.toFixed(1) : Math.round(km)} km`);

export const clamp01 = (v) => Math.min(1, Math.max(0, v));

export const timeAgo = (iso) => {
  if (!iso) return '—';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.floor(s)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—');

export const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

export const titleCase = (s) => (s || '').replace(/\b\w/g, (c) => c.toUpperCase());

export const pct = (a, b) => (b ? a / b : 0);
