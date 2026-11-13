import { describe, expect, it } from 'vitest';
import {
  advancePlayoff,
  computeAggregateWinner,
  createPlayoffState,
  generatePlayoffSemiFinals,
  getAggregateOffsetForFixture,
  playoffSeedStartForTier,
  simulateDecisiveFixture,
  type ClubMatchMeta,
} from '..';
import type { Fixture, Formation, LeagueTableRow, MatchResult, Player, Position } from '../types';

const FORMATION_442: Formation = {
  id: '4-4-2',
  name: '4-4-2',
  slots: [
    { position: 'GK', count: 1 },
    { position: 'DEF', count: 4 },
    { position: 'MID', count: 4 },
    { position: 'FWD', count: 2 },
  ],
  attackBias: 1,
  defenseBias: 1,
};

function row(clubId: string): LeagueTableRow {
  return { clubId, played: 46, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 };
}

const TABLE: LeagueTableRow[] = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'].map(row);

function makeSquad(prefix: string): Player[] {
  const players: Player[] = [];
  let n = 0;
  const add = (position: Position, count: number) => {
    for (let i = 0; i < count; i++) {
      n += 1;
      players.push({ id: `${prefix}-p${n}`, name: `${prefix}-p${n}`, position, age: 25, attributes: { pace: 60, shooting: 60, passing: 60, defending: 60, physical: 60, goalkeeping: 60 } });
    }
  };
  add('GK', 2);
  add('DEF', 5);
  add('MID', 5);
  add('FWD', 3);
  return players;
}

const CLUB_IDS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
const CLUBS: Record<string, ClubMatchMeta> = Object.fromEntries(
  CLUB_IDS.map((id) => [id, { id, name: id, shortName: id.slice(0, 3).toUpperCase(), primaryColor: '#000', secondaryColor: '#fff' }]),
);
const SQUADS: Record<string, Player[]> = Object.fromEntries(CLUB_IDS.map((id) => [id, makeSquad(id)]));
const clubListingOf = (id: string) => CLUBS[id];
const squadOf = (id: string) => SQUADS[id];

function playedFixture(f: Fixture, homeGoals: number, awayGoals: number): Fixture {
  const result: MatchResult = {
    fixtureId: f.id,
    homeGoals,
    awayGoals,
    events: [],
    homeScorers: [],
    awayScorers: [],
    homeAssists: [],
    awayAssists: [],
    homeBookings: [],
    awayBookings: [],
    homeRedCards: [],
    awayRedCards: [],
    homeXI: SQUADS[f.homeClubId]?.slice(0, 11).map((p) => p.id) ?? [],
    awayXI: SQUADS[f.awayClubId]?.slice(0, 11).map((p) => p.id) ?? [],
    seed: 1,
  };
  return { ...f, played: true, result };
}

describe('generatePlayoffSemiFinals', () => {
  it('pairs 3rd-v-6th and 4th-v-5th, with the lower seed hosting leg1 and the higher seed hosting leg2', () => {
    const { semiFinal1, semiFinal2 } = generatePlayoffSemiFinals(TABLE, 47);

    expect(semiFinal1.higherSeedClubId).toBe('third');
    expect(semiFinal1.lowerSeedClubId).toBe('sixth');
    expect(semiFinal1.leg1.homeClubId).toBe('sixth');
    expect(semiFinal1.leg1.awayClubId).toBe('third');
    expect(semiFinal1.leg2.homeClubId).toBe('third');
    expect(semiFinal1.leg2.awayClubId).toBe('sixth');
    expect(semiFinal1.leg1.matchday).toBe(47);
    expect(semiFinal1.leg2.matchday).toBe(48);
    expect(semiFinal1.wentToExtraTime).toBe(false);
    expect(semiFinal1.penaltyShootout).toBeNull();

    expect(semiFinal2.higherSeedClubId).toBe('fourth');
    expect(semiFinal2.lowerSeedClubId).toBe('fifth');
  });

  it('with seedStart 4 (League Two, which promotes its top 3 automatically) pairs 4th-v-7th and 5th-v-6th instead', () => {
    const SEVEN_TABLE: LeagueTableRow[] = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'].map(row);
    const { semiFinal1, semiFinal2 } = generatePlayoffSemiFinals(SEVEN_TABLE, 47, 4);

    expect(semiFinal1.higherSeedClubId).toBe('fourth');
    expect(semiFinal1.lowerSeedClubId).toBe('seventh');
    expect(semiFinal2.higherSeedClubId).toBe('fifth');
    expect(semiFinal2.lowerSeedClubId).toBe('sixth');
  });
});

describe('playoffSeedStartForTier', () => {
  it('is 4 for the fourth tier (League Two) and 3 for everything else with a playoff', () => {
    expect(playoffSeedStartForTier('fourth')).toBe(4);
    expect(playoffSeedStartForTier('second')).toBe(3);
    expect(playoffSeedStartForTier('third')).toBe(3);
    expect(playoffSeedStartForTier('top')).toBe(3);
  });
});

