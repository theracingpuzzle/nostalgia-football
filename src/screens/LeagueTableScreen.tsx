import { ClubCrest } from '../components/ui/ClubCrest';
import { Panel } from '../components/ui/Panel';
import { PREMIER_LEAGUE_2008_09 } from '../data/premierLeague0809';
import type { LeagueTableRow } from '../engine/types';

export function LeagueTableScreen({ table, managedClubId }: { table: LeagueTableRow[]; managedClubId: string }) {
  return (
    <div className="mx-auto max-w-3xl p-4">
      <h2 className="mb-3 text-xl font-black uppercase tracking-wide text-white">League Table</h2>
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
                const club = PREMIER_LEAGUE_2008_09.find((c) => c.id === row.clubId);
                const isManaged = row.clubId === managedClubId;
                return (
                  <tr
                    key={row.clubId}
                    className={`border-b border-ink/10 ${i % 2 === 0 ? 'bg-white/60' : 'bg-white/30'} ${isManaged ? 'bg-pitch-light/40 font-bold' : ''}`}
                  >
                    <td className="px-2 py-1.5 text-right">{i + 1}</td>
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
      </Panel>
    </div>
  );
}
