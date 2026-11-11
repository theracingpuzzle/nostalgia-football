import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../components/ui/Button';
import { ClubCrest } from '../components/ui/ClubCrest';
import { GoalFrame } from '../components/ui/GoalFrame';
import { Panel } from '../components/ui/Panel';
import { FORMATIONS, DEFAULT_FORMATION_ID } from '../data/formations';
import { computePlayerMorale, expandSlots, pickBestXI, type MonthlyPlayerStat, type MoraleInfo } from '../engine';
import type { Formation, Player, Position } from '../engine/types';
import { getContrastTextColor } from '../utils/colorContrast';

// Left-to-right, goalkeeper to forwards — matches a real screenshot of the
// original's live match screen (landscape pitch, goals at each end) rather
// than a guess. See PLAN.md.
const COLUMN_ORDER: Position[] = ['GK', 'DEF', 'MID', 'FWD'];

interface Slot {
  id: string;
  position: Position;
  playerId: string | null;
}

function buildEmptySlots(formation: Formation): Slot[] {
  return expandSlots(formation).map((position, i) => ({ id: `slot-${i}`, position, playerId: null }));
}

/**
 * "Coach's Help": fills only the currently-empty slots, leaving anything
 * already manually placed untouched. Builds a one-off mini formation shaped
 * like just the gap (e.g. "need 2 more DEF, 1 more FWD") so pickBestXI
 * doesn't over- or under-pick relative to what's actually missing.
 */
function fillEmptySlotsWithCoachPick(
  slots: Slot[],
  squad: Player[],
  pseudoClub: { id: string; name: string; shortName: string; colors: { primary: string; secondary: string }; reputation: number; players: Player[] },
): Slot[] {
  const usedIds = new Set(slots.map((s) => s.playerId).filter((id): id is string => id !== null));
  const emptySlots = slots.filter((s) => s.playerId === null);
  if (emptySlots.length === 0) return slots;

  const neededCounts = new Map<Position, number>();
  for (const slot of emptySlots) {
    neededCounts.set(slot.position, (neededCounts.get(slot.position) ?? 0) + 1);
  }

  const gapFormation: Formation = {
    id: 'coach-fill',
    name: 'coach-fill',
    slots: [...neededCounts.entries()].map(([position, count]) => ({ position, count })),
    attackBias: 1,
    defenseBias: 1,
  };

  const availablePlayers = squad.filter((p) => !p.injured && !usedIds.has(p.id));
  const pick = pickBestXI({ ...pseudoClub, players: availablePlayers }, gapFormation);

  const pickByPosition = new Map<Position, Player[]>();
  for (const player of pick) {
    const list = pickByPosition.get(player.position) ?? [];
    list.push(player);
    pickByPosition.set(player.position, list);
  }

  return slots.map((slot) => {
    if (slot.playerId !== null) return slot;
    const player = pickByPosition.get(slot.position)?.shift();
    return player ? { ...slot, playerId: player.id } : slot;
  });
}

interface TeamSelectionScreenProps {
  clubName: string;
  clubShortName: string;
  primaryColor: string;
  secondaryColor: string;
  crestPath?: string;
  squad: Player[];
  /** This season's per-player stats so far (appearances/goals/rating), used to derive morale and coach advice. Omit (or pass an empty map) if unavailable. */
  seasonStats?: Map<string, MonthlyPlayerStat>;
  /** How many of this club's fixtures have been played this season — morale needs this to judge "rarely used" relative to the season length. */
  teamGamesPlayed?: number;
  /** Fires whenever the chosen formation or XI changes, so a parent can use it elsewhere (e.g. simulating a match) without a separate "save" step. */
  onTeamChange?: (formationId: string, xiPlayerIds: string[]) => void;
  /** Optional shortcut button, e.g. to jump to the Fixtures screen. Omit to hide it. */
  onContinue?: () => void;
}

/**
 * Stage 2+3: Team Selection & Formation screen with drag-and-drop. Players
 * drag from the squad list, substitutes panel, or another pitch slot onto a
 * pitch slot to take that position; dragging onto the squad/substitutes
 * panel benches them. Injured players can't be dragged onto the pitch.
 * GK and outfield slots reject each other — everything else is free-form.
 *
 * Layout is a sidebar (formation/coach/continue) + main area (pitch+subs,
 * squad below) rather than one long vertical stack, specifically so it fits
 * in one screen without scrolling — a usability call, not a claim about the
 * original's actual layout (still unconfirmed, see PLAN.md).
 *
 * Starts with every slot empty and a 1-keeper/4-outfield subs panel, and
 * stays empty on a formation change too — confirmed from a real screenshot
 * of the original's Select Your Team/Formation screen. "Coach's Help" fills
 * whatever's still empty with the strongest available XI; it doesn't touch
 * slots you've already placed yourself.
 */
