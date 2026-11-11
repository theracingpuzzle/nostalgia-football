import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/ui/Button';
import { CardIcon } from '../components/ui/CardIcon';
import { ClubCrest } from '../components/ui/ClubCrest';
import { GoalFrame } from '../components/ui/GoalFrame';
import { KitIcon } from '../components/ui/KitIcon';
import { Panel } from '../components/ui/Panel';
import type { ClubListing } from '../data/premierLeague0809';
import { createMatchSimulation, type MatchSimulationHandle } from '../engine';
import type { MatchResult, Player, Position, Scorer, TeamMatchInput } from '../engine/types';
import { computeAttendance } from '../utils/attendance';

const HALF_DURATION_MS = 4500;
const TICK_MS = 300;
const JITTER_EVERY_N_TICKS = 3;
const GOAL_HOLD_MS = 1800;
const SHOT_WINDUP_MS = 350;
const MOMENTUM_SWING_EVERY_N_TICKS = 10; // ~3s at TICK_MS=300
const MAX_SUBSTITUTIONS = 3; // the real-world limit for this era — five-sub rules came later

type Role = Position;
type Phase = 'first-half' | 'half-time' | 'second-half';

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

/** Appends a goal to a live scorer list, building it up the same shape the final match result uses (so this screen and MatchResultScreen render scorers identically). */
function appendScorer(prev: Scorer[], playerId: string, playerName: string, minute: number): Scorer[] {
  const existing = prev.find((s) => s.playerId === playerId);
  if (existing) return prev.map((s) => (s === existing ? { ...s, minutes: [...s.minutes, minute] } : s));
  return [...prev, { playerId, playerName, minutes: [minute] }];
}

interface LiveCard {
  playerId: string;
  playerName: string;
  minute: number;
  cardType: 'yellow' | 'red';
}

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
 * dots wander the pitch with a simple "momentum" sway (one side pushes
 * forward for a few seconds, then the other), a goal plays out as a visible
 * two-stage shot — the ball drifts to the edge of the box, then is struck
 * into the net on a faster transition, with a pulse ring confirming it
 * actually landed there — and a scoreboard tracks the live score as it
 * happens. This is NOT the original's real match screen — no manager
 * commands, no real player movement model, nothing claimed as faithful.
 * Built because you asked for visible action and a working scoreboard;
 * Stage 8 (the real thing) stays gated until its actual mechanics are known
 * (see PLAN.md).
 *
 * The match itself is now simulated live, not pre-computed: `createMatchSimulation`
 * runs the first half, pauses at half time so you can make up to 3
 * substitutions for your own club (the AI side keeps its starting XI the
 * whole match — not confirmed either way from the original, a deliberate
 * simplification), then runs the second half with whatever changes you made.
 */
