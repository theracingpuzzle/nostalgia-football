import { describe, expect, it } from 'vitest';
import { getLeagueZone } from '../leagueZones';
import { computePyramidTransition } from '../pyramid';
import type { LeagueTableRow } from '../../engine/types';

function row(clubId: string): LeagueTableRow {
  return { clubId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 };
}

const PL_IDS = Array.from({ length: 20 }, (_, i) => `pl-${i + 1}`);
const CHAMP_IDS = Array.from({ length: 24 }, (_, i) => `ch-${i + 1}`);
const PL_TABLE = PL_IDS.map(row); // already in finishing-position order
const CHAMP_TABLE = CHAMP_IDS.map(row);

describe('computePyramidTransition', () => {
  const result = computePyramidTransition(PL_IDS, CHAMP_IDS, PL_TABLE, CHAMP_TABLE, 'ch-5' /* playoff winner, finished 5th */);

  it('relegates the Premier League\'s actual bottom 3', () => {
    expect(result.relegatedFromPremierLeague.sort()).toEqual(['pl-18', 'pl-19', 'pl-20'].sort());
  });

  it('promotes the Championship\'s automatic top 2 plus the given playoff winner', () => {
    expect(result.promotedFromChampionship.sort()).toEqual(['ch-1', 'ch-2', 'ch-5'].sort());
  });

  it('preserves club counts (20 and 24)', () => {
    expect(result.nextPremierLeagueClubIds).toHaveLength(20);
    expect(result.nextChampionshipClubIds).toHaveLength(24);
  });

  it('never puts the same club in both next-season lists', () => {
    const overlap = result.nextPremierLeagueClubIds.filter((id) => result.nextChampionshipClubIds.includes(id));
    expect(overlap).toEqual([]);
  });

  it('every mover actually left their old division and landed in the other', () => {
    for (const id of result.relegatedFromPremierLeague) {
      expect(result.nextPremierLeagueClubIds).not.toContain(id);
      expect(result.nextChampionshipClubIds).toContain(id);
    }
    for (const id of result.promotedFromChampionship) {
      expect(result.nextChampionshipClubIds).not.toContain(id);
      expect(result.nextPremierLeagueClubIds).toContain(id);
    }
  });

  it('cross-checks the relegated/promoted sets directly against getLeagueZone, so the two can\'t silently drift apart', () => {
    const expectedRelegated = PL_TABLE.filter((_row, i) => getLeagueZone(i + 1, 20, 'top') === 'relegation').map((r) => r.clubId);
    const expectedAutoPromoted = CHAMP_TABLE.filter((_row, i) => getLeagueZone(i + 1, 24, 'second') === 'promotion').map((r) => r.clubId);

    expect(result.relegatedFromPremierLeague.sort()).toEqual(expectedRelegated.sort());
    expect(result.promotedFromChampionship.sort()).toEqual([...expectedAutoPromoted, 'ch-5'].sort());
  });

  it('every non-moving club stays exactly where it was', () => {
    const stayedInPl = PL_IDS.filter((id) => !result.relegatedFromPremierLeague.includes(id));
    for (const id of stayedInPl) expect(result.nextPremierLeagueClubIds).toContain(id);
    const stayedInChamp = CHAMP_IDS.filter((id) => !result.promotedFromChampionship.includes(id));
    for (const id of stayedInChamp) expect(result.nextChampionshipClubIds).toContain(id);
  });
});
