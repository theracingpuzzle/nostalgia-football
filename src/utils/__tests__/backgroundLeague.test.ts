import { describe, expect, it } from 'vitest';
import { SQUADS_BY_CLUB_ID } from '../../data/clubSquads';
import { LEAGUES } from '../../data/leagues';
import { MANAGER_STARTING_CONFIDENCE } from '../../engine';
import { advanceBackgroundLeagueMatchday, createBackgroundLeagueState, fastForwardBackgroundLeagueSeason, isBackgroundLeagueSeasonComplete, type BackgroundLeagueState } from '../backgroundLeague';

function clubIdsFor(leagueId: string): string[] {
  return LEAGUES.find((l) => l.id === leagueId)!.clubs.map((c) => c.id);
}

/** Every club has a named manager, and every managerNews entry (if any) refers to a real club and a matchday that actually happened this season. */
function assertManagersAreWellFormed(state: BackgroundLeagueState, clubIds: string[]) {
  for (const clubId of clubIds) {
    expect(state.managers[clubId]).toBeDefined();
    expect(state.managers[clubId].name.trim().length).toBeGreaterThan(0);
  }
  const totalMatchdays = Math.max(0, ...state.fixtures.map((f) => f.matchday));
  for (const event of state.managerNews) {
    expect(clubIds).toContain(event.clubId);
    expect(event.matchday).toBeGreaterThanOrEqual(1);
    expect(event.matchday).toBeLessThanOrEqual(totalMatchdays + 20); // +20 covers the playoff's own extra matchdays, which aren't in `fixtures`
    expect(event.outgoingName.trim().length).toBeGreaterThan(0);
    expect(event.incomingName.trim().length).toBeGreaterThan(0);
  }
}

describe('advanceBackgroundLeagueMatchday', () => {
  it('plays exactly one matchday\'s worth of fixtures per call', () => {
    const clubIds = clubIdsFor('la-liga');
    const state = createBackgroundLeagueState('la-liga', clubIds, 1);
    const { nextState } = advanceBackgroundLeagueMatchday(state, SQUADS_BY_CLUB_ID);

    expect(nextState.fixtures.filter((f) => f.played)).toHaveLength(clubIds.length / 2);
    expect(isBackgroundLeagueSeasonComplete(nextState)).toBe(false);
  });

  it('is a no-op once the season is already complete', () => {
    const clubIds = clubIdsFor('la-liga');
    let state = createBackgroundLeagueState('la-liga', clubIds, 1);
    state = fastForwardBackgroundLeagueSeason(state, SQUADS_BY_CLUB_ID).nextState;
    const { nextState } = advanceBackgroundLeagueMatchday(state, SQUADS_BY_CLUB_ID);
    expect(nextState).toBe(state);
  });
});

