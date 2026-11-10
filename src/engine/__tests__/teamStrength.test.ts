import { describe, expect, it } from 'vitest';
import { calculateTeamStrength } from '../teamStrength';
import type { Club, Formation, Player, PlayerAttributes, Position } from '../types';

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

const ATTACK_HEAVY_FORMATION: Formation = { ...FORMATION_442, id: 'attack', attackBias: 1.3, defenseBias: 0.8 };

// Deliberately wrong shape: every outfielder (and the keeper) crammed into
// forward slots, so no assignment can avoid a position-suitability penalty.
const ALL_FORWARDS_FORMATION: Formation = {
  id: 'all-fwd',
  name: 'All-FWD',
  slots: [{ position: 'FWD', count: 11 }],
  attackBias: 1,
  defenseBias: 1,
};

function makePlayer(id: string, position: Position, overrides: Partial<PlayerAttributes> = {}): Player {
  const base: PlayerAttributes = { pace: 60, shooting: 60, passing: 60, defending: 60, physical: 60, goalkeeping: 10 };
  return { id, name: id, position, age: 25, attributes: { ...base, ...overrides } };
}

function makeXI(positions: Position[]): Player[] {
  return positions.map((position, i) => makePlayer(`${position}-${i}`, position));
}

const CLUB: Club = {
  id: 'test-club',
  name: 'Test Club',
  shortName: 'TST',
  colors: { primary: '#000', secondary: '#fff' },
  reputation: 60,
  players: [],
};

describe('calculateTeamStrength', () => {
  it('returns a well-formed result for a correctly shaped XI', () => {
    const xi = makeXI(['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'FWD', 'FWD']);
    const result = calculateTeamStrength({ club: CLUB, formation: FORMATION_442, selectedXI: xi });
    expect(result.attack).toBeGreaterThan(0);
    expect(result.defense).toBeGreaterThan(0);
    expect(result.overall).toBeCloseTo((result.attack + result.defense) / 2, 5);
  });

  it('penalises players deployed out of position', () => {
    const xi = makeXI(['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'FWD', 'FWD']);

    const wellShaped = calculateTeamStrength({ club: CLUB, formation: FORMATION_442, selectedXI: xi });
    const forcedMismatch = calculateTeamStrength({ club: CLUB, formation: ALL_FORWARDS_FORMATION, selectedXI: xi });

    expect(forcedMismatch.overall).toBeLessThan(wellShaped.overall);
  });

  it('applies formation attack/defense bias', () => {
    const xi = makeXI(['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'FWD', 'FWD']);
    const balanced = calculateTeamStrength({ club: CLUB, formation: FORMATION_442, selectedXI: xi });
    const attackHeavy = calculateTeamStrength({ club: CLUB, formation: ATTACK_HEAVY_FORMATION, selectedXI: xi });

    expect(attackHeavy.attack).toBeGreaterThan(balanced.attack);
    expect(attackHeavy.defense).toBeLessThan(balanced.defense);
  });

  it('handles an empty XI without throwing', () => {
    const result = calculateTeamStrength({ club: CLUB, formation: FORMATION_442, selectedXI: [] });
    expect(result.overall).toBeGreaterThan(0);
  });
});
