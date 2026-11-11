import type { Player } from './types';

/** Tuned so the ~11 players who start a match for one club pick up roughly one new injury every several matchdays on average — frequent enough to matter over a season, not so often squad rotation becomes implausible. */
const INJURY_CHANCE_PER_PLAYER = 0.03;

function rollInjuryDuration(random: () => number): number {
  const r = random();
  if (r < 0.5) return 1 + Math.floor(random() * 2); // 1-2 matchdays: a knock
  if (r < 0.85) return 3 + Math.floor(random() * 2); // 3-4 matchdays: a strain
  return 5 + Math.floor(random() * 4); // 5-8 matchdays: a longer lay-off
}

/**
 * Simulated injuries — a new addition, not confirmed from the original
 * (which almost certainly never modeled this). After each matchday, every
 * player who actually started a match has a small independent chance of
 * picking up a knock, out for a random number of matchdays. A previously
 * injured player recovers automatically once the matchday reaches their
 * return matchday. Takes the same kind of seeded random generator the match
 * engine uses (see engine/rng.ts createRandom), so a career replays
 * identically from its starting seed, same as the matches themselves.
 */
export function applyInjuryUpdates(
  allSquads: Record<string, Player[]>,
  matchday: number,
  playedPlayerIdsByClub: Record<string, string[]>,
  random: () => number,
): Record<string, Player[]> {
  const next: Record<string, Player[]> = {};

  for (const [clubId, players] of Object.entries(allSquads)) {
    const playedIds = new Set(playedPlayerIdsByClub[clubId] ?? []);
    next[clubId] = players.map((p) => {
      if (p.injured) {
        if (p.injuryReturnMatchday !== undefined && matchday >= p.injuryReturnMatchday) {
          return { ...p, injured: false, injuryReturnMatchday: undefined };
        }
        return p;
      }
      if (playedIds.has(p.id) && random() < INJURY_CHANCE_PER_PLAYER) {
        return { ...p, injured: true, injuryReturnMatchday: matchday + rollInjuryDuration(random) };
      }
      return p;
    });
  }

  return next;
}
