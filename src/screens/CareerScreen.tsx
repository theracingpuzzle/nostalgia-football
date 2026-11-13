import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CareerNav, type CareerScreenId } from '../components/layout/CareerNav';
import { SQUADS_BY_CLUB_ID } from '../data/clubSquads';
import { DEFAULT_FORMATION_ID, FORMATIONS } from '../data/formations';
import { ALL_CLUBS, LEAGUES, getLeagueForClub } from '../data/leagues';
import type { ClubListing } from '../data/premierLeague0809';
import {
  advancePlayoff,
  applyInjuryUpdates,
  applyResultToPlayoffFixture,
  computeLeagueTable,
  computeMonthlyPlayerStats,
  createPlayoffState,
  createRandom,
  fastForwardPlayoff,
  generateFixtures,
  managedClubStillInPlayoff,
  simulateMatchday,
  type PlayoffState,
} from '../engine';
import type { Fixture, MatchResult, Player, TeamMatchInput } from '../engine/types';
import {
  advanceBackgroundLeagueMatchday,
  createBackgroundLeagueState,
  fastForwardBackgroundLeagueSeason,
  isBackgroundLeagueSeasonComplete,
  type BackgroundLeagueState,
} from '../utils/backgroundLeague';
import { computePyramidTransition } from '../utils/pyramid';
import { FixturesScreen } from './FixturesScreen';
import { LeagueTableScreen } from './LeagueTableScreen';
import { MatchAnimationScreen } from './MatchAnimationScreen';
import { MatchResultScreen } from './MatchResultScreen';
import { OtherLeaguesScreen } from './OtherLeaguesScreen';
import { PlayoffScreen } from './PlayoffScreen';
import { SeasonSummaryScreen, type DivisionOutcome } from './SeasonSummaryScreen';
import { StatsScreen, type PlayerSeasonTotal } from './StatsScreen';
import { TeamOfTheMonthScreen } from './TeamOfTheMonthScreen';
import { TeamSelectionScreen } from './TeamSelectionScreen';
import {
  DEADLINE_DAY_END_HOUR,
  DEADLINE_DAY_START_HOUR,
  TransferWindowScreen,
  type TransferOffer,
  type TransferTimelineEntry,
} from './TransferWindowScreen';
import { saveCareer, type CareerSaveData } from '../utils/careerStorage';

const AI_FORMATION = FORMATIONS.find((f) => f.id === DEFAULT_FORMATION_ID) ?? FORMATIONS[0];

const TRANSFER_FLAVOR_TEMPLATES: ((out: string, inP: string, inClub: string) => string)[] = [
  (out, inP, inClub) => `Dressing room gossip: ${out} fancies a change of scenery. ${inClub} will send ${inP} the other way.`,
  (out, inP, inClub) => `Tabloid exclusive! ${inP} has told ${inClub} he wants to play for you — they just want ${out} in return.`,
  (out, inP, inClub) => `Your tea lady reckons ${out} has been house-hunting near ${inClub}'s training ground. They've offered ${inP}.`,
  (out, inP, inClub) => `${inClub} rang. Straight swap: ${inP} for ${out}. Take it or leave it, they said.`,
  (out, inP, inClub) => `Transfer deadline fever: ${out} to ${inClub} for ${inP}? Your board seems oddly keen.`,
];

const TRANSFER_NEWS_TEMPLATES: ((outName: string, outClub: string, inName: string, inClub: string) => string)[] = [
  (outName, outClub, inName, inClub) => `BREAKING: ${outClub} confirm ${outName} heads to ${inClub} in a straight swap for ${inName}.`,
  (outName, outClub, inName, inClub) => `Deadline done: ${inName} joins ${outClub} from ${inClub}, with ${outName} going the other way.`,
  (outName, outClub, inName, inClub) => `Surprise swap! ${outClub} and ${inClub} trade ${outName} for ${inName}.`,
  (outName, outClub, inName, inClub) => `${outClub} and ${inClub} do a deadline deal: ${outName} out, ${inName} in.`,
  (outName, outClub, inName, inClub) => `Here we go! ${inName} completes his move to ${outClub}, ${outName} going to ${inClub} to complete the swap.`,
];

/**
 * Other clubs make their own moves too, not just the ones offered to you —
 * a handful of silly swap deals happen between random OTHER clubs whenever
 * a transfer window opens, applied straight to their squads (no offer/
 * accept step, since it's not your business). Produces a short list of
 * tabloid-style headlines for a "transfer deadline news feed." Same spirit
 * as the player-facing transfer window: a fun addition, not a transfer
 * market simulation.
 */
function simulateLeagueTransferActivity(
  allSquads: Record<string, Player[]>,
  leagueClubIds: string[],
  excludeClubId: string,
  count: number,
): { updatedSquads: Record<string, Player[]>; news: { text: string; clubIds: [string, string] }[] } {
  const next = cloneSquads(allSquads);
  const news: { text: string; clubIds: [string, string] }[] = [];
  // Scoped to the managed club's OWN league — otherwise, once squads from
  // multiple leagues share one allSquads map, this would swap/rumor
  // players across leagues, which shouldn't be possible.
  const otherClubIds = leagueClubIds.filter((id) => id !== excludeClubId);
  const usedPlayerIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    const sellingClubId = otherClubIds[Math.floor(Math.random() * otherClubIds.length)];
    const sellingSquad = next[sellingClubId] ?? [];
    const outCandidates = sellingSquad.filter(
      (p) => !usedPlayerIds.has(p.id) && sellingSquad.filter((q) => q.position === p.position).length > 1,
    );
    if (outCandidates.length === 0) continue;
    const outPlayer = outCandidates[Math.floor(Math.random() * outCandidates.length)];

    const buyingCandidates = otherClubIds.filter((id) => id !== sellingClubId);
    let picked: { inPlayer: Player; buyingClubId: string } | null = null;
    for (const buyingClubId of [...buyingCandidates].sort(() => Math.random() - 0.5)) {
      const roster = next[buyingClubId] ?? [];
      const samePosition = roster.filter((p) => p.position === outPlayer.position && !usedPlayerIds.has(p.id));
      if (samePosition.length > 0) {
        picked = { inPlayer: samePosition[Math.floor(Math.random() * samePosition.length)], buyingClubId };
        break;
      }
    }
    if (!picked) continue;

    usedPlayerIds.add(outPlayer.id);
    usedPlayerIds.add(picked.inPlayer.id);

    next[sellingClubId] = next[sellingClubId].filter((p) => p.id !== outPlayer.id).concat(picked.inPlayer);
    next[picked.buyingClubId] = next[picked.buyingClubId].filter((p) => p.id !== picked.inPlayer.id).concat(outPlayer);

    const sellingName = ALL_CLUBS.find((c) => c.id === sellingClubId)?.shortName ?? sellingClubId;
    const buyingName = ALL_CLUBS.find((c) => c.id === picked.buyingClubId)?.shortName ?? picked.buyingClubId;
    const template = TRANSFER_NEWS_TEMPLATES[Math.floor(Math.random() * TRANSFER_NEWS_TEMPLATES.length)];
    news.push({ text: template(outPlayer.name, sellingName, picked.inPlayer.name, buyingName), clubIds: [sellingClubId, picked.buyingClubId] });
  }

  return { updatedSquads: next, news };
}

