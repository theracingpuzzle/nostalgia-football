import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/ui/Button';
import { ClubCrest } from '../components/ui/ClubCrest';
import { GoalFrame } from '../components/ui/GoalFrame';
import { KitIcon } from '../components/ui/KitIcon';
import { Panel } from '../components/ui/Panel';
import type { ClubListing } from '../data/premierLeague0809';
import type { Fixture, Position } from '../engine/types';

const DURATION_MS = 9000;
const TICK_MS = 300;
const JITTER_EVERY_N_TICKS = 3;
const GOAL_HOLD_MS = 1800;

type Role = Position;

interface Dot {
  id: string;
  side: 'home' | 'away';
  role: Role;
  xMin: number;
  xMax: number;
  x: number;
  y: number;
}

// Rough zone shape per side, as % of pitch width — home attacks right, away
// attacks left. Cosmetic only (not tied to the actual simulated XI/formation)
// but keeps the "running around" animation looking like a match shape
// instead of 22 dots scattered with no regard for position.
const HOME_ZONES: Record<Role, [number, number]> = { GK: [4, 13], DEF: [16, 34], MID: [36, 58], FWD: [60, 84] };
const AWAY_ZONES: Record<Role, [number, number]> = { GK: [87, 96], DEF: [66, 84], MID: [42, 64], FWD: [16, 40] };
const ROLE_COUNTS: { role: Role; count: number }[] = [
  { role: 'GK', count: 1 },
  { role: 'DEF', count: 4 },
  { role: 'MID', count: 4 },
  { role: 'FWD', count: 2 },
];

function randomJitter(current: number, min: number, max: number, maxDelta: number): number {
  const next = current + (Math.random() * 2 - 1) * maxDelta;
  return Math.max(min, Math.min(max, next));
}

function initialDots(): Dot[] {
  const dots: Dot[] = [];
  for (const side of ['home', 'away'] as const) {
    const zones = side === 'home' ? HOME_ZONES : AWAY_ZONES;
    let index = 0;
    for (const { role, count } of ROLE_COUNTS) {
      const [xMin, xMax] = zones[role];
      for (let i = 0; i < count; i++) {
        index += 1;
        dots.push({ id: `${side}-${index}`, side, role, xMin, xMax, x: xMin + Math.random() * (xMax - xMin), y: 6 + Math.random() * 88 });
      }
    }
  }
  return dots;
}

/**
 * A visual flourish on top of the placeholder match engine: zone-constrained
 * dots wander the pitch, the ball travels into the net on a goal, and a
 * scoreboard tracks the live score as it happens. This is NOT the original's
 * real match screen — no manager commands, no real player movement model,
 * nothing claimed as faithful. Built because you asked for visible action
 * and a working scoreboard; Stage 8 (the real thing) stays gated until its
 * actual mechanics are known (see PLAN.md).
 */
