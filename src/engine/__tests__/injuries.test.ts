import { describe, expect, it } from 'vitest';
import { applyInjuryUpdates } from '../injuries';
import type { Player } from '../types';

function player(id: string, overrides: Partial<Player> = {}): Player {
  return {
    id,
    name: id,
    position: 'MID',
    age: 25,
    attributes: { pace: 60, shooting: 60, passing: 60, defending: 60, physical: 60, goalkeeping: 60 },
    ...overrides,
  };
}

/** Always returns a value below the injury-chance threshold — guarantees a roll "hits". */
function alwaysInjureRandom(): () => number {
  return () => 0.001;
}

/** Always returns a value above the injury-chance threshold — guarantees a roll "misses". */
function neverInjureRandom(): () => number {
  return () => 0.999;
}

describe('applyInjuryUpdates', () => {
  it('only considers players who actually played this matchday', () => {
    const squads = { home: [player('played'), player('benched')] };
    const next = applyInjuryUpdates(squads, 5, { home: ['played'] }, alwaysInjureRandom());
    expect(next.home.find((p) => p.id === 'played')?.injured).toBe(true);
    expect(next.home.find((p) => p.id === 'benched')?.injured).toBeFalsy();
  });

  it('never injures anyone when the roll misses', () => {
    const squads = { home: [player('p1')] };
    const next = applyInjuryUpdates(squads, 5, { home: ['p1'] }, neverInjureRandom());
    expect(next.home[0].injured).toBeFalsy();
  });

  it('sets a return matchday after the current one when newly injured', () => {
    const squads = { home: [player('p1')] };
    const next = applyInjuryUpdates(squads, 5, { home: ['p1'] }, alwaysInjureRandom());
    expect(next.home[0].injuryReturnMatchday).toBeGreaterThan(5);
  });

  it('recovers a player once the matchday reaches their return matchday', () => {
    const squads = { home: [player('p1', { injured: true, injuryReturnMatchday: 10 })] };
    const next = applyInjuryUpdates(squads, 10, {}, neverInjureRandom());
    expect(next.home[0].injured).toBe(false);
    expect(next.home[0].injuryReturnMatchday).toBeUndefined();
  });

  it('keeps a player injured before their return matchday', () => {
    const squads = { home: [player('p1', { injured: true, injuryReturnMatchday: 10 })] };
    const next = applyInjuryUpdates(squads, 7, {}, neverInjureRandom());
    expect(next.home[0].injured).toBe(true);
    expect(next.home[0].injuryReturnMatchday).toBe(10);
  });

  it('never re-rolls an already-injured player as newly injured', () => {
    const squads = { home: [player('p1', { injured: true, injuryReturnMatchday: 20 })] };
    const next = applyInjuryUpdates(squads, 7, { home: ['p1'] }, alwaysInjureRandom());
    expect(next.home[0].injuryReturnMatchday).toBe(20);
  });
});
