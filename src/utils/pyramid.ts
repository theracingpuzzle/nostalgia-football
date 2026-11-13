import { getLeagueZone } from './leagueZones';
import type { LeagueDefinition } from '../data/leagues';
import type { LeagueTableRow } from '../engine/types';

/**
 * The real English football pyramid chain, top to bottom, used to drive
 * promotion/relegation between adjacent divisions. La Liga is deliberately
 * NOT in this list — it shares `tier: 'top'` with the Premier League but
 * has no real connection to this chain, so membership here (not `tier`)
 * is what decides "does this league have a division above/below it".
 */
export const ENGLISH_PYRAMID = ['premier-league', 'championship', 'league-one', 'league-two'];

/**
 * Generalized promotion/relegation between one adjacent pair of divisions
 * in the pyramid. Works for all three real boundary shapes — Premier
 * League/Championship and Championship/League One are both 3-up-3-down
 * with a 3rd-6th playoff; League One/League Two promotes 3 up via
 * automatic+playoff but relegates 4, and League Two itself promotes 3
 * automatically plus a 4th-7th playoff winner (see leagueZones.ts) — by
 * deferring the exact cutoffs to `getLeagueZone` for each side's own tier
 * rather than hardcoding a single shape here.
 */
export function computePyramidTransition(
  upperClubIds: string[],
  lowerClubIds: string[],
  upperTable: LeagueTableRow[],
  lowerRegularSeasonTable: LeagueTableRow[],
  lowerPlayoffWinnerClubId: string,
  upperTier: LeagueDefinition['tier'],
  lowerTier: LeagueDefinition['tier'],
): { nextUpperClubIds: string[]; nextLowerClubIds: string[]; relegatedFromUpper: string[]; promotedFromLower: string[] } {
  const relegatedFromUpper = upperTable
    .filter((_row, i) => getLeagueZone(i + 1, upperTable.length, upperTier) === 'relegation')
    .map((row) => row.clubId);
  const autoPromoted = lowerRegularSeasonTable
    .filter((_row, i) => getLeagueZone(i + 1, lowerRegularSeasonTable.length, lowerTier) === 'promotion')
    .map((row) => row.clubId);
  const promotedFromLower = [...autoPromoted, lowerPlayoffWinnerClubId];
  const nextUpperClubIds = [...upperClubIds.filter((id) => !relegatedFromUpper.includes(id)), ...promotedFromLower];
  const nextLowerClubIds = [...lowerClubIds.filter((id) => !promotedFromLower.includes(id)), ...relegatedFromUpper];
  return { nextUpperClubIds, nextLowerClubIds, relegatedFromUpper, promotedFromLower };
}
