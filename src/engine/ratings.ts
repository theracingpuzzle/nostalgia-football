import type { Fixture, Player, Position } from './types';

/** Deterministic 0-1 value from a string, so the same fixture+player always gets the same bit of variance rather than re-rolling on every render. */
function hash01(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * A lightweight, deterministic post-match rating out of 10 — a new addition
 * for Team of the Month, not a feature confirmed from the original (which
 * almost certainly never had this). Built entirely from what the match
 * engine already produces: result, clean sheets/goals conceded for
 * defenders and keepers, goals scored by this player, a small nudge from
 * their own quality, and a touch of deterministic per-match variance so
 * identical scorelines don't hand out identical ratings. There's no
 * per-event simulation behind it (no tackles/passes/assists modeled).
 */
export function computeMatchRating(player: Player, side: 'home' | 'away', fixture: Fixture): number {
  const result = fixture.result;
  if (!result) return 6;

  const teamGoals = side === 'home' ? result.homeGoals : result.awayGoals;
  const oppGoals = side === 'home' ? result.awayGoals : result.homeGoals;

  let rating = 6;
  if (teamGoals > oppGoals) rating += 0.6;
  else if (teamGoals === oppGoals) rating += 0.1;
  else rating -= 0.4;

  if (player.position === 'GK' || player.position === 'DEF') {
    if (oppGoals === 0) rating += 0.6;
    rating -= Math.min(oppGoals, 3) * 0.15;
  }

  const scorers = side === 'home' ? result.homeScorers : result.awayScorers;
  const goalsThisMatch = scorers.find((s) => s.playerId === player.id)?.minutes.length ?? 0;
  rating += goalsThisMatch;

  const qualityAttr =
    player.position === 'GK'
      ? player.attributes.goalkeeping
      : player.position === 'DEF'
        ? player.attributes.defending
        : player.position === 'FWD'
          ? player.attributes.shooting
          : player.attributes.passing;
  rating += (qualityAttr - 60) / 200;

  rating += (hash01(`${fixture.id}:${player.id}`) - 0.5) * 0.6;

  return Math.max(1, Math.min(10, Math.round(rating * 10) / 10));
}

export interface MonthlyPlayerStat {
  playerId: string;
  playerName: string;
  position: Position;
  clubId: string;
  appearances: number;
  goals: number;
  averageRating: number;
}

/**
 * Aggregates per-player stats across played fixtures in a matchday range
 * (see SEASON_MONTHS) — one row per player who actually appeared, with
 * their average match rating and goals scored in that window. `findPlayer`
 * is expected to look a player id up across every club's *current* squad
 * (not just the two clubs in a given fixture), so someone since transferred
 * is still found — their shown club just reflects where they are now, not
 * necessarily who they played for in that match. A known, minor
 * approximation rather than tracking historical squad membership.
 */
export function computeMonthlyPlayerStats(
  fixtures: Fixture[],
  matchdayStart: number,
  matchdayEnd: number,
  findPlayer: (playerId: string) => { player: Player; clubId: string } | undefined,
): MonthlyPlayerStat[] {
  const totals = new Map<string, { sum: number; count: number; goals: number }>();

  for (const fixture of fixtures) {
    if (!fixture.played || !fixture.result || fixture.matchday < matchdayStart || fixture.matchday > matchdayEnd) continue;

    for (const side of ['home', 'away'] as const) {
      const xi = side === 'home' ? fixture.result.homeXI : fixture.result.awayXI;
      const scorers = side === 'home' ? fixture.result.homeScorers : fixture.result.awayScorers;
      for (const playerId of xi) {
        const found = findPlayer(playerId);
        if (!found) continue;
        const rating = computeMatchRating(found.player, side, fixture);
        const goals = scorers.find((s) => s.playerId === playerId)?.minutes.length ?? 0;
        const entry = totals.get(playerId) ?? { sum: 0, count: 0, goals: 0 };
        entry.sum += rating;
        entry.count += 1;
        entry.goals += goals;
        totals.set(playerId, entry);
      }
    }
  }

  const rows: MonthlyPlayerStat[] = [];
  for (const [playerId, entry] of totals) {
    const found = findPlayer(playerId);
    if (!found) continue;
    rows.push({
      playerId,
      playerName: found.player.name,
      position: found.player.position,
      clubId: found.clubId,
      appearances: entry.count,
      goals: entry.goals,
      averageRating: Math.round((entry.sum / entry.count) * 10) / 10,
    });
  }
  return rows;
}

const TOTM_FORMATION: { position: Position; count: number }[] = [
  { position: 'GK', count: 1 },
  { position: 'DEF', count: 4 },
  { position: 'MID', count: 3 },
  { position: 'FWD', count: 3 },
];

/**
 * Picks a Team of the Month in a fixed 4-3-3 shape plus the keeper (the shape real
 * end-of-month team graphics typically use), ranked by average rating with
 * goals scored weighted in on top — matching "realistic, based on goals
 * scored etc." Not pulled from any confirmed source for the original game;
 * this whole feature is a new addition.
 */
export function pickTeamOfTheMonth(stats: MonthlyPlayerStat[]): MonthlyPlayerStat[] {
  const score = (s: MonthlyPlayerStat) => s.averageRating + s.goals * 0.3;
  const picked: MonthlyPlayerStat[] = [];
  for (const { position, count } of TOTM_FORMATION) {
    const candidates = stats.filter((s) => s.position === position).sort((a, b) => score(b) - score(a));
    picked.push(...candidates.slice(0, count));
  }
  return picked;
}
