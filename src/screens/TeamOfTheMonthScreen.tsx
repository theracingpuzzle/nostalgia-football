import { useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { ClubCrest } from '../components/ui/ClubCrest';
import { GoalFrame } from '../components/ui/GoalFrame';
import { Panel } from '../components/ui/Panel';
import { PREMIER_LEAGUE_2008_09 } from '../data/premierLeague0809';
import { SEASON_MONTHS } from '../data/seasonMonths';
import { computeMonthlyPlayerStats, pickTeamOfTheMonth, type MonthlyPlayerStat } from '../engine';
import type { Fixture, Player, Position } from '../engine/types';

const ROW_ORDER: Position[] = ['GK', 'DEF', 'MID', 'FWD'];

/** Last month index with at least one played fixture, so the screen opens on real data rather than an empty future month. */
function latestMonthWithData(fixtures: Fixture[]): number {
  for (let i = SEASON_MONTHS.length - 1; i >= 0; i--) {
    const { matchdayStart, matchdayEnd } = SEASON_MONTHS[i];
    if (fixtures.some((f) => f.played && f.matchday >= matchdayStart && f.matchday <= matchdayEnd)) return i;
  }
  return 0;
}

/**
 * League-wide "Team of the Month" — a new addition, not a reconstruction of
 * anything from the original (which almost certainly never had this). Picks
 * a 4-3-3 shaped XI (plus the keeper) from whoever played that block of matchdays, ranked by
 * a lightweight post-match rating (see engine/ratings.ts) with goals scored
 * weighted in on top. Flagged here the same way the transfer window is —
 * a fun addition, not a faithfulness claim.
 */
export function TeamOfTheMonthScreen({ fixtures, allSquads, managedClubId }: { fixtures: Fixture[]; allSquads: Record<string, Player[]>; managedClubId: string }) {
  const [monthIndex, setMonthIndex] = useState(() => latestMonthWithData(fixtures));
  const month = SEASON_MONTHS[monthIndex];

  const playerIndex = useMemo(() => {
    const map = new Map<string, { player: Player; clubId: string }>();
    for (const [clubId, players] of Object.entries(allSquads)) {
      for (const player of players) map.set(player.id, { player, clubId });
    }
    return map;
  }, [allSquads]);

  const totm = useMemo(() => {
    const stats = computeMonthlyPlayerStats(fixtures, month.matchdayStart, month.matchdayEnd, (id) => playerIndex.get(id));
    return pickTeamOfTheMonth(stats);
  }, [fixtures, month, playerIndex]);

  const byRow = useMemo(() => {
    const map = new Map<Position, MonthlyPlayerStat[]>();
    for (const row of ROW_ORDER) map.set(row, []);
    for (const entry of totm) map.get(entry.position)?.push(entry);
    return map;
  }, [totm]);

  const hasAnyData = totm.length > 0;

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
        <Button variant="secondary" disabled={monthIndex === SEASON_MONTHS.length - 1} onClick={() => setMonthIndex((i) => Math.min(SEASON_MONTHS.length - 1, i + 1))}>
          ▶
        </Button>
      </div>

      <Panel title="4-3-3">
        {!hasAnyData ? (
          <p className="p-3 text-center text-sm text-ink/70">No matches played in this block of fixtures yet.</p>
        ) : (
          <div className="relative overflow-hidden rounded-sm border-4 border-white bg-pitch px-3 py-4">
            <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t-2 border-white/60" />
            <div className="pointer-events-none absolute left-1/2 top-0 h-16 w-44 -translate-x-1/2 border-2 border-t-0 border-white/60" />
            <div className="pointer-events-none absolute bottom-0 left-1/2 h-16 w-44 -translate-x-1/2 border-2 border-b-0 border-white/60" />
            <GoalFrame side="top" size={64} />
            <GoalFrame side="bottom" size={64} />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60" />

            <div className="relative flex flex-col gap-4">
              {ROW_ORDER.map((position) => {
                const rowPlayers = byRow.get(position) ?? [];
                if (rowPlayers.length === 0) return null;
                return (
                  <div key={position} className="flex flex-row items-stretch justify-center gap-1.5">
                    {rowPlayers.map((entry) => (
                      <TotmCard key={entry.playerId} entry={entry} isManaged={entry.clubId === managedClubId} />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

function TotmCard({ entry, isManaged }: { entry: MonthlyPlayerStat; isManaged: boolean }) {
  const club = PREMIER_LEAGUE_2008_09.find((c) => c.id === entry.clubId);
  return (
    <div
      className={`flex flex-1 basis-0 min-w-0 max-w-[120px] flex-col items-center gap-0.5 rounded-sm border-2 bg-ink/80 px-1 py-1.5 text-center shadow-[1px_1px_0_rgba(0,0,0,0.4)] md:flex-none ${
        isManaged ? 'border-amber-300' : 'border-white/40'
      }`}
    >
      {club && <ClubCrest primaryColor={club.primaryColor} secondaryColor={club.secondaryColor} label={club.shortName} crestPath={club.crestPath} size={20} />}
      <span className="w-full break-words text-[11px] font-bold leading-tight text-white md:text-xs">{entry.playerName}</span>
      <div className="flex items-center gap-1 text-[10px] text-white/70">
        <span className="rounded-sm bg-amber-500 px-1 font-bold text-ink">{entry.averageRating.toFixed(1)}</span>
        {entry.goals > 0 && <span>⚽ {entry.goals}</span>}
      </div>
    </div>
  );
}
