import { useState } from 'react';
import { ClubCrest } from '../components/ui/ClubCrest';
import { Panel } from '../components/ui/Panel';
import { PREMIER_LEAGUE_2008_09 } from '../data/premierLeague0809';

export interface PlayerSeasonTotal {
  playerId: string;
  playerName: string;
  clubId: string;
  goals: number;
  assists: number;
  yellowCards: number;
}

type SortKey = 'goals' | 'assists' | 'yellowCards';

const SORT_TABS: { key: SortKey; label: string }[] = [
  { key: 'goals', label: 'Goals' },
  { key: 'assists', label: 'Assists' },
  { key: 'yellowCards', label: 'Yellow Cards' },
];

/** League-wide season stats — goals, assists, and yellow cards per player, ranked by whichever column is selected. */
export function StatsScreen({ stats, managedClubId }: { stats: PlayerSeasonTotal[]; managedClubId: string }) {
  const [sortBy, setSortBy] = useState<SortKey>('goals');
  const sorted = [...stats].filter((s) => s[sortBy] > 0).sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h2 className="mb-3 text-xl font-black uppercase tracking-wide text-white">Stats</h2>

      <div className="mb-3 flex gap-2">
        {SORT_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSortBy(tab.key)}
            className={`rounded-sm border-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
              sortBy === tab.key ? 'border-pitch-dark bg-pitch text-white' : 'border-ink/30 bg-panel text-ink hover:bg-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Panel>
        {sorted.length === 0 ? (
          <p className="p-2 text-sm text-ink/70">Nothing recorded yet this season.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-ink text-white">
                  <th className="px-2 py-1.5 text-right font-bold uppercase">#</th>
                  <th className="px-2 py-1.5 text-left font-bold uppercase">Player</th>
                  <th className="px-2 py-1.5 text-left font-bold uppercase">Club</th>
                  <th className="px-2 py-1.5 text-right font-bold uppercase">G</th>
                  <th className="px-2 py-1.5 text-right font-bold uppercase">A</th>
                  <th className="px-2 py-1.5 text-right font-bold uppercase">YC</th>
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 20).map((s, i) => {
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
                      <td className={`px-2 py-1.5 text-right ${sortBy === 'goals' ? 'font-black' : ''}`}>{s.goals}</td>
                      <td className={`px-2 py-1.5 text-right ${sortBy === 'assists' ? 'font-black' : ''}`}>{s.assists}</td>
                      <td className={`px-2 py-1.5 text-right ${sortBy === 'yellowCards' ? 'font-black' : ''}`}>{s.yellowCards}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
