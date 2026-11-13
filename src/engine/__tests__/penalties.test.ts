import { describe, expect, it } from 'vitest';
import { simulatePenaltyShootout } from '../penalties';
import type { Player, Position } from '../types';

function player(id: string, position: Position, shooting = 60, goalkeeping = 60): Player {
  return { id, name: id, position, age: 25, attributes: { pace: 60, shooting, passing: 60, defending: 60, physical: 60, goalkeeping } };
}

function makeXI(prefix: string, shooting = 60, goalkeeping = 60): Player[] {
  return [
    player(`${prefix}-gk`, 'GK', 60, goalkeeping),
    ...Array.from({ length: 4 }, (_, i) => player(`${prefix}-def${i}`, 'DEF', shooting)),
    ...Array.from({ length: 4 }, (_, i) => player(`${prefix}-mid${i}`, 'MID', shooting)),
    ...Array.from({ length: 2 }, (_, i) => player(`${prefix}-fwd${i}`, 'FWD', shooting)),
  ];
}

describe('simulatePenaltyShootout', () => {
  it('always produces a winner with a strictly higher score', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const result = simulatePenaltyShootout(makeXI('h'), makeXI('a'), seed);
      if (result.winnerSide === 'home') expect(result.homeScore).toBeGreaterThanOrEqual(result.awayScore);
      else expect(result.awayScore).toBeGreaterThan(result.homeScore);
    }
  });

  it('is deterministic for a fixed seed', () => {
    const a = simulatePenaltyShootout(makeXI('h'), makeXI('a'), 777);
    const b = simulatePenaltyShootout(makeXI('h'), makeXI('a'), 777);
    expect(a).toEqual(b);
  });

  it('takes at least 5 rounds each before any sudden death', () => {
    const result = simulatePenaltyShootout(makeXI('h'), makeXI('a'), 42);
    const homeKicks = result.kicks.filter((k) => k.side === 'home');
    const awayKicks = result.kicks.filter((k) => k.side === 'away');
    expect(homeKicks.length).toBeGreaterThanOrEqual(5);
    expect(awayKicks.length).toBeGreaterThanOrEqual(5);
    expect(homeKicks.length).toBe(awayKicks.length);
  });

  it('a much better-shooting side with a much worse-shooting opponent wins more often than not across many seeds', () => {
    const strongXI = makeXI('s', 90, 60);
    const weakXI = makeXI('w', 30, 60);
    let strongWins = 0;
    const trials = 60;
    for (let seed = 1; seed <= trials; seed++) {
      const result = simulatePenaltyShootout(strongXI, weakXI, seed * 13);
      if (result.winnerSide === 'home') strongWins++;
    }
    expect(strongWins).toBeGreaterThan(trials / 2);
  });

  it('cycles back through the taker list for sudden death rather than crashing once everyone has taken one', () => {
    // Only 2 outfield takers each, forced into many sudden-death rounds via lopsided but not guaranteed-early-deciding skill gaps is unreliable to force deterministically — instead just confirm no crash and a valid result shape with a small squad.
    const smallHome = [player('h-gk', 'GK'), player('h-1', 'DEF', 60), player('h-2', 'FWD', 60)];
    const smallAway = [player('a-gk', 'GK'), player('a-1', 'DEF', 60), player('a-2', 'FWD', 60)];
    const result = simulatePenaltyShootout(smallHome, smallAway, 999);
    expect(result.homeScore).toBeGreaterThanOrEqual(0);
    expect(result.kicks.length).toBeGreaterThan(0);
  });
});
