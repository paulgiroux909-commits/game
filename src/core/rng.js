// Seedable pseudo-random number generator (mulberry32) so runs can be reproduced.
export class RNG {
  constructor(seed = Date.now() >>> 0) {
    this.seed = seed >>> 0;
    this.state = this.seed;
  }

  // float in [0,1)
  next() {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // float in [min, max)
  range(min, max) {
    return min + this.next() * (max - min);
  }

  // integer in [min, max] inclusive
  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  bool(chance = 0.5) {
    return this.next() < chance;
  }

  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }

  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // weighted pick: items is array of {weight, ...}
  weighted(items, weightKey = 'weight') {
    let total = 0;
    for (const it of items) total += it[weightKey];
    let r = this.next() * total;
    for (const it of items) {
      r -= it[weightKey];
      if (r <= 0) return it;
    }
    return items[items.length - 1];
  }
}

// global default rng (re-seeded on new run)
export const rng = new RNG();
