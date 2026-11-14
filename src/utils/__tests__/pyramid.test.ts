import { describe, expect, it } from 'vitest';
import { getLeagueZone } from '../leagueZones';
import { computePyramidTransition, ENGLISH_PYRAMID } from '../pyramid';
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

/**
 * Regression test for the "a club ends up in two leagues at once" bug:
 * CareerScreen's startNewSeason() applies computePyramidTransition across
 * ENGLISH_PYRAMID's three adjacent boundaries in one pass, and Championship
 * and League One each sit in the MIDDLE of that chain — they're the
 * "lower" league for one boundary and the "upper" league for the next. If
 * each boundary is fed the original, season-start club lists instead of
 * the roster already updated by the previous boundary, the later boundary
 * clobbers the earlier one's promotions/relegations for the shared league,
 * leaving a club listed in two leagues' final rosters simultaneously (and,
 * since fixtures are generated per-league from that list, playing two
 * independent fixture schedules). This test runs the same three-boundary
 * chain CareerScreen runs, across a realistic shared club universe, and
 * asserts no club is ever double-counted and every league ends up the
 * right size.
 */
describe('three-boundary pyramid chain (regression: no club should ever end up in two leagues)', () => {
  const tierByLeagueId: Record<string, 'top' | 'second' | 'third' | 'fourth'> = {
    'premier-league': 'top',
    championship: 'second',
    'league-one': 'third',
    'league-two': 'fourth',
  };

  function runFullChain(clubIdsByLeague: Record<string, string[]>, playoffWinnerByLowerLeague: Record<string, string>) {
    const tableByLeague: Record<string, LeagueTableRow[]> = Object.fromEntries(
      Object.entries(clubIdsByLeague).map(([leagueId, ids]) => [leagueId, ids.map(row)]),
    );

    let nextLeagueClubIds: Record<string, string[]> = clubIdsByLeague;
    for (let i = 0; i < ENGLISH_PYRAMID.length - 1; i++) {
      const upperLeagueId = ENGLISH_PYRAMID[i];
      const lowerLeagueId = ENGLISH_PYRAMID[i + 1];
      const playoffWinnerClubId = playoffWinnerByLowerLeague[lowerLeagueId];
      if (!playoffWinnerClubId) continue;

      const currentUpperClubIds = nextLeagueClubIds[upperLeagueId] ?? clubIdsByLeague[upperLeagueId];
      const currentLowerClubIds = nextLeagueClubIds[lowerLeagueId] ?? clubIdsByLeague[lowerLeagueId];
      const { nextUpperClubIds, nextLowerClubIds } = computePyramidTransition(
        currentUpperClubIds,
        currentLowerClubIds,
        tableByLeague[upperLeagueId],
        tableByLeague[lowerLeagueId],
        playoffWinnerClubId,
        tierByLeagueId[upperLeagueId],
        tierByLeagueId[lowerLeagueId],
      );
      nextLeagueClubIds = { ...nextLeagueClubIds, [upperLeagueId]: nextUpperClubIds, [lowerLeagueId]: nextLowerClubIds };
    }
    return nextLeagueClubIds;
  }

  const clubIdsByLeague = {
    'premier-league': makeIds('pl', 20),
    championship: makeIds('ch', 24),
    'league-one': makeIds('l1', 24),
    'league-two': makeIds('l2', 24),
  };
  const playoffWinnerByLowerLeague = { championship: 'ch-5', 'league-one': 'l1-4', 'league-two': 'l2-6' };

  const result = runFullChain(clubIdsByLeague, playoffWinnerByLowerLeague);

  it('no club appears in more than one league\'s final roster', () => {
    const allIds = Object.values(result).flat();
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  it('every league keeps its original club count', () => {
    for (const leagueId of ENGLISH_PYRAMID) {
      expect(result[leagueId]).toHaveLength(clubIdsByLeague[leagueId as keyof typeof clubIdsByLeague].length);
    }
  });

  it('clubs promoted out of the Championship actually land in the Premier League, not left behind', () => {
    expect(result['premier-league']).toContain('ch-1');
    expect(result['premier-league']).toContain('ch-5'); // the playoff winner
    expect(result.championship).not.toContain('ch-1');
    expect(result.championship).not.toContain('ch-5');
  });

  it('clubs promoted from League One into the Championship backfill the Championship spots vacated by its own promotions, not duplicate them', () => {
    expect(result.championship).toContain('l1-1');
    expect(result.championship).toContain('l1-4'); // the playoff winner
    expect(result['league-one']).not.toContain('l1-1');
    expect(result['league-one']).not.toContain('l1-4');
  });

  it('clubs relegated from the Premier League land in the Championship, and clubs relegated from the Championship land in League One', () => {
    expect(result.championship).toContain('pl-18');
    expect(result['league-one']).toContain('ch-22');
  });

  it('clubs promoted from League Two land in League One', () => {
    expect(result['league-one']).toContain('l2-1');
    expect(result['league-one']).toContain('l2-6'); // the playoff winner
    expect(result['league-two']).not.toContain('l2-1');
    expect(result['league-two']).not.toContain('l2-6');
  });
});
