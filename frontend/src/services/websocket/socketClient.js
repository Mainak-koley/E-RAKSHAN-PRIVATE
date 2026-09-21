/* Mock websocket channel: same subscribe/unsubscribe surface as the real
   `WS /api/v1/events`, but events are generated in-browser on a timer. */
import { generateAlert, generateTelemetry } from '../../utils/simulate';

class MockSocket {
  constructor() {
    this.subs = { alert: new Set(), telemetry: new Set() };
    this.timer = null;
    this.tick = 0;
    this.intervalMs = Number(import.meta.env.VITE_MOCK_WS_INTERVAL_MS ?? 6000);
    this.connected = false;
  }

  on(event, cb) { this.subs[event]?.add(cb); return () => this.subs[event]?.delete(cb); }

  connect() {
    if (this.connected) return;
    this.connected = true;
    this.timer = setInterval(() => {
      this.tick += 1;
      const evt = this.tick % 3 === 0
        ? { type: 'telemetry', payload: generateTelemetry() }
        : { type: 'alert', payload: generateAlert() };
      this.subs[evt.type]?.forEach((cb) => cb(evt.payload));
    }, this.intervalMs);
  }

  emit(event, payload) { this.subs[event]?.forEach((cb) => cb(payload)); }

  setIntervalMs(ms) {
    this.intervalMs = ms;
    if (this.connected) { clearInterval(this.timer); this.connected = false; this.connect(); }
  }

  close() { clearInterval(this.timer); this.connected = false; }
}

export const mockSocket = new MockSocket();
