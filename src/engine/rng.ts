// Deterministic seeded PRNG. Every random decision in the engine must go
// through a SeededRandom instance so a given seed always reproduces the same
// outcome — never call Math.random() in engine code.

export type RandomFn = () => number; // returns a float in [0, 1)

/** mulberry32 — small, fast, good-enough distribution for gameplay RNG. */
export function createRandom(seed: number): RandomFn {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic hash of a string into a 32-bit seed. */
export function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Integer in [min, max] inclusive. */
export function randInt(random: RandomFn, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

/** Pick an element, weighted by the given weight function. Weights must be > 0 overall. */
export function weightedPick<T>(random: RandomFn, items: T[], weightFn: (item: T) => number): T {
  const weights = items.map(weightFn);
  const total = weights.reduce((sum, w) => sum + Math.max(w, 0.0001), 0);
  let roll = random() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= Math.max(weights[i], 0.0001);
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}
