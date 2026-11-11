import { createRandom, weightedPick } from './rng';
import { calculateTeamStrength } from './teamStrength';
import type { MatchEvent, MatchResult, Player, Scorer, TeamMatchInput } from './types';

const MINUTES_IN_MATCH = 90;
const BASE_GOAL_RATE_PER_MINUTE = 0.0144; // tuned so two average sides average ~2.6 goals/match
const HOME_ADVANTAGE_MULTIPLIER = 1.15;
const CHANCE_EVENT_RATE_PER_MINUTE = 0.02;
const YELLOW_CARD_RATE_PER_MINUTE = 0.006;
const RED_CARD_RATE_PER_MINUTE = 0.0007; // tuned so a red card is a rare, notable event (roughly 1 every 15-ish matches)
const ASSIST_CHANCE = 0.82; // most goals have one; some are solo efforts/unassisted

export interface SimulateMatchOptions {
  fixtureId: string;
  home: TeamMatchInput;
  away: TeamMatchInput;
  seed: number;
  applyHomeAdvantage?: boolean;
}

/**
 * A match simulation that can be paused and resumed minute-by-minute —
 * used for the live match screen's half-time substitution break. Attack/
 * defense ratings (and therefore each side's goal probability) are fixed
 * at kickoff from the starting XI, same as before; a substitution changes
 * who's eligible to score/assist/get booked in minutes simulated from that
 * point on, not the team's overall rating for the match (recomputing
 * strength mid-match would need to weight it by minutes played, which
 * isn't worth the complexity for what's still a placeholder stats engine).
 */
export interface MatchSimulationHandle {
  /** Runs the simulation forward from its current minute up to (and including) this one. No-op if already there or past it. */
  advanceTo(minute: number): void;
  /** Swaps a player out of the live XI for a substitute, effective only for minutes simulated after this call — past events for the outgoing player stand. */
  substitute(side: 'home' | 'away', outPlayerId: string, inPlayer: Player): void;
  /** A snapshot of the result so far (or the final result, once advanceTo(90) has run). */
  getResult(): MatchResult;
  getCurrentMinute(): number;
}

function scorerWeight(player: Player): number {
  const positionBonus = player.position === 'FWD' ? 35 : player.position === 'MID' ? 15 : player.position === 'DEF' ? 3 : 0;
  return player.attributes.shooting + positionBonus + 1;
}

function assistWeight(player: Player): number {
  const positionBonus = player.position === 'MID' ? 25 : player.position === 'FWD' ? 10 : player.position === 'DEF' ? 5 : 0;
  return player.attributes.passing + positionBonus + 1;
}

function outfield(players: Player[]): Player[] {
  const nonGoalkeepers = players.filter((player) => player.position !== 'GK');
  return nonGoalkeepers.length > 0 ? nonGoalkeepers : players;
}

function addTally(tallies: Map<string, Scorer>, playerId: string, playerName: string, minute: number): void {
  const existing = tallies.get(playerId);
  if (existing) existing.minutes.push(minute);
  else tallies.set(playerId, { playerId, playerName, minutes: [minute] });
}

