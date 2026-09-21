const BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export const DEMO_MODE =
  String(import.meta.env.VITE_DEMO_MODE ?? 'false') === 'true';

async function request(
  path,
  { method = 'GET', body, timeoutMs = 8000 } = {}
) {
  if (DEMO_MODE) {
    throw new Error(
      'DEMO_MODE active — route the call through services/mock instead.'
    );
  }

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const token = localStorage.getItem('access_token');

    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE}${path}`, {
      method,
      signal: ctrl.signal,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      let message = `API ${res.status} on ${path}`;

      try {
        const data = await res.json();
        if (data?.detail) message = data.detail;
      } catch {
        // Keep the default error message.
      }

      throw new Error(message);
    }

    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
};