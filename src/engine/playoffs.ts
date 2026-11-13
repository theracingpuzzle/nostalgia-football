import { createRandom, weightedPick } from './rng';
import { calculateTeamStrength } from './teamStrength';
import { simulateMatchday, type ClubMatchMeta, type DeferredMatchday } from './matchday';
import { simulateMatch } from './matchSimulator';
import type { Fixture, Formation, LeagueTableRow, MatchResult, Player, TeamMatchInput } from './types';

// A decider match needs *a* formation to shape the strength comparison — the AI formation each club actually played isn't available at this point in the flow, so this one fixed shape stands in purely for the tiebreak's own strength calculation. Doesn't affect either real leg at all.
const FORMATION_PLACEHOLDER: Formation = { id: '4-4-2', name: '4-4-2', slots: [{ position: 'GK', count: 1 }, { position: 'DEF', count: 4 }, { position: 'MID', count: 4 }, { position: 'FWD', count: 2 }], attackBias: 1, defenseBias: 1 };

/**
 * The Championship's end-of-season promotion playoff — the real EFL
 * format: 3rd-v-6th and 4th-v-5th each play a two-legged tie (aggregate
 * score decides), then the two winners play a single final. The winner
 * of the final is the 3rd promoted club, alongside the top 2 automatic
 * promotion spots (see utils/pyramid.ts). Pure, Fixture-typed, and
 * deliberately kept out of the Championship's own 46-fixture list —
 * these never touch computeLeagueTable.
 */
export interface TwoLegTie {
  id: string;
  higherSeedClubId: string;
  lowerSeedClubId: string;
  /** Lower seed hosts first (real-format convention — the better-placed side gets the advantage of hosting the decisive second leg). */
  leg1: Fixture;
  leg2: Fixture;
}

/** Seeds the semis from the Championship's final regular-season table (already sorted by computeLeagueTable): 3rd-v-6th, 4th-v-5th. */
export function generatePlayoffSemiFinals(finalTable: LeagueTableRow[], firstMatchday: number): { semiFinal1: TwoLegTie; semiFinal2: TwoLegTie } {
  const [, , third, fourth, fifth, sixth] = finalTable;

  function makeTie(id: string, higherSeed: LeagueTableRow, lowerSeed: LeagueTableRow): TwoLegTie {
    return {
      id,
      higherSeedClubId: higherSeed.clubId,
      lowerSeedClubId: lowerSeed.clubId,
      leg1: { id: `${id}-leg1`, matchday: firstMatchday, homeClubId: lowerSeed.clubId, awayClubId: higherSeed.clubId, played: false, result: null },
      leg2: { id: `${id}-leg2`, matchday: firstMatchday + 1, homeClubId: higherSeed.clubId, awayClubId: lowerSeed.clubId, played: false, result: null },
    };
  }

  return {
    semiFinal1: makeTie('sf1', third, sixth),
    semiFinal2: makeTie('sf2', fourth, fifth),
  };
}

/** Both legs must be played first. Away goals aren't a tiebreak here (dropped from the real rules in 2021, and this engine never tracked them anyway) — a level aggregate is handled by breakAggregateTie instead. */
export function computeAggregateWinner(tie: TwoLegTie): { winnerClubId: string } | { levelAggregate: true } {
  if (!tie.leg1.result || !tie.leg2.result) throw new Error('computeAggregateWinner: both legs must be played first');
  const higherSeedAggregate = tie.leg1.result.awayGoals + tie.leg2.result.homeGoals;
  const lowerSeedAggregate = tie.leg1.result.homeGoals + tie.leg2.result.awayGoals;
  if (higherSeedAggregate === lowerSeedAggregate) return { levelAggregate: true };
  return { winnerClubId: higherSeedAggregate > lowerSeedAggregate ? tie.higherSeedClubId : tie.lowerSeedClubId };
}

/**
 * Tiebreak for a level aggregate (also reused for a level final, which has
 * no second leg to fall back on). There's no away-goals or
 * penalty-shootout concept anywhere in this engine, so this simulates one
 * extra "decider" match with no home advantage (it's not a real fixture,
 * just a coin-flip stand-in), and — in the vanishingly unlikely case that
 * one is *also* drawn — a single team-strength-weighted coin flip rather
 * than simulating deciders forever. A deliberate, transparent
 * simplification standing in for penalties, flagged the same way
 * `cardWeight`/the GK card-booking fix are in matchSimulator.ts.
 */
