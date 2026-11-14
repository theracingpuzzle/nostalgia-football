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
  /** null = the job is genuinely vacant right now. */
  name: string | null;
  /** Frozen (not decayed) while vacant — there's no manager to have confidence in. */
  confidence: number;
  /**
   * While employed: the matchday this tenure began — a sacking can never
   * fire before tenureStartMatchday + MANAGER_SACK_GRACE_MATCHDAYS, so a
   * newly hired manager (AI or player) always gets a fair run first.
   * While vacant: the matchday the club BECAME vacant — drives
   * MANAGER_VACANCY_FILL_MATCHDAYS instead. Same field, same "how long
   * has the current state lasted" meaning either way.
   */
  tenureStartMatchday: number;
}

/**
 * One manager-related event, for display in a "Managerial News" feed.
 * Covers both directions — a sacking (incomingName null, the job's now
 * vacant) and an appointment to a standing vacancy (outgoingName null,
 * nobody was fired this time) — exactly one of the two is ever null,
 * never both and never neither.
 */
export interface ManagerNewsEvent {
  clubId: string;
  outgoingName: string | null;
  incomingName: string | null;
  matchday: number;
}

export const MANAGER_STARTING_CONFIDENCE = 55;
export const MANAGER_SACK_THRESHOLD = 15;
export const MANAGER_SACK_GRACE_MATCHDAYS = 6;
/** Shorter than the sack grace period (a filled vacancy's own grace period shouldn't overlap a long sit-vacant stretch), longer than 1 (so there's an actual window for the vacancy to be seen/applied to). */
export const MANAGER_VACANCY_FILL_MATCHDAYS = 3;
/** Same cutoff the job-security "Secure" display band uses (see utils/managerDisplay.ts) — "doing well enough to be approached" means the same thing everywhere. */
export const MANAGER_SECURE_THRESHOLD = 45;
/** Per eligible matchday — rare enough that an approach feels like an event, not a weekly nag. */
export const MANAGER_APPROACH_CHANCE = 0.12;
/** After declining an approach, how long before the player can be approached again. */
export const MANAGER_APPROACH_COOLDOWN_MATCHDAYS = 4;

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
 * fillStaleVacancies).
 */
export function computeNextConfidence(confidence: number, position: number, totalClubs: number, formScore: number): number {
  const regressed = confidence + (MANAGER_STARTING_CONFIDENCE - confidence) * 0.08;
  const next = regressed + positionPressure(position, totalClubs) + formScore * 1.6;
  return Math.max(0, Math.min(100, next));
}

export function isSackWorthy(confidence: number, matchday: number, tenureStartMatchday: number): boolean {
  return matchday - tenureStartMatchday >= MANAGER_SACK_GRACE_MATCHDAYS && confidence <= MANAGER_SACK_THRESHOLD;
}

/** A single fresh replacement name, excluding anyone currently employed. */
export function pickReplacementManagerName(excludeNames: Iterable<string>, random: RandomFn): string {
  const exclude = new Set(excludeNames);
  const candidates = PLACEHOLDER_MANAGER_POOL.filter((n) => !exclude.has(n));
  const pool = candidates.length > 0 ? candidates : PLACEHOLDER_MANAGER_POOL;
  return pool[Math.floor(random() * pool.length)];
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
 * CareerScreen/engine/managers.ts callers). Decays everyone's EMPLOYED
 * confidence (a currently-vacant club is frozen, not touched — there's
 * no manager to gain or lose confidence); anyone crossing the sacking
 * threshold becomes vacant — no instant replacement anymore, see
 * fillStaleVacancies for how a standing vacancy eventually gets filled.
 */
export function updateLeagueManagers(
  managers: Record<string, ClubManagerState>,
  clubIds: string[],
  table: LeagueTableRow[],
  fixtures: Fixture[],
  matchday: number,
): { nextManagers: Record<string, ClubManagerState>; sackings: ManagerNewsEvent[] } {
  const positionByClub = new Map(table.map((row, i) => [row.clubId, i + 1]));
  const totalClubs = table.length;

  const nextManagers: Record<string, ClubManagerState> = {};
  const sackings: ManagerNewsEvent[] = [];
  for (const clubId of clubIds) {
    const state = managers[clubId];
    if (!state) continue;
    if (state.name === null) {
      nextManagers[clubId] = state; // vacant — frozen, nothing to decay
      continue;
    }
    const position = positionByClub.get(clubId) ?? Math.ceil(totalClubs / 2);
    const form = recentFormScore(clubId, fixtures);
    const nextConfidence = computeNextConfidence(state.confidence, position, totalClubs, form);
    if (isSackWorthy(nextConfidence, matchday, state.tenureStartMatchday)) {
      nextManagers[clubId] = { name: null, confidence: nextConfidence, tenureStartMatchday: matchday };
      sackings.push({ clubId, outgoingName: state.name, incomingName: null, matchday });
    } else {
      nextManagers[clubId] = { ...state, confidence: nextConfidence };
    }
  }

  return { nextManagers, sackings };
}

