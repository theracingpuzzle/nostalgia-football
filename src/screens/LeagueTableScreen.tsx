import { ClubCrest } from '../components/ui/ClubCrest';
import { Panel } from '../components/ui/Panel';
import { PREMIER_LEAGUE_2008_09 } from '../data/premierLeague0809';
import type { LeagueTableRow } from '../engine/types';
import { getLeagueZone, ZONE_STYLES } from '../utils/leagueZones';

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
                const position = i + 1;
                const zone = getLeagueZone(position, table.length);
                const stripeClass = zone ? ZONE_STYLES[zone].stripe : 'border-l-4 border-l-transparent';
                return (
                  <tr
                    key={row.clubId}
                    className={`border-b border-ink/10 ${stripeClass} ${i % 2 === 0 ? 'bg-white/60' : 'bg-white/30'} ${isManaged ? 'bg-pitch-light/40 font-bold' : ''}`}
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
          {(Object.keys(ZONE_STYLES) as (keyof typeof ZONE_STYLES)[]).map((zone) => (
            <span key={zone} className="flex items-center gap-1.5">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${ZONE_STYLES[zone].dot}`} />
              {ZONE_STYLES[zone].label}
            </span>
          ))}
        </div>
      </Panel>
    </div>
  );
}
