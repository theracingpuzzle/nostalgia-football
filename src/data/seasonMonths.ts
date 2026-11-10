export interface SeasonMonth {
  name: string;
  matchdayStart: number;
  matchdayEnd: number;
}

/**
 * Fixtures aren't dated, just numbered 1-38 (same approximation the January
 * transfer window uses — see JANUARY_MATCHDAY in CareerScreen.tsx). This
 * chunks the season into blocks under real Aug-May Premier League month
 * names purely so "Team of the Month" has something to label itself with —
 * it's not a real calendar and the two approximations aren't meant to line
 * up exactly.
 */
export const SEASON_MONTHS: SeasonMonth[] = [
  { name: 'August', matchdayStart: 1, matchdayEnd: 4 },
  { name: 'September', matchdayStart: 5, matchdayEnd: 8 },
  { name: 'October', matchdayStart: 9, matchdayEnd: 12 },
  { name: 'November', matchdayStart: 13, matchdayEnd: 16 },
  { name: 'December', matchdayStart: 17, matchdayEnd: 20 },
  { name: 'January', matchdayStart: 21, matchdayEnd: 24 },
  { name: 'February', matchdayStart: 25, matchdayEnd: 28 },
  { name: 'March', matchdayStart: 29, matchdayEnd: 32 },
  { name: 'April', matchdayStart: 33, matchdayEnd: 35 },
  { name: 'May', matchdayStart: 36, matchdayEnd: 38 },
];
