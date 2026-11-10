import type { Position } from './types';

// Ordinal distance between broad positions. GK is deliberately isolated —
// an outfielder in goal (or a keeper outfield) is a disaster, not just a
// mismatch.
const ORDER: Position[] = ['DEF', 'MID', 'FWD'];

/**
 * How well a player's natural position fits a formation slot, as a
 * multiplier in (0, 1]. Data-driven distance table rather than nested
 * conditionals: 0 tiers away = 1.0, 1 tier = 0.8, 2 tiers = 0.55.
 */
export function positionSuitability(playerPosition: Position, slotPosition: Position): number {
  if (playerPosition === slotPosition) return 1;

  const playerIsGK = playerPosition === 'GK';
  const slotIsGK = slotPosition === 'GK';
  if (playerIsGK || slotIsGK) return 0.15; // keeper out of goal, or vice versa

  const distance = Math.abs(ORDER.indexOf(playerPosition) - ORDER.indexOf(slotPosition));
  const falloff = [1, 0.8, 0.55];
  return falloff[distance] ?? 0.4;
}
