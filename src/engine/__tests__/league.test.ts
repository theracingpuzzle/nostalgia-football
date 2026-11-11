import { describe, expect, it } from 'vitest';
import { computeLeagueTable, generateFixtures } from '../league';
import type { Fixture } from '../types';

const CLUB_IDS = ['a', 'b', 'c', 'd'];

describe('generateFixtures', () => {
  it('throws for an odd number of clubs', () => {
    expect(() => generateFixtures(['a', 'b', 'c'])).toThrow();
  });

  it('generates a full double round-robin: every club plays every other club home and away', () => {
    const fixtures = generateFixtures(CLUB_IDS);
    expect(fixtures).toHaveLength(CLUB_IDS.length * (CLUB_IDS.length - 1));

    for (const a of CLUB_IDS) {
      for (const b of CLUB_IDS) {
        if (a === b) continue;
        const homeLeg = fixtures.find((f) => f.homeClubId === a && f.awayClubId === b);
        expect(homeLeg, `expected a fixture with ${a} at home to ${b}`).toBeDefined();
      }
    }
  });

  it('gives every club exactly one fixture per matchday', () => {
    const fixtures = generateFixtures(CLUB_IDS);
    const matchdays = new Set(fixtures.map((f) => f.matchday));
    for (const matchday of matchdays) {
      const clubsThisMatchday = fixtures
        .filter((f) => f.matchday === matchday)
        .flatMap((f) => [f.homeClubId, f.awayClubId]);
      expect(new Set(clubsThisMatchday).size).toBe(clubsThisMatchday.length);
    }
  });
});

describe('computeLeagueTable', () => {
  function played(id: string, matchday: number, home: string, away: string, homeGoals: number, awayGoals: number): Fixture {
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
        homeScorers: [],
        awayScorers: [],
        homeAssists: [],
        awayAssists: [],
        homeBookings: [],
        awayBookings: [],
        homeXI: [],
        awayXI: [],
        seed: 1,
      },
    };
  }

  it('awards 3 points for a win, 1 for a draw, 0 for a loss', () => {
    const fixtures = [played('f1', 1, 'a', 'b', 2, 0), played('f2', 1, 'c', 'd', 1, 1)];
    const table = computeLeagueTable(CLUB_IDS, fixtures);

    const rowA = table.find((r) => r.clubId === 'a')!;
    const rowB = table.find((r) => r.clubId === 'b')!;
    const rowC = table.find((r) => r.clubId === 'c')!;

    expect(rowA.points).toBe(3);
    expect(rowA.won).toBe(1);
    expect(rowB.points).toBe(0);
    expect(rowB.lost).toBe(1);
    expect(rowC.points).toBe(1);
    expect(rowC.drawn).toBe(1);
  });

  it('ignores unplayed fixtures', () => {
    const fixtures: Fixture[] = [{ id: 'f1', matchday: 1, homeClubId: 'a', awayClubId: 'b', played: false, result: null }];
    const table = computeLeagueTable(CLUB_IDS, fixtures);
    expect(table.every((row) => row.played === 0)).toBe(true);
  });

  it('sorts by points, then goal difference, then goals for', () => {
    const fixtures = [played('f1', 1, 'a', 'b', 3, 0), played('f2', 1, 'c', 'd', 1, 0)];
    const table = computeLeagueTable(CLUB_IDS, fixtures);
    expect(table[0].clubId).toBe('a'); // 3 pts, GD +3, beats c's 3pts/GD+1
  });
});
