import { Button } from '../components/ui/Button';
import { CardIcon } from '../components/ui/CardIcon';
import { ClubCrest } from '../components/ui/ClubCrest';
import { Panel } from '../components/ui/Panel';
import { ALL_CLUBS } from '../data/leagues';
import type { Fixture, MatchEvent, MatchResult, PlayerMinuteTally } from '../engine/types';
import { computeAttendance } from '../utils/attendance';

interface CardEntry {
  playerId: string;
  playerName: string;
  minute: number;
  cardType: 'yellow' | 'red';
}

/** Flattens bookings/red cards (each a player plus every minute it happened) into one minute-ordered list, same shape used for the live match screen's card display. */
function cardEntries(bookings: PlayerMinuteTally[], redCards: PlayerMinuteTally[]): CardEntry[] {
  const entries: CardEntry[] = [];
  for (const b of bookings) for (const minute of b.minutes) entries.push({ playerId: b.playerId, playerName: b.playerName, minute, cardType: 'yellow' });
  for (const r of redCards) for (const minute of r.minutes) entries.push({ playerId: r.playerId, playerName: r.playerName, minute, cardType: 'red' });
  return entries.sort((a, b) => a.minute - b.minute);
}

type DisplayEvent =
  | { kind: 'match'; minute: number; event: MatchEvent }
  | { kind: 'kickoff'; minute: number }
  | { kind: 'halftime'; minute: number; homeGoals: number; awayGoals: number }
  | { kind: 'fulltime'; minute: number; homeGoals: number; awayGoals: number };

/**
 * The raw event list is just goals/chances/cards — this adds a Kick Off
 * entry at the very top and Half Time / Full Time entries at their minute,
 * each showing the score at that point, so the list reads like a real
 * match report rather than a bare log of incidents. Purely presentational;
 * nothing here is stored on the result itself.
 */
function buildDisplayEvents(result: MatchResult): DisplayEvent[] {
  const homeGoalsAtHalf = result.events.filter((e) => e.type === 'goal' && e.side === 'home' && e.minute <= 45).length;
  const awayGoalsAtHalf = result.events.filter((e) => e.type === 'goal' && e.side === 'away' && e.minute <= 45).length;

  const entries: DisplayEvent[] = [
    { kind: 'kickoff', minute: 0 },
    ...result.events.map((event): DisplayEvent => ({ kind: 'match', minute: event.minute, event })),
    { kind: 'halftime', minute: 45, homeGoals: homeGoalsAtHalf, awayGoals: awayGoalsAtHalf },
    { kind: 'fulltime', minute: 90, homeGoals: result.homeGoals, awayGoals: result.awayGoals },
  ];
  // Stable sort — a 45th-minute goal (inserted before the half-time entry
  // above) still lands before the "Half Time" marker itself.
  return entries.sort((a, b) => a.minute - b.minute);
}

export function MatchResultScreen({ fixture, onContinue }: { fixture: Fixture; onContinue: () => void }) {
  const result = fixture.result;
  if (!result) return null;

  const homeClub = ALL_CLUBS.find((c) => c.id === fixture.homeClubId);
  const awayClub = ALL_CLUBS.find((c) => c.id === fixture.awayClubId);

  const homeCards = cardEntries(result.homeBookings, result.homeRedCards);
  const awayCards = cardEntries(result.awayBookings, result.awayRedCards);
  const displayEvents = buildDisplayEvents(result);

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h2 className="mb-1 text-center text-xl font-black uppercase tracking-wide text-white">Full Time</h2>
      {homeClub && (
        <p className="mb-3 text-center text-xs text-white/60">
          {homeClub.stadiumName} · Attendance {computeAttendance(fixture.id, homeClub.stadiumCapacity).toLocaleString()}
        </p>
      )}

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
          <div className="flex flex-col items-end gap-0.5">
            {result.homeScorers.length > 0
              ? result.homeScorers.map((s) => <div key={s.playerId}>{`${s.playerName} ${s.minutes.join(', ')}'`}</div>)
              : <div>—</div>}
          </div>
          <div className="flex flex-col items-start gap-0.5">
            {result.awayScorers.length > 0
              ? result.awayScorers.map((s) => <div key={s.playerId}>{`${s.playerName} ${s.minutes.join(', ')}'`}</div>)
              : <div>—</div>}
          </div>
        </div>
        {(homeCards.length > 0 || awayCards.length > 0) && (
          <div className="flex justify-center gap-10 pb-2 text-xs text-ink/70">
            <div className="flex flex-col items-end gap-0.5">
              {homeCards.map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  <CardIcon type={c.cardType} />
                  {c.playerName} {c.minute}'
                </span>
              ))}
            </div>
            <div className="flex flex-col items-start gap-0.5">
              {awayCards.map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  <CardIcon type={c.cardType} />
                  {c.playerName} {c.minute}'
                </span>
              ))}
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Match Events" className="mb-3">
        <ul className="max-h-64 divide-y divide-ink/10 overflow-y-auto text-sm">
          {displayEvents.map((entry, i) => {
            if (entry.kind === 'kickoff') {
              return (
                <li key={i} className="bg-ink/5 px-2 py-1.5 text-center text-xs font-black uppercase tracking-wide text-ink/70">
                  Kick Off
                </li>
              );
            }
            if (entry.kind === 'halftime' || entry.kind === 'fulltime') {
              return (
                <li key={i} className="bg-ink/5 px-2 py-1.5 text-center text-xs font-black uppercase tracking-wide text-ink/70">
                  {entry.kind === 'halftime' ? 'Half Time' : 'Full Time'} — {homeClub?.shortName} {entry.homeGoals} - {entry.awayGoals} {awayClub?.shortName}
                </li>
              );
            }

            const event = entry.event;
            const isCard = event.type === 'yellow-card' || event.type === 'red-card';
            return (
              <li key={i} className="flex items-center gap-2 px-1 py-1.5">
                <span className="w-8 shrink-0 text-right text-ink/60">{event.minute}'</span>
                {isCard && <CardIcon type={event.type === 'red-card' ? 'red' : 'yellow'} />}
                <span className="flex flex-col">
                  <span
                    className={
                      event.type === 'goal'
                        ? 'font-bold'
                        : event.type === 'red-card'
                          ? 'font-bold text-red-700'
                          : event.type === 'yellow-card'
                            ? 'font-semibold text-yellow-700'
                            : ''
                    }
                  >
                    {event.description}
                  </span>
                  {event.assistPlayerName && <span className="text-xs text-ink/60">assisted by {event.assistPlayerName}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </Panel>

      <div className="flex justify-center">
        <Button onClick={onContinue}>Continue</Button>
      </div>
    </div>
  );
}