export function TeamSelectionScreen({
  clubName,
  clubShortName,
  primaryColor,
  secondaryColor,
  crestPath,
  squad,
  seasonStats,
  teamGamesPlayed = 0,
  onTeamChange,
  onContinue,
}: TeamSelectionScreenProps) {
  const [formationId, setFormationId] = useState(DEFAULT_FORMATION_ID);
  const [showCoachAdvice, setShowCoachAdvice] = useState(false);
  const [slots, setSlots] = useState<Slot[]>(() => {
    const formation = FORMATIONS.find((f) => f.id === DEFAULT_FORMATION_ID) ?? FORMATIONS[0];
    return buildEmptySlots(formation);
  });
  // Tap-to-place: an alternative to drag-and-drop for mobile, where dragging
  // is fiddly. Tap a player (pitch, subs, or squad), then tap a destination
  // (a pitch slot, or another player to swap with). Reuses the exact same
  // dropOnSlot/dropOnBench logic as drag-and-drop below — this is just a
  // second way to trigger it.
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const formation = FORMATIONS.find((f) => f.id === formationId) ?? FORMATIONS[0];
  const contrastText = getContrastTextColor(primaryColor);
  const pseudoClub = useMemo(
    () => ({ id: 'demo', name: clubName, shortName: clubShortName, colors: { primary: primaryColor, secondary: secondaryColor }, reputation: 70, players: squad }),
    [clubName, clubShortName, primaryColor, secondaryColor, squad],
  );

  function handleFormationChange(nextFormationId: string) {
    const nextFormation = FORMATIONS.find((f) => f.id === nextFormationId) ?? FORMATIONS[0];
    setFormationId(nextFormationId);
    setSlots(buildEmptySlots(nextFormation));
  }

  function handleCoachHelp() {
    setShowCoachAdvice(true);
    setSlots((prev) => fillEmptySlotsWithCoachPick(prev, squad, pseudoClub));
  }

  const playersById = useMemo(() => new Map(squad.map((p) => [p.id, p])), [squad]);
  const xiIds = useMemo(() => new Set(slots.map((s) => s.playerId).filter((id): id is string => id !== null)), [slots]);
  const substitutes = squad.filter((p) => !xiIds.has(p.id));
  const injuredPlayers = useMemo(() => squad.filter((p) => p.injured), [squad]);

  const moraleByPlayerId = useMemo(() => {
    const map = new Map<string, MoraleInfo>();
    for (const p of squad) map.set(p.id, computePlayerMorale(seasonStats?.get(p.id), teamGamesPlayed));
    return map;
  }, [squad, seasonStats, teamGamesPlayed]);

  const unsettledPlayers = useMemo(
    () => squad.filter((p) => !p.injured && moraleByPlayerId.get(p.id)?.label.startsWith('Unsettled')),
    [squad, moraleByPlayerId],
  );
  const lowConfidencePlayers = useMemo(
    () => squad.filter((p) => !p.injured && moraleByPlayerId.get(p.id)?.label === 'Low confidence'),
    [squad, moraleByPlayerId],
  );

  /** Best-rated available player not currently in the XI — a concrete, actionable nudge rather than just a squad summary. */
  const inFormSuggestion = useMemo(() => {
    const candidates = squad
      .filter((p) => !p.injured && !xiIds.has(p.id))
      .map((p) => ({ player: p, stat: seasonStats?.get(p.id) }))
      .filter((c) => c.stat && c.stat.appearances > 0 && c.stat.averageRating >= 7)
      .sort((a, b) => (b.stat?.averageRating ?? 0) - (a.stat?.averageRating ?? 0));
    return candidates[0];
  }, [squad, xiIds, seasonStats]);

  const onTeamChangeRef = useRef(onTeamChange);
  onTeamChangeRef.current = onTeamChange;
  useEffect(() => {
    onTeamChangeRef.current?.(formationId, [...xiIds]);
  }, [formationId, xiIds]);

  function dropOnSlot(playerId: string, targetSlotId: string) {
    const player = playersById.get(playerId);
    if (!player || player.injured) return; // can't field injured players

    setSlots((prev) => {
      const targetIndex = prev.findIndex((s) => s.id === targetSlotId);
      if (targetIndex === -1) return prev;
      const targetSlot = prev[targetIndex];
      const isGKMismatch = (player.position === 'GK') !== (targetSlot.position === 'GK');
      if (isGKMismatch) return prev; // reject: keepers and outfielders don't swap

      const next = prev.map((s) => ({ ...s }));
      const sourceIndex = next.findIndex((s) => s.playerId === playerId);
      const previousAtTarget = next[targetIndex].playerId;
      next[targetIndex].playerId = playerId;
      if (sourceIndex !== -1 && sourceIndex !== targetIndex) {
        next[sourceIndex].playerId = previousAtTarget;
      }
      return next;
    });
  }

  function dropOnBench(playerId: string) {
    setSlots((prev) => prev.map((s) => (s.playerId === playerId ? { ...s, playerId: null } : s)));
  }

  /**
   * Tap-to-place dispatcher. `playerId` is the player tapped (if any);
   * `slotId` is set only when a pitch slot itself was tapped. First tap with
   * nothing selected just selects a player. A second tap on the same player
   * deselects. A second tap on a pitch slot moves the selected player there
   * (dropOnSlot already handles swapping whoever was there back out). A
   * second tap on another squad/bench row either swaps them in for a
   * selected pitch player, or — if the selection was already a bench player
   * too — just switches the selection.
   */
  function handleTap(playerId: string | null, slotId: string | null) {
    if (selectedPlayerId === null) {
      if (playerId) setSelectedPlayerId(playerId);
      return;
    }
    if (playerId === selectedPlayerId) {
      setSelectedPlayerId(null);
      return;
    }
    if (slotId) {
      dropOnSlot(selectedPlayerId, slotId);
      setSelectedPlayerId(null);
      return;
    }
    if (playerId) {
      const selectedSlot = slots.find((s) => s.playerId === selectedPlayerId);
      if (selectedSlot) {
        dropOnSlot(playerId, selectedSlot.id);
        setSelectedPlayerId(null);
      } else {
        setSelectedPlayerId(playerId);
      }
    }
  }

  const filledCount = slots.filter((s) => s.playerId !== null).length;

  return (
    <div className="mx-auto max-w-6xl p-3 text-white">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-1.5 text-base font-black uppercase tracking-wide md:gap-2 md:text-xl">
          <ClubCrest primaryColor={primaryColor} secondaryColor={secondaryColor} label={clubShortName} crestPath={crestPath} size={28} />
          <span className="truncate">{clubName} — Team Selection</span>
        </h2>
        <span
          className={`shrink-0 whitespace-nowrap rounded-sm border-2 px-2 py-1 text-xs font-bold md:px-2.5 md:py-1.5 md:text-sm ${filledCount === 11 ? 'border-green-300 bg-green-800' : 'border-amber-300 bg-amber-800'}`}
        >
          Starting XI: {filledCount} / 11
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <div className="flex flex-col gap-3">
          <Panel title="Formation" accentColor={primaryColor}>
            <div className="flex flex-col gap-1.5">
              {FORMATIONS.map((f) => {
                const selected = f.id === formationId;
                return (
                  <Button
                    key={f.id}
                    variant="secondary"
                    className="w-full"
                    onClick={() => handleFormationChange(f.id)}
                    style={selected ? { backgroundColor: primaryColor, borderColor: secondaryColor, color: contrastText } : undefined}
                  >
                    {f.name}
                  </Button>
                );
              })}
            </div>
          </Panel>

          <Panel title="Coach says..." accentColor={primaryColor}>
            {showCoachAdvice ? (
              <ul className="list-disc space-y-1 pl-4 text-xs text-ink/80">
                {injuredPlayers.length > 0 ? (
                  <li>Injured: {injuredPlayers.map((p) => p.name).join(', ')}</li>
                ) : (
                  <li>No fresh injury concerns.</li>
                )}
                {unsettledPlayers.length > 0 && (
                  <li>Unsettled, wants game time: {unsettledPlayers.map((p) => p.name).join(', ')}</li>
                )}
                {lowConfidencePlayers.length > 0 && (
                  <li>Short of confidence lately: {lowConfidencePlayers.map((p) => p.name).join(', ')}</li>
                )}
                {inFormSuggestion && (
                  <li>
                    In great form: <strong>{inFormSuggestion.player.name}</strong> ({inFormSuggestion.stat?.averageRating.toFixed(1)} avg) isn't in your XI yet.
                  </li>
                )}
                <li className="list-none pl-0 text-[10px] italic text-ink/50">
                  (Morale and form here are a new addition, worked out from this season's appearances and ratings — not confirmed from the original.)
                </li>
              </ul>
            ) : (
              <p className="text-xs text-ink/70">Click Coach's Help for a squad summary and to fill any empty slots.</p>
            )}
            <Button variant="secondary" className="mt-2 w-full" onClick={handleCoachHelp}>
              Coach's Help
            </Button>
          </Panel>

          {onContinue && (
            <Button className="w-full" style={{ backgroundColor: primaryColor, borderColor: secondaryColor, color: contrastText }} onClick={onContinue}>
              Continue
            </Button>
          )}
        </div>

        {/* Main area */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_210px]">
            <Panel title={`Pitch (${formation.name}) — drag, or tap a player then tap a slot`} accentColor={primaryColor}>
              {/*
                Portrait (down the page) on mobile for usability, landscape
                (left-to-right, matching the real reference screenshot) from
                md up. Two full sets of decorations rather than trying to
                make one set orientation-agnostic via breakpoint overrides —
                more lines, much less fragile.
              */}
              <div className="relative overflow-hidden rounded-sm border-4 border-white bg-pitch h-[460px] md:h-[300px]">
                {/* Portrait decorations */}
                <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t-2 border-white/60 md:hidden" />
                <div className="pointer-events-none absolute left-1/2 top-0 h-12 w-40 -translate-x-1/2 border-2 border-t-0 border-white/60 md:hidden" />
                <div className="pointer-events-none absolute bottom-0 left-1/2 h-12 w-40 -translate-x-1/2 border-2 border-b-0 border-white/60 md:hidden" />
                <div className="md:hidden">
                  <GoalFrame side="top" size={56} />
                </div>
                <div className="md:hidden">
                  <GoalFrame side="bottom" size={56} />
                </div>

                {/* Landscape decorations */}
                <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden border-l-2 border-white/60 md:block" />
                <div className="pointer-events-none absolute left-0 top-1/2 hidden h-36 w-14 -translate-y-1/2 border-2 border-l-0 border-white/60 md:block" />
                <div className="pointer-events-none absolute right-0 top-1/2 hidden h-36 w-14 -translate-y-1/2 border-2 border-r-0 border-white/60 md:block" />
                <div className="hidden md:block">
                  <GoalFrame side="left" size={56} />
                </div>
                <div className="hidden md:block">
                  <GoalFrame side="right" size={56} />
                </div>

                {/* Center circle — same shape either orientation */}
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60" />

                <div className="relative flex h-full flex-col items-stretch justify-between gap-1 px-3 py-3 md:flex-row md:px-5">
                  {COLUMN_ORDER.map((position) => {
                    const columnSlots = slots.filter((s) => s.position === position);
                    if (columnSlots.length === 0) return null;
                    return (
                      <div key={position} className="flex flex-1 flex-row items-stretch justify-center gap-1 md:flex-col md:items-center md:gap-2">
                        {columnSlots.map((slot) => {
                          const player = slot.playerId ? (playersById.get(slot.playerId) ?? null) : null;
                          return (
                            <PitchSlotView
                              key={slot.id}
                              slot={slot}
                              player={player}
                              primaryColor={primaryColor}
                              secondaryColor={secondaryColor}
                              isSelected={player?.id === selectedPlayerId}
                              onDropPlayer={(playerId) => dropOnSlot(playerId, slot.id)}
                              onTap={() => handleTap(player?.id ?? null, slot.id)}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Panel>

            <Panel title="Substitutes" accentColor={primaryColor}>
              <ul
                className="flex flex-col gap-1 overflow-y-auto text-sm"
                style={{ height: 300 - 40 }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  dropOnBench(e.dataTransfer.getData('text/plain'));
                }}
              >
                {substitutes.map((p) => (
                  <DraggableRow key={p.id} player={p} morale={moraleByPlayerId.get(p.id)} isSelected={p.id === selectedPlayerId} onTap={() => handleTap(p.id, null)} />
                ))}
              </ul>
            </Panel>
          </div>

          <Panel title="Squad" accentColor={primaryColor}>
            <div className="mb-1.5 flex items-center gap-3 text-[10px] text-ink/60">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" /> Good morale
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-gray-400" /> Neutral
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" /> Unhappy
              </span>
            </div>
            <ul
              className="grid max-h-40 grid-cols-1 gap-1 overflow-y-auto text-sm sm:grid-cols-2 md:grid-cols-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                dropOnBench(e.dataTransfer.getData('text/plain'));
              }}
            >
              {squad.map((p) => {
                const inXI = xiIds.has(p.id);
                return (
                  <DraggableRow
                    key={p.id}
                    player={p}
                    highlight={inXI}
                    highlightColor={primaryColor}
                    morale={moraleByPlayerId.get(p.id)}
                    isSelected={p.id === selectedPlayerId}
                    onTap={() => handleTap(p.id, null)}
                  />
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

const MORALE_DOT_CLASS: Record<MoraleInfo['tone'], string> = {
  good: 'bg-green-500',
  neutral: 'bg-gray-400',
  bad: 'bg-red-500',
};

function DraggableRow({
  player,
  highlight,
  highlightColor,
  morale,
  isSelected,
  onTap,
}: {
  player: Player;
  highlight?: boolean;
  highlightColor?: string;
  morale?: MoraleInfo;
  isSelected?: boolean;
  onTap?: () => void;
}) {
  return (
    <li
      draggable={!player.injured}
      onDragStart={(e) => e.dataTransfer.setData('text/plain', player.id)}
      onClick={player.injured ? undefined : onTap}
      title={morale?.label}
      className={`flex items-center justify-between rounded-sm border-2 px-2 py-1.5 ${
        player.injured
          ? 'cursor-not-allowed border-pink-400 bg-pink-200 text-pink-900'
          : `cursor-grab active:cursor-grabbing bg-white/70 text-ink ${highlight ? 'font-bold' : 'border-ink/20'}`
      } ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}`}
      style={highlight && !player.injured && highlightColor ? { borderColor: highlightColor } : undefined}
    >
      <span className="flex items-center gap-1.5">
        {morale && <span aria-hidden className={`inline-block h-2 w-2 shrink-0 rounded-full ${MORALE_DOT_CLASS[morale.tone]}`} />}
        {player.name}
      </span>
      <span className="text-xs uppercase text-ink/60">{player.position}</span>
    </li>
  );
}

function PitchSlotView({
  slot,
  player,
  primaryColor,
  secondaryColor,
  isSelected,
  onDropPlayer,
  onTap,
}: {
  slot: Slot;
  player: Player | null;
  primaryColor: string;
  secondaryColor: string;
  isSelected?: boolean;
  onDropPlayer: (playerId: string) => void;
  onTap?: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const selectedRing = isSelected ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-pitch' : '';

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        onDropPlayer(e.dataTransfer.getData('text/plain'));
      }}
      onClick={onTap}
      /*
       * flex-1/basis-0/min-w-0 (mobile only) make every slot in a position
       * row shrink or grow to divide the row's width equally — so a row of
       * 4 defenders always renders as 4 uniform cards on one line, matching
       * the formation shape, rather than wrapping onto a second row. The
       * max-w-[110px] ceiling keeps a lone slot (e.g. the goalkeeper) from
       * stretching to the full row width. Desktop (md:) reverts to the
       * original fixed-size column stack, unchanged.
       */
      className={`flex flex-1 basis-0 min-w-0 max-w-[110px] flex-col items-center rounded-sm md:flex-none ${dragOver ? 'ring-2 ring-white ring-offset-1 ring-offset-pitch' : selectedRing}`}
    >
      {player ? (
        <div
          draggable
          onDragStart={(e) => e.dataTransfer.setData('text/plain', player.id)}
          className="w-full cursor-grab break-words rounded-sm border-2 px-1 py-1 text-center text-[11px] font-bold leading-tight shadow-[1px_1px_0_rgba(0,0,0,0.4)] active:cursor-grabbing md:px-2 md:text-sm"
          style={{ backgroundColor: primaryColor, borderColor: secondaryColor, color: getContrastTextColor(primaryColor) }}
        >
          {player.name}
          <div className="text-[8px] font-normal opacity-70 md:text-[10px]">{player.position}</div>
        </div>
      ) : (
        <div className="w-full rounded-sm border-2 border-dashed border-white/50 px-1 py-1 text-center text-[10px] font-bold uppercase text-white/60 md:px-3 md:py-1.5 md:text-xs">
          {slot.position}
          <div className="font-normal normal-case">empty</div>
        </div>
      )}
    </div>
  );
}
