import { describe, expect, it } from 'vitest';
import { createRandom, hashSeed, randInt, weightedPick } from '../rng';

describe('rng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRandom(42);
    const b = createRandom(42);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = createRandom(1);
    const b = createRandom(2);
    expect(a()).not.toBe(b());
  });

  it('stays within [0, 1)', () => {
    const random = createRandom(7);
    for (let i = 0; i < 1000; i++) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('hashSeed is deterministic for the same string', () => {
    expect(hashSeed('riverside')).toBe(hashSeed('riverside'));
    expect(hashSeed('riverside')).not.toBe(hashSeed('hilltop'));
  });

  it('randInt stays within bounds', () => {
    const random = createRandom(3);
    for (let i = 0; i < 200; i++) {
      const value = randInt(random, 5, 10);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThanOrEqual(10);
    }
  });

  it('weightedPick favours heavily-weighted items over many draws', () => {
    const random = createRandom(99);
    const items = ['rare', 'common'];
    const counts = { rare: 0, common: 0 };
    for (let i = 0; i < 1000; i++) {
      const pick = weightedPick(random, items, (item) => (item === 'common' ? 90 : 1));
      counts[pick as 'rare' | 'common']++;
    }
    expect(counts.common).toBeGreaterThan(counts.rare * 5);
  });
});
