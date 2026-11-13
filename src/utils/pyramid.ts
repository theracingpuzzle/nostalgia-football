import { getLeagueZone } from './leagueZones';
import type { LeagueTableRow } from '../engine/types';

/**
 * Real promotion/relegation between the only two English divisions
 * modeled here: the Premier League's bottom 3 (getLeagueZone's
 * 'relegation' zone for tier:'top') swap with the Championship's top 2
 * (getLeagueZone's 'promotion' zone for tier:'second') plus the
 * promotion playoff's winner. La Liga has no pyramid relationship to
 * either and never appears here — it only ever runs in parallel for
 * flavor (see utils/backgroundLeague.ts).
 */
export function computePyramidTransition(
  premierLeagueClubIds: string[],
  championshipClubIds: string[],
  premierLeagueTable: LeagueTableRow[],
  championshipRegularSeasonTable: LeagueTableRow[],
  championshipPlayoffWinnerClubId: string,
): { nextPremierLeagueClubIds: string[]; nextChampionshipClubIds: string[]; relegatedFromPremierLeague: string[]; promotedFromChampionship: string[] } {
  const relegatedFromPremierLeague = premierLeagueTable
    .filter((_row, i) => getLeagueZone(i + 1, premierLeagueTable.length, 'top') === 'relegation')
    .map((row) => row.clubId);

  const autoPromoted = championshipRegularSeasonTable
    .filter((_row, i) => getLeagueZone(i + 1, championshipRegularSeasonTable.length, 'second') === 'promotion')
    .map((row) => row.clubId);
  const promotedFromChampionship = [...autoPromoted, championshipPlayoffWinnerClubId];

  const nextPremierLeagueClubIds = [...premierLeagueClubIds.filter((id) => !relegatedFromPremierLeague.includes(id)), ...promotedFromChampionship];
  const nextChampionshipClubIds = [...championshipClubIds.filter((id) => !promotedFromChampionship.includes(id)), ...relegatedFromPremierLeague];

  return { nextPremierLeagueClubIds, nextChampionshipClubIds, relegatedFromPremierLeague, promotedFromChampionship };
}
