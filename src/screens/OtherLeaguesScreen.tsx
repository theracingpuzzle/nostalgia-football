import { useState } from 'react';
import { Panel } from '../components/ui/Panel';
import { LEAGUES } from '../data/leagues';
import { computeLeagueTable } from '../engine';
import type { Player } from '../engine/types';
import { isBackgroundLeagueSeasonComplete, type BackgroundLeagueState } from '../utils/backgroundLeague';
import { LeagueTableScreen } from './LeagueTableScreen';
import { ManagersScreen } from './ManagersScreen';

function statusFor(bg: BackgroundLeagueState): string {
  const totalMatchdays = (bg.clubIds.length - 1) * 2;
  const playedMatchdays = new Set(bg.fixtures.filter((f) => f.played).map((f) => f.matchday)).size;
  if (!isBackgroundLeagueSeasonComplete(bg)) return `Matchday ${Math.min(playedMatchdays + 1, totalMatchdays)}/${totalMatchdays}`;
  if (bg.playoff) return bg.playoff.championClubId ? 'Season complete (play-offs resolved)' : 'Play-offs in progress';
  return 'Season complete';
}

/**
 * Every league the player ISN'T managing keeps playing out its own season
 * in the background (see utils/backgroundLeague.ts) — this is just a way
 * to check in on them. Reuses LeagueTableScreen as-is: no club in a
 * background league is ever "managed" (managedClubId=""), so its
 * highlight row simply never triggers, which is exactly the right
 * behavior for passively browsing someone else's table.
 */
export function OtherLeaguesScreen({ backgroundLeagues, allSquads }: { backgroundLeagues: BackgroundLeagueState[]; allSquads: Record<string, Player[]> }) {
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [subView, setSubView] = useState<'table' | 'managers'>('table');
  const selected = selectedLeagueId ? backgroundLeagues.find((bg) => bg.leagueId === selectedLeagueId) : null;

  if (selected) {
    const league = LEAGUES.find((l) => l.id === selected.leagueId)!;
    const table = computeLeagueTable(selected.clubIds, selected.fixtures);
    return (
      <div>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 p-4 pb-0">
          <button
            onClick={() => {
              setSelectedLeagueId(null);
              setSubView('table');
            }}
            className="text-sm font-bold uppercase text-white/70 hover:text-white"
          >
            ← Back to Other Leagues
          </button>
          <div className="flex gap-1">
            <button
              onClick={() => setSubView('table')}
              className={`rounded-sm border-2 px-2 py-1 text-xs font-bold uppercase ${subView === 'table' ? 'border-white bg-white/20 text-white' : 'border-transparent text-white/60'}`}
            >
              Table
            </button>
            <button
              onClick={() => setSubView('managers')}
              className={`rounded-sm border-2 px-2 py-1 text-xs font-bold uppercase ${subView === 'managers' ? 'border-white bg-white/20 text-white' : 'border-transparent text-white/60'}`}
            >
              Managers
            </button>
          </div>
        </div>
        {subView === 'table' ? (
          <LeagueTableScreen
            table={table}
            managedClubId=""
            fixtures={selected.fixtures}
            allSquads={allSquads}
            leagueTier={league.tier}
            managerNews={selected.managerNews}
            managerNameOf={(id) => selected.managers[id]?.name}
          />
        ) : (
          <ManagersScreen
            clubs={league.clubs}
            table={table}
            managedClubId=""
            managerNameOf={(id) => selected.managers[id]?.name}
            confidenceOf={(id) => selected.managers[id]?.confidence}
            allSquads={allSquads}
            fixtures={selected.fixtures}
            leagueTier={league.tier}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl p-4">
      <h2 className="mb-3 text-xl font-black uppercase tracking-wide text-white">Other Leagues</h2>
      <Panel>
        <div className="flex flex-col gap-2">
          {backgroundLeagues.map((bg) => {
            const league = LEAGUES.find((l) => l.id === bg.leagueId)!;
            return (
              <button
                key={bg.leagueId}
                onClick={() => setSelectedLeagueId(bg.leagueId)}
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
                <span className="shrink-0 text-xs font-bold uppercase text-ink/50">{statusFor(bg)}</span>
              </button>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
