import type { CareerScreenId } from '../components/layout/CareerNav';
import type { ClubManagerState, ManagerNewsEvent } from '../engine/managers';
import type { PlayoffState } from '../engine/playoffs';
import type { Fixture, Player } from '../engine/types';
import type { TransferOffer, TransferTimelineEntry } from '../screens/TransferWindowScreen';
import type { BackgroundLeagueState } from './backgroundLeague';

const STORAGE_KEY = 'fsm-career-v1';

/**
 * Everything needed to resume a career exactly where it was left — one
 * save slot for the one career in progress, not per-club multi-save
 * (matches the app's single-playthrough flow: picking a different club
 * starts a new career, it doesn't stack alongside the old one). A
 * sacking no longer forces an immediate new job — the player goes
 * properly unemployed instead (see utils/careerTransition.ts), which
 * has no managed club at all, hence the union: `status` discriminates
 * between the two. Most code only ever needs `EmployedSaveData`
 * directly (CareerScreen's own `initialSave`/`onTakeNewJob` are typed
 * to it specifically); the union exists for the one shared save slot
 * in localStorage and App.tsx's top-level routing.
 */
export type CareerSaveData = EmployedSaveData | UnemployedSaveData;

/**
 * One completed (or ended-early) managerial stint, for the Career
 * Overview screen. `champion`/`stayed` only ever apply where there's
 * no real promotion/relegation at all (a top-tier league, or any
 * league not linked into utils/pyramid.ts's ENGLISH_PYRAMID) — see
 * utils/careerTransition.ts's `outcomeForCompletedSeason`. `sacked`
 * and `left` cover a stint that ended mid-season rather than running
 * its full course.
 */
export type CareerHistoryOutcome =
  | 'champion'
  | 'promoted-automatic'
  | 'promoted-playoff'
  | 'lost-playoff-semifinal'
  | 'lost-playoff-final'
  | 'relegated-real'
  | 'stayed'
  | 'sacked'
  | 'left';

export interface CareerHistoryEntry {
  clubId: string;
  leagueId: string;
  seasonNumber: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  /** Table position at the moment this stint ended (1-indexed). */
  position: number;
  totalClubs: number;
  outcome: CareerHistoryOutcome;
}

export interface EmployedSaveData {
  /** Absent on every save from before unemployment existed — treated as 'employed' (the only thing a save could be back then). */
  status?: 'employed';
  clubId: string;
  leagueId: string;
  managerName: string;
  /** Which season of the career this is — 1 for a brand new career, incremented every startNewSeason(). Absent on an old save, treated as 1 (no way to know how many seasons it's already been through). */
  seasonNumber?: number;
  /** Every completed-or-ended-early stint so far, oldest first — absent on an old save, treated as []. See screens/CareerOverviewScreen.tsx. */
  careerHistory?: CareerHistoryEntry[];
  /**
   * Which clubs currently make up each league (keyed by league id) —
   * absent on an old save, which just means "no promotion/relegation has
   * happened yet, use the static src/data/leagues.ts rosters." See
   * utils/pyramid.ts for how this changes between seasons.
   */
  leagueClubIds?: Record<string, string[]>;
  /** Every other league's own simulated progress — absent on an old save, which just means "not caught up yet," resolved fresh next time CareerScreen mounts. See utils/backgroundLeague.ts. */
  backgroundLeagues?: BackgroundLeagueState[];
  /** The Championship promotion playoff, once the managed club's regular season ends — only ever set for a tier:'second' career. See engine/playoffs.ts. */
  managedPlayoff?: PlayoffState | null;
  /** Every OTHER club in the managed league's manager and how much trouble they're in — never an entry for `clubId` itself. Absent on an old save, which just means "not seeded yet," rebuilt fresh next time CareerScreen mounts. See engine/managers.ts. */
  leagueManagers?: Record<string, ClubManagerState>;
  /** The player's own job security, 0-100 — absent on an old save, treated as a fresh hire (MANAGER_STARTING_CONFIDENCE). */
  managerJobSecurity?: number;
  /** The matchday the player's CURRENT job began — absent on an old save, treated as matchday 1 (so an old save's manager gets a fresh grace period rather than being instantly sackable). */
  managerTenureStartMatchday?: number;
  /** The managed league's own managerial news feed, newest first. */
  managerNews?: ManagerNewsEvent[];
  /** Set only while an unsolicited approach from another club is awaiting the player's Accept/Decline — resumable (reloading mid-decision shows the same approach, not a reroll). */
  managerApproachState?: { clubId: string } | null;
  /** The matchday of the player's most recent approach (accepted, declined, or otherwise resolved) — drives MANAGER_APPROACH_COOLDOWN_MATCHDAYS. null/absent means "never approached yet." */
  managerLastApproachMatchday?: number | null;
  screen: CareerScreenId;
  formationId: string;
  selectedXI: string[];
  fixtures: Fixture[];
  nextSeed: number;
  lastPlayedFixtureId: string | null;
  allSquads: Record<string, Player[]>;
  transferWindow: 'preseason' | 'january' | null;
  januaryWindowShown: boolean;
  transferOffers: TransferOffer[];
  transferTimeline: TransferTimelineEntry[];
  seasonSummaryDismissed: boolean;
}

/**
 * The save shape for a genuinely unemployed spell — no managed club at
 * all, just every league ticking along as its own BackgroundLeagueState
 * (see utils/careerTransition.ts). `leagueClubIds` isn't stored
 * separately since it's always just derivable from `leagues[].clubIds`.
 */
export interface UnemployedSaveData {
  status: 'unemployed';
  managerName: string;
  seasonNumber: number;
  leagues: BackgroundLeagueState[];
  allSquads: Record<string, Player[]>;
  /** Carried through unchanged while unemployed — no stint is in progress to add to it. See EmployedSaveData.careerHistory. */
  careerHistory?: CareerHistoryEntry[];
}

/** Minimal shape check — enough to reject corrupted/foreign JSON without trusting it blindly. */
function isCareerSaveData(value: unknown): value is CareerSaveData {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (v.status === 'unemployed') {
    return typeof v.managerName === 'string' && Array.isArray(v.leagues) && typeof v.allSquads === 'object';
  }
  return (
    typeof v.clubId === 'string' &&
    typeof v.leagueId === 'string' &&
    typeof v.managerName === 'string' &&
    Array.isArray(v.fixtures) &&
    typeof v.allSquads === 'object'
  );
}

/** localStorage can throw (private browsing, quota exceeded, disabled storage) — losing the autosave isn't worth crashing the app over. */
export function saveCareer(data: CareerSaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore — best-effort autosave
  }
}

export function loadCareer(): CareerSaveData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isCareerSaveData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearCareer(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
