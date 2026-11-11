import { useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { ClubCrest } from '../components/ui/ClubCrest';
import { Panel } from '../components/ui/Panel';
import type { ClubListing } from '../data/premierLeague0809';
import { computeMonthlyPlayerStats } from '../engine';
import type { Fixture, LeagueTableRow, Player, Position } from '../engine/types';
import { getLeagueZone, ordinal, ZONE_STYLES } from '../utils/leagueZones';

const POSITION_ORDER: Position[] = ['GK', 'DEF', 'MID', 'FWD'];

/**
 * A club's season-so-far overview, opened by tapping its row in the League
 * Table — the final record plus a per-player breakdown (appearances, goals,
 * average match rating) using the same ratings engine Team of the Month
 * uses. Works for any club in the league, not just the one you manage.
 */
export function ClubOverviewScreen({
  club,
  leagueRow,
  leaguePosition,
  totalClubs,
  squad,
  fixtures,
  allSquads,
  onClose,
}: {
  club: ClubListing;
  leagueRow: LeagueTableRow | undefined;
  leaguePosition: number;
  totalClubs: number;
  squad: Player[];
  fixtures: Fixture[];
  allSquads: Record<string, Player[]>;
  onClose: () => void;
}) {
  const playerIndex = useMemo(() => {
    const map = new Map<string, { player: Player; clubId: string }>();
    for (const [clubId, players] of Object.entries(allSquads)) {
      for (const player of players) map.set(player.id, { player, clubId });
    }
    return map;
  }, [allSquads]);

  const clubFixtures = useMemo(() => fixtures.filter((f) => f.homeClubId === club.id || f.awayClubId === club.id), [fixtures, club.id]);

  const statsByPlayerId = useMemo(() => {
    const stats = computeMonthlyPlayerStats(clubFixtures, 1, 38, (id) => playerIndex.get(id));
    return new Map(stats.map((s) => [s.playerId, s]));
  }, [clubFixtures, playerIndex]);

  const sortedSquad = useMemo(() => {
    return [...squad].sort((a, b) => {
      const posDiff = POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position);
      if (posDiff !== 0) return posDiff;
      return (statsByPlayerId.get(b.id)?.appearances ?? 0) - (statsByPlayerId.get(a.id)?.appearances ?? 0);
    });
  }, [squad, statsByPlayerId]);

  const zone = getLeagueZone(leaguePosition, totalClubs);

  return (
    <div className="mx-auto max-w-2xl p-4 text-white">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <ClubCrest primaryColor={club.primaryColor} secondaryColor={club.secondaryColor} label={club.shortName} crestPath={club.crestPath} size={36} />
          <div className="min-w-0 leading-tight">
            <span className="block truncate text-lg font-black uppercase tracking-wide">{club.name}</span>
            <span className="flex items-center gap-1.5 text-xs text-white/70">
              {zone && <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${ZONE_STYLES[zone].dot}`} />}
              {ordinal(leaguePosition)} of {totalClubs}
            </span>
          </div>
        </div>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>

      {leagueRow && (
        <Panel title="Season Record" className="mb-3">
          <div className="grid grid-cols-4 gap-2 p-1 text-center text-sm sm:grid-cols-8">
            <Stat label="P" value={leagueRow.played} />
            <Stat label="W" value={leagueRow.won} />
            <Stat label="D" value={leagueRow.drawn} />
            <Stat label="L" value={leagueRow.lost} />
            <Stat label="GF" value={leagueRow.goalsFor} />
            <Stat label="GA" value={leagueRow.goalsAgainst} />
            <Stat label="GD" value={leagueRow.goalDifference} />
            <Stat label="Pts" value={leagueRow.points} />
          </div>
        </Panel>
      )}

      <Panel title="Squad & Season Stats">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-ink text-white">
                <th className="px-2 py-1.5 text-left font-bold uppercase">Player</th>
                <th className="px-2 py-1.5 text-left font-bold uppercase">Pos</th>
                <th className="px-2 py-1.5 text-right font-bold uppercase">Apps</th>
                <th className="px-2 py-1.5 text-right font-bold uppercase">Goals</th>
                <th className="px-2 py-1.5 text-right font-bold uppercase">Avg</th>
              </tr>
            </thead>
            <tbody>
              {sortedSquad.map((p, i) => {
                const stat = statsByPlayerId.get(p.id);
                return (
                  <tr key={p.id} className={`border-b border-ink/10 ${i % 2 === 0 ? 'bg-white/60' : 'bg-white/30'}`}>
                    <td className={`px-2 py-1.5 font-semibold ${p.injured ? 'text-pink-700' : 'text-ink'}`}>
                      {p.name}
                      {p.injured ? ` (inj${p.injuryReturnMatchday ? `, back MD${p.injuryReturnMatchday}` : ''})` : ''}
                    </td>
                    <td className="px-2 py-1.5 text-ink/80">{p.position}</td>
                    <td className="px-2 py-1.5 text-right text-ink/80">{stat?.appearances ?? 0}</td>
                    <td className="px-2 py-1.5 text-right text-ink/80">{stat?.goals ?? 0}</td>
                    <td className="px-2 py-1.5 text-right text-ink/80">{stat ? stat.averageRating.toFixed(1) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-lg font-black text-ink">{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-ink/60">{label}</span>
    </div>
  );
}
