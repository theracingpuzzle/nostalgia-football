import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Panel } from '../components/ui/Panel';
import type { Player } from '../engine/types';

export interface TransferOffer {
  id: string;
  outPlayer: Player;
  inPlayer: Player;
  inClubName: string;
  flavorText: string;
  status: 'pending' | 'accepted' | 'declined';
}

export type TransferTimelineEntry =
  | { hour: number; kind: 'news'; id: string; text: string; confirmed: boolean }
  | { hour: number; kind: 'offer'; id: string; offerId: string }
  | { hour: number; kind: 'countdown'; id: string; hoursLeft: number };

/** A fixed "deadline day" window, same bounds every time — CareerScreen schedules news/offers into these hours. */
export const DEADLINE_DAY_START_HOUR = 9;
export const DEADLINE_DAY_END_HOUR = 22;

const HOUR_TICK_MS = 2500; // 14 hourly ticks * 2.5s ≈ 35s total

/**
 * A live "deadline day" sequence rather than everything landing at once: a
 * simulated clock ticks hour by hour through the window, revealing other
 * clubs' news and your own offers as their scheduled hour arrives — same
 * spirit as the live match screen's minute-by-minute reveal, not a real
 * broadcast. Skippable, same pattern as "Skip to Full Time".
 */
export function TransferWindowScreen({
  title,
  offers,
  timeline,
  onAccept,
  onDecline,
  onDone,
}: {
  title: string;
  offers: TransferOffer[];
  timeline: TransferTimelineEntry[];
  onAccept: (offerId: string) => void;
  onDecline: (offerId: string) => void;
  onDone: () => void;
}) {
  const [hour, setHour] = useState(DEADLINE_DAY_START_HOUR - 1);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (finished || hour >= DEADLINE_DAY_END_HOUR) {
      setFinished(true);
      return;
    }
    const timer = setTimeout(() => setHour((h) => h + 1), HOUR_TICK_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hour]);

  function skipToEnd() {
    setHour(DEADLINE_DAY_END_HOUR);
    setFinished(true);
  }

  const displayedHour = Math.min(hour, DEADLINE_DAY_END_HOUR);
  // Newest first: the timeline itself is built oldest-to-newest (it's how
  // the hours get assigned), so the feed is reversed only for display.
  const revealed = [...timeline].filter((entry) => entry.hour <= displayedHour).reverse();
  const offersById = new Map(offers.map((o) => [o.id, o]));
  const totalTicks = DEADLINE_DAY_END_HOUR - (DEADLINE_DAY_START_HOUR - 1);
  const progress = ((displayedHour - (DEADLINE_DAY_START_HOUR - 1)) / totalTicks) * 100;

  return (
    <div className="mx-auto max-w-2xl p-4 text-white">
      <h2 className="mb-1 text-center text-xl font-black uppercase tracking-wide">{title}</h2>
      <p className="mb-3 text-center text-sm text-white/70">
        Just for fun — no fees, no wages, just a few silly swap deals on the table.
      </p>

      <Panel className="mb-3">
        <div className="flex items-center justify-between px-1 py-1">
          <span className="text-xs font-bold uppercase tracking-wide text-ink/60">Deadline Day</span>
          <span className="rounded-sm bg-ink px-3 py-1 text-lg font-black text-white">{String(displayedHour).padStart(2, '0')}:00</span>
        </div>
        <div className="mx-1 mb-1 h-1.5 overflow-hidden rounded-full bg-ink/20">
          <div className="h-full bg-pitch transition-all duration-500 ease-linear" style={{ width: `${progress}%` }} />
        </div>
      </Panel>

      {revealed.length === 0 && (
        <p className="mb-3 text-center text-sm text-white/60">Quiet so far — check back as the day goes on...</p>
      )}

      <div className="flex flex-col gap-3">
        {revealed.map((entry) => {
          if (entry.kind === 'countdown') {
            return (
              <p
                key={entry.id}
                className="rounded-sm border-2 border-dashed border-white/30 bg-white/5 px-3 py-1.5 text-center text-xs font-bold uppercase tracking-wide text-white/80"
              >
                ⏳ {entry.hoursLeft} {entry.hoursLeft === 1 ? 'hour' : 'hours'} left in the window
              </p>
            );
          }

          if (entry.kind === 'news') {
            return (
              <Panel key={entry.id}>
                <p className="text-sm text-ink/70">
                  <span className="mr-1.5 text-xs font-bold text-ink/50">{String(entry.hour).padStart(2, '0')}:00</span>
                  <span
                    className={`mr-1.5 rounded-sm px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                      entry.confirmed ? 'bg-green-700 text-white' : 'bg-amber-400 text-ink'
                    }`}
                  >
                    {entry.confirmed ? 'Done deal' : 'Rumour'}
                  </span>
                  <span className="italic">{entry.text}</span>
                </p>
              </Panel>
            );
          }

          const offer = offersById.get(entry.offerId);
          if (!offer) return null;
          return (
            <Panel key={entry.id}>
              <p className="mb-1 text-xs font-bold text-ink/50">{String(entry.hour).padStart(2, '0')}:00</p>
              <p className="mb-2 text-sm text-ink">{offer.flavorText}</p>
              <div className="mb-2 flex flex-col gap-1 text-xs text-ink/70 sm:flex-row sm:justify-between">
                <span>
                  OUT: <strong>{offer.outPlayer.name}</strong> ({offer.outPlayer.position})
                </span>
                <span>
                  IN: <strong>{offer.inPlayer.name}</strong> ({offer.inPlayer.position}) from {offer.inClubName}
                </span>
              </div>
              {offer.status === 'pending' ? (
                <div className="flex gap-2">
                  <Button onClick={() => onAccept(offer.id)}>Accept</Button>
                  <Button variant="secondary" onClick={() => onDecline(offer.id)}>
                    Decline
                  </Button>
                </div>
              ) : (
                <p className={`text-xs font-bold uppercase ${offer.status === 'accepted' ? 'text-green-700' : 'text-ink/40'}`}>
                  {offer.status === 'accepted' ? 'Deal done!' : 'Declined'}
                </p>
              )}
            </Panel>
          );
        })}
      </div>

      <div className="mt-4 flex justify-center gap-3">
        {!finished && (
          <Button variant="secondary" onClick={skipToEnd}>
            Skip to Deadline
          </Button>
        )}
        {finished && <Button onClick={onDone}>Continue</Button>}
      </div>
    </div>
  );
}
