import { simulateMatchday, toEngineClub, type ClubMatchMeta, type DeferredMatchday } from './matchday';
import { createMatchSimulation, MINUTES_IN_MATCH, MINUTES_WITH_EXTRA_TIME } from './matchSimulator';
import { simulatePenaltyShootout, type PenaltyShootoutResult } from './penalties';
import type { Fixture, Formation, LeagueTableRow, MatchResult, Player } from './types';

/**
 * The Championship's end-of-season promotion playoff — the real EFL
 * format: 3rd-v-6th and 4th-v-5th each play a two-legged tie (aggregate
 * score decides), then the two winners play a single final. If the
 * decisive leg (leg 2, or the final — leg 1 never goes to extra time,
 * same as real football) is level after 90 minutes, it goes to extra
 * time (90 more minutes played, 120 total); if STILL level, a penalty
 * shootout (engine/penalties.ts) decides it. The winner of the final is
 * the 3rd promoted club, alongside the top 2 automatic promotion spots
 * (see utils/pyramid.ts). Pure, Fixture-typed, and deliberately kept out
 * of the Championship's own 46-fixture list — these never touch
 * computeLeagueTable.
 */
export interface TwoLegTie {
  id: string;
  higherSeedClubId: string;
  lowerSeedClubId: string;
  /** Lower seed hosts first (real-format convention — the better-placed side gets the advantage of hosting the decisive second leg). */
  leg1: Fixture;
  /** May end up covering 120 minutes (extra time) — `leg2.result.homeGoals`/`awayGoals` always reflect the final score, whatever length it took. */
  leg2: Fixture;
  wentToExtraTime: boolean;
  /** Set only if still level even after extra time. */
  penaltyShootout: PenaltyShootoutResult | null;
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
      wentToExtraTime: false,
      penaltyShootout: null,
    };
  }

  return {
    semiFinal1: makeTie('sf1', third, sixth),
    semiFinal2: makeTie('sf2', fourth, fifth),
  };
}

/** Both legs must be played first. Away goals aren't a tiebreak here (dropped from the real rules in 2021, and this engine never tracked them anyway). `leg2`'s goals already include any extra time played, so this needs no ET-awareness of its own. */
export function computeAggregateWinner(tie: TwoLegTie): { winnerClubId: string } | { levelAggregate: true } {
  if (!tie.leg1.result || !tie.leg2.result) throw new Error('computeAggregateWinner: both legs must be played first');
  const higherSeedAggregate = tie.leg1.result.awayGoals + tie.leg2.result.homeGoals;
  const lowerSeedAggregate = tie.leg1.result.homeGoals + tie.leg2.result.awayGoals;
  if (higherSeedAggregate === lowerSeedAggregate) return { levelAggregate: true };
  return { winnerClubId: higherSeedAggregate > lowerSeedAggregate ? tie.higherSeedClubId : tie.lowerSeedClubId };
}

/** Resolves a tie already decided by a penalty shootout into a winning club id (home/away here refer to leg2's home/away side — the shootout is hosted at leg2's venue). */
export function penaltyShootoutWinner(shootout: PenaltyShootoutResult, leg2: Fixture): string {
  return shootout.winnerSide === 'home' ? leg2.homeClubId : leg2.awayClubId;
}

/** The final is at a neutral venue — always simulated with applyHomeAdvantage: false; home/away here is nominal only. */
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
  finalWentToExtraTime: boolean;
  finalPenaltyShootout: PenaltyShootoutResult | null;
  /** The 3rd promoted club, once the final is resolved. */
  championClubId: string | null;
  nextSeed: number;
}

export function createPlayoffState(table: LeagueTableRow[], firstMatchday: number, seed: number): PlayoffState {
  const { semiFinal1, semiFinal2 } = generatePlayoffSemiFinals(table, firstMatchday);
  return { table, semiFinal1, semiFinal2, semiFinal1Winner: null, semiFinal2Winner: null, final: null, finalWentToExtraTime: false, finalPenaltyShootout: null, championClubId: null, nextSeed: seed };
}

export interface DecisiveFixtureResult {
  /** Unchanged (still unplayed) if deferred; otherwise updated with its final result (possibly 120 minutes). */
  fixture: Fixture;
  wentToExtraTime: boolean;
  /** Set only if still level even after extra time — null for a fixture decided inside normal or extra time, or one still awaiting a live result. */
  penaltyShootout: PenaltyShootoutResult | null;
  deferred: DeferredMatchday | null;
  nextSeed: number;
}

