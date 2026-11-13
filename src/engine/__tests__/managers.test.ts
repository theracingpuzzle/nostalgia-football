import { describe, expect, it } from 'vitest';
import { createRandom } from '../rng';
import { PLACEHOLDER_MANAGER_POOL } from '../../data/managers0809';
import {
  MANAGER_SACK_GRACE_MATCHDAYS,
  MANAGER_SACK_THRESHOLD,
  MANAGER_STARTING_CONFIDENCE,
  computeNextConfidence,
  createClubManagers,
  isSackWorthy,
  pickJobOffers,
  pickReplacementManagerName,
  recentFormScore,
  updateLeagueManagers,
  type ClubManagerState,
  type ManagerSackingEvent,
} from '../managers';
import type { Fixture, LeagueTableRow, MatchResult } from '../types';

function row(clubId: string): LeagueTableRow {
  return { clubId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 };
}

function playedFixture(id: string, matchday: number, homeClubId: string, awayClubId: string, homeGoals: number, awayGoals: number): Fixture {
  const result: MatchResult = {
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
    homeRedCards: [],
    awayRedCards: [],
    homeXI: [],
    awayXI: [],
    seed: 1,
  };
  return { id, matchday, homeClubId, awayClubId, played: true, result };
}

describe('recentFormScore', () => {
  it('sums +1 win / 0 draw / -1 loss over the last N played fixtures, most recent matchdays first', () => {
    const fixtures = [
      playedFixture('f1', 1, 'a', 'x', 2, 0), // a wins
      playedFixture('f2', 2, 'y', 'a', 1, 1), // a draws
      playedFixture('f3', 3, 'a', 'z', 0, 3), // a loses
    ];
    expect(recentFormScore('a', fixtures, 5)).toBe(0); // +1 + 0 - 1
  });

  it('only counts the last `lookback` played fixtures, dropping older ones', () => {
    const fixtures = [
      playedFixture('f1', 1, 'a', 'x', 3, 0), // win, but too old
      playedFixture('f2', 2, 'a', 'x', 0, 3), // loss
      playedFixture('f3', 3, 'a', 'x', 0, 3), // loss
    ];
    expect(recentFormScore('a', fixtures, 2)).toBe(-2);
  });

  it('ignores unplayed fixtures and fixtures not involving the club', () => {
    const fixtures = [
      { id: 'f1', matchday: 1, homeClubId: 'a', awayClubId: 'x', played: false, result: null },
      playedFixture('f2', 2, 'x', 'y', 5, 0),
    ];
    expect(recentFormScore('a', fixtures, 5)).toBe(0);
  });
});

describe('computeNextConfidence', () => {
  it('regresses toward the starting value when position and form are neutral', () => {
    const mid = 10; // some generic total-clubs count
    const neutralPosition = (mid + 1) / 2;
    const below = computeNextConfidence(30, neutralPosition, mid, 0);
    expect(below).toBeGreaterThan(30);
    const above = computeNextConfidence(80, neutralPosition, mid, 0);
    expect(above).toBeLessThan(80);
  });

  it('rewards a top-of-table position and punishes bottom-of-table, all else equal', () => {
    const top = computeNextConfidence(MANAGER_STARTING_CONFIDENCE, 1, 20, 0);
    const bottom = computeNextConfidence(MANAGER_STARTING_CONFIDENCE, 20, 20, 0);
    expect(top).toBeGreaterThan(bottom);
  });

  it('never goes below 0 or above 100', () => {
    expect(computeNextConfidence(2, 20, 20, -5)).toBeGreaterThanOrEqual(0);
    expect(computeNextConfidence(99, 1, 20, 5)).toBeLessThanOrEqual(100);
  });
});

describe('isSackWorthy', () => {
  it('is never true before the grace period has elapsed, no matter how low confidence is', () => {
    expect(isSackWorthy(0, 3, 1)).toBe(false); // only 2 matchdays into the job
    expect(isSackWorthy(0, 1 + MANAGER_SACK_GRACE_MATCHDAYS, 1)).toBe(true); // exactly at the grace boundary
  });

  it('is only true once confidence is at or below the threshold', () => {
    expect(isSackWorthy(MANAGER_SACK_THRESHOLD + 1, 50, 1)).toBe(false);
    expect(isSackWorthy(MANAGER_SACK_THRESHOLD, 50, 1)).toBe(true);
  });
});

describe('createClubManagers', () => {
  it('seeds every club with its real/placeholder starting name at full confidence and tenure from matchday 1', () => {
    const managers = createClubManagers(['man-utd', 'ch-barnsley']);
    expect(managers['man-utd']).toEqual({ name: 'Sir Alex Ferguson', confidence: MANAGER_STARTING_CONFIDENCE, tenureStartMatchday: 1 });
    expect(managers['ch-barnsley'].confidence).toBe(MANAGER_STARTING_CONFIDENCE);
    expect(managers['ch-barnsley'].tenureStartMatchday).toBe(1);
  });
});

