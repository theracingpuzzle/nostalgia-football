import type { CareerScreenId } from '../components/layout/CareerNav';
import type { Fixture, Player } from '../engine/types';
import type { TransferOffer, TransferTimelineEntry } from '../screens/TransferWindowScreen';

const STORAGE_KEY = 'fsm-career-v1';

/**
 * Everything needed to resume a career exactly where it was left — one
 * save slot for the one career in progress, not per-club multi-save
 * (matches the app's single-playthrough flow: picking a different club
 * starts a new career, it doesn't stack alongside the old one).
 */
export interface CareerSaveData {
  clubId: string;
  leagueId: string;
  managerName: string;
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

/** Minimal shape check — enough to reject corrupted/foreign JSON without trusting it blindly. */
function isCareerSaveData(value: unknown): value is CareerSaveData {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
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
