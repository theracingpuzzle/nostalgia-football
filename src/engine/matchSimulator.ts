import { createRandom, weightedPick } from './rng';
import { calculateTeamStrength } from './teamStrength';
import type { MatchEvent, MatchResult, Player, Scorer, TeamMatchInput } from './types';

const MINUTES_IN_MATCH = 90;
const BASE_GOAL_RATE_PER_MINUTE = 0.0144; // tuned so two average sides average ~2.6 goals/match
const HOME_ADVANTAGE_MULTIPLIER = 1.15;
const CHANCE_EVENT_RATE_PER_MINUTE = 0.02;
const YELLOW_CARD_RATE_PER_MINUTE = 0.006;

export interface SimulateMatchOptions {
  fixtureId: string;
  home: TeamMatchInput;
  away: TeamMatchInput;
  seed: number;
  applyHomeAdvantage?: boolean;
}

function scorerWeight(player: Player): number {
  const positionBonus = player.position === 'FWD' ? 35 : player.position === 'MID' ? 15 : player.position === 'DEF' ? 3 : 0;
  return player.attributes.shooting + positionBonus + 1;
}

function outfield(players: Player[]): Player[] {
  const nonGoalkeepers = players.filter((player) => player.position !== 'GK');
  return nonGoalkeepers.length > 0 ? nonGoalkeepers : players;
}

export function simulateMatch({ fixtureId, home, away, seed, applyHomeAdvantage = true }: SimulateMatchOptions): MatchResult {
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

  const homeScorerPool = outfield(home.selectedXI);
  const awayScorerPool = outfield(away.selectedXI);

  const events: MatchEvent[] = [];
  const homeGoalMinutes = new Map<string, Scorer>();
  const awayGoalMinutes = new Map<string, Scorer>();

  let homeGoals = 0;
  let awayGoals = 0;

  for (let minute = 1; minute <= MINUTES_IN_MATCH; minute++) {
    if (random() < homeGoalProb) {
      homeGoals++;
      recordGoal(events, homeGoalMinutes, minute, 'home', weightedPick(random, homeScorerPool, scorerWeight), home.club.shortName);
    }
    if (random() < awayGoalProb) {
      awayGoals++;
      recordGoal(events, awayGoalMinutes, minute, 'away', weightedPick(random, awayScorerPool, scorerWeight), away.club.shortName);
    }
    if (random() < CHANCE_EVENT_RATE_PER_MINUTE) {
      const side = random() < 0.5 ? 'home' : 'away';
      const club = side === 'home' ? home.club : away.club;
      events.push({ minute, type: 'chance', side, description: `${club.shortName} go close` });
    }
    if (random() < YELLOW_CARD_RATE_PER_MINUTE) {
      const side = random() < 0.5 ? 'home' : 'away';
      const pool = side === 'home' ? home.selectedXI : away.selectedXI;
      const player = weightedPick(random, pool, (p) => 100 - p.attributes.defending);
      events.push({ minute, type: 'yellow-card', side, playerId: player.id, playerName: player.name, description: `${player.name} is booked` });
    }
  }

  events.sort((a, b) => a.minute - b.minute);

  return {
    fixtureId,
    homeGoals,
    awayGoals,
    events,
    homeScorers: [...homeGoalMinutes.values()],
    awayScorers: [...awayGoalMinutes.values()],
    seed,
  };
}

function recordGoal(
  events: MatchEvent[],
  scorers: Map<string, Scorer>,
  minute: number,
  side: 'home' | 'away',
  scorer: Player,
  clubShortName: string,
): void {
  events.push({
    minute,
    type: 'goal',
    side,
    playerId: scorer.id,
    playerName: scorer.name,
    description: `GOAL! ${scorer.name} (${clubShortName})`,
  });

  const existing = scorers.get(scorer.id);
  if (existing) {
    existing.minutes.push(minute);
  } else {
    scorers.set(scorer.id, { playerId: scorer.id, playerName: scorer.name, minutes: [minute] });
  }
}
