import { describe, expect, it } from 'vitest';
import { pickBestXI } from '../squadAuto';
import type { Club, Formation, Player, Position } from '../types';

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

function player(id: string, position: Position, overrides: Partial<Player> = {}): Player {
  return {
    id,
    name: id,
    position,
    age: 25,
    attributes: { pace: 60, shooting: 60, passing: 60, defending: 60, physical: 60, goalkeeping: 60 },
    ...overrides,
  };
}

function squadOf(players: Player[]): Club {
  return { id: 'c', name: 'c', shortName: 'C', colors: { primary: '#000', secondary: '#fff' }, reputation: 60, players };
}

describe('pickBestXI', () => {
  it('never picks an injured player when enough fit players exist', () => {
    const players = [
      player('gk1', 'GK'),
      ...Array.from({ length: 5 }, (_, i) => player(`def${i}`, 'DEF', i === 0 ? { injured: true } : {})),
      ...Array.from({ length: 5 }, (_, i) => player(`mid${i}`, 'MID', i === 0 ? { injured: true } : {})),
      ...Array.from({ length: 3 }, (_, i) => player(`fwd${i}`, 'FWD', i === 0 ? { injured: true } : {})),
    ];
    const xi = pickBestXI(squadOf(players), FORMATION_442);
    expect(xi.some((p) => p.injured)).toBe(false);
    expect(xi).toHaveLength(11);
  });

  it('falls back to injured players rather than fielding fewer than 11', () => {
    const players = [
      player('gk1', 'GK', { injured: true }),
      player('gk2', 'GK'),
      ...Array.from({ length: 4 }, (_, i) => player(`def${i}`, 'DEF')),
      ...Array.from({ length: 4 }, (_, i) => player(`mid${i}`, 'MID')),
      // Only 1 fit forward, 1 injured — fewer than 11 fit players overall.
      player('fwd0', 'FWD'),
      player('fwd1', 'FWD', { injured: true }),
    ];
    const xi = pickBestXI(squadOf(players), FORMATION_442);
    expect(xi).toHaveLength(11);
  });
});