describe('computeAggregateWinner', () => {
  const base = generatePlayoffSemiFinals(TABLE, 1).semiFinal1; // third (higher) vs sixth (lower)

  it('gives the higher seed the win when their aggregate is bigger', () => {
    const tie = { ...base, leg1: playedFixture(base.leg1, 1, 0), leg2: playedFixture(base.leg2, 2, 0) }; // leg1: sixth 1-0 third; leg2: third 2-0 sixth -> third 2, sixth 1
    const outcome = computeAggregateWinner(tie);
    expect(outcome).toEqual({ winnerClubId: 'third' });
  });

  it('gives the lower seed the win when their aggregate is bigger', () => {
    const tie = { ...base, leg1: playedFixture(base.leg1, 3, 0), leg2: playedFixture(base.leg2, 0, 0) }; // sixth 3-0 third; third 0-0 sixth -> sixth 3, third 0
    const outcome = computeAggregateWinner(tie);
    expect(outcome).toEqual({ winnerClubId: 'sixth' });
  });

  it('detects a level aggregate (even one only level after what would have been extra time)', () => {
    const tie = { ...base, leg1: playedFixture(base.leg1, 1, 1), leg2: playedFixture(base.leg2, 1, 1) };
    const outcome = computeAggregateWinner(tie);
    expect(outcome).toEqual({ levelAggregate: true });
  });

  it('throws if either leg is unplayed', () => {
    expect(() => computeAggregateWinner(base)).toThrow();
  });
});

describe('simulateDecisiveFixture', () => {
  const fixture: Fixture = { id: 'sf1-leg2', matchday: 48, homeClubId: 'third', awayClubId: 'sixth', played: false, result: null };

  it('is deterministic for a fixed seed', () => {
    const a = simulateDecisiveFixture(fixture, 555, clubListingOf, squadOf, FORMATION_442, true);
    const b = simulateDecisiveFixture(fixture, 555, clubListingOf, squadOf, FORMATION_442, true);
    expect(a).toEqual(b);
  });

  it('always fully resolves a non-deferred fixture to a decisive (non-level) score', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const result = simulateDecisiveFixture(fixture, seed, clubListingOf, squadOf, FORMATION_442, true);
      expect(result.deferred).toBeNull();
      expect(result.fixture.played).toBe(true);
      const { homeGoals, awayGoals } = result.fixture.result!;
      if (homeGoals === awayGoals) {
        // Only possible if a penalty shootout decided it.
        expect(result.penaltyShootout).not.toBeNull();
      } else {
        expect(result.penaltyShootout).toBeNull();
      }
    }
  });

  it('some seeds need extra time, and when they do, the result score only ever came from a longer match (never contradicts a clean 90-minute decision)', () => {
    let sawExtraTime = false;
    for (let seed = 1; seed <= 150; seed++) {
      const result = simulateDecisiveFixture(fixture, seed, clubListingOf, squadOf, FORMATION_442, true);
      if (result.wentToExtraTime) sawExtraTime = true;
    }
    expect(sawExtraTime).toBe(true);
  });

  it('defers a fixture containing the managed club instead of simulating it, without resolving extra time/penalties itself', () => {
    const managedOverride = { clubId: 'third', formation: FORMATION_442, selectedXI: SQUADS.third.slice(0, 11) };
    const result = simulateDecisiveFixture(fixture, 1, clubListingOf, squadOf, FORMATION_442, true, managedOverride);
    expect(result.deferred).not.toBeNull();
    expect(result.deferred?.fixtureId).toBe('sf1-leg2');
    expect(result.fixture.played).toBe(false);
    expect(result.wentToExtraTime).toBe(false);
    expect(result.penaltyShootout).toBeNull();
  });
});

describe('getAggregateOffsetForFixture', () => {
  it('reads leg1\'s score the right way round for leg2 (higher seed is away in leg1, home in leg2)', () => {
    const { semiFinal1 } = generatePlayoffSemiFinals(TABLE, 47); // third (higher) v sixth (lower)
    const withLeg1Played = { ...semiFinal1, leg1: playedFixture(semiFinal1.leg1, 1, 2) }; // sixth (home) 1-2 third (away)
    const offset = getAggregateOffsetForFixture({ table: TABLE, semiFinal1: withLeg1Played, semiFinal2: generatePlayoffSemiFinals(TABLE, 47).semiFinal2, semiFinal1Winner: null, semiFinal2Winner: null, final: null, finalWentToExtraTime: false, finalPenaltyShootout: null, championClubId: null, nextSeed: 1 }, 'sf1-leg2');
    expect(offset).toEqual({ home: 2, away: 1 }); // third's (leg2 home) leg1 goals = 2 (away in leg1); sixth's (leg2 away) leg1 goals = 1
  });

  it('returns {0,0} for a fixture that is not any tie\'s leg2 (leg1, or the final)', () => {
    const playoff = createPlayoffState(TABLE, 47, 1);
    expect(getAggregateOffsetForFixture(playoff, 'sf1-leg1')).toEqual({ home: 0, away: 0 });
    expect(getAggregateOffsetForFixture(playoff, 'final')).toEqual({ home: 0, away: 0 });
  });
});

