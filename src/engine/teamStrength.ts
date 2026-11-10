import { positionSuitability } from './positionSuitability';
import type { Formation, Player, PlayerAttributes, Position, TeamMatchInput } from './types';

export interface TeamStrength {
  attack: number;
  defense: number;
  overall: number;
}

type AttributeWeights = Partial<Record<keyof PlayerAttributes, number>>;

// How much each attribute matters for attacking vs. defending output,
// depending on which slot a player is deployed in. Data-driven on purpose —
// tune these numbers to change the game's feel without touching logic.
const ATTACK_WEIGHTS: Record<Position, AttributeWeights> = {
  GK: { passing: 0.6, goalkeeping: 0.4 },
  DEF: { passing: 0.4, pace: 0.3, shooting: 0.1, physical: 0.2 },
  MID: { passing: 0.35, shooting: 0.25, pace: 0.25, physical: 0.15 },
  FWD: { shooting: 0.45, pace: 0.3, passing: 0.15, physical: 0.1 },
};

const DEFENSE_WEIGHTS: Record<Position, AttributeWeights> = {
  GK: { goalkeeping: 0.7, physical: 0.15, defending: 0.15 },
  DEF: { defending: 0.5, physical: 0.3, pace: 0.2 },
  MID: { defending: 0.4, passing: 0.3, physical: 0.3 },
  FWD: { defending: 0.6, physical: 0.4 },
};

function weightedAttribute(attributes: PlayerAttributes, weights: AttributeWeights): number {
  let sum = 0;
  let totalWeight = 0;
  for (const [key, weight] of Object.entries(weights) as [keyof PlayerAttributes, number][]) {
    sum += attributes[key] * weight;
    totalWeight += weight;
  }
  return totalWeight > 0 ? sum / totalWeight : 0;
}

export function expandSlots(formation: Formation): Position[] {
  return formation.slots.flatMap((slot) => Array(slot.count).fill(slot.position) as Position[]);
}

/**
 * Greedy max-weight assignment of players to formation slots: repeatedly
 * assign the best-fitting unassigned (player, slot) pair. Good enough for a
 * squad of 11 — a full optimal assignment is unnecessary complexity here.
 */
function assignPlayersToSlots(players: Player[], slots: Position[]): { player: Player; slot: Position }[] {
  const remainingPlayers = [...players];
  const remainingSlots = slots.map((position, index) => ({ position, index }));
  const assignments: { player: Player; slot: Position }[] = [];

  while (remainingPlayers.length > 0 && remainingSlots.length > 0) {
    let best = { playerIdx: 0, slotIdx: 0, score: -1 };
    for (let p = 0; p < remainingPlayers.length; p++) {
      for (let s = 0; s < remainingSlots.length; s++) {
        const score = positionSuitability(remainingPlayers[p].position, remainingSlots[s].position);
        if (score > best.score) {
          best = { playerIdx: p, slotIdx: s, score };
        }
      }
    }
    const [player] = remainingPlayers.splice(best.playerIdx, 1);
    const [slot] = remainingSlots.splice(best.slotIdx, 1);
    assignments.push({ player, slot: slot.position });
  }

  return assignments;
}

export function calculateTeamStrength({ formation, selectedXI }: TeamMatchInput): TeamStrength {
  if (selectedXI.length === 0) {
    return { attack: 1, defense: 1, overall: 1 };
  }

  const slots = expandSlots(formation);
  const assignments = assignPlayersToSlots(selectedXI, slots);

  let attackTotal = 0;
  let defenseTotal = 0;

  for (const { player, slot } of assignments) {
    const suitability = positionSuitability(player.position, slot);
    attackTotal += weightedAttribute(player.attributes, ATTACK_WEIGHTS[slot]) * suitability;
    defenseTotal += weightedAttribute(player.attributes, DEFENSE_WEIGHTS[slot]) * suitability;
  }

  const count = assignments.length;
  const attack = (attackTotal / count) * formation.attackBias;
  const defense = (defenseTotal / count) * formation.defenseBias;

  return {
    attack: clamp(attack),
    defense: clamp(defense),
    overall: clamp((attack + defense) / 2),
  };
}

function clamp(value: number): number {
  return Math.max(1, Math.min(100, value));
}
