// random.js — deterministic seeded RNG (mulberry32) so ?seed=N reproduces a run.

// Create a mulberry32 generator from a 32-bit seed.
export function mulberry32(seed) {
  let a = (seed >>> 0) || 1;
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Small helper wrapper with the conveniences the game uses everywhere.
export class Rng {
  constructor(seed) { this.next = mulberry32(seed); this.seed = seed >>> 0; }
  float() { return this.next(); }
  range(min, max) { return min + this.next() * (max - min); }
  int(min, maxInclusive) { return min + Math.floor(this.next() * (maxInclusive - min + 1)); }
  pick(list) { return list[Math.floor(this.next() * list.length)]; }
  chance(p) { return this.next() < p; }
}

// Parse ?seed=N from a query string; default 1. Pure: takes the string.
export function seedFromQuery(search) {
  try {
    const v = new URLSearchParams(search || '').get('seed');
    const n = v === null ? NaN : Number.parseInt(v, 10);
    return Number.isFinite(n) ? (n >>> 0) || 1 : 1;
  } catch { return 1; }
}
