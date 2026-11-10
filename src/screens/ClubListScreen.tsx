import { ClubCrest } from '../components/ui/ClubCrest';
import { Panel } from '../components/ui/Panel';
import { SQUADS_BY_CLUB_ID } from '../data/clubSquads';
import { PREMIER_LEAGUE_2008_09 } from '../data/premierLeague0809';

/**
 * The main team list — the real 2008/09 Premier League clubs to choose from.
 * This is the app's home screen. Only clubs with a squad built out so far
 * (see clubSquads.ts) are selectable; the rest would show "Squad TBD" and be
 * disabled rather than guessing a roster on the spot — currently all 20 have
 * one, so that path is dormant but kept for when a club's data is ever
 * pulled for rework.
 */
const CLUBS_ALPHABETICAL = [...PREMIER_LEAGUE_2008_09].sort((a, b) => a.name.localeCompare(b.name));

export function ClubListScreen({ onSelectClub }: { onSelectClub: (clubId: string) => void }) {
  return (
    <div className="mx-auto max-w-3xl p-4 text-white">
      <h2 className="mb-3 text-center text-2xl font-black uppercase tracking-wide">Premier League 2008/09</h2>

      <Panel>
        <p className="mb-2 text-sm text-ink/70">
          Real club list. Squads are only built out for clubs marked <strong>Ready</strong> so far — the rest would be
          placeholders (see PLAN.md).
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CLUBS_ALPHABETICAL.map((club) => {
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
