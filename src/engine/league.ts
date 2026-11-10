import type { Fixture, LeagueTableRow } from './types';

/**
 * Double round-robin fixture list (every club plays every other club home
 * and away) using the standard "circle method" for the first leg, then a
 * home/away-reversed mirror for the second leg. Requires an even number of
 * clubs.
 */
export function generateFixtures(clubIds: string[]): Fixture[] {
  if (clubIds.length % 2 !== 0) {
    throw new Error('generateFixtures requires an even number of clubs');
  }

  const n = clubIds.length;
  const half = n / 2;
  const rotation = [...clubIds];
  const firstLeg: { home: string; away: string; matchday: number }[] = [];

  for (let round = 0; round < n - 1; round++) {
    for (let i = 0; i < half; i++) {
      const a = rotation[i];
      const b = rotation[n - 1 - i];
      const [home, away] = round % 2 === 0 ? [a, b] : [b, a];
      firstLeg.push({ home, away, matchday: round + 1 });
    }
    rotation.splice(1, 0, rotation.pop()!);
  }

  const secondLeg = firstLeg.map((fixture) => ({
    home: fixture.away,
    away: fixture.home,
    matchday: fixture.matchday + (n - 1),
  }));

  return [...firstLeg, ...secondLeg].map((fixture, index) => ({
    id: `fx-${index + 1}`,
    matchday: fixture.matchday,
    homeClubId: fixture.home,
    awayClubId: fixture.away,
    played: false,
    result: null,
  }));
}

export function createEmptyTableRow(clubId: string): LeagueTableRow {
  return { clubId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 };
}

/** Recomputes the full table from scratch given all fixtures played so far. */
export function computeLeagueTable(clubIds: string[], fixtures: Fixture[]): LeagueTableRow[] {
  const rows = new Map<string, LeagueTableRow>(clubIds.map((id) => [id, createEmptyTableRow(id)]));

  for (const fixture of fixtures) {
    if (!fixture.played || !fixture.result) continue;
    const home = rows.get(fixture.homeClubId);
    const away = rows.get(fixture.awayClubId);
    if (!home || !away) continue;

    const { homeGoals, awayGoals } = fixture.result;
    applyMatch(home, homeGoals, awayGoals);
    applyMatch(away, awayGoals, homeGoals);
  }

  return [...rows.values()].sort(
    (a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor,
  );
}

function applyMatch(row: LeagueTableRow, goalsFor: number, goalsAgainst: number): void {
  row.played += 1;
  row.goalsFor += goalsFor;
  row.goalsAgainst += goalsAgainst;
  row.goalDifference = row.goalsFor - row.goalsAgainst;

  if (goalsFor > goalsAgainst) {
    row.won += 1;
    row.points += 3;
  } else if (goalsFor === goalsAgainst) {
    row.drawn += 1;
    row.points += 1;
  } else {
    row.lost += 1;
  }
}
