import { describe, expect, it } from 'vitest';
import { computeMatchRating, computeMonthlyPlayerStats, computePlayerMorale, pickTeamOfTheMonth, type MonthlyPlayerStat } from '../ratings';
import type { Fixture, Formation, Player } from '../types';

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
      homeAssists: [],
      awayAssists: [],
      homeBookings: [],
      awayBookings: [],
      homeRedCards: [],
      awayRedCards: [],
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

  const oneFormation: Formation[] = [
    { id: 'f', name: '4-3-3', slots: [{ position: 'GK', count: 1 }, { position: 'DEF', count: 4 }, { position: 'MID', count: 3 }, { position: 'FWD', count: 3 }], attackBias: 1, defenseBias: 1 },
  ];

  it('picks a Team of the Month shaped by the given formation and favors the in-form scorer', () => {
    const fixtures = [
      fixture('f1', 1, 'home', 'away', 3, 0, 'h-fwd', 'home'),
      fixture('f2', 2, 'home', 'away', 3, 0, 'h-fwd', 'home'),
    ];
    const stats = computeMonthlyPlayerStats(fixtures, 1, 4, findPlayer);
    const totm = pickTeamOfTheMonth(stats, oneFormation);
    expect(totm.formationName).toBe('4-3-3');
    expect(totm.players.filter((p) => p.position === 'GK')).toHaveLength(1);
    expect(totm.players.filter((p) => p.position === 'DEF')).toHaveLength(2); // only 2 DEF candidates exist in this fixture set
    expect(totm.players.filter((p) => p.position === 'FWD')).toHaveLength(2); // only 2 FWD candidates exist
    expect(totm.players.find((p) => p.playerId === 'h-fwd')).toBeDefined();
  });

  it('switches to whichever candidate formation scores best for the available performances', () => {
    const strongForwards: MonthlyPlayerStat[] = [
      { playerId: 'fw1', playerName: 'fw1', position: 'FWD', clubId: 'x', appearances: 4, goals: 6, averageRating: 8.5 },
      { playerId: 'fw2', playerName: 'fw2', position: 'FWD', clubId: 'x', appearances: 4, goals: 5, averageRating: 8.2 },
      { playerId: 'fw3', playerName: 'fw3', position: 'FWD', clubId: 'x', appearances: 4, goals: 4, averageRating: 8.0 },
      { playerId: 'def1', playerName: 'def1', position: 'DEF', clubId: 'x', appearances: 4, goals: 0, averageRating: 6.0 },
      { playerId: 'def2', playerName: 'def2', position: 'DEF', clubId: 'x', appearances: 4, goals: 0, averageRating: 5.8 },
      { playerId: 'def3', playerName: 'def3', position: 'DEF', clubId: 'x', appearances: 4, goals: 0, averageRating: 5.9 },
      { playerId: 'gk1', playerName: 'gk1', position: 'GK', clubId: 'x', appearances: 4, goals: 0, averageRating: 6.0 },
    ];
    const formations: Formation[] = [
      { id: 'defensive', name: '5-4-1', slots: [{ position: 'GK', count: 1 }, { position: 'DEF', count: 3 }, { position: 'MID', count: 0 }, { position: 'FWD', count: 1 }], attackBias: 1, defenseBias: 1 },
      { id: 'attacking', name: '3-0-3', slots: [{ position: 'GK', count: 1 }, { position: 'DEF', count: 3 }, { position: 'MID', count: 0 }, { position: 'FWD', count: 3 }], attackBias: 1, defenseBias: 1 },
    ];
    const totm = pickTeamOfTheMonth(strongForwards, formations);
    expect(totm.formationName).toBe('3-0-3'); // more of the strong forwards get picked
    expect(totm.players.filter((p) => p.position === 'FWD')).toHaveLength(3);
  });
});

describe('computePlayerMorale', () => {
  function stat(appearances: number, averageRating: number): MonthlyPlayerStat {
    return { playerId: 'p', playerName: 'p', position: 'MID', clubId: 'c', appearances, goals: 0, averageRating };
  }

  it('is neutral before the team has played any games', () => {
    expect(computePlayerMorale(undefined, 0).tone).toBe('neutral');
  });

  it('flags a rarely-used player as unsettled once a real stretch of games has passed', () => {
    expect(computePlayerMorale(stat(1, 6.5), 10).label).toMatch(/unsettled/i);
  });

  it('does not flag a benched player as unsettled after just a game or two', () => {
    expect(computePlayerMorale(undefined, 1).tone).not.toBe('bad');
    expect(computePlayerMorale(undefined, 2).tone).not.toBe('bad');
    expect(computePlayerMorale(stat(1, 6.5), 3).tone).not.toBe('bad');
  });

  it('is buzzing for a regular starter playing well', () => {
    expect(computePlayerMorale(stat(9, 7.5), 10).tone).toBe('good');
  });

  it('loses confidence for a regular starter playing poorly', () => {
    expect(computePlayerMorale(stat(9, 5.0), 10).tone).toBe('bad');
  });

  it('is settled (not low-confidence) for a regular starter with an ordinary, baseline rating', () => {
    expect(computePlayerMorale(stat(9, 6.0), 10).tone).toBe('good');
  });
});
