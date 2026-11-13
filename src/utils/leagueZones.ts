import type { LeagueDefinition } from '../data/leagues';

/**
 * End-of-season table zones. A top-flight division (Premier League, La
 * Liga) sends its top finishers into Europe and relegates its bottom 3 —
 * standard, not a guess. A second-tier division (the Championship)
 * instead promotes its top 2 automatically and sends 3rd-6th into the
 * promotion playoffs, with the same bottom-3 relegation — also standard
 * English football league structure, not a guess. Which scheme applies is
 * driven by `LeagueDefinition.tier` (see leagues.ts).
 */
export type LeagueZone = 'champions' | 'europa' | 'promotion' | 'playoff' | 'relegation' | null;

export function getLeagueZone(position: number, totalClubs = 20, tier: LeagueDefinition['tier'] = 'top'): LeagueZone {
  if (tier === 'second') {
    if (position <= 2) return 'promotion';
    if (position <= 6) return 'playoff';
    if (position > totalClubs - 3) return 'relegation';
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
  return tier === 'second' ? ['promotion', 'playoff', 'relegation'] : ['champions', 'europa', 'relegation'];
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