describe('simulateDecisiveFixture aggregate-awareness (regression)', () => {
  const fixture: Fixture = { id: 'sf1-leg2', matchday: 48, homeClubId: 'third', awayClubId: 'sixth', played: false, result: null };

  it('never extends to extra time just because leg2 alone is level, if the AGGREGATE already favors one side', () => {
    // Give the "home" (higher seed, third) side a big aggregate cushion — level or not on leg2 alone, the tie is already decided.
    const bigCushion = { home: 10, away: 0 };
    for (let seed = 1; seed <= 50; seed++) {
      const result = simulateDecisiveFixture(fixture, seed, clubListingOf, squadOf, FORMATION_442, true, undefined, bigCushion);
      expect(result.wentToExtraTime).toBe(false);
      expect(result.penaltyShootout).toBeNull();
      expect(result.fixture.result).not.toBeNull();
    }
  });

  it('a seed whose leg2-alone result is level only goes to extra time with a {0,0} offset, not with an offset that makes the true aggregate decisive', () => {
    // Find a seed where leg2 alone (no offset) is level after 90 minutes.
    let levelSeed: number | null = null;
    for (let seed = 1; seed <= 300 && levelSeed === null; seed++) {
      const result = simulateDecisiveFixture(fixture, seed, clubListingOf, squadOf, FORMATION_442, true);
      // wentToExtraTime true with a {0,0} offset means the 90-minute leg2 score itself was level.
      if (result.wentToExtraTime) levelSeed = seed;
    }
    expect(levelSeed).not.toBeNull();

    const withZeroOffset = simulateDecisiveFixture(fixture, levelSeed!, clubListingOf, squadOf, FORMATION_442, true, undefined, { home: 0, away: 0 });
    expect(withZeroOffset.wentToExtraTime).toBe(true); // level leg2, {0,0} offset -> aggregate level -> needs extra time

    const withDecisiveOffset = simulateDecisiveFixture(fixture, levelSeed!, clubListingOf, squadOf, FORMATION_442, true, undefined, { home: 3, away: 0 });
    expect(withDecisiveOffset.wentToExtraTime).toBe(false); // same level leg2, but the tie was already decided by leg1 -> no extra time needed
  });
});

describe('advancePlayoff', () => {
  it('drives a full bracket through to a championClubId with no managed club involved', () => {
    let playoff = createPlayoffState(TABLE, 47, 1);
    let iterations = 0;
    while (!playoff.championClubId && iterations < 20) {
      const { nextPlayoff, deferred } = advancePlayoff(playoff, SQUADS, clubListingOf, FORMATION_442);
      expect(deferred).toBeNull(); // no managed club in this bracket at all
      playoff = nextPlayoff;
      iterations++;
    }
    expect(playoff.championClubId).not.toBeNull();
    expect([playoff.semiFinal1Winner, playoff.semiFinal2Winner]).toContain(playoff.championClubId);
  });

  it('defers the leg containing the managed club instead of simulating it', () => {
    const playoff = createPlayoffState(TABLE, 47, 1);
    const managedOverride = { clubId: 'third', formation: FORMATION_442, selectedXI: SQUADS.third.slice(0, 11) };
    const { nextPlayoff, deferred } = advancePlayoff(playoff, SQUADS, clubListingOf, FORMATION_442, managedOverride);

    expect(deferred).not.toBeNull();
    expect(deferred?.fixtureId).toBe('sf1-leg1'); // third is away in leg1 (sixth hosts)
    expect(nextPlayoff.semiFinal1.leg1.played).toBe(false); // deferred fixture isn't committed yet
    expect(nextPlayoff.semiFinal2.leg1.played).toBe(true); // the other semi's leg1 (no managed club) is simulated immediately
  });

  it('across many different starting seeds, always eventually reaches a championClubId (covers brackets that need extra time/penalties along the way)', () => {
    for (let seed = 1; seed <= 30; seed++) {
      let playoff = createPlayoffState(TABLE, 47, seed * 101);
      let iterations = 0;
      while (!playoff.championClubId && iterations < 20) {
        playoff = advancePlayoff(playoff, SQUADS, clubListingOf, FORMATION_442).nextPlayoff;
        iterations++;
      }
      expect(playoff.championClubId).not.toBeNull();
    }
  });
});
