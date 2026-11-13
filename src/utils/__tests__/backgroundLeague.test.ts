import { describe, expect, it } from 'vitest';
import { SQUADS_BY_CLUB_ID } from '../../data/clubSquads';
import { LEAGUES } from '../../data/leagues';
import { advanceBackgroundLeagueMatchday, createBackgroundLeagueState, fastForwardBackgroundLeagueSeason, isBackgroundLeagueSeasonComplete } from '../backgroundLeague';

function clubIdsFor(leagueId: string): string[] {
  return LEAGUES.find((l) => l.id === leagueId)!.clubs.map((c) => c.id);
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
  });
});
