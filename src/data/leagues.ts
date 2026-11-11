import { LA_LIGA_2008_09 } from './laLiga0809';
import type { ClubListing } from './premierLeague0809';
import { PREMIER_LEAGUE_2008_09 } from './premierLeague0809';

export interface LeagueDefinition {
  id: string;
  name: string;
  clubs: ClubListing[];
}

/**
 * Every league a career can start in. Adding a league is: a new
 * `ClubListing[]` + squad data file (following premierLeague0809.ts /
 * realSquads2008_09.ts's pattern), then one entry here — everything else
 * (fixtures, table, transfers, stats, Team of the Month) is already
 * generic over "whichever league the managed club belongs to".
 */
export const LEAGUES: LeagueDefinition[] = [
  { id: 'premier-league', name: 'Premier League', clubs: PREMIER_LEAGUE_2008_09 },
  { id: 'la-liga', name: 'La Liga', clubs: LA_LIGA_2008_09 },
];

/** Every club across every league, flattened — for lookups where it doesn't matter which league a club belongs to (crest/colors/stadium display). Club ids are unique across leagues by construction. */
export const ALL_CLUBS: ClubListing[] = LEAGUES.flatMap((l) => l.clubs);

export function getLeagueForClub(clubId: string): LeagueDefinition | undefined {
  return LEAGUES.find((l) => l.clubs.some((c) => c.id === clubId));
}
