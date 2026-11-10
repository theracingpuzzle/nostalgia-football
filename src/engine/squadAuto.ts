import type { Club, Formation, Player } from './types';

/** Simple positional rating used only for ranking players during auto-selection — not match strength. */
function rating(player: Player): number {
  const a = player.attributes;
  switch (player.position) {
    case 'GK':
      return a.goalkeeping * 0.7 + a.physical * 0.15 + a.passing * 0.15;
    case 'DEF':
      return a.defending * 0.5 + a.physical * 0.25 + a.pace * 0.25;
    case 'MID':
      return a.passing * 0.3 + a.shooting * 0.25 + a.pace * 0.25 + a.defending * 0.2;
    case 'FWD':
      return a.shooting * 0.5 + a.pace * 0.3 + a.passing * 0.2;
  }
}

/**
 * Picks the strongest available XI for a formation: best natural fit per
 * slot first, then backfills any unfilled slots with the best remaining
 * players (covers squads that don't exactly match the formation's shape).
 * Used both as the player's default XI and to field AI-controlled opponents.
 */
export function pickBestXI(club: Club, formation: Formation): Player[] {
  const chosen: Player[] = [];
  const used = new Set<string>();

  for (const slot of formation.slots) {
    const candidates = club.players
      .filter((player) => player.position === slot.position && !used.has(player.id))
      .sort((a, b) => rating(b) - rating(a));

    for (let i = 0; i < slot.count; i++) {
      const pick = candidates[i];
      if (pick) {
        chosen.push(pick);
        used.add(pick.id);
      }
    }
  }

  if (chosen.length < 11) {
    const rest = club.players.filter((player) => !used.has(player.id)).sort((a, b) => rating(b) - rating(a));
    for (const player of rest) {
      if (chosen.length >= 11) break;
      chosen.push(player);
      used.add(player.id);
    }
  }

  return chosen.slice(0, 11);
}