const TRANSFER_RUMOUR_TEMPLATES: ((playerName: string, playerClub: string, interestedClub: string) => string)[] = [
  (playerName, playerClub, interestedClub) => `Whispers: ${interestedClub} are keeping tabs on ${playerClub}'s ${playerName} — nothing official yet.`,
  (playerName, playerClub, interestedClub) => `Paper talk: ${playerName} (${playerClub}) strongly linked with a shock move to ${interestedClub}.`,
  (playerName, playerClub, interestedClub) => `Sources suggest ${interestedClub} have made an enquiry for ${playerClub}'s ${playerName}. Early days.`,
  (playerName, playerClub, interestedClub) => `Agent spotted at ${interestedClub}'s training ground — cue the ${playerClub} ${playerName} rumours.`,
  (playerName, playerClub, interestedClub) => `Unconfirmed: ${interestedClub} are said to be "monitoring" ${playerName}'s situation at ${playerClub}.`,
];

/**
 * Pure speculation, same tabloid spirit as simulateLeagueTransferActivity
 * but deliberately NOT applied to any squad — a rumour is just a headline,
 * not a done deal, and (same as real transfer gossip) nothing says it has
 * to actually happen. Kept separate from the confirmed-swap news so the UI
 * can clearly mark one "RUMOUR" and the other "DONE DEAL".
 */
function simulateLeagueRumours(
  allSquads: Record<string, Player[]>,
  leagueClubIds: string[],
  excludeClubId: string,
  count: number,
): { text: string; clubIds: [string, string] }[] {
  const otherClubIds = leagueClubIds.filter((id) => id !== excludeClubId);
  const rumours: { text: string; clubIds: [string, string] }[] = [];

  for (let i = 0; i < count; i++) {
    const playerClubId = otherClubIds[Math.floor(Math.random() * otherClubIds.length)];
    const roster = allSquads[playerClubId] ?? [];
    if (roster.length === 0) continue;
    const player = roster[Math.floor(Math.random() * roster.length)];

    const interestedCandidates = otherClubIds.filter((id) => id !== playerClubId);
    if (interestedCandidates.length === 0) continue;
    const interestedClubId = interestedCandidates[Math.floor(Math.random() * interestedCandidates.length)];

    const playerClubName = ALL_CLUBS.find((c) => c.id === playerClubId)?.shortName ?? playerClubId;
    const interestedClubName = ALL_CLUBS.find((c) => c.id === interestedClubId)?.shortName ?? interestedClubId;
    const template = TRANSFER_RUMOUR_TEMPLATES[Math.floor(Math.random() * TRANSFER_RUMOUR_TEMPLATES.length)];
    rumours.push({ text: template(player.name, playerClubName, interestedClubName), clubIds: [playerClubId, interestedClubId] });
  }

  return rumours;
}

const COUNTDOWN_HOURS_LEFT_CHECKPOINTS = [12, 9, 6, 3, 1];

/** Fixed "X hours left" checkpoints through the window — not tied to any news/offer. */
function buildCountdownEntries(): TransferTimelineEntry[] {
  return COUNTDOWN_HOURS_LEFT_CHECKPOINTS.map((hoursLeft) => ({
    hour: DEADLINE_DAY_END_HOUR - hoursLeft,
    kind: 'countdown' as const,
    id: `countdown-${hoursLeft}`,
    hoursLeft,
  })).filter((entry) => entry.hour >= DEADLINE_DAY_START_HOUR);
}

/**
 * Picks an hour within the deadline-day window, skewed toward the end —
 * real deadline days are quiet in the morning and go mad in the last
 * couple of hours. Taking the max of three uniform rolls biases the result
 * toward 1 (so toward DEADLINE_DAY_END_HOUR) without ruling out an early
 * hour entirely — a classic skew trick, not anything statistically
 * rigorous about real transfer deadlines.
 */
function pickBiasedHour(): number {
  const span = DEADLINE_DAY_END_HOUR - DEADLINE_DAY_START_HOUR + 1;
  const skewed = Math.max(Math.random(), Math.random(), Math.random());
  return DEADLINE_DAY_START_HOUR + Math.min(span - 1, Math.floor(skewed * span));
}

/**
 * Spreads this window's news items and your own offers across the fixed
 * "deadline day" hours (see TransferWindowScreen) — each item gets its own
 * independently-rolled, end-biased hour (see pickBiasedHour), so several
 * items can land in the same hour and the feed visibly thickens up as the
 * deadline approaches, rather than one tidy item per hour spread evenly
 * across the whole day. Fixed "hours left" countdown entries are layered
 * on top at the same checkpoints every time.
 */
function scheduleTransferTimeline(
  news: { text: string; confirmed: boolean; clubIds: [string, string] }[],
  offers: TransferOffer[],
): TransferTimelineEntry[] {
  type TimelineItem =
    | { kind: 'news'; id: string; text: string; confirmed: boolean; clubIds: [string, string] }
    | { kind: 'offer'; id: string; offerId: string };
  const items: TimelineItem[] = [
    ...news.map((n, i): TimelineItem => ({ kind: 'news', id: `news-${i}-${n.text.length}`, text: n.text, confirmed: n.confirmed, clubIds: n.clubIds })),
    ...offers.map((offer): TimelineItem => ({ kind: 'offer', id: `offer-${offer.id}`, offerId: offer.id })),
  ];

  const scheduled: TransferTimelineEntry[] = items.map((item) => ({ ...item, hour: pickBiasedHour() }));
  return [...scheduled, ...buildCountdownEntries()].sort((a, b) => a.hour - b.hour);
}

