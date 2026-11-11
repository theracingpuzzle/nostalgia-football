import { useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { FormationXIPitch } from '../components/ui/FormationXIPitch';
import { Panel } from '../components/ui/Panel';
import { FORMATIONS } from '../data/formations';
import { buildSeasonMonths, type SeasonMonth } from '../data/seasonMonths';
import { computeMonthlyPlayerStats, pickTeamOfTheMonth } from '../engine';
import type { Fixture, Player } from '../engine/types';

/** Last month index with at least one played fixture, so the screen opens on real data rather than an empty future month. */
function latestMonthWithData(fixtures: Fixture[], seasonMonths: SeasonMonth[]): number {
  for (let i = seasonMonths.length - 1; i >= 0; i--) {
    const { matchdayStart, matchdayEnd } = seasonMonths[i];
    if (fixtures.some((f) => f.played && f.matchday >= matchdayStart && f.matchday <= matchdayEnd)) return i;
  }
  return 0;
}

/**
 * League-wide "Team of the Month" — a new addition, not a reconstruction of
 * anything from the original (which almost certainly never had this). Picks
 * whichever of the game's own formations (4-4-2/4-3-3/3-5-2/4-5-1) best fits
 * that block of matchdays' standout performances, ranked by a lightweight
 * post-match rating (see engine/ratings.ts) with goals scored weighted in
 * on top. Flagged here the same way the transfer window is — a fun
 * addition, not a faithfulness claim.
 */
export function TeamOfTheMonthScreen({
  fixtures,
  totalMatchdays,
  allSquads,
  managedClubId,
}: {
  fixtures: Fixture[];
  /** ((clubCount - 1) * 2) for the managed league — drives month boundaries, not always 38. */
  totalMatchdays: number;
  allSquads: Record<string, Player[]>;
  managedClubId: string;
}) {
  const seasonMonths = useMemo(() => buildSeasonMonths(totalMatchdays), [totalMatchdays]);
  const [monthIndex, setMonthIndex] = useState(() => latestMonthWithData(fixtures, seasonMonths));
  const month = seasonMonths[monthIndex];

  const playerIndex = useMemo(() => {
    const map = new Map<string, { player: Player; clubId: string }>();
    for (const [clubId, players] of Object.entries(allSquads)) {
      for (const player of players) map.set(player.id, { player, clubId });
    }
    return map;
  }, [allSquads]);

  const totm = useMemo(() => {
    const stats = computeMonthlyPlayerStats(fixtures, month.matchdayStart, month.matchdayEnd, (id) => playerIndex.get(id));
    return pickTeamOfTheMonth(stats, FORMATIONS);
  }, [fixtures, month, playerIndex]);

  return (
    <div className="mx-auto max-w-3xl p-4 text-white">
      <h2 className="mb-1 text-center text-xl font-black uppercase tracking-wide">Team of the Month</h2>
      <p className="mb-3 text-center text-sm text-white/70">
        A new addition, not something confirmed from the original — a league-wide XI picked from post-match ratings and goals scored. See PLAN.md for how it's worked out.
      </p>

      <div className="mb-3 flex items-center justify-center gap-3">
        <Button variant="secondary" disabled={monthIndex === 0} onClick={() => setMonthIndex((i) => Math.max(0, i - 1))}>
          ◀
        </Button>
        <span className="min-w-[180px] text-center text-base font-bold uppercase tracking-wide">
          {month.name} <span className="font-normal text-white/60">(MD{month.matchdayStart}-{month.matchdayEnd})</span>
        </span>
        <Button variant="secondary" disabled={monthIndex === seasonMonths.length - 1} onClick={() => setMonthIndex((i) => Math.min(seasonMonths.length - 1, i + 1))}>
          ▶
        </Button>
      </div>

      <Panel title={totm.players.length > 0 ? totm.formationName : 'No data yet'}>
        {totm.players.length === 0 ? (
          <p className="p-3 text-center text-sm text-ink/70">No matches played in this block of fixtures yet.</p>
        ) : (
          <FormationXIPitch entries={totm.players} managedClubId={managedClubId} />
        )}
      </Panel>
    </div>
  );
}