export function breakAggregateTie(sideA: TeamMatchInput, sideB: TeamMatchInput, seed: number): { winnerClubId: string; decider: MatchResult | 'coin-flip'; nextSeed: number } {
  const decider = simulateMatch({ fixtureId: `decider-${seed}`, home: sideA, away: sideB, seed, applyHomeAdvantage: false });
  if (decider.homeGoals !== decider.awayGoals) {
    return { winnerClubId: decider.homeGoals > decider.awayGoals ? sideA.club.id : sideB.club.id, decider, nextSeed: seed + 1 };
  }
  const random = createRandom(seed + 1);
  const strengthA = calculateTeamStrength(sideA);
  const strengthB = calculateTeamStrength(sideB);
  const winner = weightedPick(
    random,
    [sideA, sideB],
    (side) => (side === sideA ? strengthA.attack + strengthA.defense : strengthB.attack + strengthB.defense) + 1,
  );
  return { winnerClubId: winner.club.id, decider: 'coin-flip', nextSeed: seed + 2 };
}

/** The final is at a neutral venue — callers must simulate it with applyHomeAdvantage: false; home/away here is nominal only. */
export function createFinalFixture(semiFinal1WinnerClubId: string, semiFinal2WinnerClubId: string, matchday: number): Fixture {
  return { id: 'final', matchday, homeClubId: semiFinal1WinnerClubId, awayClubId: semiFinal2WinnerClubId, played: false, result: null };
}

export interface PlayoffState {
  /** The regular-season table used to seed the bracket — frozen at creation, never recomputed mid-playoff. */
  table: LeagueTableRow[];
  semiFinal1: TwoLegTie;
  semiFinal2: TwoLegTie;
  semiFinal1Winner: string | null;
  semiFinal2Winner: string | null;
  final: Fixture | null;
  finalDecider: MatchResult | 'coin-flip' | null;
  /** The 3rd promoted club, once the final is resolved. */
  championClubId: string | null;
  nextSeed: number;
}

export function createPlayoffState(table: LeagueTableRow[], firstMatchday: number, seed: number): PlayoffState {
  const { semiFinal1, semiFinal2 } = generatePlayoffSemiFinals(table, firstMatchday);
  return { table, semiFinal1, semiFinal2, semiFinal1Winner: null, semiFinal2Winner: null, final: null, finalDecider: null, championClubId: null, nextSeed: seed };
}

function resolveTieIfReady(tie: TwoLegTie, allSquads: Record<string, Player[]>, clubListingOf: (id: string) => ClubMatchMeta | undefined, seed: number): { winnerClubId: string; decider: MatchResult | 'coin-flip' | null; nextSeed: number } | null {
  if (!tie.leg1.played || !tie.leg2.played) return null;
  const outcome = computeAggregateWinner(tie);
  if ('winnerClubId' in outcome) return { winnerClubId: outcome.winnerClubId, decider: null, nextSeed: seed };

  const higherListing = clubListingOf(tie.higherSeedClubId);
  const lowerListing = clubListingOf(tie.lowerSeedClubId);
  const higherSquad = allSquads[tie.higherSeedClubId];
  const lowerSquad = allSquads[tie.lowerSeedClubId];
  if (!higherListing || !lowerListing || !higherSquad || !lowerSquad) throw new Error('resolveTieIfReady: missing club data');

  const { winnerClubId, decider, nextSeed } = breakAggregateTie(
    { club: { id: higherListing.id, name: higherListing.name, shortName: higherListing.shortName, colors: { primary: higherListing.primaryColor, secondary: higherListing.secondaryColor }, reputation: 70, players: higherSquad }, formation: FORMATION_PLACEHOLDER, selectedXI: higherSquad.slice(0, 11) },
    { club: { id: lowerListing.id, name: lowerListing.name, shortName: lowerListing.shortName, colors: { primary: lowerListing.primaryColor, secondary: lowerListing.secondaryColor }, reputation: 70, players: lowerSquad }, formation: FORMATION_PLACEHOLDER, selectedXI: lowerSquad.slice(0, 11) },
    seed,
  );
  return { winnerClubId, decider, nextSeed };
}

