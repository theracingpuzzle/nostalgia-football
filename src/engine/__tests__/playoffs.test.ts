import { describe, expect, it } from 'vitest';
import {
  advancePlayoff,
  breakAggregateTie,
  computeAggregateWinner,
  createPlayoffState,
  generatePlayoffSemiFinals,
  type ClubMatchMeta,
} from '..';
import type { Fixture, Formation, LeagueTableRow, MatchResult, Player, Position, TeamMatchInput } from '../types';

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
    homeXI: [],
    awayXI: [],
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

    expect(semiFinal2.higherSeedClubId).toBe('fourth');
    expect(semiFinal2.lowerSeedClubId).toBe('fifth');
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

  it('detects a level aggregate', () => {
    const tie = { ...base, leg1: playedFixture(base.leg1, 1, 1), leg2: playedFixture(base.leg2, 1, 1) };
    const outcome = computeAggregateWinner(tie);
    expect(outcome).toEqual({ levelAggregate: true });
  });

  it('throws if either leg is unplayed', () => {
    expect(() => computeAggregateWinner(base)).toThrow();
  });
});

describe('breakAggregateTie', () => {
  function input(clubId: string): TeamMatchInput {
    return { club: { id: clubId, name: clubId, shortName: clubId, colors: { primary: '#000', secondary: '#fff' }, reputation: 70, players: SQUADS[clubId] }, formation: FORMATION_442, selectedXI: SQUADS[clubId].slice(0, 11) };
  }

  it('is deterministic for a fixed seed', () => {
    const a = breakAggregateTie(input('third'), input('sixth'), 999);
    const b = breakAggregateTie(input('third'), input('sixth'), 999);
    expect(a).toEqual(b);
  });

  it('always produces a winner, even across many seeds (never stalls on a drawn decider)', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { winnerClubId } = breakAggregateTie(input('third'), input('sixth'), seed);
      expect(['third', 'sixth']).toContain(winnerClubId);
    }
  });
});

describe('advancePlayoff', () => {
  const clubListingOf = (id: string) => CLUBS[id];

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
});
