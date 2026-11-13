import type { LeagueDefinition } from '../data/leagues';

/**
 * End-of-season table zones. A top-flight division (Premier League, La
 * Liga) sends its top finishers into Europe and relegates its bottom 3 —
 * standard, not a guess. A second-tier division (the Championship) and a
 * third-tier one (League One) instead promote their top 2 automatically
 * and send 3rd-6th into the promotion playoffs — same shape for both,
 * except League One relegates 4 clubs, not 3 (it feeds League Two, which
 * has one more relegation slot of its own below it). A fourth-tier
 * division (League Two) promotes its top 3 automatically, sends 4th-7th
 * into the playoffs (not 3rd-6th, since the top 3 already go up), and
 * relegates 2 — all standard English football league structure, not a
 * guess. Which scheme applies is driven by `LeagueDefinition.tier` (see
 * leagues.ts).
 */
export type LeagueZone = 'champions' | 'europa' | 'promotion' | 'playoff' | 'relegation' | null;

export function getLeagueZone(position: number, totalClubs = 20, tier: LeagueDefinition['tier'] = 'top'): LeagueZone {
  if (tier === 'second' || tier === 'third') {
    if (position <= 2) return 'promotion';
    if (position <= 6) return 'playoff';
    if (position > totalClubs - (tier === 'third' ? 4 : 3)) return 'relegation';
    return null;
  }
  if (tier === 'fourth') {
    if (position <= 3) return 'promotion';
    if (position <= 7) return 'playoff';
    if (position > totalClubs - 2) return 'relegation';
    return null;
  }
  if (position <= 4) return 'champions';
  if (position <= 6) return 'europa';
  if (position > totalClubs - 3) return 'relegation';
  return null;
}

export const ZONE_STYLES: Record<Exclude<LeagueZone, null>, { stripe: string; dot: string; label: string }> = {
  champions: { stripe: 'border-l-4 border-l-blue-500', dot: 'bg-blue-500', label: 'Champions League' },
  europa: { stripe: 'border-l-4 border-l-orange-500', dot: 'bg-orange-500', label: 'Europa / UEFA Cup' },
  promotion: { stripe: 'border-l-4 border-l-emerald-600', dot: 'bg-emerald-600', label: 'Automatic Promotion' },
  playoff: { stripe: 'border-l-4 border-l-teal-400', dot: 'bg-teal-400', label: 'Promotion Playoffs' },
  relegation: { stripe: 'border-l-4 border-l-red-600', dot: 'bg-red-600', label: 'Relegation' },
};

/** Which zone kinds can actually appear for a given tier — for filtering a table legend down to the zones that are relevant, rather than listing every zone across every tier. */
export function zonesForTier(tier: LeagueDefinition['tier']): Exclude<LeagueZone, null>[] {
  return tier === 'top' ? ['champions', 'europa', 'relegation'] : ['promotion', 'playoff', 'relegation'];
}

export function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}