/**
 * One step of the bracket: whichever round is next unplayed/unresolved.
 * Same "always pass the real managedOverride" pattern as simulateMatchday
 * — it only activates when the managed club is actually in that round's
 * fixture(s), so this is safe to call unconditionally for a background
 * Championship too.
 */
export function advancePlayoff(
  playoff: PlayoffState,
  allSquads: Record<string, Player[]>,
  clubListingOf: (id: string) => ClubMatchMeta | undefined,
  aiFormation: Formation,
  managedOverride?: { clubId: string; formation: Formation; selectedXI: Player[] },
): { nextPlayoff: PlayoffState; deferred: DeferredMatchday | null } {
  const unplayedLegs = [playoff.semiFinal1.leg1, playoff.semiFinal1.leg2, playoff.semiFinal2.leg1, playoff.semiFinal2.leg2].filter((f) => !f.played);

  if (unplayedLegs.length > 0) {
    const matchday = Math.min(...unplayedLegs.map((f) => f.matchday));
    const fixturesThisRound = unplayedLegs.filter((f) => f.matchday === matchday);
    const { resultsByFixtureId, deferred, nextSeed } = simulateMatchday({ fixtures: fixturesThisRound, seed: playoff.nextSeed, clubListingOf, squadOf: (id) => allSquads[id], aiFormation, managedOverride });

    const applyResult = (fixture: Fixture) => resultsByFixtureId.has(fixture.id) ? { ...fixture, played: true, result: resultsByFixtureId.get(fixture.id)! } : fixture;
    const nextPlayoff: PlayoffState = {
      ...playoff,
      semiFinal1: { ...playoff.semiFinal1, leg1: applyResult(playoff.semiFinal1.leg1), leg2: applyResult(playoff.semiFinal1.leg2) },
      semiFinal2: { ...playoff.semiFinal2, leg1: applyResult(playoff.semiFinal2.leg1), leg2: applyResult(playoff.semiFinal2.leg2) },
      nextSeed,
    };
    return { nextPlayoff, deferred };
  }

  // Both semis' legs are played — resolve any tie whose winner isn't known yet (may need a decider).
  if (!playoff.semiFinal1Winner) {
    const resolved = resolveTieIfReady(playoff.semiFinal1, allSquads, clubListingOf, playoff.nextSeed);
    if (resolved) return { nextPlayoff: { ...playoff, semiFinal1Winner: resolved.winnerClubId, nextSeed: resolved.nextSeed }, deferred: null };
  }
  if (!playoff.semiFinal2Winner) {
    const resolved = resolveTieIfReady(playoff.semiFinal2, allSquads, clubListingOf, playoff.nextSeed);
    if (resolved) return { nextPlayoff: { ...playoff, semiFinal2Winner: resolved.winnerClubId, nextSeed: resolved.nextSeed }, deferred: null };
  }

  if (playoff.semiFinal1Winner && playoff.semiFinal2Winner && !playoff.final) {
    const final = createFinalFixture(playoff.semiFinal1Winner, playoff.semiFinal2Winner, Math.max(playoff.semiFinal1.leg2.matchday, playoff.semiFinal2.leg2.matchday) + 1);
    return { nextPlayoff: { ...playoff, final }, deferred: null };
  }

  if (playoff.final && !playoff.final.played) {
    const { resultsByFixtureId, deferred, nextSeed } = simulateMatchday({ fixtures: [playoff.final], seed: playoff.nextSeed, clubListingOf, squadOf: (id) => allSquads[id], aiFormation, managedOverride, applyHomeAdvantage: false });
    const result = resultsByFixtureId.get(playoff.final.id);
    const nextFinal = result ? { ...playoff.final, played: true, result } : playoff.final;
    return { nextPlayoff: { ...playoff, final: nextFinal, nextSeed }, deferred };
  }

  if (playoff.final?.played && !playoff.championClubId) {
    const { final } = playoff;
    if (!final.result) throw new Error('advancePlayoff: final marked played with no result');
    if (final.result.homeGoals !== final.result.awayGoals) {
      const championClubId = final.result.homeGoals > final.result.awayGoals ? final.homeClubId : final.awayClubId;
      return { nextPlayoff: { ...playoff, championClubId }, deferred: null };
    }
    const higherListing = clubListingOf(final.homeClubId);
    const lowerListing = clubListingOf(final.awayClubId);
    const homeSquad = allSquads[final.homeClubId];
    const awaySquad = allSquads[final.awayClubId];
    if (!higherListing || !lowerListing || !homeSquad || !awaySquad) throw new Error('advancePlayoff: missing club data for final decider');
    const { winnerClubId, decider, nextSeed } = breakAggregateTie(
      { club: { id: higherListing.id, name: higherListing.name, shortName: higherListing.shortName, colors: { primary: higherListing.primaryColor, secondary: higherListing.secondaryColor }, reputation: 70, players: homeSquad }, formation: FORMATION_PLACEHOLDER, selectedXI: homeSquad.slice(0, 11) },
      { club: { id: lowerListing.id, name: lowerListing.name, shortName: lowerListing.shortName, colors: { primary: lowerListing.primaryColor, secondary: lowerListing.secondaryColor }, reputation: 70, players: awaySquad }, formation: FORMATION_PLACEHOLDER, selectedXI: awaySquad.slice(0, 11) },
      playoff.nextSeed,
    );
    return { nextPlayoff: { ...playoff, championClubId: winnerClubId, finalDecider: decider, nextSeed }, deferred: null };
  }

  return { nextPlayoff: playoff, deferred: null };
}

