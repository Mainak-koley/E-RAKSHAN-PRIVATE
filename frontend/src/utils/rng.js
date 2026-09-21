/* Deterministic seeded RNG so demo scenarios are reproducible. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rand = (rng, min, max) => min + rng() * (max - min);
export const randInt = (rng, min, max) => Math.floor(rand(rng, min, max + 1));
export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
export const uid = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
