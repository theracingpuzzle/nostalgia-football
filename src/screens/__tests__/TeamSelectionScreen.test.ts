import { describe, expect, it } from 'vitest';
import { FORMATIONS } from '../../data/formations';
import type { Player, Position } from '../../engine/types';
import { buildEmptySlots, fillEmptySlotsWithCoachPick } from '../TeamSelectionScreen';

const FORMATION_442 = FORMATIONS.find((f) => f.id === '4-4-2')!;

function mk(id: string, position: Position, injured = false): Player {
  return {
    id,
    name: id,
    position,
    age: 25,
    injured,
    attributes: { pace: 60, shooting: 60, passing: 60, defending: 60, physical: 60, goalkeeping: 60 },
  };
}

function pseudoClubFor(players: Player[]) {
  return { id: 'demo', name: 'Demo FC', shortName: 'DEM', colors: { primary: '#000', secondary: '#fff' }, reputation: 70, players };
}

describe('fillEmptySlotsWithCoachPick', () => {
  it('fills every slot from fit players when there are enough', () => {
    const squad: Player[] = [
      mk('gk1', 'GK'),
      ...Array.from({ length: 4 }, (_, i) => mk(`def${i}`, 'DEF')),
      ...Array.from({ length: 4 }, (_, i) => mk(`mid${i}`, 'MID')),
      ...Array.from({ length: 2 }, (_, i) => mk(`fwd${i}`, 'FWD')),
    ];
    const slots = buildEmptySlots(FORMATION_442);
    const filled = fillEmptySlotsWithCoachPick(slots, squad, pseudoClubFor(squad));
    expect(filled.every((s) => s.playerId !== null)).toBe(true);
    const chosenIds = new Set(filled.map((s) => s.playerId));
    for (const p of squad) expect(chosenIds.has(p.id)).toBe(p.injured === false);
  });

  it('presses an outfield player into goal (emergency keeper) when every recognized GK is injured', () => {
    const squad: Player[] = [
      mk('gk1', 'GK', true),
      mk('gk2', 'GK', true),
      ...Array.from({ length: 5 }, (_, i) => mk(`def${i}`, 'DEF')),
      ...Array.from({ length: 4 }, (_, i) => mk(`mid${i}`, 'MID')),
      ...Array.from({ length: 3 }, (_, i) => mk(`fwd${i}`, 'FWD')),
    ];
    const slots = buildEmptySlots(FORMATION_442);
    const filled = fillEmptySlotsWithCoachPick(slots, squad, pseudoClubFor(squad));
    expect(filled.every((s) => s.playerId !== null)).toBe(true);
    const gkSlot = filled.find((s) => s.position === 'GK')!;
    const gkPlayer = squad.find((p) => p.id === gkSlot.playerId)!;
    expect(gkPlayer.injured).toBe(false); // a fit outfield player, not one of the injured real keepers
    expect(gkPlayer.position).not.toBe('GK');
  });

  it('never leaves a slot empty even when the squad has fewer than 11 fit players — an injured player plays through it as a last resort', () => {
    // 12-player squad, 4 injured — only 8 fit, short of the 11 needed.
    const squad: Player[] = [
      mk('gk1', 'GK'),
      mk('def0', 'DEF'),
      mk('def1', 'DEF'),
      mk('def2', 'DEF', true),
      mk('def3', 'DEF', true),
      mk('mid0', 'MID'),
      mk('mid1', 'MID'),
      mk('mid2', 'MID', true),
      mk('mid3', 'MID'),
      mk('fwd0', 'FWD'),
      mk('fwd1', 'FWD', true),
      mk('fwd2', 'FWD'),
    ];
    const fitCount = squad.filter((p) => !p.injured).length;
    expect(fitCount).toBeLessThan(11); // sanity-check the scenario is actually exercising the shortfall

    const slots = buildEmptySlots(FORMATION_442);
    const filled = fillEmptySlotsWithCoachPick(slots, squad, pseudoClubFor(squad));

    expect(filled.every((s) => s.playerId !== null)).toBe(true);
    expect(new Set(filled.map((s) => s.playerId)).size).toBe(11); // no player fielded twice
  });

  it('leaves manually-placed slots untouched, only filling the gaps', () => {
    const squad: Player[] = [
      mk('gk1', 'GK'),
      ...Array.from({ length: 4 }, (_, i) => mk(`def${i}`, 'DEF')),
      ...Array.from({ length: 4 }, (_, i) => mk(`mid${i}`, 'MID')),
      ...Array.from({ length: 2 }, (_, i) => mk(`fwd${i}`, 'FWD')),
    ];
    const slots = buildEmptySlots(FORMATION_442);
    slots[0] = { ...slots[0], playerId: 'gk1' };
    const filled = fillEmptySlotsWithCoachPick(slots, squad, pseudoClubFor(squad));
    expect(filled[0].playerId).toBe('gk1');
    expect(filled.every((s) => s.playerId !== null)).toBe(true);
  });
});
