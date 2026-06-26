export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
export function len(x, y) { return Math.hypot(x, y); }
export function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
export function normalize(x, y) {
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
}
export function lerp(a, b, t) { return a + (b - a) * t; }
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}
