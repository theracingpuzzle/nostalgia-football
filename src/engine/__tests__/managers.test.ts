import { describe, expect, it } from 'vitest';
import { createRandom } from '../rng';
import { PLACEHOLDER_MANAGER_POOL } from '../../data/managers0809';
import {
  MANAGER_APPROACH_COOLDOWN_MATCHDAYS,
  MANAGER_SACK_GRACE_MATCHDAYS,
  MANAGER_SACK_THRESHOLD,
  MANAGER_SECURE_THRESHOLD,
  MANAGER_STARTING_CONFIDENCE,
  MANAGER_VACANCY_FILL_MATCHDAYS,
  checkForJobApproach,
  computeNextConfidence,
  createClubManagers,
  fillStaleVacancies,
  isSackWorthy,
  pickReplacementManagerName,
  pickSackedJobOffers,
  recentFormScore,
  updateLeagueManagers,
  vacantClubIds,
  type ClubManagerState,
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
    const { sackings } = updateLeagueManagers(managers, clubIds, table, fixtures, 2);
    expect(sackings).toEqual([]);
  });

  it('eventually sacks a club stuck bottom-of-table on a losing streak, making it genuinely vacant (not an instant replacement)', () => {
    let managers = baseManagers(1);
    let sackingEvent: { clubId: string; outgoingName: string | null; incomingName: string | null } | undefined;
    const allFixtures: Fixture[] = []; // accumulates across matchdays, same as a real career's fixtures list

    for (let matchday = 2; matchday <= 40 && !sackingEvent; matchday++) {
      const table = [row('b'), row('c'), row('d'), row('a')]; // 'a' always last
      allFixtures.push(playedFixture(`f${matchday}`, matchday, 'a', 'b', 0, 5));
      const result = updateLeagueManagers(managers, clubIds, table, allFixtures, matchday);
      managers = result.nextManagers;
      sackingEvent = result.sackings.find((s) => s.clubId === 'a');
    }

    expect(sackingEvent?.outgoingName).toBe('Manager-a');
    expect(sackingEvent?.incomingName).toBeNull();
    expect(managers['a'].name).toBeNull(); // genuinely vacant, no instant replacement
  });

  it('never decays a club that is already vacant', () => {
    const managers: Record<string, ClubManagerState> = { ...baseManagers(1), a: { name: null, confidence: 42, tenureStartMatchday: 1 } };
    const table = [row('a'), row('b'), row('c'), row('d')]; // 'a' top of the table, which would otherwise boost confidence
    const fixtures = [playedFixture('f1', 10, 'a', 'b', 5, 0)]; // and winning big, which would otherwise boost form
    const { nextManagers } = updateLeagueManagers(managers, clubIds, table, fixtures, 10);
    expect(nextManagers['a']).toEqual({ name: null, confidence: 42, tenureStartMatchday: 1 });
  });

  it('sacks every club crossing the threshold in the same call, all becoming vacant', () => {
    const managers: Record<string, ClubManagerState> = Object.fromEntries(clubIds.map((id) => [id, { name: `Manager-${id}`, confidence: 1, tenureStartMatchday: 1 }]));
    const table = clubIds.map(row);
    const fixtures: Fixture[] = [];
    const matchday = 1 + MANAGER_SACK_GRACE_MATCHDAYS;

    const { nextManagers, sackings } = updateLeagueManagers(managers, clubIds, table, fixtures, matchday);

    expect(sackings.length).toBe(clubIds.length);
    for (const id of clubIds) expect(nextManagers[id].name).toBeNull();
  });
});

describe('fillStaleVacancies', () => {
  const clubIds = ['a', 'b', 'c', 'd'];

  it('is a no-op before the fill threshold', () => {
    const managers: Record<string, ClubManagerState> = {
      a: { name: null, confidence: 0, tenureStartMatchday: 5 },
      b: { name: 'Manager-b', confidence: 55, tenureStartMatchday: 1 },
      c: { name: 'Manager-c', confidence: 55, tenureStartMatchday: 1 },
      d: { name: 'Manager-d', confidence: 55, tenureStartMatchday: 1 },
    };
    const matchday = 5 + MANAGER_VACANCY_FILL_MATCHDAYS - 1; // one short of the threshold
    const { nextManagers, appointments } = fillStaleVacancies(managers, clubIds, matchday, createRandom(1));
    expect(appointments).toEqual([]);
    expect(nextManagers['a'].name).toBeNull();
  });

  it('fills a vacancy exactly at the threshold, with a fresh name and full confidence', () => {
    const managers: Record<string, ClubManagerState> = {
      a: { name: null, confidence: 0, tenureStartMatchday: 5 },
      b: { name: 'Manager-b', confidence: 55, tenureStartMatchday: 1 },
      c: { name: 'Manager-c', confidence: 55, tenureStartMatchday: 1 },
      d: { name: 'Manager-d', confidence: 55, tenureStartMatchday: 1 },
    };
    const matchday = 5 + MANAGER_VACANCY_FILL_MATCHDAYS;
    const { nextManagers, appointments } = fillStaleVacancies(managers, clubIds, matchday, createRandom(1));
    expect(appointments).toHaveLength(1);
    expect(appointments[0]).toMatchObject({ clubId: 'a', outgoingName: null, matchday });
    expect(nextManagers['a'].name).not.toBeNull();
    expect(nextManagers['a'].confidence).toBe(MANAGER_STARTING_CONFIDENCE);
    expect(nextManagers['a'].tenureStartMatchday).toBe(matchday);
  });

  it('never assigns a name already employed elsewhere in clubIds', () => {
    const employedName = PLACEHOLDER_MANAGER_POOL[0];
    const managers: Record<string, ClubManagerState> = {
      a: { name: null, confidence: 0, tenureStartMatchday: 1 },
      b: { name: employedName, confidence: 55, tenureStartMatchday: 1 },
      c: { name: 'Manager-c', confidence: 55, tenureStartMatchday: 1 },
      d: { name: 'Manager-d', confidence: 55, tenureStartMatchday: 1 },
    };
    const matchday = 1 + MANAGER_VACANCY_FILL_MATCHDAYS;
    const { nextManagers } = fillStaleVacancies(managers, clubIds, matchday, createRandom(2));
    expect(nextManagers['a'].name).not.toBe(employedName);
  });

  it('never assigns the same name to two vacancies filled in the same call', () => {
    const managers: Record<string, ClubManagerState> = {
      a: { name: null, confidence: 0, tenureStartMatchday: 1 },
      b: { name: null, confidence: 0, tenureStartMatchday: 1 },
      c: { name: 'Manager-c', confidence: 55, tenureStartMatchday: 1 },
      d: { name: 'Manager-d', confidence: 55, tenureStartMatchday: 1 },
    };
    const matchday = 1 + MANAGER_VACANCY_FILL_MATCHDAYS;
    const { nextManagers } = fillStaleVacancies(managers, clubIds, matchday, createRandom(3));
    expect(nextManagers['a'].name).not.toBeNull();
    expect(nextManagers['b'].name).not.toBeNull();
    expect(nextManagers['a'].name).not.toBe(nextManagers['b'].name);
  });
});

