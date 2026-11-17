import { Button } from '../components/ui/Button';
import { ClubCrest } from '../components/ui/ClubCrest';
import { Panel } from '../components/ui/Panel';
import { ALL_CLUBS, LEAGUES } from '../data/leagues';
import type { CareerHistoryEntry, CareerHistoryOutcome } from '../utils/careerStorage';
import type { CurrentStintSnapshot } from '../utils/careerTransition';
import { ordinal } from '../utils/leagueZones';

const OUTCOME_STYLES: Record<CareerHistoryOutcome, { label: string; tone: string }> = {
  champion: { label: '🏆 Champion', tone: 'bg-amber-400 text-ink border-amber-600' },
  'promoted-automatic': { label: 'Promoted', tone: 'bg-emerald-600 text-white border-emerald-800' },
  'promoted-playoff': { label: 'Promoted (Play-offs)', tone: 'bg-emerald-600 text-white border-emerald-800' },
  'lost-playoff-semifinal': { label: 'Lost Play-off Semi', tone: 'bg-ink/70 text-white border-ink' },
  'lost-playoff-final': { label: 'Lost Play-off Final', tone: 'bg-ink/70 text-white border-ink' },
  'relegated-real': { label: 'Relegated', tone: 'bg-red-700 text-white border-red-900' },
  stayed: { label: 'Stayed Up', tone: 'bg-ink/50 text-white border-ink/70' },
  sacked: { label: 'Sacked', tone: 'bg-red-700 text-white border-red-900' },
  left: { label: 'Left for New Job', tone: 'bg-sky-600 text-white border-sky-800' },
};

const TROPHY_OUTCOMES: CareerHistoryOutcome[] = ['champion', 'promoted-automatic', 'promoted-playoff'];

function clubLabel(clubId: string) {
  const club = ALL_CLUBS.find((c) => c.id === clubId);
  return club ?? { id: clubId, name: clubId, shortName: clubId.slice(0, 3).toUpperCase(), primaryColor: '#334155', secondaryColor: '#e2e8f0', crestPath: undefined };
}

function leagueName(leagueId: string): string {
  return LEAGUES.find((l) => l.id === leagueId)?.name ?? leagueId;
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center rounded-sm border-2 border-ink/20 bg-white/70 px-2 py-2">
      <span className="text-lg font-black text-ink">{value}</span>
      <span className="text-center text-[10px] font-bold uppercase tracking-wide text-ink/60">{label}</span>
    </div>
  );
}

function StintRow({
  clubId,
  leagueId,
  seasonNumber,
  played,
  won,
  drawn,
  lost,
  position,
  totalClubs,
  outcome,
}: {
  clubId: string;
  leagueId: string;
  seasonNumber: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  position: number;
  totalClubs: number;
  outcome?: CareerHistoryOutcome;
}) {
  const club = clubLabel(clubId);
  const badge = outcome ? OUTCOME_STYLES[outcome] : { label: 'In Progress', tone: 'bg-sky-600 text-white border-sky-800' };
  return (
    <div className="flex items-center justify-between gap-3 rounded-sm border-2 border-ink/20 bg-white/70 px-3 py-2">
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <ClubCrest primaryColor={club.primaryColor} secondaryColor={club.secondaryColor} label={club.shortName} crestPath={club.crestPath} size={28} />
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-bold text-ink">{club.name}</span>
          <span className="block truncate text-xs text-ink/60">
            {leagueName(leagueId)} · Season {seasonNumber} · {played}P {won}W {drawn}D {lost}L · {ordinal(position)}/{totalClubs}
          </span>
        </span>
      </span>
      <span className={`shrink-0 whitespace-nowrap rounded-sm border-2 px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${badge.tone}`}>{badge.label}</span>
    </div>
  );
}

/**
 * A persistent log of every club and season the player has managed —
 * not scoped to the current club/job, since the whole point is
 * seeing the career that spans across sackings, voluntary moves, and
 * unemployment spells (see utils/careerStorage.ts's
 * `CareerHistoryEntry`/`careerHistory`). Reachable from three places:
 * the title screen (reading a save directly, no live career needed —
 * see App.tsx), the managed-league CareerNav header, and the
 * Unemployed screen's header — all render this same component as the
 * usual fixed-overlay.
 */
export function CareerOverviewScreen({
  managerName,
  history,
  currentStint,
  onClose,
}: {
  managerName: string;
  /** Oldest first — this screen reverses it for display. */
  history: CareerHistoryEntry[];
  /** The in-progress stint, if the player is currently managing a club — shown separately, not counted toward trophies/sackings below. */
  currentStint: CurrentStintSnapshot | null;
  onClose: () => void;
}) {
  const totals = history.reduce(
    (acc, entry) => ({
      played: acc.played + entry.played,
      won: acc.won + entry.won,
      drawn: acc.drawn + entry.drawn,
      lost: acc.lost + entry.lost,
      trophies: acc.trophies + (TROPHY_OUTCOMES.includes(entry.outcome) ? 1 : 0),
      sackings: acc.sackings + (entry.outcome === 'sacked' ? 1 : 0),
    }),
    { played: 0, won: 0, drawn: 0, lost: 0, trophies: 0, sackings: 0 },
  );
  const clubsManaged = new Set(history.map((e) => e.clubId).concat(currentStint ? [currentStint.clubId] : []));
  const winPct = totals.played > 0 ? Math.round((totals.won / totals.played) * 100) : 0;
  const reversedHistory = [...history].reverse();

  return (
    <div className="mx-auto max-w-2xl p-4 text-white">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-xl font-black uppercase tracking-wide">Career Overview</h2>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
      <p className="mb-3 text-center text-sm text-white/70">{managerName}</p>

      <Panel title="Lifetime Record" className="mb-3">
        <div className="grid grid-cols-3 gap-2 p-1 sm:grid-cols-6">
          <StatTile label="Clubs" value={clubsManaged.size} />
          <StatTile label="Seasons" value={history.length + (currentStint ? 1 : 0)} />
          <StatTile label="Played" value={totals.played} />
          <StatTile label="W-D-L" value={`${totals.won}-${totals.drawn}-${totals.lost}`} />
          <StatTile label="Win %" value={`${winPct}%`} />
          <StatTile label="Trophies" value={totals.trophies} />
        </div>
        {totals.sackings > 0 && <p className="px-1 pb-1 text-center text-[11px] italic text-ink/60">Sacked {totals.sackings} time{totals.sackings === 1 ? '' : 's'}.</p>}
      </Panel>

      {currentStint && (
        <Panel title="Currently Managing" className="mb-3">
          <StintRow
            clubId={currentStint.clubId}
            leagueId={currentStint.leagueId}
            seasonNumber={currentStint.seasonNumber}
            played={currentStint.played}
            won={currentStint.won}
            drawn={currentStint.drawn}
            lost={currentStint.lost}
            position={currentStint.position}
            totalClubs={currentStint.totalClubs}
          />
        </Panel>
      )}

      <Panel title="History">
        {reversedHistory.length === 0 ? (
          <p className="p-3 text-center text-sm text-ink/70">No seasons completed yet.</p>
        ) : (
          <div className="flex flex-col gap-2 p-1">
            {reversedHistory.map((entry, i) => (
              <StintRow key={`${entry.clubId}-${entry.seasonNumber}-${i}`} {...entry} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