export function MatchAnimationScreen({
  fixture,
  homeClub,
  awayClub,
  onFinished,
}: {
  fixture: Fixture;
  homeClub: ClubListing;
  awayClub: ClubListing;
  onFinished: () => void;
}) {
  const result = fixture.result;
  const [dots, setDots] = useState<Dot[]>(initialDots);
  const [ball, setBall] = useState({ x: 50, y: 50 });
  const [minute, setMinute] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [ticker, setTicker] = useState<string>('Kick off');
  const [liveHomeGoals, setLiveHomeGoals] = useState(0);
  const [liveAwayGoals, setLiveAwayGoals] = useState(0);
  const firedRef = useRef(new Set<number>());

  useEffect(() => {
    if (!result) {
      onFinished();
      return;
    }

    let tick = 0;

    const interval = setInterval(() => {
      tick += 1;
      const elapsed = tick * TICK_MS;
      const currentMinute = Math.min(90, (elapsed / DURATION_MS) * 90);
      setMinute(Math.round(currentMinute));

      result.events.forEach((event, index) => {
        if (event.minute > currentMinute || firedRef.current.has(index)) return;
        firedRef.current.add(index);
        setTicker(event.description);

        if (event.type === 'goal') {
          setFlash(event.description);
          if (event.side === 'home') setLiveHomeGoals((n) => n + 1);
          else setLiveAwayGoals((n) => n + 1);
          // Home attacks right (away's net); away attacks left (home's net).
          setBall({ x: event.side === 'home' ? 97 : 3, y: 50 + (Math.random() * 16 - 8) });
          setTimeout(() => setFlash(null), 1500);
          setTimeout(() => setBall({ x: 50, y: 50 }), GOAL_HOLD_MS);
        }
      });

      if (tick % JITTER_EVERY_N_TICKS === 0) {
        setDots((prev) => prev.map((d) => ({ ...d, x: randomJitter(d.x, d.xMin, d.xMax, 10), y: randomJitter(d.y, 4, 96, 16) })));
        setBall((prev) => ({ x: randomJitter(prev.x, 25, 75, 10), y: randomJitter(prev.y, 15, 85, 10) }));
      }

      if (elapsed >= DURATION_MS) {
        clearInterval(interval);
        onFinished();
      }
    }, TICK_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixture.id]);

  if (!result) return null;

  return (
    <div className="mx-auto max-w-2xl p-4 text-white">
      <Panel accentColor={homeClub.primaryColor} className="mb-2">
        <div className="flex items-center justify-between gap-2 px-1 py-1">
          <div className="flex min-w-0 flex-1 items-center gap-2 text-base font-bold text-ink">
            <ClubCrest primaryColor={homeClub.primaryColor} secondaryColor={homeClub.secondaryColor} label={homeClub.shortName} crestPath={homeClub.crestPath} size={28} />
            <span className="truncate">{homeClub.shortName}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-sm bg-ink px-3 py-1 text-xl font-black text-white">
              {liveHomeGoals} - {liveAwayGoals}
            </span>
            <span className="rounded-sm border-2 border-ink/50 bg-ink/10 px-2 py-1 text-sm font-bold text-ink">{minute}'</span>
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-base font-bold text-ink">
            <span className="truncate">{awayClub.shortName}</span>
            <ClubCrest primaryColor={awayClub.primaryColor} secondaryColor={awayClub.secondaryColor} label={awayClub.shortName} crestPath={awayClub.crestPath} size={28} />
          </div>
        </div>
        <div className="mx-1 mb-1 h-1.5 overflow-hidden rounded-full bg-ink/30">
          <div className="h-full bg-white/80 transition-all duration-300 ease-linear" style={{ width: `${(minute / 90) * 100}%` }} />
        </div>
      </Panel>

      <div className="relative overflow-hidden rounded-sm border-4 border-white bg-pitch" style={{ height: 360 }}>
        <div className="pointer-events-none absolute inset-y-0 left-1/2 border-l-2 border-white/60" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60" />
        <div className="pointer-events-none absolute left-0 top-1/2 h-44 w-16 -translate-y-1/2 border-2 border-l-0 border-white/60" />
        <div className="pointer-events-none absolute right-0 top-1/2 h-44 w-16 -translate-y-1/2 border-2 border-r-0 border-white/60" />
        <GoalFrame side="left" size={70} />
        <GoalFrame side="right" size={70} />

        {dots.map((d) => (
          <div
            key={d.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-[900ms] ease-linear"
            style={{ left: `${d.x}%`, top: `${d.y}%` }}
          >
            <KitIcon
              primaryColor={d.side === 'home' ? homeClub.primaryColor : awayClub.primaryColor}
              secondaryColor={d.side === 'home' ? homeClub.secondaryColor : awayClub.secondaryColor}
              pattern={d.side === 'home' ? homeClub.kitPattern : awayClub.kitPattern}
              size={18}
            />
          </div>
        ))}

        <div
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_3px_rgba(0,0,0,0.9)] transition-all duration-[900ms] ease-linear"
          style={{ left: `${ball.x}%`, top: `${ball.y}%` }}
        />

        {flash && (
          <div className="absolute inset-x-0 top-1/3 flex justify-center">
            <span className="rounded-sm bg-ink/90 px-3 py-1.5 text-base font-black uppercase tracking-wide text-white">{flash}</span>
          </div>
        )}
      </div>

      <p className="mt-2 min-h-[24px] text-center text-base font-semibold text-white">{ticker}</p>

      <div className="mt-1 flex justify-center">
        <Button variant="secondary" onClick={onFinished}>
          Skip to Full Time
        </Button>
      </div>
    </div>
  );
}
