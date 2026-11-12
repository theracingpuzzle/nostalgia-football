import { LA_LIGA_2008_09 } from './laLiga0809';
import type { ClubListing } from './premierLeague0809';
import { PREMIER_LEAGUE_2008_09 } from './premierLeague0809';

export interface LeagueDefinition {
  id: string;
  name: string;
  clubs: ClubListing[];
  /**
   * Relative path (no leading slash, same convention as ClubListing.crestPath)
   * to the league's real title-sponsor logo as it was in 2008/09 — e.g. the
   * Premier League's is the Barclays-era lion crest (2007-2016), not the
   * current plain wordmark. Optional — a league without one falls back to
   * just its name. See PLAN.md for sourcing/caveats.
   */
  logoPath?: string;
}

/**
 * Every league a career can start in. Adding a league is: a new
 * `ClubListing[]` + squad data file (following premierLeague0809.ts /
 * realSquads2008_09.ts's pattern), then one entry here — everything else
 * (fixtures, table, transfers, stats, Team of the Month) is already
 * generic over "whichever league the managed club belongs to".
 */
export const LEAGUES: LeagueDefinition[] = [
  { id: 'premier-league', name: 'Premier League', clubs: PREMIER_LEAGUE_2008_09, logoPath: 'leagues/premier-league.png' },
  { id: 'la-liga', name: 'La Liga', clubs: LA_LIGA_2008_09, logoPath: 'leagues/la-liga.svg' },
];

/** Every club across every league, flattened — for lookups where it doesn't matter which league a club belongs to (crest/colors/stadium display). Club ids are unique across leagues by construction. */
export const ALL_CLUBS: ClubListing[] = LEAGUES.flatMap((l) => l.clubs);

export function getLeagueForClub(clubId: string): LeagueDefinition | undefined {
  return LEAGUES.find((l) => l.clubs.some((c) => c.id === clubId));
}
