import { describe, expect, it } from 'vitest';
import { getLeagueZone } from '../leagueZones';
import { computePyramidTransition } from '../pyramid';
import type { LeagueTableRow } from '../../engine/types';

function row(clubId: string): LeagueTableRow {
  return { clubId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 };
}

function makeIds(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}-${i + 1}`);
}

describe('computePyramidTransition — Premier League <-> Championship (3 up, 3 down)', () => {
  const PL_IDS = makeIds('pl', 20);
  const CHAMP_IDS = makeIds('ch', 24);
  const PL_TABLE = PL_IDS.map(row);
  const CHAMP_TABLE = CHAMP_IDS.map(row);
  const result = computePyramidTransition(PL_IDS, CHAMP_IDS, PL_TABLE, CHAMP_TABLE, 'ch-5' /* playoff winner, finished 5th */, 'top', 'second');

  it('relegates the Premier League\'s actual bottom 3', () => {
    expect(result.relegatedFromUpper.sort()).toEqual(['pl-18', 'pl-19', 'pl-20'].sort());
  });

  it('promotes the Championship\'s automatic top 2 plus the given playoff winner', () => {
    expect(result.promotedFromLower.sort()).toEqual(['ch-1', 'ch-2', 'ch-5'].sort());
  });

  it('preserves club counts (20 and 24)', () => {
    expect(result.nextUpperClubIds).toHaveLength(20);
    expect(result.nextLowerClubIds).toHaveLength(24);
  });

  it('never puts the same club in both next-season lists', () => {
    const overlap = result.nextUpperClubIds.filter((id) => result.nextLowerClubIds.includes(id));
    expect(overlap).toEqual([]);
  });

  it('every mover actually left their old division and landed in the other', () => {
    for (const id of result.relegatedFromUpper) {
      expect(result.nextUpperClubIds).not.toContain(id);
      expect(result.nextLowerClubIds).toContain(id);
    }
    for (const id of result.promotedFromLower) {
      expect(result.nextLowerClubIds).not.toContain(id);
      expect(result.nextUpperClubIds).toContain(id);
    }
  });

  it('cross-checks the relegated/promoted sets directly against getLeagueZone, so the two can\'t silently drift apart', () => {
    const expectedRelegated = PL_TABLE.filter((_row, i) => getLeagueZone(i + 1, 20, 'top') === 'relegation').map((r) => r.clubId);
    const expectedAutoPromoted = CHAMP_TABLE.filter((_row, i) => getLeagueZone(i + 1, 24, 'second') === 'promotion').map((r) => r.clubId);

    expect(result.relegatedFromUpper.sort()).toEqual(expectedRelegated.sort());
    expect(result.promotedFromLower.sort()).toEqual([...expectedAutoPromoted, 'ch-5'].sort());
  });

  it('every non-moving club stays exactly where it was', () => {
    const stayedInUpper = PL_IDS.filter((id) => !result.relegatedFromUpper.includes(id));
    for (const id of stayedInUpper) expect(result.nextUpperClubIds).toContain(id);
    const stayedInLower = CHAMP_IDS.filter((id) => !result.promotedFromLower.includes(id));
    for (const id of stayedInLower) expect(result.nextLowerClubIds).toContain(id);
  });
});

describe('computePyramidTransition — Championship <-> League One (same shape as above)', () => {
  const CHAMP_IDS = makeIds('ch', 24);
  const L1_IDS = makeIds('l1', 24);
  const CHAMP_TABLE = CHAMP_IDS.map(row);
  const L1_TABLE = L1_IDS.map(row);
  const result = computePyramidTransition(CHAMP_IDS, L1_IDS, CHAMP_TABLE, L1_TABLE, 'l1-4', 'second', 'third');

  it('relegates the Championship\'s bottom 3', () => {
    expect(result.relegatedFromUpper.sort()).toEqual(['ch-22', 'ch-23', 'ch-24'].sort());
  });

  it('promotes League One\'s top 2 automatically plus the playoff winner', () => {
    expect(result.promotedFromLower.sort()).toEqual(['l1-1', 'l1-2', 'l1-4'].sort());
  });
});

describe('computePyramidTransition — League One <-> League Two (different shape: 4 down from L1, 3 auto up from L2)', () => {
  const L1_IDS = makeIds('l1', 24);
  const L2_IDS = makeIds('l2', 24);
  const L1_TABLE = L1_IDS.map(row);
  const L2_TABLE = L2_IDS.map(row);
  const result = computePyramidTransition(L1_IDS, L2_IDS, L1_TABLE, L2_TABLE, 'l2-6' /* playoff winner, finished 6th (4th-7th seeding) */, 'third', 'fourth');

  it('relegates League One\'s bottom 4, not 3', () => {
    expect(result.relegatedFromUpper.sort()).toEqual(['l1-21', 'l1-22', 'l1-23', 'l1-24'].sort());
  });

  it('promotes League Two\'s top 3 automatically plus the playoff winner', () => {
    expect(result.promotedFromLower.sort()).toEqual(['l2-1', 'l2-2', 'l2-3', 'l2-6'].sort());
  });

  it('preserves club counts (24 and 24)', () => {
    expect(result.nextUpperClubIds).toHaveLength(24);
    expect(result.nextLowerClubIds).toHaveLength(24);
  });

  it('cross-checks against getLeagueZone for both tier shapes', () => {
    const expectedRelegated = L1_TABLE.filter((_row, i) => getLeagueZone(i + 1, 24, 'third') === 'relegation').map((r) => r.clubId);
    const expectedAutoPromoted = L2_TABLE.filter((_row, i) => getLeagueZone(i + 1, 24, 'fourth') === 'promotion').map((r) => r.clubId);

    expect(result.relegatedFromUpper.sort()).toEqual(expectedRelegated.sort());
    expect(result.promotedFromLower.sort()).toEqual([...expectedAutoPromoted, 'l2-6'].sort());
  });
});