/**
 * Simulates ONE decisive fixture (a tie's leg 2, or the final) — unlike a
 * normal matchday fixture, this one may need extra time and then
 * penalties if it's level. Uses `createMatchSimulation`'s incremental
 * `advanceTo` (not the one-shot `simulateMatch`) so extra time is a
 * genuine continuation of the same 90-minute match, not a fresh
 * re-simulation — same mechanism the live match screen uses for its own
 * half-time pause. Only ever resolves non-deferred (AI-vs-AI) matches
 * fully in one call; a deferred (managed-club) fixture's extra
 * time/penalties are handled by the live match screen itself once it
 * reports back — see resolveDeferredDecisiveFixture.
 */
export function simulateDecisiveFixture(
  fixture: Fixture,
  seed: number,
  clubListingOf: (clubId: string) => ClubMatchMeta | undefined,
  squadOf: (clubId: string) => Player[] | undefined,
  aiFormation: Formation,
  applyHomeAdvantage: boolean,
  managedOverride?: { clubId: string; formation: Formation; selectedXI: Player[] },
  /** Goals this fixture's home/away club already has from a first leg (for a tie's leg2 — see getAggregateOffsetForFixture) — defaults to {0,0} for the final, which has no first leg and is just level-or-not on its own 90/120 minutes. */
  aggregateOffset: { home: number; away: number } = { home: 0, away: 0 },
): DecisiveFixtureResult {
  // Reuse simulateMatchday just to build the two TeamMatchInputs (AI best-XI or the managed selection) and detect a deferral — it always simulates to 90 for a non-deferred match, which this function then extends itself when needed.
  const { resultsByFixtureId, deferred, nextSeed } = simulateMatchday({ fixtures: [fixture], seed, clubListingOf, squadOf, aiFormation, applyHomeAdvantage, managedOverride });

  if (deferred) return { fixture, wentToExtraTime: false, penaltyShootout: null, deferred, nextSeed };

  const isLevelOnAggregate = (result: MatchResult) => aggregateOffset.home + result.homeGoals === aggregateOffset.away + result.awayGoals;

  const ninetyMinuteResult = resultsByFixtureId.get(fixture.id);
  if (!ninetyMinuteResult) throw new Error('simulateDecisiveFixture: expected a result for a non-deferred fixture');
  if (!isLevelOnAggregate(ninetyMinuteResult)) {
    return { fixture: { ...fixture, played: true, result: ninetyMinuteResult }, wentToExtraTime: false, penaltyShootout: null, deferred: null, nextSeed };
  }

  // Level on aggregate after 90 — extend the SAME simulation to extra time by rebuilding identical inputs (deterministic: pickBestXI is a pure function of squad+formation, so this reproduces the exact same XIs) and continuing past 90 rather than starting over.
  const homeListing = clubListingOf(fixture.homeClubId);
  const awayListing = clubListingOf(fixture.awayClubId);
  const homeSquad = squadOf(fixture.homeClubId);
  const awaySquad = squadOf(fixture.awayClubId);
  if (!homeListing || !awayListing || !homeSquad || !awaySquad) throw new Error('simulateDecisiveFixture: missing club data');

  const isManagedHome = managedOverride?.clubId === fixture.homeClubId;
  const isManagedAway = managedOverride?.clubId === fixture.awayClubId;
  const homeClub = toEngineClub(homeListing, homeSquad);
  const awayClub = toEngineClub(awayListing, awaySquad);
  const homeInput = isManagedHome ? { club: homeClub, formation: managedOverride!.formation, selectedXI: managedOverride!.selectedXI } : { club: homeClub, formation: aiFormation, selectedXI: ninetyMinuteResult.homeXI.map((id) => homeSquad.find((p) => p.id === id)!).filter(Boolean) };
  const awayInput = isManagedAway ? { club: awayClub, formation: managedOverride!.formation, selectedXI: managedOverride!.selectedXI } : { club: awayClub, formation: aiFormation, selectedXI: ninetyMinuteResult.awayXI.map((id) => awaySquad.find((p) => p.id === id)!).filter(Boolean) };

  const sim = createMatchSimulation({ fixtureId: fixture.id, home: homeInput, away: awayInput, seed: nextSeed, applyHomeAdvantage, totalMinutes: MINUTES_WITH_EXTRA_TIME });
  sim.advanceTo(MINUTES_IN_MATCH); // replays minutes 1-90 identically (same seed, same inputs), then...
  sim.advanceTo(MINUTES_WITH_EXTRA_TIME); // ...continues straight through extra time.
  const afterExtraTime = sim.getResult();
  let seedAfter = nextSeed + 1;

  if (!isLevelOnAggregate(afterExtraTime)) {
    return { fixture: { ...fixture, played: true, result: afterExtraTime }, wentToExtraTime: true, penaltyShootout: null, deferred: null, nextSeed: seedAfter };
  }

  const homeXIPlayers = afterExtraTime.homeXI.map((id) => homeSquad.find((p) => p.id === id)).filter((p): p is Player => p != null);
  const awayXIPlayers = afterExtraTime.awayXI.map((id) => awaySquad.find((p) => p.id === id)).filter((p): p is Player => p != null);
  const penaltyShootout = simulatePenaltyShootout(homeXIPlayers, awayXIPlayers, seedAfter);
  seedAfter += 1;

  return { fixture: { ...fixture, played: true, result: afterExtraTime }, wentToExtraTime: true, penaltyShootout, deferred: null, nextSeed: seedAfter };
}