function getFormation(formationId: string) {
  return FORMATIONS.find((f) => f.id === formationId) ?? FORMATIONS[0];
}

/** Looks up a fixture by id among a playoff's legs/final — these never live in the main `fixtures` list (see engine/playoffs.ts). */
function findPlayoffFixture(playoff: PlayoffState | null, fixtureId: string): Fixture | null {
  if (!playoff) return null;
  const candidates = [playoff.semiFinal1.leg1, playoff.semiFinal1.leg2, playoff.semiFinal2.leg1, playoff.semiFinal2.leg2, playoff.final];
  return candidates.find((f): f is Fixture => f !== null && f.id === fixtureId) ?? null;
}

function computeSeasonStats(fixtures: Fixture[]): PlayerSeasonTotal[] {
  const totals = new Map<string, PlayerSeasonTotal>();

  function entry(playerId: string, playerName: string, clubId: string): PlayerSeasonTotal {
    const existing = totals.get(playerId);
    if (existing) return existing;
    const fresh = { playerId, playerName, clubId, goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
    totals.set(playerId, fresh);
    return fresh;
  }

  for (const fixture of fixtures) {
    if (!fixture.played || !fixture.result) continue;
    const { result } = fixture;
    for (const s of result.homeScorers) entry(s.playerId, s.playerName, fixture.homeClubId).goals += s.minutes.length;
    for (const s of result.awayScorers) entry(s.playerId, s.playerName, fixture.awayClubId).goals += s.minutes.length;
    for (const a of result.homeAssists) entry(a.playerId, a.playerName, fixture.homeClubId).assists += a.minutes.length;
    for (const a of result.awayAssists) entry(a.playerId, a.playerName, fixture.awayClubId).assists += a.minutes.length;
    for (const b of result.homeBookings) entry(b.playerId, b.playerName, fixture.homeClubId).yellowCards += b.minutes.length;
    for (const b of result.awayBookings) entry(b.playerId, b.playerName, fixture.awayClubId).yellowCards += b.minutes.length;
    for (const r of result.homeRedCards) entry(r.playerId, r.playerName, fixture.homeClubId).redCards += r.minutes.length;
    for (const r of result.awayRedCards) entry(r.playerId, r.playerName, fixture.awayClubId).redCards += r.minutes.length;
  }

  return [...totals.values()].sort((a, b) => b.goals - a.goals);
}

/** Picks a handful of silly straight-swap offers: one of your reserves for a same-position player from a random other club (within the managed club's own league). Not a transfer market simulation — just flavor. */
function generateTransferOffers(managedClubId: string, leagueClubIds: string[], allSquads: Record<string, Player[]>, protectedIds: Set<string>, count = 3): TransferOffer[] {
  const managedSquad = allSquads[managedClubId] ?? [];
  const otherClubIds = leagueClubIds.filter((id) => id !== managedClubId);

  const outCandidates = managedSquad.filter(
    (p) => !protectedIds.has(p.id) && managedSquad.filter((q) => q.position === p.position).length > 1,
  );
  const shuffledOut = [...outCandidates].sort(() => Math.random() - 0.5).slice(0, count);

  const offers: TransferOffer[] = [];
  const usedInPlayerIds = new Set<string>();

  for (const outPlayer of shuffledOut) {
    const candidateClubs = [...otherClubIds].sort(() => Math.random() - 0.5);
    let picked: { inPlayer: Player; inClubId: string } | null = null;

    for (const clubId of candidateClubs) {
      const roster = allSquads[clubId] ?? [];
      const samePosition = roster.filter((p) => p.position === outPlayer.position && !usedInPlayerIds.has(p.id));
      if (samePosition.length > 0) {
        picked = { inPlayer: samePosition[Math.floor(Math.random() * samePosition.length)], inClubId: clubId };
        break;
      }
    }
    if (!picked) continue;

    usedInPlayerIds.add(picked.inPlayer.id);
    const inClubName = ALL_CLUBS.find((c) => c.id === picked.inClubId)?.name ?? picked.inClubId;
    const template = TRANSFER_FLAVOR_TEMPLATES[Math.floor(Math.random() * TRANSFER_FLAVOR_TEMPLATES.length)];

    offers.push({
      id: `${outPlayer.id}-${picked.inPlayer.id}`,
      outPlayer,
      inPlayer: picked.inPlayer,
      inClubName,
      inClubId: picked.inClubId,
      flavorText: template(outPlayer.name, picked.inPlayer.name, inClubName),
      status: 'pending',
    });
  }

  return offers;
}

function cloneSquads(source: Record<string, Player[]>): Record<string, Player[]> {
  const clone: Record<string, Player[]> = {};
  for (const [id, players] of Object.entries(source)) clone[id] = [...players];
  return clone;
}

/**
 * Everything the live match screen needs to simulate the managed club's
 * fixture itself (so half-time substitutions can affect the second half),
 * plus what's needed to finish the job once it reports back: the other
 * matchday fixtures are simulated and committed immediately in
 * playNextFixture as before, but this one fixture's seed is just reserved
 * there — the actual simulation happens live, and injuries for the WHOLE
 * matchday wait until this result is known too.
 */
interface LiveMatchSetup {
  fixtureId: string;
  homeInput: TeamMatchInput;
  awayInput: TeamMatchInput;
  seed: number;
  managedSide: 'home' | 'away';
  managedBench: Player[];
  matchday: number;
  playedPlayerIdsByClub: Record<string, string[]>;
  seedAfterOtherFixtures: number;
  /** True for a Championship promotion playoff leg/final — its result commits into `managedPlayoff` instead of the regular `fixtures` list, and doesn't touch the career-level `nextSeed` (the playoff tracks its own). */
  isPlayoffMatch?: boolean;
}

/**
 * Owns a single club's career session: team selection, the league's
 * fixture list, and the table. Match simulation here is the engine parked
 * in PLAN.md — a provisional statistical stand-in, not the original's real
 * (still-unknown) match mechanics. That's flagged on the result screen too,
 * not just buried in a comment.
 */
export function CareerScreen({
  club,
  squad,
  managerName,
  onChangeClub,
  initialSave,
}: {
  club: ClubListing;
  squad: Player[];
  managerName: string;
  onChangeClub: () => void;
  /** A previously-saved career for this same club, to resume from instead of starting fresh. Ignored (treated as absent) if it belongs to a different club. */
  initialSave?: CareerSaveData;
}) {
  const resume = initialSave && initialSave.clubId === club.id ? initialSave : undefined;

  // Which clubs currently make up each league — starts as the static
  // registry (src/data/leagues.ts) but is career-local state from here on,
  // because promotion/relegation (see utils/pyramid.ts) can move clubs
  // between the Premier League and the Championship season to season. A
  // fresh career always starts from the static rosters; a resumed one
  // carries forward whatever last season's promotion/relegation produced.
  const [leagueClubIds, setLeagueClubIds] = useState<Record<string, string[]>>(
    () => resume?.leagueClubIds ?? Object.fromEntries(LEAGUES.map((l) => [l.id, l.clubs.map((c) => c.id)])),
  );

  // Which league the managed club is CURRENTLY in — derived from
  // leagueClubIds (not the static getLeagueForClub) so that a club that
  // got promoted/relegated last season is correctly found in its new
  // division. The static lookup is only a defensive fallback for the
  // (should-never-happen) case where the club isn't in any tracked list.
  const managedLeagueId = useMemo(
    () => Object.entries(leagueClubIds).find(([, ids]) => ids.includes(club.id))?.[0] ?? getLeagueForClub(club.id)?.id ?? LEAGUES[0].id,
    [leagueClubIds, club.id],
  );
  const league = LEAGUES.find((l) => l.id === managedLeagueId) ?? LEAGUES[0]; // name/tier/logo are static — only roster membership moves
  const ALL_CLUB_IDS = leagueClubIds[managedLeagueId] ?? league.clubs.map((c) => c.id);
  const totalMatchdays = (ALL_CLUB_IDS.length - 1) * 2;
  // Fixtures aren't dated, just numbered 1-N — this is an approximate
  // "roughly halfway through the season" marker, not a real calendar.
  const januaryMatchday = Math.ceil(totalMatchdays / 2);

  const [screen, setScreen] = useState<CareerScreenId>(resume?.screen ?? 'team');

  // Switching tabs (or landing back on Team Selection after a match) should
  // open at the top of that screen, not wherever the page happened to be
  // scrolled to before — Team Selection in particular stays mounted (just
  // hidden) between visits, so without this it can reopen scrolled partway
  // down the pitch from a previous visit.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  const [formationId, setFormationId] = useState(resume?.formationId ?? DEFAULT_FORMATION_ID);
  const [selectedXI, setSelectedXI] = useState<string[]>(resume?.selectedXI ?? []);
  const [fixtures, setFixtures] = useState<Fixture[]>(() => resume?.fixtures ?? generateFixtures(ALL_CLUB_IDS));
  // Randomized per career start (not a fixed constant) so replaying the same
  // fixture list doesn't always reproduce the identical result. The engine
  // itself stays a pure, deterministic function of its seed — same seed still
  // always gives the same match, which is what the unit tests check.
  const [nextSeed, setNextSeed] = useState(() => resume?.nextSeed ?? Math.floor(Math.random() * 1_000_000) + 1);
  const [lastPlayedFixtureId, setLastPlayedFixtureId] = useState<string | null>(resume?.lastPlayedFixtureId ?? null);
  // Never resumes mid-animation (even if a save happened to land there) —
  // the match result is already in `fixtures`, so this just shows the Full
  // Time screen for it instead of replaying the animation from scratch.
  const [showingAnimation, setShowingAnimation] = useState(false);
  // Not persisted (see above) — a reload mid-live-match just means
  // replaying that one fixture fresh rather than resurrecting a half-played
  // match, which isn't worth the complexity of serializing.
  const [liveMatch, setLiveMatch] = useState<LiveMatchSetup | null>(null);

  // Every league other than the one being managed, simulating its own
  // season fully automatically alongside this one (see
  // utils/backgroundLeague.ts) — this is what "the leagues run alongside
  // one another" actually is. Rebuilt (not just resumed as-is) whenever
  // the managed league itself changes, since promotion/relegation can
  // swap which two leagues count as "other."
  const [backgroundLeagues, setBackgroundLeagues] = useState<BackgroundLeagueState[]>(
    () => resume?.backgroundLeagues ?? LEAGUES.filter((l) => l.id !== managedLeagueId).map((l) =>
      createBackgroundLeagueState(l.id, leagueClubIds[l.id] ?? l.clubs.map((c) => c.id), Math.floor(Math.random() * 1_000_000) + 1),
    ),
  );

  // Only ever populated for a tier:'second' (Championship) career, once
  // its regular season ends — the real promotion playoff (see
  // engine/playoffs.ts). null the rest of the time, including for every
  // top-tier career.
  const [managedPlayoff, setManagedPlayoff] = useState<PlayoffState | null>(resume?.managedPlayoff ?? null);

  // Per-career mutable squads (starts as a copy of the shared static data) so
  // transfer-window swaps only affect this playthrough, not the app-wide
  // data. Other clubs make their own deadline-day moves too (see
  // simulateLeagueTransferActivity) — applied here so the very first
  // pre-season window already reflects it; the ref is just a same-render
  // side channel so the news initializer below can read what this one
  // generated, without rerolling a different random outcome. Skipped
  // entirely when resuming a save — that squad state (and the news it
  // produced) is already captured in the save itself.
  const initialTransferNewsRef = useRef<{ text: string; confirmed: boolean; clubIds: [string, string] }[]>([]);
  const [allSquads, setAllSquads] = useState<Record<string, Player[]>>(() => {
    if (resume) return resume.allSquads;
    const { updatedSquads, news } = simulateLeagueTransferActivity(cloneSquads(SQUADS_BY_CLUB_ID), ALL_CLUB_IDS, club.id, 5);
    const rumours = simulateLeagueRumours(updatedSquads, ALL_CLUB_IDS, club.id, 4);
    initialTransferNewsRef.current = [
      ...news.map((n) => ({ ...n, confirmed: true })),
      ...rumours.map((r) => ({ ...r, confirmed: false })),
    ];
    return updatedSquads;
  });
  const [transferWindow, setTransferWindow] = useState<'preseason' | 'january' | null>(resume ? resume.transferWindow : 'preseason');
  const [januaryWindowShown, setJanuaryWindowShown] = useState(resume?.januaryWindowShown ?? false);
  const [transferOffers, setTransferOffers] = useState<TransferOffer[]>(() => resume?.transferOffers ?? generateTransferOffers(club.id, ALL_CLUB_IDS, allSquads, new Set(selectedXI)));
  const [transferTimeline, setTransferTimeline] = useState<TransferTimelineEntry[]>(
    () => resume?.transferTimeline ?? scheduleTransferTimeline(initialTransferNewsRef.current, transferOffers),
  );
  const [seasonSummaryDismissed, setSeasonSummaryDismissed] = useState(resume?.seasonSummaryDismissed ?? false);

  // Autosave: one localStorage write whenever any persisted piece of state
  // changes, so a refresh/close mid-career loses at most the last action
  // rather than the whole season. Deliberately not debounced — writes here
  // are small and infrequent enough (team changes, match results, transfer
  // decisions) that there's no real cost to saving on every one of them,
  // and debouncing risks losing the very last action if the tab closes
  // right after it.
  useEffect(() => {
    saveCareer({
      clubId: club.id,
      leagueId: league.id,
      leagueClubIds,
      backgroundLeagues,
      managedPlayoff,
      managerName,
      screen,
      formationId,
      selectedXI,
      fixtures,
      nextSeed,
      lastPlayedFixtureId,
      allSquads,
      transferWindow,
      januaryWindowShown,
      transferOffers,
      transferTimeline,
      seasonSummaryDismissed,
    });
  }, [
    club.id,
    league.id,
    leagueClubIds,
    backgroundLeagues,
    managedPlayoff,
    managerName,
    screen,
    formationId,
    selectedXI,
    fixtures,
    nextSeed,
    lastPlayedFixtureId,
    allSquads,
    transferWindow,
    januaryWindowShown,
    transferOffers,
    transferTimeline,
    seasonSummaryDismissed,
  ]);

  const liveSquad = allSquads[club.id] ?? squad;
  const table = useMemo(() => computeLeagueTable(ALL_CLUB_IDS, fixtures), [ALL_CLUB_IDS, fixtures]);
  const leagueSeasonTotals = useMemo(() => computeSeasonStats(fixtures), [fixtures]);
  const topScorers = useMemo(() => leagueSeasonTotals.slice(0, 20), [leagueSeasonTotals]);
  // A playoff fixture's id never appears in `fixtures` (deliberately kept
  // separate — see engine/playoffs.ts), so this also checks managedPlayoff
  // for it, letting the same MatchResultScreen/live-match overlay logic
  // below handle both a regular fixture and a playoff leg/final uniformly.
  const lastFixture = lastPlayedFixtureId
    ? fixtures.find((f) => f.id === lastPlayedFixtureId) ?? findPlayoffFixture(managedPlayoff, lastPlayedFixtureId)
    : null;
  const leaguePosition = table.findIndex((r) => r.clubId === club.id) + 1;
  const regularSeasonComplete = fixtures.length > 0 && fixtures.every((f) => f.played);
  // The Championship isn't actually done until its promotion playoff is
  // resolved too — every top-tier league finishes the moment its regular
  // season does, same as before this feature.
  const fullSeasonComplete = regularSeasonComplete && (league.tier !== 'second' || managedPlayoff?.championClubId != null);

  // The real promotion/relegation result for SeasonSummaryScreen, when
  // one applies — only the Premier League and Championship are linked by
  // the pyramid (see utils/pyramid.ts); La Liga and the Championship's
  // own relegation zone (no League One modeled) stay null, which the
  // screen shows with its older "not modeled yet" wording instead.
  const divisionOutcome: DivisionOutcome | null = !fullSeasonComplete
    ? null
    : managedLeagueId === 'championship' && managedPlayoff
      ? (() => {
          if (leaguePosition <= 2) return 'promoted-automatic';
          const inSemiFinal1 = managedPlayoff.semiFinal1.higherSeedClubId === club.id || managedPlayoff.semiFinal1.lowerSeedClubId === club.id;
          const inSemiFinal2 = managedPlayoff.semiFinal2.higherSeedClubId === club.id || managedPlayoff.semiFinal2.lowerSeedClubId === club.id;
          if (!inSemiFinal1 && !inSemiFinal2) return null; // finished 7th or lower — never in the playoff
          if (managedPlayoff.championClubId === club.id) return 'promoted-playoff';
          const wonSemiFinal = (inSemiFinal1 && managedPlayoff.semiFinal1Winner === club.id) || (inSemiFinal2 && managedPlayoff.semiFinal2Winner === club.id);
          return wonSemiFinal ? 'lost-playoff-final' : 'lost-playoff-semifinal';
        })()
      : managedLeagueId === 'premier-league' && leaguePosition > ALL_CLUB_IDS.length - 3
        ? 'relegated-real'
        : null;

  // Seeds the real Championship promotion playoff the moment the regular
  // season ends, then — once the managed club is no longer in it
  // (finished mid-table and was never in the bracket, or lost a semi) —
  // resolves the rest of it in one go, same as a background league's own
  // playoff, so the player isn't made to click through fixtures they
  // have no stake in.
  useEffect(() => {
    if (!regularSeasonComplete || league.tier !== 'second') return;
    if (!managedPlayoff) {
      setManagedPlayoff(createPlayoffState(table, totalMatchdays + 1, Math.floor(Math.random() * 1_000_000) + 1));
      return;
    }
    if (managedPlayoff.championClubId) return;
    if (!managedClubStillInPlayoff(managedPlayoff, club.id)) {
      setManagedPlayoff(fastForwardPlayoff(managedPlayoff, allSquads, (id) => ALL_CLUBS.find((c) => c.id === id), AI_FORMATION));
    }
  }, [regularSeasonComplete, league.tier, managedPlayoff, table, totalMatchdays, club.id, allSquads]);

  const allPlayerIndex = useMemo(() => {
    const map = new Map<string, { player: Player; clubId: string }>();
    for (const [clubId, players] of Object.entries(allSquads)) {
      for (const player of players) map.set(player.id, { player, clubId });
    }
    return map;
  }, [allSquads]);

  const managedClubGamesPlayed = table.find((r) => r.clubId === club.id)?.played ?? 0;
  const managedClubSeasonStats = useMemo(() => {
    const clubFixtures = fixtures.filter((f) => f.homeClubId === club.id || f.awayClubId === club.id);
    const stats = computeMonthlyPlayerStats(clubFixtures, 1, totalMatchdays, (id) => allPlayerIndex.get(id));
    return new Map(stats.map((s) => [s.playerId, s]));
  }, [fixtures, club.id, allPlayerIndex, totalMatchdays]);

  /**
   * `overrideClubIds`/`overrideSquads` exist for one reason: at the start
   * of a new season after a promotion/relegation move, the managed
   * club's new league's club list and the just-fast-forwarded background
   * squads aren't reflected in `ALL_CLUB_IDS`/`allSquads` yet (state
   * updates triggered earlier in the same `startNewSeason` call haven't
   * re-rendered), so the opening preseason window would otherwise use
   * last season's division. The January window call site never needs
   * these — the managed league never changes mid-season.
   */
  function openTransferWindow(which: 'preseason' | 'january', overrideClubIds?: string[], overrideSquads?: Record<string, Player[]>) {
    const clubIds = overrideClubIds ?? ALL_CLUB_IDS;
    const squads = overrideSquads ?? allSquads;
    const { updatedSquads, news } = simulateLeagueTransferActivity(squads, clubIds, club.id, 5);
    const rumours = simulateLeagueRumours(updatedSquads, clubIds, club.id, 4);
    const offers = generateTransferOffers(club.id, clubIds, updatedSquads, new Set(selectedXI));
    const combinedNews = [...news.map((n) => ({ ...n, confirmed: true })), ...rumours.map((r) => ({ ...r, confirmed: false }))];
    setAllSquads(updatedSquads);
    setTransferOffers(offers);
    setTransferTimeline(scheduleTransferTimeline(combinedNews, offers));
    setTransferWindow(which);
  }

  function acceptTransferOffer(offerId: string) {
    const offer = transferOffers.find((o) => o.id === offerId);
    if (!offer || offer.status !== 'pending') return;

    setAllSquads((prev) => {
      const next = cloneSquads(prev);
      next[club.id] = next[club.id].filter((p) => p.id !== offer.outPlayer.id).concat(offer.inPlayer);
      // Find which club the incoming player actually came from (not necessarily tracked by id alone, so search).
      for (const [clubId, roster] of Object.entries(prev)) {
        if (clubId !== club.id && roster.some((p) => p.id === offer.inPlayer.id)) {
          next[clubId] = next[clubId].filter((p) => p.id !== offer.inPlayer.id).concat(offer.outPlayer);
          break;
        }
      }
      return next;
    });
    // A traded-out player can't stay in your selected XI.
    setSelectedXI((prev) => prev.filter((id) => id !== offer.outPlayer.id));
    setTransferOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, status: 'accepted' } : o)));
  }

  function declineTransferOffer(offerId: string) {
    setTransferOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, status: 'declined' } : o)));
  }

  /** Advances every OTHER league by exactly one matchday too — this is what "the leagues run alongside one another" actually is. Combines every league's squad writes into the one returned map so the caller issues a single setAllSquads, not one per league. */
  function advanceBackgroundLeaguesOnce(squadsBase: Record<string, Player[]>): Record<string, Player[]> {
    let squadsAcc = squadsBase;
    const nextBackgroundLeagues = backgroundLeagues.map((bg) => {
      const { nextState, updatedAllSquads } = advanceBackgroundLeagueMatchday(bg, squadsAcc);
      squadsAcc = updatedAllSquads;
      return nextState;
    });
    setBackgroundLeagues(nextBackgroundLeagues);
    return squadsAcc;
  }

  function playNextFixture() {
    const unplayed = fixtures.filter((f) => !f.played);
    if (unplayed.length === 0) return;

    const matchday = Math.min(...unplayed.map((f) => f.matchday));

    if (matchday >= januaryMatchday && !januaryWindowShown) {
      setJanuaryWindowShown(true);
      openTransferWindow('january');
      return;
    }

    const fixturesThisMatchday = unplayed.filter((f) => f.matchday === matchday);

    const formation = getFormation(formationId);
    const managedXI = liveSquad.filter((p) => selectedXI.includes(p.id));

    const { resultsByFixtureId, playedPlayerIdsByClub, deferred, nextSeed: seedAfterOtherFixtures } = simulateMatchday({
      fixtures: fixturesThisMatchday,
      seed: nextSeed,
      clubListingOf: (id) => ALL_CLUBS.find((c) => c.id === id),
      squadOf: (id) => (id === club.id ? liveSquad : allSquads[id]),
      aiFormation: AI_FORMATION,
      managedOverride: { clubId: club.id, formation, selectedXI: managedXI },
    });

    setFixtures((prev) => prev.map((f) => {
      const result = resultsByFixtureId.get(f.id);
      return result ? { ...f, played: true, result } : f;
    }));

    if (deferred) {
      // Deferred, not simulated above — the live match screen runs this
      // one itself (createMatchSimulation), pausing at half time so a
      // substitution can actually change who's on the pitch for the
      // second half. Its seed slot is already reserved in sequence, so
      // the rest of the matchday's results don't shift depending on what
      // happens in the live match.
      setLiveMatch({
        ...deferred,
        managedBench: liveSquad.filter((p) => !selectedXI.includes(p.id) && !p.injured),
        playedPlayerIdsByClub,
        seedAfterOtherFixtures,
      });
      setLastPlayedFixtureId(deferred.fixtureId);
      setShowingAnimation(true);
      setAllSquads(advanceBackgroundLeaguesOnce(allSquads));
      // nextSeed, injuries, and XI-fitness all finish once the live match
      // reports its result back — see handleManagedMatchFinished.
      return;
    }

    // No managed fixture this matchday (every club always has one in a
    // full round-robin season, but fall back safely rather than assume it).
    const injuryRandom = createRandom(seedAfterOtherFixtures);
    const seed = seedAfterOtherFixtures + 1;
    const updatedAllSquads = applyInjuryUpdates(allSquads, matchday, playedPlayerIdsByClub, injuryRandom);
    setAllSquads(advanceBackgroundLeaguesOnce(updatedAllSquads));
    const stillFitIds = new Set((updatedAllSquads[club.id] ?? []).filter((p) => !p.injured).map((p) => p.id));
    setSelectedXI((prev) => prev.filter((id) => stillFitIds.has(id)));
    setNextSeed(seed);
  }

  /** Called once the live match screen finishes the managed fixture (after any half-time substitutions) — commits its result and finally runs the injury pass for the whole matchday. */
  function handleManagedMatchFinished(result: MatchResult) {
    if (!liveMatch) return;

    if (liveMatch.isPlayoffMatch) {
      // Playoff fixtures don't roll injuries (see engine/playoffs.ts) and
      // have their own independent seed stream inside managedPlayoff
      // itself — nothing here touches allSquads or the career's nextSeed.
      if (managedPlayoff) setManagedPlayoff(applyResultToPlayoffFixture(managedPlayoff, liveMatch.fixtureId, result));
      setLiveMatch(null);
      return;
    }

    const fixture = fixtures.find((f) => f.id === liveMatch.fixtureId);
    if (!fixture) {
      setLiveMatch(null);
      return;
    }

    setFixtures((prev) => prev.map((f) => (f.id === liveMatch.fixtureId ? { ...f, played: true, result } : f)));

    const playedPlayerIdsByClub: Record<string, string[]> = {
      ...liveMatch.playedPlayerIdsByClub,
      [fixture.homeClubId]: result.homeXI,
      [fixture.awayClubId]: result.awayXI,
    };

    // Injuries/recoveries for every club, not just the one you manage — uses
    // the next seed in the same sequence as the matches themselves, so a
    // career replays identically from its starting seed.
    let seed = liveMatch.seedAfterOtherFixtures;
    const injuryRandom = createRandom(seed);
    seed += 1;
    const updatedAllSquads = applyInjuryUpdates(allSquads, liveMatch.matchday, playedPlayerIdsByClub, injuryRandom);
    setAllSquads(updatedAllSquads);
    // A player newly injured mid-season can't stay in your selected XI —
    // same rule as picking the team in the first place.
    const stillFitIds = new Set((updatedAllSquads[club.id] ?? []).filter((p) => !p.injured).map((p) => p.id));
    setSelectedXI((prev) => prev.filter((id) => stillFitIds.has(id)));

    setNextSeed(seed);
    setLiveMatch(null);
  }

  /** One step of the managed club's own Championship playoff bracket — mirrors playNextFixture, just against managedPlayoff instead of the regular fixtures list. */
  function advanceManagedPlayoff() {
    if (!managedPlayoff || managedPlayoff.championClubId) return;
    const formation = getFormation(formationId);
    const managedXI = liveSquad.filter((p) => selectedXI.includes(p.id));

    const { nextPlayoff, deferred } = advancePlayoff(
      managedPlayoff,
      allSquads,
      (id) => ALL_CLUBS.find((c) => c.id === id),
      AI_FORMATION,
      { clubId: club.id, formation, selectedXI: managedXI },
    );
    setManagedPlayoff(nextPlayoff);

    if (deferred) {
      setLiveMatch({
        fixtureId: deferred.fixtureId,
        homeInput: deferred.homeInput,
        awayInput: deferred.awayInput,
        seed: deferred.seed,
        managedSide: deferred.managedSide,
        managedBench: liveSquad.filter((p) => !selectedXI.includes(p.id) && !p.injured),
        matchday: deferred.matchday,
        playedPlayerIdsByClub: {},
        seedAfterOtherFixtures: nextPlayoff.nextSeed,
        isPlayoffMatch: true,
      });
      setLastPlayedFixtureId(deferred.fixtureId);
      setShowingAnimation(true);
    }
  }

  /**
   * A new season for the managed league's CURRENT club list — which, for
   * the Premier League or Championship, may have just changed: real
   * promotion/relegation (see utils/pyramid.ts) swaps the Premier
   * League's bottom 3 with the Championship's top 2 plus this season's
   * promotion playoff winner. La Liga never participates in that swap.
   * Every other league gets fast-forwarded to its own completion first
   * (it may be mid-season still, e.g. a shorter-season top-tier career
   * finishing before the 46-matchday Championship does) so a full,
   * resolved picture is ready before anything is computed. Squads (and
   * any transfers made) carry over regardless of which division a club
   * ends up in.
   */
  function startNewSeason() {
    let squadsAcc = allSquads;
    const resolvedOtherLeagues = backgroundLeagues.map((bg) => {
      if (isBackgroundLeagueSeasonComplete(bg)) return bg;
      const { nextState, updatedAllSquads } = fastForwardBackgroundLeagueSeason(bg, squadsAcc);
      squadsAcc = updatedAllSquads;
      return nextState;
    });

    function outcomeFor(leagueId: string): { clubIds: string[]; table: ReturnType<typeof computeLeagueTable>; playoffWinnerClubId?: string } {
      if (leagueId === managedLeagueId) {
        return { clubIds: ALL_CLUB_IDS, table, playoffWinnerClubId: managedPlayoff?.championClubId ?? undefined };
      }
      const bg = resolvedOtherLeagues.find((b) => b.leagueId === leagueId)!;
      return { clubIds: bg.clubIds, table: computeLeagueTable(bg.clubIds, bg.fixtures), playoffWinnerClubId: bg.playoff?.championClubId ?? undefined };
    }

    let nextLeagueClubIds = leagueClubIds;
    if (managedLeagueId === 'premier-league' || managedLeagueId === 'championship') {
      const pl = outcomeFor('premier-league');
      const champ = outcomeFor('championship');
      if (champ.playoffWinnerClubId) {
        const { nextPremierLeagueClubIds, nextChampionshipClubIds } = computePyramidTransition(pl.clubIds, champ.clubIds, pl.table, champ.table, champ.playoffWinnerClubId);
        nextLeagueClubIds = { ...leagueClubIds, 'premier-league': nextPremierLeagueClubIds, championship: nextChampionshipClubIds };
      }
    }

    const nextManagedLeagueId = Object.entries(nextLeagueClubIds).find(([, ids]) => ids.includes(club.id))?.[0] ?? managedLeagueId;
    const nextManagedClubIds = nextLeagueClubIds[nextManagedLeagueId] ?? ALL_CLUB_IDS;

    setLeagueClubIds(nextLeagueClubIds);
    setAllSquads(squadsAcc);
    setBackgroundLeagues(
      LEAGUES.filter((l) => l.id !== nextManagedLeagueId).map((l) => {
        const ids = nextLeagueClubIds[l.id] ?? l.clubs.map((c) => c.id);
        return createBackgroundLeagueState(l.id, ids, Math.floor(Math.random() * 1_000_000) + 1);
      }),
    );
    setManagedPlayoff(null);
    setFixtures(generateFixtures(nextManagedClubIds));
    setNextSeed(Math.floor(Math.random() * 1_000_000) + 1);
    setLastPlayedFixtureId(null);
    setShowingAnimation(false);
    setJanuaryWindowShown(false);
    setSeasonSummaryDismissed(false);
    openTransferWindow('preseason', nextManagedClubIds, squadsAcc);
  }

  // Overlay content (transfer window / match animation / match result) renders
  // ON TOP of the persistent tree below, rather than replacing it via an early
  // return — TeamSelectionScreen must stay mounted continuously, or its
  // drag-and-drop XI resets to empty every time a match is played.
  let overlay: ReactNode = null;
  if (transferWindow) {
    overlay = (
      <TransferWindowScreen
        title={transferWindow === 'preseason' ? 'Pre-Season Transfer Window' : 'January Transfer Window'}
        managedClubId={club.id}
        offers={transferOffers}
        timeline={transferTimeline}
        onAccept={acceptTransferOffer}
        onDecline={declineTransferOffer}
        onDone={() => setTransferWindow(null)}
      />
    );
  } else if (lastFixture) {
    const homeClub = ALL_CLUBS.find((c) => c.id === lastFixture.homeClubId);
    const awayClub = ALL_CLUBS.find((c) => c.id === lastFixture.awayClubId);
    if (showingAnimation && liveMatch && liveMatch.fixtureId === lastFixture.id && homeClub && awayClub) {
      overlay = (
        <MatchAnimationScreen
          fixtureId={liveMatch.fixtureId}
          homeClub={homeClub}
          awayClub={awayClub}
          homeInput={liveMatch.homeInput}
          awayInput={liveMatch.awayInput}
          seed={liveMatch.seed}
          managedSide={liveMatch.managedSide}
          managedBench={liveMatch.managedBench}
          onFinished={(result) => {
            handleManagedMatchFinished(result);
            setShowingAnimation(false);
          }}
        />
      );
    } else if (!showingAnimation) {
      overlay = (
        <MatchResultScreen
          fixture={lastFixture}
          onContinue={() => {
            setLastPlayedFixtureId(null);
            setScreen('team');
          }}
        />
      );
    }
  } else if (managedPlayoff && !managedPlayoff.championClubId && managedClubStillInPlayoff(managedPlayoff, club.id)) {
    overlay = <PlayoffScreen playoff={managedPlayoff} onPlayNext={advanceManagedPlayoff} />;
  } else if (fullSeasonComplete && !seasonSummaryDismissed) {
    overlay = (
      <SeasonSummaryScreen
        club={club}
        leagueName={league.name}
        leagueTier={league.tier}
        leagueRow={table.find((r) => r.clubId === club.id)}
        leaguePosition={leaguePosition}
        totalClubs={ALL_CLUB_IDS.length}
        divisionOutcome={divisionOutcome}
        topScorers={topScorers}
        fixtures={fixtures}
        allSquads={allSquads}
        onNewSeason={startNewSeason}
        onClose={() => setSeasonSummaryDismissed(true)}
      />
    );
  }

  return (
    <div>
      <CareerNav
        club={club}
        managerName={managerName}
        screen={screen}
        leaguePosition={leaguePosition}
        totalClubs={ALL_CLUB_IDS.length}
        leagueTier={league.tier}
        onNavigate={setScreen}
        onChangeClub={onChangeClub}
      />

      <div hidden={screen !== 'team'}>
        <TeamSelectionScreen
          clubName={club.name}
          clubShortName={club.shortName}
          primaryColor={club.primaryColor}
          secondaryColor={club.secondaryColor}
          crestPath={club.crestPath}
          squad={liveSquad}
          seasonStats={managedClubSeasonStats}
          teamGamesPlayed={managedClubGamesPlayed}
          onTeamChange={(nextFormationId, xiIds) => {
            setFormationId(nextFormationId);
            setSelectedXI(xiIds);
          }}
          onContinue={() => setScreen('fixtures')}
        />
      </div>

      {screen === 'fixtures' && (
        <FixturesScreen
          managedClubId={club.id}
          fixtures={fixtures}
          totalMatchdays={totalMatchdays}
          xiReady={selectedXI.length === 11}
          onPlayNext={playNextFixture}
          onViewSeasonSummary={fullSeasonComplete ? () => setSeasonSummaryDismissed(false) : undefined}
          onViewTeamOfTheMonth={() => setScreen('totm')}
          onGoToTeamSelection={() => setScreen('team')}
        />
      )}

      {screen === 'table' && <LeagueTableScreen table={table} managedClubId={club.id} fixtures={fixtures} allSquads={allSquads} leagueTier={league.tier} />}

      {screen === 'stats' && <StatsScreen stats={leagueSeasonTotals} managedClubId={club.id} />}

      {screen === 'totm' && <TeamOfTheMonthScreen fixtures={fixtures} totalMatchdays={totalMatchdays} allSquads={allSquads} managedClubId={club.id} />}

      {screen === 'otherLeagues' && <OtherLeaguesScreen backgroundLeagues={backgroundLeagues} allSquads={allSquads} />}

      {overlay && <div className="fixed inset-0 z-50 overflow-y-auto bg-pitch">{overlay}</div>}
    </div>
  );
}
