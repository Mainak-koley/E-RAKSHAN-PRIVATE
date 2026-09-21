/* In-browser mock backend: latency + deterministic responses so the UI is
   fully interactive without any server (VITE_DEMO_MODE=true). */
import { DEMO_USERS } from '../../constants/app';

const wait = (ms = 450) => new Promise((r) => setTimeout(r, ms));

export async function mockLogin(email, password) {
  await wait(600);
  const u = DEMO_USERS.find((x) => x.email === email.toLowerCase().trim() && x.password === password);
  if (!u) throw new Error('Invalid credentials. Try the demo accounts below.');
  const { password: _pw, ...safe } = u;
  return { ...safe, token: `demo-jwt-${u.role}-${Date.now()}` };
}

export async function mockSolve(payload) {
  await wait(900); // simulate solver round-trip
  return payload.result; // caller passes the solved result through
}

export async function mockVerify(incidentId) {
  await wait(350);
  return { id: incidentId, status: 'verified' };
}
