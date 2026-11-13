import { getInitialManagerName, PLACEHOLDER_MANAGER_POOL } from '../data/managers0809';
import type { RandomFn } from './rng';
import type { Fixture, LeagueTableRow } from './types';

/**
 * A club's current manager and how much trouble they're in. Lives inside
 * BackgroundLeagueState for AI clubs, and (for the managed league's OTHER
 * clubs — never the managed club itself) inside CareerScreen's own state.
 * The player has a parallel, simpler version of the same idea
 * (managerJobSecurity/managerTenureStartMatchday in CareerSaveData) rather
 * than one of these, since the player isn't drawn from a name pool.
 */
export interface ClubManagerState {
  name: string;
  confidence: number;
  /** The matchday this manager's tenure began — a sacking can never fire before tenureStartMatchday + MANAGER_SACK_GRACE_MATCHDAYS, so a newly hired manager (AI or player) always gets a fair run first. */
  tenureStartMatchday: number;
}

/** One manager actually leaving a job, for display in a "Managerial News" feed. */
export interface ManagerSackingEvent {
  clubId: string;
  outgoingName: string;
  incomingName: string;
  matchday: number;
}

export const MANAGER_STARTING_CONFIDENCE = 55;
export const MANAGER_SACK_THRESHOLD = 15;
export const MANAGER_SACK_GRACE_MATCHDAYS = 6;

/** ~+3 for 1st place, ~-3 for last — deliberately simple, no club "stature/expectation" data exists to lean on (see PLAN.md). */
function positionPressure(position: number, totalClubs: number): number {
  return ((totalClubs + 1 - 2 * position) / totalClubs) * 3;
}

/** Sum of +1 win / 0 draw / -1 loss over the club's last `lookback` PLAYED fixtures (whichever matchdays those actually fall on — fixtures aren't assumed pre-sorted). */
export function recentFormScore(clubId: string, fixtures: Fixture[], lookback = 5): number {
  const recent = fixtures
    .filter((f) => f.played && f.result && (f.homeClubId === clubId || f.awayClubId === clubId))
    .sort((a, b) => b.matchday - a.matchday)
    .slice(0, lookback);

  let score = 0;
  for (const f of recent) {
    const isHome = f.homeClubId === clubId;
    const goalsFor = isHome ? f.result!.homeGoals : f.result!.awayGoals;
    const goalsAgainst = isHome ? f.result!.awayGoals : f.result!.homeGoals;
    if (goalsFor > goalsAgainst) score += 1;
    else if (goalsFor < goalsAgainst) score -= 1;
  }
  return score;
}

/**
 * One matchday's confidence update. Slowly regresses toward the starting
 * value (so a purple patch or a bad run doesn't compound forever), then
 * applies position pressure and recent form — same deliberately simple,
 * fully-explainable shape as the injury system (engine/injuries.ts), and
 * no RNG here: the SACKING decision is 100% deterministic given
 * position/form, only the replacement NAME involves randomness (see
 * updateLeagueManagers).
 */
export function computeNextConfidence(confidence: number, position: number, totalClubs: number, formScore: number): number {
  const regressed = confidence + (MANAGER_STARTING_CONFIDENCE - confidence) * 0.08;
  const next = regressed + positionPressure(position, totalClubs) + formScore * 1.6;
  return Math.max(0, Math.min(100, next));
}

export function isSackWorthy(confidence: number, matchday: number, tenureStartMatchday: number): boolean {
  return matchday - tenureStartMatchday >= MANAGER_SACK_GRACE_MATCHDAYS && confidence <= MANAGER_SACK_THRESHOLD;
}

/** A single fresh replacement name, excluding anyone currently employed — used when the PLAYER's own club needs a new (AI) manager right after a sacking, since the player isn't drawn from the real-manager data the way a club's very first hire is. */
export function pickReplacementManagerName(excludeNames: Iterable<string>, random: RandomFn): string {
  const exclude = new Set(excludeNames);
  const candidates = PLACEHOLDER_MANAGER_POOL.filter((n) => !exclude.has(n));
  const pool = candidates.length > 0 ? candidates : PLACEHOLDER_MANAGER_POOL;
  return pool[Math.floor(random() * pool.length)];
}

/**
 * A short list of job offers for a just-sacked player, all from the SAME
 * league (see PLAN.md — cross-league sacking is out of scope). Prefers
 * clubs that appear in the most recent managerNews (an AI club that just
 * had a vacancy — nicely coherent with what's visible on the Table tab),
 * falling back to other same-league clubs if there aren't enough.
 */
