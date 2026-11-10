import { ClubCrest } from '../components/ui/ClubCrest';
import { Panel } from '../components/ui/Panel';
import { PREMIER_LEAGUE_2008_09 } from '../data/premierLeague0809';

export interface ScorerTotal {
  playerId: string;
  playerName: string;
  clubId: string;
  goals: number;
}

export function ScorersScreen({ scorers, managedClubId }: { scorers: ScorerTotal[]; managedClubId: string }) {
  return (
    <div className="mx-auto max-w-2xl p-4">
      <h2 className="mb-3 text-xl font-black uppercase tracking-wide text-white">Top 20 Scorers</h2>
      <Panel>
        {scorers.length === 0 ? (
          <p className="p-2 text-sm text-ink/70">No goals yet this season.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-ink text-white">
                <th className="px-2 py-1.5 text-right font-bold uppercase">#</th>
                <th className="px-2 py-1.5 text-left font-bold uppercase">Player</th>
                <th className="px-2 py-1.5 text-left font-bold uppercase">Club</th>
                <th className="px-2 py-1.5 text-right font-bold uppercase">Goals</th>
              </tr>
            </thead>
            <tbody>
              {scorers.map((s, i) => {
                const club = PREMIER_LEAGUE_2008_09.find((c) => c.id === s.clubId);
                const isManaged = s.clubId === managedClubId;
                return (
                  <tr key={s.playerId} className={`border-b border-ink/10 ${i % 2 === 0 ? 'bg-white/60' : 'bg-white/30'} ${isManaged ? 'bg-pitch-light/40 font-bold' : ''}`}>
                    <td className="px-2 py-1.5 text-right">{i + 1}</td>
                    <td className="px-2 py-1.5">{s.playerName}</td>
                    <td className="px-2 py-1.5">
                      <span className="flex items-center gap-1.5">
                        {club && (
                          <ClubCrest primaryColor={club.primaryColor} secondaryColor={club.secondaryColor} label={club.shortName} crestPath={club.crestPath} size={20} />
                        )}
                        {club?.shortName ?? s.clubId}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right">{s.goals}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}