/**
 * Goals this fixture's home/away club already has from a prior leg, for
 * use as `simulateDecisiveFixture`'s `aggregateOffset` (and the live
 * match screen's equivalent "is the tie level" check) — {0,0} for leg 1
 * or the final, which have no prior leg to account for. Critical: a
 * tie's leg2 going to extra time/penalties depends on the AGGREGATE
 * being level, not leg2 alone — leg1 2-0 then leg2 1-1 is already decided
 * (3-1 on aggregate), it doesn't need extra time just because leg2 itself
 * was drawn.
 */
export function getAggregateOffsetForFixture(playoff: PlayoffState, fixtureId: string): { home: number; away: number } {
  for (const tie of [playoff.semiFinal1, playoff.semiFinal2]) {
    if (tie.leg2.id === fixtureId) {
      if (!tie.leg1.result) throw new Error('getAggregateOffsetForFixture: leg1 not played yet');
      // leg2's home club is the higher seed, who was AWAY in leg1 (and vice versa) — see generatePlayoffSemiFinals.
      return { home: tie.leg1.result.awayGoals, away: tie.leg1.result.homeGoals };
    }
  }
  return { home: 0, away: 0 };
}

function tieWinner(tie: TwoLegTie): string | null {
  if (!tie.leg1.played || !tie.leg2.played) return null;
  const outcome = computeAggregateWinner(tie);
  if ('winnerClubId' in outcome) return outcome.winnerClubId;
  return tie.penaltyShootout ? penaltyShootoutWinner(tie.penaltyShootout, tie.leg2) : null;
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
  const squadOf = (id: string) => allSquads[id];

  // Round 1: leg 1 of both ties, batched together (never goes to extra time — a normal matchday-style simulation).
  const unplayedLeg1s = [playoff.semiFinal1.leg1, playoff.semiFinal2.leg1].filter((f) => !f.played);
  if (unplayedLeg1s.length > 0) {
    const { resultsByFixtureId, deferred, nextSeed } = simulateMatchday({ fixtures: unplayedLeg1s, seed: playoff.nextSeed, clubListingOf, squadOf, aiFormation, managedOverride });
    const applyResult = (f: Fixture) => (resultsByFixtureId.has(f.id) ? { ...f, played: true, result: resultsByFixtureId.get(f.id)! } : f);
    return {
      nextPlayoff: { ...playoff, semiFinal1: { ...playoff.semiFinal1, leg1: applyResult(playoff.semiFinal1.leg1) }, semiFinal2: { ...playoff.semiFinal2, leg1: applyResult(playoff.semiFinal2.leg1) }, nextSeed },
      deferred,
    };
  }

  // Round 2: each tie's leg 2 — decisive, so handled one tie at a time via simulateDecisiveFixture (may need extra time/penalties).
  for (const key of ['semiFinal1', 'semiFinal2'] as const) {
    const tie = playoff[key];
    if (tie.leg2.played) continue;
    const aggregateOffset = { home: tie.leg1.result!.awayGoals, away: tie.leg1.result!.homeGoals };
    const result = simulateDecisiveFixture(tie.leg2, playoff.nextSeed, clubListingOf, squadOf, aiFormation, true, managedOverride, aggregateOffset);
    if (result.deferred) return { nextPlayoff: playoff, deferred: result.deferred };
    return {
      nextPlayoff: { ...playoff, [key]: { ...tie, leg2: result.fixture, wentToExtraTime: result.wentToExtraTime, penaltyShootout: result.penaltyShootout }, nextSeed: result.nextSeed },
      deferred: null,
    };
  }

  // Both ties' leg 2 are played (with ET/penalties already resolved for any AI-decided one) — work out winners.
  if (!playoff.semiFinal1Winner) {
    const winner = tieWinner(playoff.semiFinal1);
    if (winner) return { nextPlayoff: { ...playoff, semiFinal1Winner: winner }, deferred: null };
  }
  if (!playoff.semiFinal2Winner) {
    const winner = tieWinner(playoff.semiFinal2);
    if (winner) return { nextPlayoff: { ...playoff, semiFinal2Winner: winner }, deferred: null };
  }

  if (playoff.semiFinal1Winner && playoff.semiFinal2Winner && !playoff.final) {
    const final = createFinalFixture(playoff.semiFinal1Winner, playoff.semiFinal2Winner, Math.max(playoff.semiFinal1.leg2.matchday, playoff.semiFinal2.leg2.matchday) + 1);
    return { nextPlayoff: { ...playoff, final }, deferred: null };
  }

  if (playoff.final && !playoff.final.played) {
    const result = simulateDecisiveFixture(playoff.final, playoff.nextSeed, clubListingOf, squadOf, aiFormation, false, managedOverride);
    if (result.deferred) return { nextPlayoff: playoff, deferred: result.deferred };
    return { nextPlayoff: { ...playoff, final: result.fixture, finalWentToExtraTime: result.wentToExtraTime, finalPenaltyShootout: result.penaltyShootout, nextSeed: result.nextSeed }, deferred: null };
  }

  if (playoff.final?.played && !playoff.championClubId) {
    const { final } = playoff;
    if (!final.result) throw new Error('advancePlayoff: final marked played with no result');
    if (final.result.homeGoals !== final.result.awayGoals) {
      return { nextPlayoff: { ...playoff, championClubId: final.result.homeGoals > final.result.awayGoals ? final.homeClubId : final.awayClubId }, deferred: null };
    }
    if (playoff.finalPenaltyShootout) {
      return { nextPlayoff: { ...playoff, championClubId: penaltyShootoutWinner(playoff.finalPenaltyShootout, final) }, deferred: null };
    }
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

/** Commits a single leg's or the final's result into playoff state — used when a live-match deferral (the managed club's own fixture) reports back. Resolving a now-complete tie into a winner (and any extra time/penalties) is a separate step, handled by resolveManagedDecisiveFixture below, then the next advancePlayoff call. */
export function applyResultToPlayoffFixture(playoff: PlayoffState, fixtureId: string, result: MatchResult): PlayoffState {
  const withResult = (f: Fixture) => (f.id === fixtureId ? { ...f, played: true, result } : f);
  if (playoff.final && playoff.final.id === fixtureId) return { ...playoff, final: withResult(playoff.final) };
  return {
    ...playoff,
    semiFinal1: { ...playoff.semiFinal1, leg1: withResult(playoff.semiFinal1.leg1), leg2: withResult(playoff.semiFinal1.leg2) },
    semiFinal2: { ...playoff.semiFinal2, leg1: withResult(playoff.semiFinal2.leg1), leg2: withResult(playoff.semiFinal2.leg2) },
  };
}

/**
 * Like applyResultToPlayoffFixture, but for the managed club's own
 * decisive leg 2/final, which may have gone to extra time and/or
 * penalties. The live match screen itself decides whether to play extra
 * time and, if still level, computes the penalty shootout (it has the
 * squads on hand already) — this just commits whatever it reports back
 * into the right slot (a tie's leg2, or the final).
 */
export function resolveManagedDecisiveFixture(
  playoff: PlayoffState,
  fixtureId: string,
  result: MatchResult,
  wentToExtraTime: boolean,
  penaltyShootout: PenaltyShootoutResult | null,
): PlayoffState {
  const withResult = (f: Fixture) => (f.id === fixtureId ? { ...f, played: true, result } : f);
  if (playoff.final && playoff.final.id === fixtureId) {
    return { ...playoff, final: withResult(playoff.final), finalWentToExtraTime: wentToExtraTime, finalPenaltyShootout: penaltyShootout };
  }
  for (const key of ['semiFinal1', 'semiFinal2'] as const) {
    const tie = playoff[key];
    if (tie.leg2.id === fixtureId) {
      return { ...playoff, [key]: { ...tie, leg2: withResult(tie.leg2), wentToExtraTime, penaltyShootout } };
    }
  }
  return playoff;
}
