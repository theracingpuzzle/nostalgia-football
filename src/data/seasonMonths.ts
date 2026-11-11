export interface SeasonMonth {
  name: string;
  matchdayStart: number;
  matchdayEnd: number;
}

const MONTH_NAMES = ['August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May'];

/**
 * Fixtures aren't dated, just numbered 1-N — this chunks the season into
 * blocks under real Aug-May month names purely so "Team of the Month" has
 * something to label itself with. Not a real calendar.
 *
 * Originally a fixed 38-matchday breakdown (the Premier League's only: 4
 * matchdays for each of the first 8 months, 3 for the last 2), now
 * computed from `totalMatchdays` so it also works for a league with a
 * different club count (e.g. an 18-club league plays 34 matchdays, not
 * 38). `totalMatchdays` is split into 10 blocks as evenly as possible —
 * `floor(totalMatchdays / 10)` each, with the remainder's extra matchday
 * going to the first N months rather than the last — which reproduces the
 * original 4×8 + 3×2 breakdown exactly at 38 matchdays.
 */
export function buildSeasonMonths(totalMatchdays: number): SeasonMonth[] {
  const base = Math.floor(totalMatchdays / MONTH_NAMES.length);
  const remainder = totalMatchdays % MONTH_NAMES.length;

  const months: SeasonMonth[] = [];
  let start = 1;
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    const length = base + (i < remainder ? 1 : 0);
    months.push({ name: MONTH_NAMES[i], matchdayStart: start, matchdayEnd: start + length - 1 });
    start += length;
  }
  return months;
}
