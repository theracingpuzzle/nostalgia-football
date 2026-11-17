import { describe, expect, it } from 'vitest';
import { SQUADS_BY_CLUB_ID } from '../../data/clubSquads';
import { LEAGUES } from '../../data/leagues';
import type { ClubManagerState } from '../../engine';
import type { Fixture, MatchResult } from '../../engine/types';
import type { DivisionOutcome } from '../../screens/SeasonSummaryScreen';
import type { EmployedSaveData } from '../careerStorage';
import { createBackgroundLeagueState, isBackgroundLeagueSeasonComplete, type BackgroundLeagueState } from '../backgroundLeague';
import { advanceUnemployedMatchday, currentStintSnapshotFromSave, managedLeagueToBackgroundState, outcomeForCompletedSeason, takeOverClub } from '../careerTransition';

function clubIdsFor(leagueId: string): string[] {
  return LEAGUES.find((l) => l.id === leagueId)!.clubs.map((c) => c.id);
}

function cloneAllSquads() {
  return Object.fromEntries(Object.entries(SQUADS_BY_CLUB_ID).map(([id, players]) => [id, players.map((p) => ({ ...p }))]));
}

describe('managedLeagueToBackgroundState', () => {
  it('marks the player\'s own club vacant, leaving every other club\'s manager untouched', () => {
    const otherManagers: Record<string, ClubManagerState> = { other1: { name: 'Manager One', confidence: 60, tenureStartMatchday: 1 } };
    const fixtures: Fixture[] = [{ id: 'f1', matchday: 5, homeClubId: 'player-club', awayClubId: 'other1', played: true, result: null }];
    const bg = managedLeagueToBackgroundState({
      leagueId: 'championship',
      clubIds: ['player-club', 'other1'],
      fixtures,
      nextSeed: 123,
      playoff: null,
      leagueManagers: otherManagers,
      managerNews: [],
      playerClubId: 'player-club',
      playerConfidence: 37,
      vacantSinceMatchday: 5,
    });

    expect(bg.managers['player-club']).toEqual({ name: null, confidence: 37, tenureStartMatchday: 5 });
    expect(bg.managers['other1']).toEqual(otherManagers.other1);
    expect(bg.leagueId).toBe('championship');
    expect(bg.clubIds).toEqual(['player-club', 'other1']);
    expect(bg.fixtures).toBe(fixtures);
    expect(bg.nextSeed).toBe(123);
  });
});

describe('takeOverClub', () => {
  const leagueA: BackgroundLeagueState = { leagueId: 'a', clubIds: ['a1', 'a2'], fixtures: [], nextSeed: 1, playoff: null, managers: {}, managerNews: [] };
  const leagueB: BackgroundLeagueState = { leagueId: 'b', clubIds: ['b1', 'b2'], fixtures: [], nextSeed: 2, playoff: null, managers: {}, managerNews: [] };

  it('splits the found league out from the rest', () => {
    const { newClubLeague, remainingLeagues } = takeOverClub('b1', [leagueA, leagueB]);
    expect(newClubLeague).toBe(leagueB);
    expect(remainingLeagues).toEqual([leagueA]);
  });

  it('throws if the club is not in any of the given leagues', () => {
    expect(() => takeOverClub('nowhere', [leagueA, leagueB])).toThrow();
  });
});

