import { LEAGUES } from '../data/leagues';
import { computeLeagueTable, type ClubManagerState, type ManagerNewsEvent, type PlayoffState } from '../engine';
import type { Fixture, Player } from '../engine/types';
import {
  advanceBackgroundLeagueMatchday,
  createBackgroundLeagueState,
  isBackgroundLeagueSeasonComplete,
  type BackgroundLeagueState,
} from './backgroundLeague';
import { applyPyramidTransitions } from './pyramid';

/**
 * Turns the currently-managed league's live state into an ordinary
 * BackgroundLeagueState, with the player's own club marked vacant — the
 * same shape every OTHER league already has. Used both when the player
 * becomes unemployed (sacked) and when accepting a job in a DIFFERENT
 * league (a cross-league approach) — in both cases, the league being
 * LEFT needs to look exactly like any other background league, ticking
 * down on the normal vacancy-fill timer rather than being special-cased.
 */
export function managedLeagueToBackgroundState(params: {
  leagueId: string;
  clubIds: string[];
  fixtures: Fixture[];
  nextSeed: number;
  playoff: PlayoffState | null;
  /** Every OTHER club in this league — never containing the player's own club. */
  leagueManagers: Record<string, ClubManagerState>;
  managerNews: ManagerNewsEvent[];
  playerClubId: string;
  playerConfidence: number;
  vacantSinceMatchday: number;
}): BackgroundLeagueState {
  return {
    leagueId: params.leagueId,
    clubIds: params.clubIds,
    fixtures: params.fixtures,
    nextSeed: params.nextSeed,
    playoff: params.playoff,
    managers: { ...params.leagueManagers, [params.playerClubId]: { name: null, confidence: params.playerConfidence, tenureStartMatchday: params.vacantSinceMatchday } },
    managerNews: params.managerNews,
  };
}

/**
 * Splits `newClubId`'s league out of a flat list of every league's
 * background state — used both for the unemployed vacancy board
 * (`leagues` is the save's own `leagues`) and for accepting a
 * cross-league approach (`leagues` is `backgroundLeagues` plus the
 * just-vacated managed league, via `managedLeagueToBackgroundState`
 * above). The found league becomes the new managed one; everything
 * else in `remainingLeagues` becomes the new backgroundLeagues.
 */
export function takeOverClub(newClubId: string, leagues: BackgroundLeagueState[]): { newClubLeague: BackgroundLeagueState; remainingLeagues: BackgroundLeagueState[] } {
  const newClubLeague = leagues.find((l) => l.clubIds.includes(newClubId));
  if (!newClubLeague) throw new Error(`takeOverClub: ${newClubId} isn't in any of the given leagues`);
  return { newClubLeague, remainingLeagues: leagues.filter((l) => l !== newClubLeague) };
}

/**
 * One matchday across every league in an unemployed spell — every
 * league is just a BackgroundLeagueState with nobody managing it, so
 * this is the exact same per-matchday step CareerScreen already runs
 * for its 4 non-managed leagues, just applied to all 5. Once every
 * league's own season (and playoff, where one applies) is complete,
 * rolls over into a fresh season via the same `applyPyramidTransitions`
 * a managed career's own `startNewSeason()` uses, so promotion/
 * relegation happens identically whether or not anyone's employed to
 * watch it.
 */
export function advanceUnemployedMatchday(
  leagues: BackgroundLeagueState[],
  allSquads: Record<string, Player[]>,
): { leagues: BackgroundLeagueState[]; allSquads: Record<string, Player[]>; rolledOver: boolean } {
  let squadsAcc = allSquads;
  const nextLeagues = leagues.map((bg) => {
    const { nextState, updatedAllSquads } = advanceBackgroundLeagueMatchday(bg, squadsAcc);
    squadsAcc = updatedAllSquads;
    return nextState;
  });

  if (!nextLeagues.every(isBackgroundLeagueSeasonComplete)) {
    return { leagues: nextLeagues, allSquads: squadsAcc, rolledOver: false };
  }

  const leagueClubIds = Object.fromEntries(nextLeagues.map((l) => [l.leagueId, l.clubIds]));
  function outcomeFor(leagueId: string) {
    const bg = nextLeagues.find((l) => l.leagueId === leagueId)!;
    return { clubIds: bg.clubIds, table: computeLeagueTable(bg.clubIds, bg.fixtures), playoffWinnerClubId: bg.playoff?.championClubId ?? undefined };
  }
  const nextLeagueClubIds = applyPyramidTransitions(leagueClubIds, outcomeFor);

  const freshLeagues = LEAGUES.map((l) => createBackgroundLeagueState(l.id, nextLeagueClubIds[l.id] ?? l.clubs.map((c) => c.id), Math.floor(Math.random() * 1_000_000) + 1));
  return { leagues: freshLeagues, allSquads: squadsAcc, rolledOver: true };
}
