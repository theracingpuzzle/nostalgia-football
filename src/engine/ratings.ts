import type { Fixture, Formation, Player, Position } from './types';

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

export type MoraleTone = 'good' | 'neutral' | 'bad';

export interface MoraleInfo {
  label: string;
  tone: MoraleTone;
}

/**
 * A new addition — the original's actual morale mechanic (if it had one)
 * isn't confirmed/known, see PLAN.md. Rather than a separate hidden stat to
 * track, this derives a mood straight from data already on hand: how much
 * game time a player's had this season and how well they've played in it.
 * Benched players who aren't getting a run out sour; regulars playing well
 * are buzzing; regulars playing poorly lose confidence. Nothing is modeled
 * before the season has any games played yet.
 */
export function computePlayerMorale(stat: MonthlyPlayerStat | undefined, teamGamesPlayed: number): MoraleInfo {
  if (teamGamesPlayed === 0) return { label: 'Fresh start', tone: 'neutral' };

  const appearances = stat?.appearances ?? 0;
  const appearanceRate = appearances / teamGamesPlayed;
  const rating = stat?.averageRating ?? 0;

  // Rating formula's baseline is 6.0 (see computeMatchRating), so thresholds
  // sit meaningfully above/below that rather than hugging it — otherwise
  // ordinary average performances would constantly misfire as good or bad.
  if (teamGamesPlayed >= 3 && appearanceRate < 0.34) return { label: 'Unsettled — wants game time', tone: 'bad' };
  if (appearanceRate >= 0.5 && rating >= 6.8) return { label: 'Buzzing', tone: 'good' };
  if (appearanceRate >= 0.5 && rating > 0 && rating < 5.3) return { label: 'Low confidence', tone: 'bad' };
  if (appearanceRate >= 0.5) return { label: 'Settled', tone: 'good' };
  return { label: 'Content', tone: 'neutral' };
}

export interface TeamOfThePeriod {
  /** e.g. "4-3-3" — whichever candidate formation scored best for this set of performances. */
  formationName: string;
  players: MonthlyPlayerStat[];
}

/**
 * Picks a Team of the Month/Season, ranked by average rating with goals
 * scored weighted in on top — matching "realistic, based on goals scored
 * etc." The shape isn't fixed: every formation in `candidateFormations` is
 * tried, and whichever one yields the strongest total XI for this
 * particular set of performances wins — so a month full of good forwards
 * and thin on defenders might come out as a 3-5-2 rather than 4-3-3, the
 * same way a real end-of-month team varies. Not pulled from any confirmed
 * source for the original game; this whole feature is a new addition.
 */
export function pickTeamOfTheMonth(stats: MonthlyPlayerStat[], candidateFormations: Formation[]): TeamOfThePeriod {
  const score = (s: MonthlyPlayerStat) => s.averageRating + s.goals * 0.3;
  const byPosition = new Map<Position, MonthlyPlayerStat[]>();
  for (const s of stats) {
    const list = byPosition.get(s.position) ?? [];
    list.push(s);
    byPosition.set(s.position, list);
  }
  for (const list of byPosition.values()) list.sort((a, b) => score(b) - score(a));

  let best: TeamOfThePeriod = { formationName: candidateFormations[0]?.name ?? '', players: [] };
  let bestScore = -Infinity;

  for (const formation of candidateFormations) {
    const picked: MonthlyPlayerStat[] = [];
    let total = 0;
    for (const slot of formation.slots) {
      const candidates = (byPosition.get(slot.position) ?? []).slice(0, slot.count);
      picked.push(...candidates);
      total += candidates.reduce((sum, c) => sum + score(c), 0);
    }
    if (total > bestScore) {
      bestScore = total;
      best = { formationName: formation.name, players: picked };
    }
  }

  return best;
}
