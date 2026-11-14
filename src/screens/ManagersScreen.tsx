import { useState } from 'react';
import { ClubCrest } from '../components/ui/ClubCrest';
import { Panel } from '../components/ui/Panel';
import type { ClubListing } from '../data/premierLeague0809';
import type { LeagueDefinition } from '../data/leagues';
import type { Fixture, LeagueTableRow, Player } from '../engine/types';
import { jobSecurityBand, vacantManagerBand } from '../utils/managerDisplay';
import { ClubOverviewScreen } from './ClubOverviewScreen';

/**
 * Every club in a league, its current manager (or "Vacant"), and that
 * manager's job security — a read-only overview, not an action point.
 * Applying for a job only ever happens as a reaction to being sacked
 * (ManagerSackedScreen); being approached only ever happens as an
 * unsolicited overlay (ManagerApproachScreen) — neither is triggered
 * from here. Same row/crest/click-to-drill-down shape as
 * LeagueTableScreen, reused for both the managed league (a new
 * CareerNav tab) and each background league (OtherLeaguesScreen's
 * Table/Managers toggle).
 */
export function ManagersScreen({
  clubs,
  table,
  managedClubId,
  managerNameOf,
  confidenceOf,
  allSquads,
  fixtures,
  leagueTier,
}: {
  clubs: ClubListing[];
  table: LeagueTableRow[];
  managedClubId: string;
  /** null means genuinely vacant; undefined means no data for this club (shouldn't normally happen once a league's managers are seeded). */
  managerNameOf: (clubId: string) => string | null | undefined;
  confidenceOf: (clubId: string) => number | undefined;
  allSquads: Record<string, Player[]>;
  fixtures: Fixture[];
  leagueTier: LeagueDefinition['tier'];
}) {
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const selectedClub = selectedClubId ? clubs.find((c) => c.id === selectedClubId) : null;
  const selectedPosition = selectedClubId ? table.findIndex((r) => r.clubId === selectedClubId) + 1 : 0;

  const rows = [...clubs].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h2 className="mb-3 text-xl font-black uppercase tracking-wide text-white">Managers</h2>
      <Panel>
        <div className="flex flex-col gap-2 p-1">
          {rows.map((club) => {
            const managerName = managerNameOf(club.id);
            const isManaged = club.id === managedClubId;
            const band = managerName === null ? vacantManagerBand() : jobSecurityBand(confidenceOf(club.id) ?? 0);
            return (
              <button
                key={club.id}
                onClick={() => setSelectedClubId(club.id)}
                className={`flex items-center justify-between gap-3 rounded-sm border-2 px-3 py-2 text-left transition hover:border-pitch-dark hover:bg-white ${
                  isManaged ? 'border-pitch-dark bg-pitch-light/40 font-bold' : 'border-ink/20 bg-white/70'
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <ClubCrest primaryColor={club.primaryColor} secondaryColor={club.secondaryColor} label={club.shortName} crestPath={club.crestPath} size={28} />
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-sm font-bold text-ink">{club.name}</span>
                    <span className="block truncate text-xs text-ink/60">
                      {managerName === null ? 'Vacant' : (managerName ?? 'Unknown')}
                      {isManaged && ' (You)'}
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase text-ink/70">
                  <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${band.dot}`} />
                  {band.label}
                </span>
              </button>
            );
          })}
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
            managerName={managerNameOf(selectedClub.id)}
            isManagedByPlayer={selectedClub.id === managedClubId}
            onClose={() => setSelectedClubId(null)}
          />
        </div>
      )}
    </div>
  );
}
