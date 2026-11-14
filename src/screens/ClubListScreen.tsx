import { useEffect } from 'react';
import { ClubCrest } from '../components/ui/ClubCrest';
import { Panel } from '../components/ui/Panel';
import { SQUADS_BY_CLUB_ID } from '../data/clubSquads';
import type { LeagueDefinition } from '../data/leagues';

/**
 * The club list for whichever league was just picked — only clubs with a
 * squad built out so far (see clubSquads.ts) are selectable; the rest
 * would show "Squad TBD" and be disabled rather than guessing a roster on
 * the spot. Currently every registered league has all of its clubs
 * populated, so that path is dormant but kept for when a club's data is
 * ever pulled for rework.
 */
export function ClubListScreen({ league, onSelectClub, onBack }: { league: LeagueDefinition; onSelectClub: (clubId: string) => void; onBack: () => void }) {
  const clubsAlphabetical = [...league.clubs].sort((a, b) => a.name.localeCompare(b.name));

  // Lands here straight after picking a league, so make sure the page
  // opens scrolled to the top rather than wherever the previous screen left off.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-4 text-white">
      <button onClick={onBack} className="mb-2 text-sm font-bold uppercase text-white/70 hover:text-white">
        ← Back to Leagues
      </button>
      <h2 className="mb-1 text-center text-2xl font-black uppercase tracking-wide">{league.name} 2008/09</h2>
      <p className="mb-3 text-center text-sm text-white/70">Choose a club below to become their manager for the season.</p>

      <Panel>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {clubsAlphabetical.map((club) => {
            const hasSquad = Boolean(SQUADS_BY_CLUB_ID[club.id]);
            return (
              <button
                key={club.id}
                disabled={!hasSquad}
                onClick={() => onSelectClub(club.id)}
                className={`flex items-center justify-between rounded-sm border-2 px-3 py-2.5 text-left transition ${
                  hasSquad
                    ? 'border-ink/30 bg-white/70 hover:border-pitch-dark hover:bg-white'
                    : 'cursor-not-allowed border-ink/10 bg-white/30 opacity-60'
                }`}
              >
                <span className="flex items-center gap-3">
                  <ClubCrest
                    primaryColor={club.primaryColor}
                    secondaryColor={club.secondaryColor}
                    label={club.shortName}
                    crestPath={club.crestPath}
                    size={36}
                  />
                  <span className="text-base font-bold text-ink">{club.name}</span>
                </span>
                <span className={`text-xs font-bold uppercase ${hasSquad ? 'text-pitch-dark' : 'text-ink/40'}`}>
                  {hasSquad ? 'Ready' : 'Squad TBD'}
                </span>
              </button>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