export function MatchAnimationScreen({
  fixtureId,
  homeClub,
  awayClub,
  homeInput,
  awayInput,
  seed,
  managedSide,
  managedBench,
  onFinished,
}: {
  fixtureId: string;
  homeClub: ClubListing;
  awayClub: ClubListing;
  homeInput: TeamMatchInput;
  awayInput: TeamMatchInput;
  seed: number;
  /** Which side is the user's own club — only that side gets a substitution option at half time. */
  managedSide: 'home' | 'away';
  /** Squad players not in the starting XI (already excludes injured players). */
  managedBench: Player[];
  onFinished: (result: MatchResult) => void;
}) {
  const [dots, setDots] = useState<Dot[]>(initialDots);
  const [ball, setBall] = useState({ x: 50, y: 50 });
  const [shooting, setShooting] = useState(false);
  // A list, not a single value — goals can land close together (two goals a
  // simulated minute apart are only ~100ms apart in real animation time), and
  // a single shared pulse would have one goal's cleanup timer wipe out
  // another's still-active pulse. Each pulse owns its own id and timer.
  const [goalPulses, setGoalPulses] = useState<{ id: number; side: 'home' | 'away'; y: number }[]>([]);
  const [minute, setMinute] = useState(0);
  // Text plus an optional second line — kept separate so "assisted by X"
  // never gets crammed onto the end of one long line with the goal itself.
  const [flash, setFlash] = useState<{ text: string; assistName?: string } | null>(null);
  const [ticker, setTicker] = useState<{ text: string; assistName?: string }>({ text: 'Kick off' });
  const [liveHomeGoals, setLiveHomeGoals] = useState(0);
  const [liveAwayGoals, setLiveAwayGoals] = useState(0);
  const [liveHomeScorers, setLiveHomeScorers] = useState<Scorer[]>([]);
  const [liveAwayScorers, setLiveAwayScorers] = useState<Scorer[]>([]);
  const [liveHomeCards, setLiveHomeCards] = useState<LiveCard[]>([]);
  const [liveAwayCards, setLiveAwayCards] = useState<LiveCard[]>([]);
  const [phase, setPhase] = useState<Phase>('first-half');

  const managedInput = managedSide === 'home' ? homeInput : awayInput;
  const [managedXI, setManagedXI] = useState<Player[]>(managedInput.selectedXI);
  const [bench, setBench] = useState<Player[]>(managedBench);
  const [subsUsed, setSubsUsed] = useState(0);

  const simRef = useRef<MatchSimulationHandle | null>(null);
  const firedRef = useRef(new Set<number>());
  // Guards the periodic "wander" jitter from fighting with an in-progress
  // shot's own ball updates — a ref rather than state since it's read inside
  // the same setInterval closure that's only created once per match.
  const shotInProgressRef = useRef(false);

  useEffect(() => {
    simRef.current = createMatchSimulation({ fixtureId, home: homeInput, away: awayInput, seed });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixtureId]);

  const managedCards = managedSide === 'home' ? liveHomeCards : liveAwayCards;
  const sentOffIds = new Set(managedCards.filter((c) => c.cardType === 'red').map((c) => c.playerId));

  function processNewEvents(result: MatchResult, currentMinute: number) {
    result.events.forEach((event, index) => {
      if (event.minute > currentMinute || firedRef.current.has(index)) return;
      firedRef.current.add(index);
      setTicker({ text: event.description, assistName: event.assistPlayerName });

      if (event.type === 'goal') {
        setFlash({ text: event.description, assistName: event.assistPlayerName });
        if (event.side === 'home') {
          setLiveHomeGoals((n) => n + 1);
          if (event.playerId && event.playerName) {
            const playerId = event.playerId;
            const playerName = event.playerName;
            setLiveHomeScorers((prev) => appendScorer(prev, playerId, playerName, event.minute));
          }
        } else {
          setLiveAwayGoals((n) => n + 1);
          if (event.playerId && event.playerName) {
            const playerId = event.playerId;
            const playerName = event.playerName;
            setLiveAwayScorers((prev) => appendScorer(prev, playerId, playerName, event.minute));
          }
        }
        // Home attacks right (away's net); away attacks left (home's net).
        // A two-stage "shot": the ball first drifts to the edge of the box
        // (a windup), then — on a faster transition — is visibly struck
        // into the net, where a pulse ring confirms it actually landed
        // there rather than just hovering near the touchline.
        const netY = 50 + (Math.random() * 10 - 5);
        const approachX = event.side === 'home' ? 78 : 22;
        const netX = event.side === 'home' ? 98 : 2;
        const pulseId = Math.random();
        shotInProgressRef.current = true;
        setShooting(false);
        setBall({ x: approachX, y: netY });
        setTimeout(() => {
          setShooting(true);
          setBall({ x: netX, y: netY });
          setGoalPulses((prev) => [...prev, { id: pulseId, side: event.side, y: netY }]);
        }, SHOT_WINDUP_MS);
        setTimeout(() => setFlash(null), 1500);
        setTimeout(() => setGoalPulses((prev) => prev.filter((p) => p.id !== pulseId)), SHOT_WINDUP_MS + GOAL_HOLD_MS);
        setTimeout(() => {
          setShooting(false);
          setBall({ x: 50, y: 50 });
          shotInProgressRef.current = false;
        }, SHOT_WINDUP_MS + GOAL_HOLD_MS);
      } else if ((event.type === 'yellow-card' || event.type === 'red-card') && event.playerId && event.playerName) {
        const card: LiveCard = { playerId: event.playerId, playerName: event.playerName, minute: event.minute, cardType: event.type === 'red-card' ? 'red' : 'yellow' };
        if (event.side === 'home') setLiveHomeCards((prev) => [...prev, card]);
        else setLiveAwayCards((prev) => [...prev, card]);
      }
    });
  }

  // Runs one half (1-45 or 46-90) as a ticking interval, pausing (half time)
  // or finishing (full time) once it reaches the half's target minute.
  useEffect(() => {
    if (phase === 'half-time') return;
    const sim = simRef.current;
    if (!sim) return;

    const halfStart = phase === 'first-half' ? 0 : 45;
    const halfEnd = phase === 'first-half' ? 45 : 90;
    let tick = 0;

    const interval = setInterval(() => {
      tick += 1;
      const elapsed = tick * TICK_MS;
      const target = Math.min(halfEnd, halfStart + (elapsed / HALF_DURATION_MS) * (halfEnd - halfStart));
      const roundedTarget = Math.round(target);
      setMinute(roundedTarget);

      sim.advanceTo(roundedTarget);
      processNewEvents(sim.getResult(), roundedTarget);

      if (tick % JITTER_EVERY_N_TICKS === 0) {
        // A simple "momentum" sway — one side periodically pushes further
        // forward for a few seconds before it swings back — so the dots
        // read as waves of attack rather than aimless wandering. Cosmetic
        // only, not tied to the actual simulated score or chances.
        const attackingSide: 'home' | 'away' = Math.floor(tick / MOMENTUM_SWING_EVERY_N_TICKS) % 2 === 0 ? 'home' : 'away';
        setDots((prev) =>
          prev.map((d) => {
            const push = d.side === attackingSide && (d.role === 'FWD' || d.role === 'MID') ? (d.side === 'home' ? 4 : -4) : 0;
            const biasedX = Math.max(d.xMin, Math.min(d.xMax, d.x + push));
            return { ...d, x: randomJitter(biasedX, d.xMin, d.xMax, 10), y: randomJitter(d.y, 4, 96, 16) };
          }),
        );
        if (!shotInProgressRef.current) {
          setBall((prev) => {
            const push = attackingSide === 'home' ? 3 : -3;
            const biasedX = Math.max(25, Math.min(75, prev.x + push));
            return { x: randomJitter(biasedX, 25, 75, 10), y: randomJitter(prev.y, 15, 85, 10) };
          });
        }
      }

      if (elapsed >= HALF_DURATION_MS) {
        clearInterval(interval);
        if (phase === 'first-half') setPhase('half-time');
        else onFinished(sim.getResult());
      }
    }, TICK_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function handleSubstitute(outPlayerId: string, inPlayer: Player) {
    if (subsUsed >= MAX_SUBSTITUTIONS) return;
    simRef.current?.substitute(managedSide, outPlayerId, inPlayer);
    setManagedXI((prev) => prev.map((p) => (p.id === outPlayerId ? inPlayer : p)));
    setBench((prev) => prev.filter((p) => p.id !== inPlayer.id));
    setSubsUsed((n) => n + 1);
  }

  function skipToFullTime() {
    const sim = simRef.current;
    if (!sim) return;
    sim.advanceTo(90);
    onFinished(sim.getResult());
  }

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
            <span className="rounded-sm border-2 border-ink/50 bg-ink/10 px-2 py-1 text-sm font-bold text-ink">
              {phase === 'half-time' ? 'HT' : `${minute}'`}
            </span>
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-base font-bold text-ink">
            <span className="truncate">{awayClub.shortName}</span>
            <ClubCrest primaryColor={awayClub.primaryColor} secondaryColor={awayClub.secondaryColor} label={awayClub.shortName} crestPath={awayClub.crestPath} size={28} />
          </div>
        </div>
        <div className="flex justify-center gap-10 px-1 pb-1 text-xs text-ink/70">
          <div>{liveHomeScorers.map((s) => `${s.playerName} ${s.minutes.join(', ')}'`).join(' · ') || '—'}</div>
          <div>{liveAwayScorers.map((s) => `${s.playerName} ${s.minutes.join(', ')}'`).join(' · ') || '—'}</div>
        </div>
        {(liveHomeCards.length > 0 || liveAwayCards.length > 0) && (
          <div className="flex justify-center gap-10 px-1 pb-1 text-[11px] text-ink/70">
            <div className="flex flex-col items-end gap-0.5">
              {liveHomeCards.map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  <CardIcon type={c.cardType} />
                  {c.playerName} {c.minute}'
                </span>
              ))}
            </div>
            <div className="flex flex-col items-start gap-0.5">
              {liveAwayCards.map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  <CardIcon type={c.cardType} />
                  {c.playerName} {c.minute}'
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="mx-1 mb-1 h-1.5 overflow-hidden rounded-full bg-ink/30">
          <div className="h-full bg-white/80 transition-all duration-300 ease-linear" style={{ width: `${(minute / 90) * 100}%` }} />
        </div>
        <div className="px-1 pb-1 text-center text-[11px] text-ink/60">
          {homeClub.stadiumName} · Attendance {computeAttendance(fixtureId, homeClub.stadiumCapacity).toLocaleString()}
        </div>
      </Panel>

      {phase === 'half-time' ? (
        <HalfTimePanel
          managedXI={managedXI}
          bench={bench}
          sentOffIds={sentOffIds}
          subsUsed={subsUsed}
          onSubstitute={handleSubstitute}
          onContinue={() => setPhase('second-half')}
          onSkip={skipToFullTime}
        />
      ) : (
        <>
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
              className={`absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_3px_rgba(0,0,0,0.9)] ease-linear ${
                shooting ? 'transition-all duration-[300ms]' : 'transition-all duration-[900ms]'
              }`}
              style={{ left: `${ball.x}%`, top: `${ball.y}%` }}
            />

            {goalPulses.map((p) => (
              <div
                key={p.id}
                aria-hidden
                className="pointer-events-none absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-white/80"
                style={{ left: `${p.side === 'home' ? 97 : 3}%`, top: `${p.y}%` }}
              />
            ))}

            {flash && (
              <div className="absolute inset-x-0 top-1/3 flex justify-center px-4">
                <span className="flex flex-col items-center gap-0.5 rounded-sm bg-ink/90 px-3 py-1.5 text-center text-base font-black uppercase tracking-wide text-white">
                  <span>{flash.text}</span>
                  {flash.assistName && <span className="text-sm font-bold normal-case text-white/80">assisted by {flash.assistName}</span>}
                </span>
              </div>
            )}
          </div>

          <div className="mt-2 min-h-[24px] text-center text-white">
            <p className="text-base font-semibold">{ticker.text}</p>
            {ticker.assistName && <p className="text-sm text-white/70">assisted by {ticker.assistName}</p>}
          </div>

          <div className="mt-1 flex justify-center">
            <Button variant="secondary" onClick={skipToFullTime}>
              Skip to Full Time
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function HalfTimePanel({
  managedXI,
  bench,
  sentOffIds,
  subsUsed,
  onSubstitute,
  onContinue,
  onSkip,
}: {
  managedXI: Player[];
  bench: Player[];
  sentOffIds: Set<string>;
  subsUsed: number;
  onSubstitute: (outPlayerId: string, inPlayer: Player) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const subsLeft = MAX_SUBSTITUTIONS - subsUsed;

  return (
    <Panel title="Half Time" className="mb-2">
      <p className="mb-2 text-xs text-ink/70">
        Substitutions remaining: <strong>{subsLeft}</strong>
        {subsLeft === 0 && ' — no changes left'}
      </p>
      <ul className="flex flex-col gap-1">
        {managedXI.map((player) => {
          const sentOff = sentOffIds.has(player.id);
          const options = bench.filter((p) => p.position === player.position);
          return (
            <li key={player.id} className="flex items-center justify-between gap-2 rounded-sm border-2 border-ink/20 bg-white/60 px-2 py-1.5 text-sm text-ink">
              <span className={sentOff ? 'text-red-700 line-through' : ''}>
                {player.name} <span className="text-xs uppercase text-ink/50">{player.position}</span>
              </span>
              {sentOff ? (
                <span className="text-xs font-bold uppercase text-red-700">Sent off</span>
              ) : subsLeft > 0 && options.length > 0 ? (
                <select
                  className="rounded-sm border-2 border-ink/30 bg-white px-1.5 py-1 text-xs text-ink"
                  value=""
                  onChange={(e) => {
                    const inPlayer = options.find((p) => p.id === e.target.value);
                    if (inPlayer) onSubstitute(player.id, inPlayer);
                  }}
                >
                  <option value="" disabled>
                    Bring on...
                  </option>
                  {options.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-ink/40">—</span>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex justify-center gap-2">
        <Button onClick={onContinue}>Continue to Second Half</Button>
        <Button variant="secondary" onClick={onSkip}>
          Skip to Full Time
        </Button>
      </div>
    </Panel>
  );
}