export function createMatchSimulation({ fixtureId, home, away, seed, applyHomeAdvantage = true }: SimulateMatchOptions): MatchSimulationHandle {
  const random = createRandom(seed);

  const homeStrength = calculateTeamStrength(home);
  const awayStrength = calculateTeamStrength(away);

  const homeAdvantage = applyHomeAdvantage ? HOME_ADVANTAGE_MULTIPLIER : 1;
  const homeAttack = homeStrength.attack * homeAdvantage;
  const homeDefense = homeStrength.defense * homeAdvantage;
  const awayAttack = awayStrength.attack;
  const awayDefense = awayStrength.defense;

  const homeGoalProb = Math.min(BASE_GOAL_RATE_PER_MINUTE * (homeAttack / awayDefense), 0.12);
  const awayGoalProb = Math.min(BASE_GOAL_RATE_PER_MINUTE * (awayAttack / homeDefense), 0.12);

  // Mutable contents (not reassigned) — a substitution replaces an element
  // in place, so every pool derived from these (scorer/assist/card
  // eligibility) picks it up for whatever minutes are simulated next,
  // without touching past events.
  const homeXI = [...home.selectedXI];
  const awayXI = [...away.selectedXI];
  const homeEverPlayed = new Set(homeXI.map((p) => p.id));
  const awayEverPlayed = new Set(awayXI.map((p) => p.id));

  const events: MatchEvent[] = [];
  const homeGoalMinutes = new Map<string, Scorer>();
  const awayGoalMinutes = new Map<string, Scorer>();
  const homeAssistMinutes = new Map<string, Scorer>();
  const awayAssistMinutes = new Map<string, Scorer>();
  const homeBookingMinutes = new Map<string, Scorer>();
  const awayBookingMinutes = new Map<string, Scorer>();
  const homeRedCardMinutes = new Map<string, Scorer>();
  const awayRedCardMinutes = new Map<string, Scorer>();

  let homeGoals = 0;
  let awayGoals = 0;
  let currentMinute = 0;

  function recordGoal(minute: number, side: 'home' | 'away', pool: Player[], clubShortName: string): void {
    const scorer = weightedPick(random, pool, scorerWeight);
    let assister: Player | null = null;
    if (random() < ASSIST_CHANCE) {
      const assistCandidates = pool.filter((p) => p.id !== scorer.id);
      if (assistCandidates.length > 0) assister = weightedPick(random, assistCandidates, assistWeight);
    }

    events.push({
      minute,
      type: 'goal',
      side,
      playerId: scorer.id,
      playerName: scorer.name,
      assistPlayerId: assister?.id,
      assistPlayerName: assister?.name,
      // Deliberately just the goal itself — the assist (when there is one)
      // is a separate field so the UI can lay it out on its own line rather
      // than cramming "assisted by X" onto the end of one long line.
      description: `GOAL! ${scorer.name} (${clubShortName})`,
    });

    const goalTallies = side === 'home' ? homeGoalMinutes : awayGoalMinutes;
    addTally(goalTallies, scorer.id, scorer.name, minute);
    if (assister) {
      const assistTallies = side === 'home' ? homeAssistMinutes : awayAssistMinutes;
      addTally(assistTallies, assister.id, assister.name, minute);
    }
  }

  function advanceTo(targetMinute: number): void {
    const clamped = Math.min(MINUTES_IN_MATCH, targetMinute);
    for (let minute = currentMinute + 1; minute <= clamped; minute++) {
      const homeScorerPool = outfield(homeXI);
      const awayScorerPool = outfield(awayXI);

      if (random() < homeGoalProb) {
        homeGoals++;
        recordGoal(minute, 'home', homeScorerPool, home.club.shortName);
      }
      if (random() < awayGoalProb) {
        awayGoals++;
        recordGoal(minute, 'away', awayScorerPool, away.club.shortName);
      }
      if (random() < CHANCE_EVENT_RATE_PER_MINUTE) {
        const side = random() < 0.5 ? 'home' : 'away';
        const club = side === 'home' ? home.club : away.club;
        events.push({ minute, type: 'chance', side, description: `${club.shortName} go close` });
      }
      if (random() < YELLOW_CARD_RATE_PER_MINUTE) {
        const side = random() < 0.5 ? 'home' : 'away';
        const pool = side === 'home' ? homeXI : awayXI;
        const player = weightedPick(random, pool, (p) => 100 - p.attributes.defending);
        events.push({ minute, type: 'yellow-card', side, playerId: player.id, playerName: player.name, description: `${player.name} is booked` });
        addTally(side === 'home' ? homeBookingMinutes : awayBookingMinutes, player.id, player.name, minute);
      }
      if (random() < RED_CARD_RATE_PER_MINUTE) {
        const side = random() < 0.5 ? 'home' : 'away';
        const pool = side === 'home' ? homeXI : awayXI;
        const player = weightedPick(random, pool, (p) => 100 - p.attributes.defending);
        events.push({ minute, type: 'red-card', side, playerId: player.id, playerName: player.name, description: `${player.name} is sent off!` });
        addTally(side === 'home' ? homeRedCardMinutes : awayRedCardMinutes, player.id, player.name, minute);
      }
    }
    currentMinute = clamped;
  }

  function substitute(side: 'home' | 'away', outPlayerId: string, inPlayer: Player): void {
    const xi = side === 'home' ? homeXI : awayXI;
    const index = xi.findIndex((p) => p.id === outPlayerId);
    if (index === -1) return;
    xi[index] = inPlayer;
    (side === 'home' ? homeEverPlayed : awayEverPlayed).add(inPlayer.id);
  }

  function getResult(): MatchResult {
    return {
      fixtureId,
      homeGoals,
      awayGoals,
      events: [...events].sort((a, b) => a.minute - b.minute),
      homeScorers: [...homeGoalMinutes.values()],
      awayScorers: [...awayGoalMinutes.values()],
      homeAssists: [...homeAssistMinutes.values()],
      awayAssists: [...awayAssistMinutes.values()],
      homeBookings: [...homeBookingMinutes.values()],
      awayBookings: [...awayBookingMinutes.values()],
      homeRedCards: [...homeRedCardMinutes.values()],
      awayRedCards: [...awayRedCardMinutes.values()],
      homeXI: [...homeEverPlayed],
      awayXI: [...awayEverPlayed],
      seed,
    };
  }

  return { advanceTo, substitute, getResult, getCurrentMinute: () => currentMinute };
}

/** Runs a full, non-interactive 90 minutes in one go — the common case (every fixture except the one you're actively watching live). */
export function simulateMatch(options: SimulateMatchOptions): MatchResult {
  const simulation = createMatchSimulation(options);
  simulation.advanceTo(MINUTES_IN_MATCH);
  return simulation.getResult();
}
