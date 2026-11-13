import { pickBestXI } from './squadAuto';
import { simulateMatch } from './matchSimulator';
import type { Club, Fixture, Formation, MatchResult, Player, TeamMatchInput } from './types';

/** Just enough club identity to build an engine `Club` for a fixture — a slice of `ClubListing`, not the type itself (this module shouldn't depend on the data layer). */
export interface ClubMatchMeta {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
}

/**
 * If the managed club has a fixture in this matchday, don't simulate it
 * here — it's handed back as `deferred` instead, so a live screen can run
 * it interactively (pausing at half time for a substitution). Its seed
 * slot is still reserved in the same sequence as every other match, so
 * the rest of the matchday's results don't shift depending on what
 * happens in the live match.
 */
export interface DeferredMatchday {
  fixtureId: string;
  homeInput: TeamMatchInput;
  awayInput: TeamMatchInput;
  seed: number;
  managedSide: 'home' | 'away';
  matchday: number;
}

export interface SimulateMatchdayOptions {
  /** One matchday's worth of unplayed fixtures (or a one-off playoff fixture/leg — anything sharing a single `matchday` number). */
  fixtures: Fixture[];
  seed: number;
  clubListingOf: (clubId: string) => ClubMatchMeta | undefined;
  squadOf: (clubId: string) => Player[] | undefined;
  aiFormation: Formation;
  /**
   * Pass the real managed-club selection every time, even when simulating
   * a league the player isn't managing — a background league's fixtures
   * never contain the managed club's id, so deferral simply never
   * triggers for them. There's no need for callers to special-case
   * "is this a background league" themselves.
   */
  managedOverride?: { clubId: string; formation: Formation; selectedXI: Player[] };
  /** Neutral-venue fixtures (a playoff final) skip the home-advantage multiplier — defaults to true, same as a normal league fixture. */
  applyHomeAdvantage?: boolean;
}

export interface SimulateMatchdayResult {
  resultsByFixtureId: Map<string, MatchResult>;
  playedPlayerIdsByClub: Record<string, string[]>;
  deferred: DeferredMatchday | null;
  /** The next unused seed — already accounts for the deferred fixture's reserved slot, if there is one. */
  nextSeed: number;
}

function toEngineClub(meta: ClubMatchMeta, players: Player[]): Club {
  return { id: meta.id, name: meta.name, shortName: meta.shortName, colors: { primary: meta.primaryColor, secondary: meta.secondaryColor }, reputation: 70, players };
}

/**
 * Simulates every fixture in one matchday, auto-picking an AI best-XI
 * (via `pickBestXI`) for every club except the managed one, if present.
 * Pure and league-agnostic — the same function drives the player's own
 * league (with live-match deferral) and every other league running in
 * the background (fully automatic, since `managedOverride.clubId` never
 * appears in a background league's fixtures).
 */
export function simulateMatchday({
  fixtures,
  seed,
  clubListingOf,
  squadOf,
  aiFormation,
  managedOverride,
  applyHomeAdvantage = true,
}: SimulateMatchdayOptions): SimulateMatchdayResult {
  let nextSeed = seed;
  const resultsByFixtureId = new Map<string, MatchResult>();
  const playedPlayerIdsByClub: Record<string, string[]> = {};
  let deferred: DeferredMatchday | null = null;

  for (const fixture of fixtures) {
    const isManagedHome = managedOverride?.clubId === fixture.homeClubId;
    const isManagedAway = managedOverride?.clubId === fixture.awayClubId;

    const homeListing = clubListingOf(fixture.homeClubId);
    const awayListing = clubListingOf(fixture.awayClubId);
    const homeSquad = squadOf(fixture.homeClubId);
    const awaySquad = squadOf(fixture.awayClubId);
    if (!homeListing || !awayListing || !homeSquad || !awaySquad) continue;

    const homeClubForEngine = toEngineClub(homeListing, homeSquad);
    const awayClubForEngine = toEngineClub(awayListing, awaySquad);

    const homeInput: TeamMatchInput = isManagedHome
      ? { club: homeClubForEngine, formation: managedOverride!.formation, selectedXI: managedOverride!.selectedXI }
      : { club: homeClubForEngine, formation: aiFormation, selectedXI: pickBestXI(homeClubForEngine, aiFormation) };
    const awayInput: TeamMatchInput = isManagedAway
      ? { club: awayClubForEngine, formation: managedOverride!.formation, selectedXI: managedOverride!.selectedXI }
      : { club: awayClubForEngine, formation: aiFormation, selectedXI: pickBestXI(awayClubForEngine, aiFormation) };

    if (isManagedHome || isManagedAway) {
      deferred = { fixtureId: fixture.id, homeInput, awayInput, seed: nextSeed, managedSide: isManagedHome ? 'home' : 'away', matchday: fixture.matchday };
      nextSeed += 1;
      continue;
    }

    const result = simulateMatch({ fixtureId: fixture.id, home: homeInput, away: awayInput, seed: nextSeed, applyHomeAdvantage });
    nextSeed += 1;
    resultsByFixtureId.set(fixture.id, result);
    playedPlayerIdsByClub[fixture.homeClubId] = result.homeXI;
    playedPlayerIdsByClub[fixture.awayClubId] = result.awayXI;
  }

  return { resultsByFixtureId, playedPlayerIdsByClub, deferred, nextSeed };
}
