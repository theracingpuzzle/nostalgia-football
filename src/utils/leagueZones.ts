/**
 * Standard 2008/09 Premier League end-of-season qualification bands (top 4 to
 * the Champions League, next 2 to the UEFA Cup, bottom 3 relegated) — not a
 * guess, this is how English football's table has worked for years.
 */
export type LeagueZone = 'champions' | 'europa' | 'relegation' | null;

export function getLeagueZone(position: number, totalClubs = 20): LeagueZone {
  if (position <= 4) return 'champions';
  if (position <= 6) return 'europa';
  if (position > totalClubs - 3) return 'relegation';
  return null;
}

export const ZONE_STYLES: Record<Exclude<LeagueZone, null>, { stripe: string; dot: string; label: string }> = {
  champions: { stripe: 'border-l-4 border-l-blue-500', dot: 'bg-blue-500', label: 'Champions League' },
  europa: { stripe: 'border-l-4 border-l-orange-500', dot: 'bg-orange-500', label: 'Europa / UEFA Cup' },
  relegation: { stripe: 'border-l-4 border-l-red-600', dot: 'bg-red-600', label: 'Relegation' },
};

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
