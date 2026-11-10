import { describe, expect, it } from 'vitest';
import { computeMatchRating, computeMonthlyPlayerStats, pickTeamOfTheMonth } from '../ratings';
import type { Fixture, Player } from '../types';

function player(id: string, position: Player['position'], overrides: Partial<Player['attributes']> = {}): Player {
  return {
    id,
    name: id,
    position,
    age: 25,
    attributes: { pace: 60, shooting: 60, passing: 60, defending: 60, physical: 60, goalkeeping: 60, ...overrides },
  };
}

function fixture(id: string, matchday: number, home: string, away: string, homeGoals: number, awayGoals: number, scorerId?: string, scorerSide?: 'home' | 'away'): Fixture {
  const scorer = scorerId ? { playerId: scorerId, playerName: scorerId, minutes: [10] } : null;
  return {
    id,
    matchday,
    homeClubId: home,
    awayClubId: away,
    played: true,
    result: {
      fixtureId: id,
      homeGoals,
      awayGoals,
      events: [],
      homeScorers: scorer && scorerSide === 'home' ? [scorer] : [],
      awayScorers: scorer && scorerSide === 'away' ? [scorer] : [],
      homeXI: ['h-gk', 'h-def', 'h-fwd'],
      awayXI: ['a-gk', 'a-def', 'a-fwd'],
      seed: 1,
    },
  };
}

describe('computeMatchRating', () => {
  it('rates a scorer higher than a non-scorer on the same winning side', () => {
    const f = fixture('f1', 1, 'home', 'away', 2, 0, 'h-fwd', 'home');
    const scorer = player('h-fwd', 'FWD');
    const bystander = player('h-def', 'DEF');
    expect(computeMatchRating(scorer, 'home', f)).toBeGreaterThan(computeMatchRating(bystander, 'home', f));
  });

  it('rewards a clean sheet for defenders and keepers', () => {
    const cleanSheet = fixture('f1', 1, 'home', 'away', 1, 0);
    const conceded = fixture('f2', 1, 'home', 'away', 1, 2);
    const def = player('h-def', 'DEF');
    expect(computeMatchRating(def, 'home', cleanSheet)).toBeGreaterThan(computeMatchRating(def, 'home', conceded));
  });

  it('is deterministic for the same fixture and player', () => {
    const f = fixture('f1', 1, 'home', 'away', 1, 1);
    const p = player('h-def', 'DEF');
    expect(computeMatchRating(p, 'home', f)).toBe(computeMatchRating(p, 'home', f));
  });

  it('stays within a 1-10 range', () => {
    const f = fixture('f1', 1, 'home', 'away', 5, 0, 'h-fwd', 'home');
    const p = player('h-fwd', 'FWD', { shooting: 99 });
    const rating = computeMatchRating(p, 'home', f);
    expect(rating).toBeGreaterThanOrEqual(1);
    expect(rating).toBeLessThanOrEqual(10);
  });
});

describe('computeMonthlyPlayerStats + pickTeamOfTheMonth', () => {
  const players: Player[] = [
    player('h-gk', 'GK'),
    player('h-def', 'DEF'),
    player('h-fwd', 'FWD', { shooting: 90 }),
    player('a-gk', 'GK'),
    player('a-def', 'DEF'),
    player('a-fwd', 'FWD'),
  ];
  const findPlayer = (id: string) => {
    const p = players.find((pl) => pl.id === id);
    return p ? { player: p, clubId: id.startsWith('h-') ? 'home' : 'away' } : undefined;
  };

  it('only counts fixtures within the given matchday range', () => {
    const fixtures = [fixture('f1', 1, 'home', 'away', 1, 0), fixture('f2', 10, 'home', 'away', 1, 0)];
    const stats = computeMonthlyPlayerStats(fixtures, 1, 4, findPlayer);
    expect(stats.find((s) => s.playerId === 'h-gk')?.appearances).toBe(1);
  });

  it('credits goals scored in the window', () => {
    const fixtures = [fixture('f1', 1, 'home', 'away', 2, 0, 'h-fwd', 'home')];
    const stats = computeMonthlyPlayerStats(fixtures, 1, 4, findPlayer);
    expect(stats.find((s) => s.playerId === 'h-fwd')?.goals).toBe(1);
  });

  it('picks a 1-4-3-3 shaped Team of the Month and favors the in-form scorer', () => {
    const fixtures = [
      fixture('f1', 1, 'home', 'away', 3, 0, 'h-fwd', 'home'),
      fixture('f2', 2, 'home', 'away', 3, 0, 'h-fwd', 'home'),
    ];
    const stats = computeMonthlyPlayerStats(fixtures, 1, 4, findPlayer);
    const totm = pickTeamOfTheMonth(stats);
    expect(totm.filter((p) => p.position === 'GK')).toHaveLength(1);
    expect(totm.filter((p) => p.position === 'DEF')).toHaveLength(2); // only 2 DEF candidates exist in this fixture set
    expect(totm.filter((p) => p.position === 'FWD')).toHaveLength(2); // only 2 FWD candidates exist
    expect(totm.find((p) => p.playerId === 'h-fwd')).toBeDefined();
  });
});
