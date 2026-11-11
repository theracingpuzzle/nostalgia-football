import { ClubCrest } from './ClubCrest';
import { GoalFrame } from './GoalFrame';
import { ALL_CLUBS } from '../../data/leagues';
import type { MonthlyPlayerStat } from '../../engine';
import type { Position } from '../../engine/types';

const ROW_ORDER: Position[] = ['GK', 'DEF', 'MID', 'FWD'];

/**
 * Read-only pitch graphic shared by Team of the Month and the end-of-season
 * summary — a fixed 11-a-side XI grouped into position rows, each row
 * shrinking to a uniform line (same pattern as the Team Selection pitch).
 */
export function FormationXIPitch({ entries, managedClubId }: { entries: MonthlyPlayerStat[]; managedClubId: string }) {
  const byRow = new Map<Position, MonthlyPlayerStat[]>();
  for (const row of ROW_ORDER) byRow.set(row, []);
  for (const entry of entries) byRow.get(entry.position)?.push(entry);

  return (
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
                <FormationCard key={entry.playerId} entry={entry} isManaged={entry.clubId === managedClubId} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FormationCard({ entry, isManaged }: { entry: MonthlyPlayerStat; isManaged: boolean }) {
  const club = ALL_CLUBS.find((c) => c.id === entry.clubId);
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