export function pickJobOffers(clubIds: string[], excludeClubId: string, managerNews: ManagerSackingEvent[], random: RandomFn, count = 3): string[] {
  const recentlyVacant = [...new Set(managerNews.slice(0, 6).map((e) => e.clubId))].filter((id) => id !== excludeClubId && clubIds.includes(id));
  const rest = clubIds.filter((id) => id !== excludeClubId && !recentlyVacant.includes(id));
  const shuffledRest = [...rest];
  for (let i = shuffledRest.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffledRest[i], shuffledRest[j]] = [shuffledRest[j], shuffledRest[i]];
  }
  return [...recentlyVacant, ...shuffledRest].slice(0, count);
}

export function createClubManagers(clubIds: string[]): Record<string, ClubManagerState> {
  const managers: Record<string, ClubManagerState> = {};
  for (const clubId of clubIds) {
    managers[clubId] = { name: getInitialManagerName(clubId), confidence: MANAGER_STARTING_CONFIDENCE, tenureStartMatchday: 1 };
  }
  return managers;
}

/**
 * One matchday's update for every club in `clubIds` (for the managed
 * league, this is called with every club EXCEPT the managed one — the
 * player has their own parallel confidence tracking, see
 * CareerScreen/engine/managers.ts callers). Decays everyone's confidence,
 * then for whoever crosses the sacking threshold, picks a replacement
 * name — ~50/50 between recycling another name sacked this same round
 * (nicely coherent: two clubs' managers effectively swap places the same
 * week, a real phenomenon) or drawing a fresh one from
 * PLACEHOLDER_MANAGER_POOL — excluding anyone currently employed
 * elsewhere in this league or already claimed by another sacking this
 * same round.
 */
export function updateLeagueManagers(
  managers: Record<string, ClubManagerState>,
  clubIds: string[],
  table: LeagueTableRow[],
  fixtures: Fixture[],
  matchday: number,
  random: RandomFn,
): { nextManagers: Record<string, ClubManagerState>; sackings: ManagerSackingEvent[] } {
  const positionByClub = new Map(table.map((row, i) => [row.clubId, i + 1]));
  const totalClubs = table.length;

  const decayed: Record<string, ClubManagerState> = {};
  const sackedClubIds: string[] = [];
  for (const clubId of clubIds) {
    const state = managers[clubId];
    if (!state) continue;
    const position = positionByClub.get(clubId) ?? Math.ceil(totalClubs / 2);
    const form = recentFormScore(clubId, fixtures);
    const nextConfidence = computeNextConfidence(state.confidence, position, totalClubs, form);
    decayed[clubId] = { ...state, confidence: nextConfidence };
    if (isSackWorthy(nextConfidence, matchday, state.tenureStartMatchday)) sackedClubIds.push(clubId);
  }

  if (sackedClubIds.length === 0) return { nextManagers: decayed, sackings: [] };

  const outgoingNames = sackedClubIds.map((id) => decayed[id].name);
  const employedElsewhere = new Set(clubIds.filter((id) => !sackedClubIds.includes(id)).map((id) => decayed[id].name));
  const usedThisRound = new Set<string>();
  const nextManagers = { ...decayed };
  const sackings: ManagerSackingEvent[] = [];

  for (const clubId of sackedClubIds) {
    const outgoingName = decayed[clubId].name;
    const recycleCandidates = outgoingNames.filter((n) => n !== outgoingName && !employedElsewhere.has(n) && !usedThisRound.has(n));
    const poolCandidates = PLACEHOLDER_MANAGER_POOL.filter((n) => !employedElsewhere.has(n) && !usedThisRound.has(n) && n !== outgoingName);

    let incomingName: string;
    if (recycleCandidates.length > 0 && random() < 0.5) {
      incomingName = recycleCandidates[Math.floor(random() * recycleCandidates.length)];
    } else if (poolCandidates.length > 0) {
      incomingName = poolCandidates[Math.floor(random() * poolCandidates.length)];
    } else {
      incomingName = recycleCandidates[0] ?? PLACEHOLDER_MANAGER_POOL[Math.floor(random() * PLACEHOLDER_MANAGER_POOL.length)];
    }

    usedThisRound.add(incomingName);
    nextManagers[clubId] = { name: incomingName, confidence: MANAGER_STARTING_CONFIDENCE, tenureStartMatchday: matchday };
    sackings.push({ clubId, outgoingName, incomingName, matchday });
  }

  return { nextManagers, sackings };
}
