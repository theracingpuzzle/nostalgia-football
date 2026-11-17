import { getLeagueZone } from './leagueZones';
import { LEAGUES, type LeagueDefinition } from '../data/leagues';
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

/**
 * Applies every real pyramid boundary in one pass, given each league's
 * CURRENT (season-start) club list and a way to resolve any league's
 * final-season outcome. Threads each boundary's OUTPUT roster into the
 * next boundary's INPUT for any league the two boundaries share —
 * Championship and League One each sit in the middle of the chain (the
 * "lower" league for one boundary, the "upper" league for the next), so
 * feeding a boundary `outcomeFor`'s frozen original roster instead of
 * the roster an earlier boundary already updated would clobber that
 * earlier boundary's promotions/relegations, leaving a club listed in
 * two leagues' final rosters at once. The *table* values driving zone
 * decisions always come straight from `outcomeFor` regardless — a
 * league's own final standings aren't affected by a neighboring
 * boundary, only roster membership is. Used both by a managed career's
 * own `startNewSeason()` and by an unemployed spell's own season
 * rollover (see utils/careerTransition.ts) — one implementation shared
 * by both.
 */
export function applyPyramidTransitions(
  leagueClubIds: Record<string, string[]>,
  outcomeFor: (leagueId: string) => { clubIds: string[]; table: LeagueTableRow[]; playoffWinnerClubId?: string },
): Record<string, string[]> {
  let nextLeagueClubIds = leagueClubIds;
  for (let i = 0; i < ENGLISH_PYRAMID.length - 1; i++) {
    const upperLeagueId = ENGLISH_PYRAMID[i];
    const lowerLeagueId = ENGLISH_PYRAMID[i + 1];
    const upperTier = LEAGUES.find((l) => l.id === upperLeagueId)!.tier;
    const lowerTier = LEAGUES.find((l) => l.id === lowerLeagueId)!.tier;
    const upper = outcomeFor(upperLeagueId);
    const lower = outcomeFor(lowerLeagueId);
    if (lower.playoffWinnerClubId) {
      const currentUpperClubIds = nextLeagueClubIds[upperLeagueId] ?? upper.clubIds;
      const currentLowerClubIds = nextLeagueClubIds[lowerLeagueId] ?? lower.clubIds;
      const { nextUpperClubIds, nextLowerClubIds } = computePyramidTransition(
        currentUpperClubIds,
        currentLowerClubIds,
        upper.table,
        lower.table,
        lower.playoffWinnerClubId,
        upperTier,
        lowerTier,
      );
      nextLeagueClubIds = { ...nextLeagueClubIds, [upperLeagueId]: nextUpperClubIds, [lowerLeagueId]: nextLowerClubIds };
    }
  }
  return nextLeagueClubIds;
}