describe('updateLeagueManagers', () => {
  const clubIds = ['a', 'b', 'c', 'd'];

  function baseManagers(tenureStartMatchday = 1): Record<string, ClubManagerState> {
    return Object.fromEntries(clubIds.map((id) => [id, { name: `Manager-${id}`, confidence: MANAGER_STARTING_CONFIDENCE, tenureStartMatchday }]));
  }

  it('is a no-op (no sackings) while still inside the grace period, even with a club rock-bottom and losing', () => {
    const managers = baseManagers(1);
    const table = [row('b'), row('c'), row('d'), row('a')]; // 'a' last
    const fixtures = [playedFixture('f1', 2, 'a', 'b', 0, 5)];
    const { sackings } = updateLeagueManagers(managers, clubIds, table, fixtures, 2, createRandom(1));
    expect(sackings).toEqual([]);
  });

  it('eventually sacks a club stuck bottom-of-table on a losing streak, once past the grace period', () => {
    let managers = baseManagers(1);
    const random = createRandom(42);
    let sackingsSeen: string[] = [];
    const allFixtures: Fixture[] = []; // accumulates across matchdays, same as a real career's fixtures list

    for (let matchday = 2; matchday <= 40 && sackingsSeen.length === 0; matchday++) {
      const table = [row('b'), row('c'), row('d'), row('a')]; // 'a' always last
      allFixtures.push(playedFixture(`f${matchday}`, matchday, 'a', 'b', 0, 5));
      const result = updateLeagueManagers(managers, clubIds, table, allFixtures, matchday, random);
      managers = result.nextManagers;
      sackingsSeen = result.sackings.map((s) => s.clubId);
    }

    expect(sackingsSeen).toContain('a');
    // the replacement never has a blank name, and isn't literally the same outgoing name
    const replaced = managers['a'];
    expect(replaced.name.trim().length).toBeGreaterThan(0);
    expect(replaced.name).not.toBe('Manager-a');
    expect(replaced.confidence).toBe(MANAGER_STARTING_CONFIDENCE);
  });

  it('never assigns the same replacement name to two different clubs sacked in the same round', () => {
    // Set up every club already below the threshold and past its grace period, so a single call sacks all four at once.
    const managers: Record<string, ClubManagerState> = Object.fromEntries(
      clubIds.map((id) => [id, { name: `Manager-${id}`, confidence: 1, tenureStartMatchday: 1 }]),
    );
    const table = clubIds.map(row);
    const fixtures: Fixture[] = [];
    const matchday = 1 + MANAGER_SACK_GRACE_MATCHDAYS;

    const { sackings } = updateLeagueManagers(managers, clubIds, table, fixtures, matchday, createRandom(7));

    expect(sackings.length).toBe(clubIds.length); // confirms the scenario really did sack everyone at once, not a weaker case
    const incomingNames = sackings.map((s) => s.incomingName);
    expect(new Set(incomingNames).size).toBe(incomingNames.length);
  });
});

describe('pickReplacementManagerName', () => {
  it('always returns a non-empty name from the placeholder pool', () => {
    const name = pickReplacementManagerName([], createRandom(3));
    expect(PLACEHOLDER_MANAGER_POOL).toContain(name);
  });

  it('excludes every currently-employed name when there is still a candidate left', () => {
    const exclude = PLACEHOLDER_MANAGER_POOL.slice(0, PLACEHOLDER_MANAGER_POOL.length - 1);
    const name = pickReplacementManagerName(exclude, createRandom(9));
    expect(name).toBe(PLACEHOLDER_MANAGER_POOL[PLACEHOLDER_MANAGER_POOL.length - 1]);
  });

  it('falls back to the full pool rather than throwing if literally everyone is excluded', () => {
    const name = pickReplacementManagerName(PLACEHOLDER_MANAGER_POOL, createRandom(11));
    expect(PLACEHOLDER_MANAGER_POOL).toContain(name);
  });
});

describe('pickJobOffers', () => {
  const leagueClubIds = ['a', 'b', 'c', 'd', 'e', 'f'];

  it('never offers the club that just did the sacking', () => {
    const offers = pickJobOffers(leagueClubIds, 'a', [], createRandom(1));
    expect(offers).not.toContain('a');
  });

  it('never offers a club from outside the given league', () => {
    const offers = pickJobOffers(leagueClubIds, 'a', [], createRandom(1), 10);
    for (const id of offers) expect(leagueClubIds).toContain(id);
  });

  it('prefers clubs that just had an AI vacancy, before falling back to the rest', () => {
    const news: ManagerSackingEvent[] = [
      { clubId: 'd', outgoingName: 'X', incomingName: 'Y', matchday: 10 },
      { clubId: 'e', outgoingName: 'X', incomingName: 'Y', matchday: 10 },
    ];
    const offers = pickJobOffers(leagueClubIds, 'a', news, createRandom(1), 2);
    expect(offers.sort()).toEqual(['d', 'e']);
  });

  it('never returns duplicate clubs even when a recently-vacant club is also in the shuffled fallback pool', () => {
    const news: ManagerSackingEvent[] = [{ clubId: 'b', outgoingName: 'X', incomingName: 'Y', matchday: 10 }];
    const offers = pickJobOffers(leagueClubIds, 'a', news, createRandom(1), 6);
    expect(new Set(offers).size).toBe(offers.length);
  });
});