describe('advanceUnemployedMatchday', () => {
  it('is a no-op pass-through (rolledOver: false) while any league still has fixtures left to play', () => {
    const leagues = LEAGUES.map((l) => createBackgroundLeagueState(l.id, clubIdsFor(l.id), 1));
    const result = advanceUnemployedMatchday(leagues, cloneAllSquads());
    expect(result.rolledOver).toBe(false);
    expect(result.leagues).toHaveLength(LEAGUES.length);
    // At least one league actually advanced (some fixture now played) — this isn't a true no-op, just not yet a season rollover.
    const anyProgress = result.leagues.some((bg, i) => bg.fixtures.some((f) => f.played) || bg !== leagues[i]);
    expect(anyProgress).toBe(true);
  });

  it('eventually rolls over into a fresh season for every league, with no club duplicated', () => {
    let leagues = LEAGUES.map((l) => createBackgroundLeagueState(l.id, clubIdsFor(l.id), 1));
    let squads = cloneAllSquads();
    let rolledOver = false;
    for (let step = 0; step < 300 && !rolledOver; step++) {
      const result = advanceUnemployedMatchday(leagues, squads);
      leagues = result.leagues;
      squads = result.allSquads;
      rolledOver = result.rolledOver;
    }

    expect(rolledOver).toBe(true);
    expect(leagues).toHaveLength(LEAGUES.length);
    for (const l of LEAGUES) expect(leagues.find((bg) => bg.leagueId === l.id)).toBeDefined();

    const allClubIds = leagues.flatMap((bg) => bg.clubIds);
    expect(new Set(allClubIds).size).toBe(allClubIds.length);

    // A fresh season: nobody's fixtures are played yet, and every club has a fresh manager.
    for (const bg of leagues) {
      expect(bg.fixtures.every((f) => !f.played)).toBe(true);
      for (const clubId of bg.clubIds) expect(bg.managers[clubId]).toBeDefined();
    }
  }, 20000);

  it('isBackgroundLeagueSeasonComplete is false for every fresh-rolled-over league', () => {
    let leagues = LEAGUES.map((l) => createBackgroundLeagueState(l.id, clubIdsFor(l.id), 1));
    let squads = cloneAllSquads();
    let rolledOver = false;
    for (let step = 0; step < 300 && !rolledOver; step++) {
      const result = advanceUnemployedMatchday(leagues, squads);
      leagues = result.leagues;
      squads = result.allSquads;
      rolledOver = result.rolledOver;
    }
    for (const bg of leagues) expect(isBackgroundLeagueSeasonComplete(bg)).toBe(false);
  }, 20000);
});

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

function makeEmployedSave(overrides: Partial<EmployedSaveData> = {}): EmployedSaveData {
  return {
    clubId: 'a',
    leagueId: 'test-league',
    managerName: 'Test Manager',
    leagueClubIds: { 'test-league': ['a', 'b', 'c', 'd'] },
    screen: 'team',
    formationId: '4-4-2',
    selectedXI: [],
    fixtures: [],
    nextSeed: 1,
    lastPlayedFixtureId: null,
    allSquads: {},
    transferWindow: null,
    januaryWindowShown: false,
    transferOffers: [],
    transferTimeline: [],
    seasonSummaryDismissed: false,
    ...overrides,
  };
}

describe('currentStintSnapshotFromSave', () => {
  it('reads played/won/drawn/lost/position/totalClubs straight from the save\'s own fixtures', () => {
    const fixtures = [
      playedFixture('f1', 1, 'a', 'b', 2, 0), // a beats b
      playedFixture('f2', 2, 'c', 'a', 1, 1), // a draws c
    ];
    const save = makeEmployedSave({ clubId: 'a', seasonNumber: 3, fixtures });
    const snapshot = currentStintSnapshotFromSave(save);

    expect(snapshot).toEqual({
      clubId: 'a',
      leagueId: 'test-league',
      seasonNumber: 3,
      played: 2,
      won: 1,
      drawn: 1,
      lost: 0,
      position: 1, // 4 points, top of a 4-club table where nobody else has played
      totalClubs: 4,
    });
  });

  it('defaults seasonNumber to 1 when absent (an old save)', () => {
    const save = makeEmployedSave({ seasonNumber: undefined });
    expect(currentStintSnapshotFromSave(save).seasonNumber).toBe(1);
  });
});

describe('outcomeForCompletedSeason', () => {
  it('is champion when finishing 1st with no real divisionOutcome', () => {
    expect(outcomeForCompletedSeason(1, null)).toBe('champion');
  });

  it('is stayed when finishing mid-table with no real divisionOutcome', () => {
    expect(outcomeForCompletedSeason(10, null)).toBe('stayed');
  });

  it('passes through every real divisionOutcome unchanged, even at position 1', () => {
    const outcomes: DivisionOutcome[] = ['promoted-automatic', 'promoted-playoff', 'lost-playoff-semifinal', 'lost-playoff-final', 'relegated-real'];
    for (const outcome of outcomes) {
      expect(outcomeForCompletedSeason(1, outcome)).toBe(outcome);
      expect(outcomeForCompletedSeason(15, outcome)).toBe(outcome);
    }
  });
});
