import { useState } from 'react';
import { ClubCrest } from '../components/ui/ClubCrest';
import { Panel } from '../components/ui/Panel';
import { ALL_CLUBS } from '../data/leagues';
import type { LeagueDefinition } from '../data/leagues';
import type { ManagerNewsEvent } from '../engine/managers';
import type { Fixture, LeagueTableRow, Player } from '../engine/types';
import { getLeagueZone, zonesForTier, ZONE_STYLES } from '../utils/leagueZones';
import { ClubOverviewScreen } from './ClubOverviewScreen';

export function LeagueTableScreen({
  table,
  managedClubId,
  fixtures,
  allSquads,
  leagueTier,
  managerNews,
  managerNameOf,
}: {
  table: LeagueTableRow[];
  managedClubId: string;
  fixtures: Fixture[];
  allSquads: Record<string, Player[]>;
  leagueTier: LeagueDefinition['tier'];
  /** This league's managerial news (sackings and appointments), newest first — see engine/managers.ts. Omitted where a league doesn't have manager data wired up yet. */
  managerNews?: ManagerNewsEvent[];
  /** This league's current manager for a given club — null means genuinely vacant, undefined means no manager data wired up for this league. */
  managerNameOf?: (clubId: string) => string | null | undefined;
}) {
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const selectedClub = selectedClubId ? ALL_CLUBS.find((c) => c.id === selectedClubId) : null;
  const selectedPosition = selectedClubId ? table.findIndex((r) => r.clubId === selectedClubId) + 1 : 0;

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h2 className="mb-3 text-xl font-black uppercase tracking-wide text-white">League Table</h2>

      {managerNews && managerNews.length > 0 && (
        <Panel title="Managerial News" className="mb-3">
          <div className="flex flex-col gap-1 p-1 text-xs text-ink/80">
            {managerNews.slice(0, 5).map((event, i) => {
              const eventClub = ALL_CLUBS.find((c) => c.id === event.clubId);
              const clubLabel = eventClub?.shortName ?? event.clubId;
              return (
                <p key={`${event.clubId}-${event.matchday}-${i}`}>
                  {event.incomingName === null
                    ? `Matchday ${event.matchday}: ${clubLabel} sack ${event.outgoingName} — the job's vacant.`
                    : `Matchday ${event.matchday}: ${clubLabel} appoint ${event.incomingName}.`}
                </p>
              );
            })}
          </div>
        </Panel>
      )}

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-ink text-white">
                <th className="px-2 py-1.5 text-right font-bold uppercase">#</th>
                <th className="px-2 py-1.5 text-left font-bold uppercase">Club</th>
                <th className="px-2 py-1.5 text-right font-bold uppercase">P</th>
                <th className="px-2 py-1.5 text-right font-bold uppercase">W</th>
                <th className="px-2 py-1.5 text-right font-bold uppercase">D</th>
                <th className="px-2 py-1.5 text-right font-bold uppercase">L</th>
                <th className="px-2 py-1.5 text-right font-bold uppercase">GF</th>
                <th className="px-2 py-1.5 text-right font-bold uppercase">GA</th>
                <th className="px-2 py-1.5 text-right font-bold uppercase">GD</th>
                <th className="px-2 py-1.5 text-right font-bold uppercase">Pts</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row, i) => {
                const club = ALL_CLUBS.find((c) => c.id === row.clubId);
                const isManaged = row.clubId === managedClubId;
                const position = i + 1;
                const zone = getLeagueZone(position, table.length, leagueTier);
                const stripeClass = zone ? ZONE_STYLES[zone].stripe : 'border-l-4 border-l-transparent';
                return (
                  <tr
                    key={row.clubId}
                    onClick={() => setSelectedClubId(row.clubId)}
                    className={`cursor-pointer border-b border-ink/10 ${stripeClass} ${i % 2 === 0 ? 'bg-white/60' : 'bg-white/30'} ${isManaged ? 'bg-pitch-light/40 font-bold' : ''} hover:brightness-95`}
                  >
                    <td className="px-2 py-1.5 text-right">{position}</td>
                    <td className="px-2 py-1.5">
                      <span className="flex items-center gap-2">
                        {club && (
                          <ClubCrest primaryColor={club.primaryColor} secondaryColor={club.secondaryColor} label={club.shortName} crestPath={club.crestPath} size={22} />
                        )}
                        {club?.shortName ?? row.clubId}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right">{row.played}</td>
                    <td className="px-2 py-1.5 text-right">{row.won}</td>
                    <td className="px-2 py-1.5 text-right">{row.drawn}</td>
                    <td className="px-2 py-1.5 text-right">{row.lost}</td>
                    <td className="px-2 py-1.5 text-right">{row.goalsFor}</td>
                    <td className="px-2 py-1.5 text-right">{row.goalsAgainst}</td>
                    <td className="px-2 py-1.5 text-right">{row.goalDifference}</td>
                    <td className="px-2 py-1.5 text-right">{row.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-ink/10 pt-2 text-xs text-ink/70">
          {zonesForTier(leagueTier).map((zone) => (
            <span key={zone} className="flex items-center gap-1.5">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${ZONE_STYLES[zone].dot}`} />
              {ZONE_STYLES[zone].label}
            </span>
          ))}
        </div>
      </Panel>

      {selectedClub && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-pitch">
          <ClubOverviewScreen
            club={selectedClub}
            leagueRow={table.find((r) => r.clubId === selectedClub.id)}
            leaguePosition={selectedPosition}
            totalClubs={table.length}
            leagueTier={leagueTier}
            squad={allSquads[selectedClub.id] ?? []}
            fixtures={fixtures}
            allSquads={allSquads}
            managerName={managerNameOf?.(selectedClub.id)}
            isManagedByPlayer={selectedClub.id === managedClubId}
            onClose={() => setSelectedClubId(null)}
          />
        </div>
      )}
    </div>
  );
}
