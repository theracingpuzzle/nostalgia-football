import { describe, expect, it } from 'vitest';
import { simulateMatchday, type ClubMatchMeta } from '../matchday';
import type { Fixture, Formation, Player, Position } from '../types';

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

const CLUBS: Record<string, ClubMatchMeta> = {
  a: { id: 'a', name: 'Club A', shortName: 'A', primaryColor: '#000', secondaryColor: '#fff' },
  b: { id: 'b', name: 'Club B', shortName: 'B', primaryColor: '#000', secondaryColor: '#fff' },
  c: { id: 'c', name: 'Club C', shortName: 'C', primaryColor: '#000', secondaryColor: '#fff' },
  d: { id: 'd', name: 'Club D', shortName: 'D', primaryColor: '#000', secondaryColor: '#fff' },
};

const SQUADS: Record<string, Player[]> = {
  a: makeSquad('a'),
  b: makeSquad('b'),
  c: makeSquad('c'),
  d: makeSquad('d'),
};

const FIXTURES: Fixture[] = [
  { id: 'f1', matchday: 1, homeClubId: 'a', awayClubId: 'b', played: false, result: null },
  { id: 'f2', matchday: 1, homeClubId: 'c', awayClubId: 'd', played: false, result: null },
];

function run(managedOverride?: Parameters<typeof simulateMatchday>[0]['managedOverride']) {
  return simulateMatchday({
    fixtures: FIXTURES,
    seed: 1,
    clubListingOf: (id) => CLUBS[id],
    squadOf: (id) => SQUADS[id],
    aiFormation: FORMATION_442,
    managedOverride,
  });
}

describe('simulateMatchday', () => {
  it('simulates every fixture and reserves one seed per fixture when there is no managed club', () => {
    const result = run();
    expect(result.deferred).toBeNull();
    expect(result.resultsByFixtureId.size).toBe(2);
    expect(result.resultsByFixtureId.get('f1')?.fixtureId).toBe('f1');
    expect(result.resultsByFixtureId.get('f2')?.fixtureId).toBe('f2');
    expect(result.playedPlayerIdsByClub.a).toHaveLength(11);
    expect(result.nextSeed).toBe(3); // seed 1 for f1, seed 2 for f2
  });

  it('behaves identically whether managedOverride is omitted or set to a club absent from this matchday', () => {
    const withoutOverride = run();
    const withAbsentOverride = run({ clubId: 'nonexistent-club', formation: FORMATION_442, selectedXI: SQUADS.a.slice(0, 11) });

    expect(withAbsentOverride.deferred).toBeNull();
    expect(withAbsentOverride.resultsByFixtureId.size).toBe(withoutOverride.resultsByFixtureId.size);
    expect(withAbsentOverride.nextSeed).toBe(withoutOverride.nextSeed);
    // Same seed sequence, so the actual simulated results line up exactly too.
    expect(withAbsentOverride.resultsByFixtureId.get('f1')).toEqual(withoutOverride.resultsByFixtureId.get('f1'));
    expect(withAbsentOverride.resultsByFixtureId.get('f2')).toEqual(withoutOverride.resultsByFixtureId.get('f2'));
  });

  it('defers the fixture containing the managed club instead of simulating it, while still simulating the rest and reserving its seed slot', () => {
    const managedXI = SQUADS.a.slice(0, 11);
    const result = run({ clubId: 'a', formation: FORMATION_442, selectedXI: managedXI });

    expect(result.deferred).not.toBeNull();
    expect(result.deferred?.fixtureId).toBe('f1');
    expect(result.deferred?.managedSide).toBe('home');
    expect(result.deferred?.seed).toBe(1);
    expect(result.deferred?.homeInput.selectedXI).toBe(managedXI);

    // f2 (not involving the managed club) is still simulated, using the seed after the deferred fixture's reserved slot.
    expect(result.resultsByFixtureId.size).toBe(1);
    expect(result.resultsByFixtureId.get('f2')?.fixtureId).toBe('f2');
    expect(result.nextSeed).toBe(3);
  });

  it('uses the AI formation (not the managed formation) and an auto-picked XI for every non-managed club', () => {
    const result = run({ clubId: 'a', formation: FORMATION_442, selectedXI: SQUADS.a.slice(0, 11) });
    expect(result.deferred?.awayInput.formation).toBe(FORMATION_442); // AI formation == the test's own FORMATION_442 here
    expect(result.deferred?.awayInput.selectedXI).toHaveLength(11);
    expect(result.deferred?.awayInput.selectedXI).not.toBe(result.deferred?.homeInput.selectedXI);
  });
});
