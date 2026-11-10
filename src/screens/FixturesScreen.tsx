import { Button } from '../components/ui/Button';
import { ClubCrest } from '../components/ui/ClubCrest';
import { Panel } from '../components/ui/Panel';
import { PREMIER_LEAGUE_2008_09 } from '../data/premierLeague0809';
import type { Fixture } from '../engine/types';

export function FixturesScreen({
  managedClubId,
  fixtures,
  xiReady,
  onPlayNext,
}: {
  managedClubId: string;
  fixtures: Fixture[];
  xiReady: boolean;
  onPlayNext: () => void;
}) {
  const myFixtures = fixtures.filter((f) => f.homeClubId === managedClubId || f.awayClubId === managedClubId);
  const nextUnplayed = fixtures.some((f) => !f.played);

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-3 flex items-center justify-between text-white">
        <h2 className="text-xl font-black uppercase tracking-wide">Fixtures</h2>
        <Button onClick={onPlayNext} disabled={!nextUnplayed || !xiReady}>
          Play Next Fixture
        </Button>
      </div>
      {!xiReady && (
        <p className="mb-3 rounded-sm border-2 border-amber-300 bg-amber-800 px-2 py-1.5 text-sm font-bold text-white">
          Pick exactly 11 starters on the Team Selection screen before playing.
        </p>
      )}
      <Panel>
        <ul className="divide-y divide-ink/10 text-base">
          {myFixtures.map((fixture) => {
            const isHome = fixture.homeClubId === managedClubId;
            const opponentId = isHome ? fixture.awayClubId : fixture.homeClubId;
            const opponent = PREMIER_LEAGUE_2008_09.find((c) => c.id === opponentId);
            return (
              <li key={fixture.id} className="flex items-center justify-between gap-2 px-1 py-2">
                <span className="w-10 shrink-0 text-sm text-ink/60">MD{fixture.matchday}</span>
                <span className="flex flex-1 items-center gap-2 font-bold">
                  <span className="w-6 shrink-0 text-sm text-ink/60">{isHome ? 'vs' : '@'}</span>
                  {opponent && (
                    <ClubCrest primaryColor={opponent.primaryColor} secondaryColor={opponent.secondaryColor} label={opponent.shortName} crestPath={opponent.crestPath} size={26} />
                  )}
                  {opponent?.shortName}
                </span>
                <span>
                  {fixture.played && fixture.result
                    ? isHome
                      ? `${fixture.result.homeGoals} - ${fixture.result.awayGoals}`
                      : `${fixture.result.awayGoals} - ${fixture.result.homeGoals}`
                    : '—'}
                </span>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
