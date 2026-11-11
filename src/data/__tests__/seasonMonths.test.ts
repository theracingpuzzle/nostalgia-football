import { describe, expect, it } from 'vitest';
import { buildSeasonMonths } from '../seasonMonths';

describe('buildSeasonMonths', () => {
  it('reproduces the original fixed 38-matchday Premier League boundaries exactly', () => {
    const months = buildSeasonMonths(38);
    expect(months.map((m) => [m.matchdayStart, m.matchdayEnd])).toEqual([
      [1, 4], [5, 8], [9, 12], [13, 16], [17, 20], [21, 24], [25, 28], [29, 32], [33, 35], [36, 38],
    ]);
  });

  it('covers every matchday exactly once, in order, for any total', () => {
    for (const total of [34, 38, 20, 18]) {
      const months = buildSeasonMonths(total);
      expect(months[0].matchdayStart).toBe(1);
      expect(months[months.length - 1].matchdayEnd).toBe(total);
      for (let i = 1; i < months.length; i++) {
        expect(months[i].matchdayStart).toBe(months[i - 1].matchdayEnd + 1);
      }
    }
  });

  it('always produces 10 named months', () => {
    expect(buildSeasonMonths(34)).toHaveLength(10);
    expect(buildSeasonMonths(38)).toHaveLength(10);
  });
});
