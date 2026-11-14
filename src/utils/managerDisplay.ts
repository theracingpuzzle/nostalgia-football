import { MANAGER_SECURE_THRESHOLD } from '../engine/managers';

/**
 * Shared dot+label visual language for a manager's job security — used
 * both by the header pill (CareerNav) and the "view all managers" screen
 * (ManagersScreen), so "doing well" reads the same everywhere. Bands are
 * set relative to MANAGER_STARTING_CONFIDENCE (55 — see
 * engine/managers.ts), not an absolute midpoint: a brand-new hire should
 * always read as "Secure," not already under pressure on day one.
 */
export function jobSecurityBand(confidence: number): { label: string; dot: string } {
  if (confidence >= MANAGER_SECURE_THRESHOLD) return { label: 'Secure', dot: 'bg-emerald-500' };
  if (confidence >= 20) return { label: 'Under Pressure', dot: 'bg-amber-400' };
  return { label: 'On The Brink', dot: 'bg-red-600' };
}

/** A fourth state for a genuinely vacant club — not folded into the three employed bands above, since there's no manager to have any confidence in. */
export function vacantManagerBand(): { label: string; dot: string } {
  return { label: 'Vacant', dot: 'bg-slate-400' };
}
