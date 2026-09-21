const NS = 'erakshan.';
export const loadLS = (key, fallback) => {
  try {
    const raw = localStorage.getItem(NS + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch { return fallback; }
};
export const saveLS = (key, value) => {
  try { localStorage.setItem(NS + key, JSON.stringify(value)); } catch { /* ignore */ }
};
export const clearLS = () => {
  try { Object.keys(localStorage).filter((k) => k.startsWith(NS)).forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
};