describe('vacantClubIds', () => {
  it('returns only the genuinely vacant clubs', () => {
    const managers: Record<string, ClubManagerState> = {
      a: { name: null, confidence: 0, tenureStartMatchday: 1 },
      b: { name: 'Manager-b', confidence: 55, tenureStartMatchday: 1 },
    };
    expect(vacantClubIds(managers, ['a', 'b'])).toEqual(['a']);
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

describe('pickSackedJobOffers', () => {
  const leagueClubIds = ['a', 'b', 'c', 'd', 'e', 'f'];

  function managersWithVacant(vacantIds: string[]): Record<string, ClubManagerState> {
    return Object.fromEntries(leagueClubIds.map((id) => [id, vacantIds.includes(id) ? { name: null, confidence: 0, tenureStartMatchday: 1 } : { name: `Manager-${id}`, confidence: 55, tenureStartMatchday: 1 }]));
  }

  it('only offers genuinely vacant clubs when any exist, and never includes excludeClubId', () => {
    const managers = managersWithVacant(['c', 'd', 'e']);
    const { offeredClubIds, isExploratory } = pickSackedJobOffers(managers, leagueClubIds, 'a', createRandom(1));
    expect(isExploratory).toBe(false);
    expect(offeredClubIds).not.toContain('a');
    for (const id of offeredClubIds) expect(['c', 'd', 'e']).toContain(id);
  });

  it('falls back to exactly one exploratory offer when nothing is vacant', () => {
    const managers = managersWithVacant([]);
    const { offeredClubIds, isExploratory } = pickSackedJobOffers(managers, leagueClubIds, 'a', createRandom(1));
    expect(isExploratory).toBe(true);
    expect(offeredClubIds).toHaveLength(1);
    expect(offeredClubIds[0]).not.toBe('a');
  });

  it('never returns an empty offer list, even with only two clubs in the league', () => {
    const managers: Record<string, ClubManagerState> = {
      a: { name: 'Manager-a', confidence: 55, tenureStartMatchday: 1 },
      b: { name: 'Manager-b', confidence: 55, tenureStartMatchday: 1 },
    };
    const { offeredClubIds } = pickSackedJobOffers(managers, ['a', 'b'], 'a', createRandom(1));
    expect(offeredClubIds.length).toBeGreaterThan(0);
  });
});

describe('checkForJobApproach', () => {
  const vacant = ['x'];

  it('is null below the secure threshold', () => {
    expect(checkForJobApproach(MANAGER_SECURE_THRESHOLD - 1, 20, 1, null, vacant, createRandom(1))).toBeNull();
  });

  it('is null with no vacant candidates', () => {
    expect(checkForJobApproach(100, 20, 1, null, [], createRandom(1))).toBeNull();
  });

  it('is null inside the player\'s own tenure grace period', () => {
    expect(checkForJobApproach(100, 3, 1, null, vacant, createRandom(1))).toBeNull();
  });

  it('is null inside the post-decline cooldown', () => {
    const matchday = 20;
    expect(checkForJobApproach(100, matchday, 1, matchday - MANAGER_APPROACH_COOLDOWN_MATCHDAYS + 1, vacant, createRandom(1))).toBeNull();
  });

  it('is allowed again once the cooldown has fully elapsed', () => {
    const matchday = 20;
    // Run many seeds — some will roll above MANAGER_APPROACH_CHANCE and return null, but none should be blocked by the cooldown itself.
    let everFired = false;
    for (let seed = 1; seed < 200; seed++) {
      const result = checkForJobApproach(100, matchday, 1, matchday - MANAGER_APPROACH_COOLDOWN_MATCHDAYS, vacant, createRandom(seed));
      if (result !== null) everFired = true;
    }
    expect(everFired).toBe(true);
  });

  it('eventually fires given enough eligible matchdays, respecting MANAGER_APPROACH_CHANCE', () => {
    const random = createRandom(123);
    let fired: string | null = null;
    for (let matchday = 10; matchday <= 200 && fired === null; matchday++) {
      fired = checkForJobApproach(100, matchday, 1, null, vacant, random);
    }
    expect(fired).toBe('x');
  });
});
