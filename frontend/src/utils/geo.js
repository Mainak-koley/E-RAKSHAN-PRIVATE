/* Geometry helpers (no external geo libs needed for the demo pipeline). */

export function centroidOf(geometry) {
  const pts = collectPoints(geometry);
  if (!pts.length) return [0, 0];
  const lat = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const lon = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  return [lat, lon];
}

export function collectPoints(geometry) {
  const out = [];
  const walk = (g) => {
    if (!g) return;
    if (typeof g[0] === 'number') { out.push([g[1], g[0]]); return; } // [lon, lat] pair
    g.forEach(walk);
  };
  walk(geometry?.coordinates);
  return out;
}

export function haversineKm([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function boundsOf(features) {
  let minLat = 90; let minLon = 180; let maxLat = -90; let maxLon = -180;
  const eat = (geometry) => collectPoints(geometry).forEach(([lat, lon]) => {
    minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
    minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
  });
  (features || []).forEach((f) => eat(f.geometry));
  if (minLat > maxLat) return null;
  return [[minLat, minLon], [maxLat, maxLon]];
}

/* Sample points along a straight segment — used to score route exposure
   against hazard polygons (a light-weight stand-in for OSRM routing). */
export function sampleLine(a, b, n = 7) {
  const out = [];
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
}

export function pointInPolygon([lat, lon], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i]; const [xj, yj] = ring[j];
    const intersect = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
