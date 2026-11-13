import { DEFAULT_FORMATION_ID, FORMATIONS } from '../data/formations';
import { ALL_CLUBS, LEAGUES } from '../data/leagues';
import {
  advancePlayoff,
  applyInjuryUpdates,
  computeLeagueTable,
  createPlayoffState,
  createRandom,
  generateFixtures,
  simulateMatchday,
  type PlayoffState,
} from '../engine';
import type { Fixture, Player } from '../engine/types';

const AI_FORMATION = FORMATIONS.find((f) => f.id === DEFAULT_FORMATION_ID) ?? FORMATIONS[0];

/**
 * A league the player isn't currently managing, simulated fully
 * automatically alongside the managed league (see CareerScreen.tsx) — own
 * fixtures, own independent RNG stream, and (for the Championship) its
 * own promotion playoff once the regular season ends. Never holds squad
 * data of its own — every club's squad lives in the one shared
 * `allSquads` map the managed league already uses (see data/clubSquads.ts).
 */
export interface BackgroundLeagueState {
  leagueId: string;
  clubIds: string[];
  fixtures: Fixture[];
  nextSeed: number;
  /** Only ever populated for a tier:'second' league (the Championship today). */
  playoff: PlayoffState | null;
}

export function createBackgroundLeagueState(leagueId: string, clubIds: string[], seed: number): BackgroundLeagueState {
  return { leagueId, clubIds, fixtures: generateFixtures(clubIds), nextSeed: seed, playoff: null };
}

function isSecondTier(leagueId: string): boolean {
  return LEAGUES.find((l) => l.id === leagueId)?.tier === 'second';
}

/** True once there's nothing left to simulate this season: the regular season, and — for a second-tier league — its promotion playoff too. */
export function isBackgroundLeagueSeasonComplete(state: BackgroundLeagueState): boolean {
  const regularSeasonDone = state.fixtures.length > 0 && state.fixtures.every((f) => f.played);
  if (!regularSeasonDone) return false;
  return !isSecondTier(state.leagueId) || state.playoff?.championClubId != null;
}

/**
 * One small step: the next unplayed matchday, or — once the regular
 * season is done and this is the Championship — the next step of its
 * playoff bracket. Always fully automatic: a background league's own
 * fixtures never contain the managed club, so `simulateMatchday`/
 * `advancePlayoff` never defer anything here.
 */
export function advanceBackgroundLeagueMatchday(
  state: BackgroundLeagueState,
  allSquads: Record<string, Player[]>,
): { nextState: BackgroundLeagueState; updatedAllSquads: Record<string, Player[]> } {
  if (isBackgroundLeagueSeasonComplete(state)) return { nextState: state, updatedAllSquads: allSquads };

  const unplayed = state.fixtures.filter((f) => !f.played);
  if (unplayed.length > 0) {
    const matchday = Math.min(...unplayed.map((f) => f.matchday));
    const fixturesThisMatchday = unplayed.filter((f) => f.matchday === matchday);
    const { resultsByFixtureId, playedPlayerIdsByClub, nextSeed } = simulateMatchday({
      fixtures: fixturesThisMatchday,
      seed: state.nextSeed,
      clubListingOf: (id) => ALL_CLUBS.find((c) => c.id === id),
      squadOf: (id) => allSquads[id],
      aiFormation: AI_FORMATION,
    });
    const nextFixtures = state.fixtures.map((f) => {
      const result = resultsByFixtureId.get(f.id);
      return result ? { ...f, played: true, result } : f;
    });
    const injuryRandom = createRandom(nextSeed);
    const updatedAllSquads = applyInjuryUpdates(allSquads, matchday, playedPlayerIdsByClub, injuryRandom);
    return { nextState: { ...state, fixtures: nextFixtures, nextSeed: nextSeed + 1 }, updatedAllSquads };
  }

  // Regular season just finished and this is the Championship — seed the playoff bracket, one step at a time, same as everything else here.
  if (!state.playoff) {
    const table = computeLeagueTable(state.clubIds, state.fixtures);
    const firstPlayoffMatchday = Math.max(...state.fixtures.map((f) => f.matchday)) + 1;
    return { nextState: { ...state, playoff: createPlayoffState(table, firstPlayoffMatchday, state.nextSeed) }, updatedAllSquads: allSquads };
  }
  const { nextPlayoff } = advancePlayoff(state.playoff, allSquads, (id) => ALL_CLUBS.find((c) => c.id === id), AI_FORMATION);
  return { nextState: { ...state, playoff: nextPlayoff }, updatedAllSquads: allSquads };
}

/**
 * Loops advanceBackgroundLeagueMatchday with no pacing until the season
 * (and, for the Championship, its playoff) is fully resolved. Used at
 * managed-league season-end to catch up a league with a longer season
 * (the Championship's 46 matchdays vs. the other two's 38) before
 * promotion/relegation is computed. The 1000-step guard is just a safety
 * net against an infinite loop from a future bug — a real season never
 * needs anywhere near that many steps.
 */
export function fastForwardBackgroundLeagueSeason(
  state: BackgroundLeagueState,
  allSquads: Record<string, Player[]>,
): { nextState: BackgroundLeagueState; updatedAllSquads: Record<string, Player[]> } {
  let current = state;
  let squads = allSquads;
  let guard = 0;
  while (!isBackgroundLeagueSeasonComplete(current) && guard < 1000) {
    const stepped = advanceBackgroundLeagueMatchday(current, squads);
    current = stepped.nextState;
    squads = stepped.updatedAllSquads;
    guard++;
  }
  return { nextState: current, updatedAllSquads: squads };
}
