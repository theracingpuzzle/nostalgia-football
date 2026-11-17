import { describe, expect, it } from 'vitest';
import { SQUADS_BY_CLUB_ID } from '../../data/clubSquads';
import { LEAGUES } from '../../data/leagues';
import type { ClubManagerState } from '../../engine';
import type { Fixture } from '../../engine/types';
import { createBackgroundLeagueState, isBackgroundLeagueSeasonComplete, type BackgroundLeagueState } from '../backgroundLeague';
import { advanceUnemployedMatchday, managedLeagueToBackgroundState, takeOverClub } from '../careerTransition';

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