/**
 * For every vacant club that's been open MANAGER_VACANCY_FILL_MATCHDAYS
 * or more, draws a fresh placeholder name and resets it to a normal
 * fresh hire — otherwise the league would eventually accumulate
 * permanently-vacant clubs. Never assigns a name already employed
 * elsewhere in `clubIds`, or already claimed by another vacancy filled
 * in this SAME call (two vacancies can cross the threshold on the same
 * matchday).
 */
export function fillStaleVacancies(
  managers: Record<string, ClubManagerState>,
  clubIds: string[],
  matchday: number,
  random: RandomFn,
): { nextManagers: Record<string, ClubManagerState>; appointments: ManagerNewsEvent[] } {
  const staleClubIds = clubIds.filter((id) => {
    const state = managers[id];
    return state && state.name === null && matchday - state.tenureStartMatchday >= MANAGER_VACANCY_FILL_MATCHDAYS;
  });
  if (staleClubIds.length === 0) return { nextManagers: managers, appointments: [] };

  const employedElsewhere = new Set(
    clubIds.filter((id) => !staleClubIds.includes(id)).map((id) => managers[id]?.name).filter((n): n is string => n !== null && n !== undefined),
  );
  const nextManagers = { ...managers };
  const appointments: ManagerNewsEvent[] = [];
  for (const clubId of staleClubIds) {
    const incomingName = pickReplacementManagerName(employedElsewhere, random);
    employedElsewhere.add(incomingName);
    nextManagers[clubId] = { name: incomingName, confidence: MANAGER_STARTING_CONFIDENCE, tenureStartMatchday: matchday };
    appointments.push({ clubId, outgoingName: null, incomingName, matchday });
  }
  return { nextManagers, appointments };
}

/** Which of clubIds are genuinely vacant right now. */
export function vacantClubIds(managers: Record<string, ClubManagerState>, clubIds: string[]): string[] {
  return clubIds.filter((id) => managers[id]?.name === null);
}

/**
 * The offer list for a just-sacked player — up to `count` genuinely
 * vacant clubs in the same league (see PLAN.md — cross-league sacking is
 * out of scope), shuffled, excluding the club that just sacked them. If
 * NONE are vacant (the one edge case this game can't leave as a dead
 * end — see PLAN.md), falls back to exactly one random other employed
 * club, flagged isExploratory so the UI can say so rather than implying
 * a real vacancy. Always returns at least one offer.
 */
export function pickSackedJobOffers(
  managers: Record<string, ClubManagerState>,
  clubIds: string[],
  excludeClubId: string,
  random: RandomFn,
  count = 3,
): { offeredClubIds: string[]; isExploratory: boolean } {
  const candidates = vacantClubIds(managers, clubIds).filter((id) => id !== excludeClubId);
  const pool = candidates.length > 0 ? candidates : clubIds.filter((id) => id !== excludeClubId);
  const isExploratory = candidates.length === 0;

  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return { offeredClubIds: shuffled.slice(0, isExploratory ? 1 : count), isExploratory };
}

/**
 * Checks whether some other club in the same league makes an unsolicited
 * approach to the player this matchday — the one voluntary way to leave
 * a job without being sacked. Gated, in order, on: confidence healthy
 * enough to be "doing well" (MANAGER_SECURE_THRESHOLD); the player's own
 * tenure past its grace period (even a high-confidence mid-season hire
 * shouldn't be poachable before settling in — same reasoning as the sack
 * grace period); outside the post-decline cooldown; at least one
 * genuinely vacant candidate club; then one MANAGER_APPROACH_CHANCE
 * roll. No RNG is spent unless every other gate already passes, so a
 * given seed always consumes the same number of random() calls
 * regardless of which gate (if any) stopped it.
 */
export function checkForJobApproach(
  jobSecurity: number,
  matchday: number,
  tenureStartMatchday: number,
  lastApproachMatchday: number | null,
  vacantCandidateClubIds: string[],
  random: RandomFn,
): string | null {
  if (jobSecurity < MANAGER_SECURE_THRESHOLD) return null;
  if (matchday - tenureStartMatchday < MANAGER_SACK_GRACE_MATCHDAYS) return null;
  if (lastApproachMatchday !== null && matchday - lastApproachMatchday < MANAGER_APPROACH_COOLDOWN_MATCHDAYS) return null;
  if (vacantCandidateClubIds.length === 0) return null;
  if (random() >= MANAGER_APPROACH_CHANCE) return null;
  return vacantCandidateClubIds[Math.floor(random() * vacantCandidateClubIds.length)];
}