describe('fastForwardBackgroundLeagueSeason', () => {
  it('fully resolves a top-tier league\'s season with no playoff', () => {
    const clubIds = clubIdsFor('la-liga');
    const state = createBackgroundLeagueState('la-liga', clubIds, 1);
    const { nextState } = fastForwardBackgroundLeagueSeason(state, SQUADS_BY_CLUB_ID);

    expect(nextState.fixtures.length).toBe(clubIds.length * (clubIds.length - 1));
    expect(nextState.fixtures.every((f) => f.played)).toBe(true);
    expect(nextState.playoff).toBeNull();
    expect(isBackgroundLeagueSeasonComplete(nextState)).toBe(true);
    assertManagersAreWellFormed(nextState, clubIds);
  });

  it('fully resolves the Championship\'s season AND its promotion playoff', () => {
    const clubIds = clubIdsFor('championship');
    const state = createBackgroundLeagueState('championship', clubIds, 1);
    const { nextState } = fastForwardBackgroundLeagueSeason(state, SQUADS_BY_CLUB_ID);

    expect(nextState.fixtures.every((f) => f.played)).toBe(true);
    expect(nextState.playoff).not.toBeNull();
    expect(nextState.playoff?.championClubId).toBeTruthy();
    // the champion must be one of the regular season's top-6 finishers (3rd-6th went to the playoff, 1st/2nd went up automatically and never entered it)
    const top6 = nextState.playoff!.table.slice(0, 6).map((r) => r.clubId);
    expect(top6).toContain(nextState.playoff!.championClubId);
    expect(isBackgroundLeagueSeasonComplete(nextState)).toBe(true);
    assertManagersAreWellFormed(nextState, clubIds);
  });

  it('fully resolves League One\'s season AND its promotion playoff (same 3rd-6th seeding shape as the Championship)', () => {
    const clubIds = clubIdsFor('league-one');
    const state = createBackgroundLeagueState('league-one', clubIds, 1);
    const { nextState } = fastForwardBackgroundLeagueSeason(state, SQUADS_BY_CLUB_ID);

    expect(nextState.fixtures.every((f) => f.played)).toBe(true);
    expect(nextState.playoff).not.toBeNull();
    expect(nextState.playoff?.championClubId).toBeTruthy();
    const top6 = nextState.playoff!.table.slice(0, 6).map((r) => r.clubId);
    expect(top6).toContain(nextState.playoff!.championClubId);
    // the playoff bracket itself must be seeded 3rd-6th (same as the Championship), not League Two's 4th-7th
    const seededClubIds = [nextState.playoff!.semiFinal1.higherSeedClubId, nextState.playoff!.semiFinal1.lowerSeedClubId, nextState.playoff!.semiFinal2.higherSeedClubId, nextState.playoff!.semiFinal2.lowerSeedClubId];
    expect(seededClubIds.sort()).toEqual(nextState.playoff!.table.slice(2, 6).map((r) => r.clubId).sort());
    expect(isBackgroundLeagueSeasonComplete(nextState)).toBe(true);
    assertManagersAreWellFormed(nextState, clubIds);
  });

  it('fully resolves League Two\'s season AND its promotion playoff, seeded 4th-7th (not 3rd-6th) since the top 3 go up automatically', () => {
    const clubIds = clubIdsFor('league-two');
    const state = createBackgroundLeagueState('league-two', clubIds, 1);
    const { nextState } = fastForwardBackgroundLeagueSeason(state, SQUADS_BY_CLUB_ID);

    expect(nextState.fixtures.every((f) => f.played)).toBe(true);
    expect(nextState.playoff).not.toBeNull();
    expect(nextState.playoff?.championClubId).toBeTruthy();
    // the champion must be one of 4th-7th (the top 3 went up automatically and never entered the bracket)
    const seeds4to7 = nextState.playoff!.table.slice(3, 7).map((r) => r.clubId);
    expect(seeds4to7).toContain(nextState.playoff!.championClubId);
    const seededClubIds = [nextState.playoff!.semiFinal1.higherSeedClubId, nextState.playoff!.semiFinal1.lowerSeedClubId, nextState.playoff!.semiFinal2.higherSeedClubId, nextState.playoff!.semiFinal2.lowerSeedClubId];
    expect(seededClubIds.sort()).toEqual(seeds4to7.sort());
    expect(isBackgroundLeagueSeasonComplete(nextState)).toBe(true);
    assertManagersAreWellFormed(nextState, clubIds);
  });

  it('fully resolves the Premier League\'s season starting from its real 2008/09 managers', () => {
    const clubIds = clubIdsFor('premier-league');
    const state = createBackgroundLeagueState('premier-league', clubIds, 1);
    expect(state.managers['man-utd'].name).toBe('Sir Alex Ferguson');
    expect(state.managers['arsenal'].name).toBe('Arsène Wenger');

    const { nextState } = fastForwardBackgroundLeagueSeason(state, SQUADS_BY_CLUB_ID);
    expect(isBackgroundLeagueSeasonComplete(nextState)).toBe(true);
    assertManagersAreWellFormed(nextState, clubIds);
  });
});

describe('createBackgroundLeagueState manager seeding', () => {
  it('gives every club a manager entry at full confidence from matchday 1', () => {
    const clubIds = clubIdsFor('championship');
    const state = createBackgroundLeagueState('championship', clubIds, 1);
    for (const clubId of clubIds) {
      expect(state.managers[clubId].confidence).toBe(MANAGER_STARTING_CONFIDENCE);
      expect(state.managers[clubId].tenureStartMatchday).toBe(1);
      expect(state.managers[clubId].name.trim().length).toBeGreaterThan(0);
    }
    expect(state.managerNews).toEqual([]);
  });
});
