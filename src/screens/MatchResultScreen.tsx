import { Button } from '../components/ui/Button';
import { ClubCrest } from '../components/ui/ClubCrest';
import { Panel } from '../components/ui/Panel';
import { PREMIER_LEAGUE_2008_09 } from '../data/premierLeague0809';
import type { Fixture } from '../engine/types';

export function MatchResultScreen({ fixture, onContinue }: { fixture: Fixture; onContinue: () => void }) {
  const result = fixture.result;
  if (!result) return null;

  const homeClub = PREMIER_LEAGUE_2008_09.find((c) => c.id === fixture.homeClubId);
  const awayClub = PREMIER_LEAGUE_2008_09.find((c) => c.id === fixture.awayClubId);

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h2 className="mb-3 text-center text-xl font-black uppercase tracking-wide text-white">
        Full Time — Placeholder Simulation
      </h2>
      <p className="mb-3 text-center text-sm text-white/70">
        This match result comes from a provisional statistical engine, not a recreation of the original's real match
        mechanics (those are still unknown — see PLAN.md Stage 8).
      </p>

      <Panel className="mb-3">
        <div className="flex items-center justify-center gap-4 py-2 text-2xl font-black">
          <span className="flex items-center gap-2">
            {homeClub && <ClubCrest primaryColor={homeClub.primaryColor} secondaryColor={homeClub.secondaryColor} label={homeClub.shortName} crestPath={homeClub.crestPath} size={38} />}
            {homeClub?.shortName}
          </span>
          <span className="rounded-sm bg-ink px-3 py-1 text-white">
            {result.homeGoals} - {result.awayGoals}
          </span>
          <span className="flex items-center gap-2">
            {awayClub?.shortName}
            {awayClub && <ClubCrest primaryColor={awayClub.primaryColor} secondaryColor={awayClub.secondaryColor} label={awayClub.shortName} crestPath={awayClub.crestPath} size={38} />}
          </span>
        </div>
        <div className="flex justify-center gap-10 pb-2 text-sm text-ink/70">
          <div>{result.homeScorers.map((s) => `${s.playerName} ${s.minutes.join(', ')}'`).join(' · ') || '—'}</div>
          <div>{result.awayScorers.map((s) => `${s.playerName} ${s.minutes.join(', ')}'`).join(' · ') || '—'}</div>
        </div>
      </Panel>

      <Panel title="Match Events" className="mb-3">
        <ul className="max-h-64 divide-y divide-ink/10 overflow-y-auto text-sm">
          {result.events.map((event, i) => (
            <li key={i} className="flex gap-2 px-1 py-1.5">
              <span className="w-8 shrink-0 text-right text-ink/60">{event.minute}'</span>
              <span className="flex flex-col">
                <span className={event.type === 'goal' ? 'font-bold' : ''}>{event.description}</span>
                {event.assistPlayerName && <span className="text-xs text-ink/60">assisted by {event.assistPlayerName}</span>}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="flex justify-center">
        <Button onClick={onContinue}>Continue</Button>
      </div>
    </div>
  );
}
