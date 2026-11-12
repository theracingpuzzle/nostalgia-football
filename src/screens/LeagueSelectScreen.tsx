import { useEffect } from 'react';
import { Panel } from '../components/ui/Panel';
import { LEAGUES } from '../data/leagues';

/**
 * Picking a league before a club — the first league added beyond the
 * Premier League is La Liga (see PLAN.md for the multi-league expansion
 * and what's still Premier-League-only). Shows each league's real
 * 2008/09 title-sponsor logo (Barclays Premier League / Liga BBVA) where
 * one's been sourced — see PLAN.md for where these came from and the
 * same "private, non-distributed build" caveat as the club crests.
 */
export function LeagueSelectScreen({ onSelectLeague }: { onSelectLeague: (leagueId: string) => void }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="mx-auto max-w-xl p-4 text-white">
      <h2 className="mb-1 text-center text-2xl font-black uppercase tracking-wide">Choose a League</h2>
      <p className="mb-3 text-center text-sm text-white/70">Pick which 2008/09 league to manage in.</p>

      <Panel>
        <div className="flex flex-col gap-2">
          {LEAGUES.map((league) => (
            <button
              key={league.id}
              onClick={() => onSelectLeague(league.id)}
              className="flex items-center justify-between gap-3 rounded-sm border-2 border-ink/30 bg-white/70 px-3 py-2.5 text-left transition hover:border-pitch-dark hover:bg-white"
            >
              <span className="flex min-w-0 flex-1 items-center gap-3">
                {league.logoPath ? (
                  <img src={league.logoPath} alt={`${league.name} logo`} className="h-10 w-20 shrink-0 object-contain object-left" />
                ) : (
                  <span className="h-10 w-20 shrink-0" />
                )}
                <span className="truncate text-base font-bold text-ink">{league.name}</span>
              </span>
              <span className="shrink-0 text-xs font-bold uppercase text-ink/50">{league.clubs.length} clubs</span>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}