/** True if this club is one of the 4 semi-final participants and hasn't been eliminated (or already crowned champion). False for a club that finished 7th or lower and was never in the bracket at all. */
export function managedClubStillInPlayoff(playoff: PlayoffState, clubId: string): boolean {
  if (playoff.championClubId) return false;
  const inSemiFinal1 = playoff.semiFinal1.higherSeedClubId === clubId || playoff.semiFinal1.lowerSeedClubId === clubId;
  const inSemiFinal2 = playoff.semiFinal2.higherSeedClubId === clubId || playoff.semiFinal2.lowerSeedClubId === clubId;
  if (!inSemiFinal1 && !inSemiFinal2) return false;
  if (inSemiFinal1 && playoff.semiFinal1Winner && playoff.semiFinal1Winner !== clubId) return false;
  if (inSemiFinal2 && playoff.semiFinal2Winner && playoff.semiFinal2Winner !== clubId) return false;
  return true;
}

/**
 * Loops advancePlayoff (always with no managedOverride) until the final
 * is resolved — used once the managed club is no longer in the bracket
 * (eliminated, or never in it at all), so the player isn't made to click
 * through fixtures they have no stake in; the rest just resolves itself,
 * same as it would for a league they aren't managing.
 */
export function fastForwardPlayoff(playoff: PlayoffState, allSquads: Record<string, Player[]>, clubListingOf: (id: string) => ClubMatchMeta | undefined, aiFormation: Formation): PlayoffState {
  let current = playoff;
  let guard = 0;
  while (!current.championClubId && guard < 20) {
    current = advancePlayoff(current, allSquads, clubListingOf, aiFormation).nextPlayoff;
    guard++;
  }
  return current;
}

/** Commits a single leg's or the final's result into playoff state — used when a live-match deferral (the managed club's own fixture) reports back. Resolving a now-complete tie into a winner is a separate step, handled by the next advancePlayoff call. */
export function applyResultToPlayoffFixture(playoff: PlayoffState, fixtureId: string, result: MatchResult): PlayoffState {
  const withResult = (f: Fixture) => (f.id === fixtureId ? { ...f, played: true, result } : f);
  if (playoff.final && playoff.final.id === fixtureId) return { ...playoff, final: withResult(playoff.final) };
  return {
    ...playoff,
    semiFinal1: { ...playoff.semiFinal1, leg1: withResult(playoff.semiFinal1.leg1), leg2: withResult(playoff.semiFinal1.leg2) },
    semiFinal2: { ...playoff.semiFinal2, leg1: withResult(playoff.semiFinal2.leg1), leg2: withResult(playoff.semiFinal2.leg2) },
  };
}
