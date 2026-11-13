import { createRandom } from './rng';
import type { Player } from './types';

const REGULAR_ROUNDS = 5;
const BASE_SUCCESS_RATE = 0.76;

export interface PenaltyKick {
  side: 'home' | 'away';
  round: number; // 1-5 are the regular rounds; 6+ is sudden death, one kick each per round
  playerId: string;
  playerName: string;
  scored: boolean;
}

export interface PenaltyShootoutResult {
  homeScore: number;
  awayScore: number;
  kicks: PenaltyKick[];
  winnerSide: 'home' | 'away';
}

function pickKeeper(xi: Player[]): Player | null {
  return xi.find((p) => p.position === 'GK') ?? null;
}

/** Best shooters first — a reasonable stand-in for how a real manager would actually order a shootout list, not a verified fact about this specific engine's data. Cycles back through the list for sudden death once everyone's taken one. */
function pickTakerOrder(xi: Player[]): Player[] {
  const outfield = xi.filter((p) => p.position !== 'GK');
  return [...outfield].sort((a, b) => b.attributes.shooting - a.attributes.shooting);
}

function successProbability(taker: Player, opposingKeeper: Player | null): number {
  const goalkeeping = opposingKeeper?.attributes.goalkeeping ?? 60;
  const rate = BASE_SUCCESS_RATE + (taker.attributes.shooting - 60) * 0.003 - (goalkeeping - 60) * 0.0025;
  return Math.max(0.45, Math.min(0.93, rate));
}

/**
 * A penalty shootout — the standard stand-in whenever a two-legged tie (or
 * the final) is still level after extra time, same as real football. Each
 * kick's chance of scoring is nudged by the taker's `shooting` attribute
 * and the opposing goalkeeper's `goalkeeping` attribute around a base ~76%
 * success rate — not a verified real-world conversion rate, just a
 * plausible one. All 5 regular rounds are always taken even once the
 * outcome is mathematically settled (real shootouts can stop early) — a
 * deliberate simplification for clearly-correct code over matching that
 * one rule exactly. Sudden death (one kick each per round) continues
 * until someone's ahead.
 */
export function simulatePenaltyShootout(homeXI: Player[], awayXI: Player[], seed: number): PenaltyShootoutResult {
  const random = createRandom(seed);
  const homeKeeper = pickKeeper(homeXI);
  const awayKeeper = pickKeeper(awayXI);
  const homeTakers = pickTakerOrder(homeXI);
  const awayTakers = pickTakerOrder(awayXI);

  const kicks: PenaltyKick[] = [];
  let homeScore = 0;
  let awayScore = 0;

  function takeKick(side: 'home' | 'away', round: number, takenSoFar: number): boolean {
    const takers = side === 'home' ? homeTakers : awayTakers;
    const keeper = side === 'home' ? awayKeeper : homeKeeper;
    if (takers.length === 0) return false; // no eligible outfield taker at all — shouldn't happen with a real squad, but don't crash a shootout over it
    const taker = takers[takenSoFar % takers.length];
    const scored = random() < successProbability(taker, keeper);
    kicks.push({ side, round, playerId: taker.id, playerName: taker.name, scored });
    return scored;
  }

  for (let round = 1; round <= REGULAR_ROUNDS; round++) {
    if (takeKick('home', round, round - 1)) homeScore++;
    if (takeKick('away', round, round - 1)) awayScore++;
  }

  let suddenDeathRound = REGULAR_ROUNDS + 1;
  let homeTaken = REGULAR_ROUNDS;
  let awayTaken = REGULAR_ROUNDS;
  // The guard is just a safety net against a pathological infinite loop (both sides missing or scoring in perfect lockstep forever) — not a realistic outcome given the success-rate range above.
  while (homeScore === awayScore && suddenDeathRound <= REGULAR_ROUNDS + 50) {
    if (takeKick('home', suddenDeathRound, homeTaken)) homeScore++;
    homeTaken++;
    if (takeKick('away', suddenDeathRound, awayTaken)) awayScore++;
    awayTaken++;
    suddenDeathRound++;
  }

  return { homeScore, awayScore, kicks, winnerSide: homeScore >= awayScore ? 'home' : 'away' };
}
