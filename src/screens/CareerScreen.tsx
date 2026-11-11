import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CareerNav, type CareerScreenId } from '../components/layout/CareerNav';
import { SQUADS_BY_CLUB_ID } from '../data/clubSquads';
import { DEFAULT_FORMATION_ID, FORMATIONS } from '../data/formations';
import type { ClubListing } from '../data/premierLeague0809';
import { PREMIER_LEAGUE_2008_09 } from '../data/premierLeague0809';
import { applyInjuryUpdates, computeLeagueTable, computeMonthlyPlayerStats, createRandom, generateFixtures, pickBestXI, simulateMatch } from '../engine';
import type { Fixture, MatchResult, Player, TeamMatchInput } from '../engine/types';
import { FixturesScreen } from './FixturesScreen';
import { LeagueTableScreen } from './LeagueTableScreen';
import { MatchAnimationScreen } from './MatchAnimationScreen';
import { MatchResultScreen } from './MatchResultScreen';
import { SeasonSummaryScreen } from './SeasonSummaryScreen';
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

const ALL_CLUB_IDS = PREMIER_LEAGUE_2008_09.map((c) => c.id);
const AI_FORMATION = FORMATIONS.find((f) => f.id === DEFAULT_FORMATION_ID) ?? FORMATIONS[0];
// Fixtures aren't dated, just numbered 1-38 — this is an approximate "roughly
// where January falls in an Aug-May season" marker, not a real calendar.
const JANUARY_MATCHDAY = 20;

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
  excludeClubId: string,
  count: number,
): { updatedSquads: Record<string, Player[]>; news: { text: string; clubIds: [string, string] }[] } {
  const next = cloneSquads(allSquads);
  const news: { text: string; clubIds: [string, string] }[] = [];
  const otherClubIds = Object.keys(next).filter((id) => id !== excludeClubId);
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

    const sellingName = PREMIER_LEAGUE_2008_09.find((c) => c.id === sellingClubId)?.shortName ?? sellingClubId;
    const buyingName = PREMIER_LEAGUE_2008_09.find((c) => c.id === picked.buyingClubId)?.shortName ?? picked.buyingClubId;
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
  excludeClubId: string,
  count: number,
): { text: string; clubIds: [string, string] }[] {
  const otherClubIds = Object.keys(allSquads).filter((id) => id !== excludeClubId);
  const rumours: { text: string; clubIds: [string, string] }[] = [];

  for (let i = 0; i < count; i++) {
    const playerClubId = otherClubIds[Math.floor(Math.random() * otherClubIds.length)];
    const roster = allSquads[playerClubId] ?? [];
    if (roster.length === 0) continue;
    const player = roster[Math.floor(Math.random() * roster.length)];

    const interestedCandidates = otherClubIds.filter((id) => id !== playerClubId);
    if (interestedCandidates.length === 0) continue;
    const interestedClubId = interestedCandidates[Math.floor(Math.random() * interestedCandidates.length)];

    const playerClubName = PREMIER_LEAGUE_2008_09.find((c) => c.id === playerClubId)?.shortName ?? playerClubId;
    const interestedClubName = PREMIER_LEAGUE_2008_09.find((c) => c.id === interestedClubId)?.shortName ?? interestedClubId;
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

/** Picks a handful of silly straight-swap offers: one of your reserves for a same-position player from a random other club. Not a transfer market simulation — just flavor. */
function generateTransferOffers(managedClubId: string, allSquads: Record<string, Player[]>, protectedIds: Set<string>, count = 3): TransferOffer[] {
  const managedSquad = allSquads[managedClubId] ?? [];
  const otherClubIds = Object.keys(allSquads).filter((id) => id !== managedClubId);

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
    const inClubName = PREMIER_LEAGUE_2008_09.find((c) => c.id === picked.inClubId)?.name ?? picked.inClubId;
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
    const { updatedSquads, news } = simulateLeagueTransferActivity(cloneSquads(SQUADS_BY_CLUB_ID), club.id, 5);
    const rumours = simulateLeagueRumours(updatedSquads, club.id, 4);
    initialTransferNewsRef.current = [
      ...news.map((n) => ({ ...n, confirmed: true })),
      ...rumours.map((r) => ({ ...r, confirmed: false })),
    ];
    return updatedSquads;
  });
  const [transferWindow, setTransferWindow] = useState<'preseason' | 'january' | null>(resume ? resume.transferWindow : 'preseason');
  const [januaryWindowShown, setJanuaryWindowShown] = useState(resume?.januaryWindowShown ?? false);
  const [transferOffers, setTransferOffers] = useState<TransferOffer[]>(() => resume?.transferOffers ?? generateTransferOffers(club.id, allSquads, new Set(selectedXI)));
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
  const table = useMemo(() => computeLeagueTable(ALL_CLUB_IDS, fixtures), [fixtures]);
  const leagueSeasonTotals = useMemo(() => computeSeasonStats(fixtures), [fixtures]);
  const topScorers = useMemo(() => leagueSeasonTotals.slice(0, 20), [leagueSeasonTotals]);
  const lastFixture = lastPlayedFixtureId ? fixtures.find((f) => f.id === lastPlayedFixtureId) ?? null : null;
  const leaguePosition = table.findIndex((r) => r.clubId === club.id) + 1;
  const seasonComplete = fixtures.length > 0 && fixtures.every((f) => f.played);

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
    const stats = computeMonthlyPlayerStats(clubFixtures, 1, 38, (id) => allPlayerIndex.get(id));
    return new Map(stats.map((s) => [s.playerId, s]));
  }, [fixtures, club.id, allPlayerIndex]);

  function openTransferWindow(which: 'preseason' | 'january') {
    const { updatedSquads, news } = simulateLeagueTransferActivity(allSquads, club.id, 5);
    const rumours = simulateLeagueRumours(updatedSquads, club.id, 4);
    const offers = generateTransferOffers(club.id, updatedSquads, new Set(selectedXI));
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

  function playNextFixture() {
    const unplayed = fixtures.filter((f) => !f.played);
    if (unplayed.length === 0) return;

    const matchday = Math.min(...unplayed.map((f) => f.matchday));

    if (matchday >= JANUARY_MATCHDAY && !januaryWindowShown) {
      setJanuaryWindowShown(true);
      openTransferWindow('january');
      return;
    }

    const fixturesThisMatchday = unplayed.filter((f) => f.matchday === matchday);

    const formation = getFormation(formationId);
    const managedXI = liveSquad.filter((p) => selectedXI.includes(p.id));

    let seed = nextSeed;
    const resultsByFixtureId = new Map<string, ReturnType<typeof simulateMatch>>();
    const playedPlayerIdsByClub: Record<string, string[]> = {};
    let pendingLiveMatch: LiveMatchSetup | null = null;

    for (const fixture of fixturesThisMatchday) {
      const isManagedHome = fixture.homeClubId === club.id;
      const isManagedAway = fixture.awayClubId === club.id;

      const homeListing = PREMIER_LEAGUE_2008_09.find((c) => c.id === fixture.homeClubId);
      const awayListing = PREMIER_LEAGUE_2008_09.find((c) => c.id === fixture.awayClubId);
      const homeSquad = isManagedHome ? liveSquad : allSquads[fixture.homeClubId];
      const awaySquad = isManagedAway ? liveSquad : allSquads[fixture.awayClubId];
      if (!homeListing || !awayListing || !homeSquad || !awaySquad) continue;

      const homeClubForEngine = { id: homeListing.id, name: homeListing.name, shortName: homeListing.shortName, colors: { primary: homeListing.primaryColor, secondary: homeListing.secondaryColor }, reputation: 70, players: homeSquad };
      const awayClubForEngine = { id: awayListing.id, name: awayListing.name, shortName: awayListing.shortName, colors: { primary: awayListing.primaryColor, secondary: awayListing.secondaryColor }, reputation: 70, players: awaySquad };

      const homeInput = isManagedHome
        ? { club: homeClubForEngine, formation, selectedXI: managedXI }
        : { club: homeClubForEngine, formation: AI_FORMATION, selectedXI: pickBestXI(homeClubForEngine, AI_FORMATION) };
      const awayInput = isManagedAway
        ? { club: awayClubForEngine, formation, selectedXI: managedXI }
        : { club: awayClubForEngine, formation: AI_FORMATION, selectedXI: pickBestXI(awayClubForEngine, AI_FORMATION) };

      if (isManagedHome || isManagedAway) {
        // Deferred, not simulated here — the live match screen runs this
        // one itself (createMatchSimulation), pausing at half time so a
        // substitution can actually change who's on the pitch for the
        // second half. Still reserves this fixture's seed slot in the same
        // sequence as every other match, so the rest of the league's
        // results don't shift depending on what you do in your own match.
        pendingLiveMatch = {
          fixtureId: fixture.id,
          homeInput,
          awayInput,
          seed,
          managedSide: isManagedHome ? 'home' : 'away',
          managedBench: liveSquad.filter((p) => !selectedXI.includes(p.id) && !p.injured),
          matchday,
          playedPlayerIdsByClub: { ...playedPlayerIdsByClub },
          seedAfterOtherFixtures: NaN, // filled in once every fixture's seed slot is reserved
        };
        seed += 1;
        continue;
      }

      const result = simulateMatch({ fixtureId: fixture.id, home: homeInput, away: awayInput, seed });
      seed += 1;
      resultsByFixtureId.set(fixture.id, result);
      playedPlayerIdsByClub[fixture.homeClubId] = result.homeXI;
      playedPlayerIdsByClub[fixture.awayClubId] = result.awayXI;
    }

    setFixtures((prev) => prev.map((f) => {
      const result = resultsByFixtureId.get(f.id);
      return result ? { ...f, played: true, result } : f;
    }));

    if (pendingLiveMatch) {
      pendingLiveMatch.seedAfterOtherFixtures = seed;
      setLiveMatch(pendingLiveMatch);
      setLastPlayedFixtureId(pendingLiveMatch.fixtureId);
      setShowingAnimation(true);
      // nextSeed, injuries, and XI-fitness all finish once the live match
      // reports its result back — see handleManagedMatchFinished.
      return;
    }

    // No managed fixture this matchday (every club always has one in a
    // full round-robin season, but fall back safely rather than assume it).
    const injuryRandom = createRandom(seed);
    seed += 1;
    const updatedAllSquads = applyInjuryUpdates(allSquads, matchday, playedPlayerIdsByClub, injuryRandom);
    setAllSquads(updatedAllSquads);
    const stillFitIds = new Set((updatedAllSquads[club.id] ?? []).filter((p) => !p.injured).map((p) => p.id));
    setSelectedXI((prev) => prev.filter((id) => stillFitIds.has(id)));
    setNextSeed(seed);
  }

  /** Called once the live match screen finishes the managed fixture (after any half-time substitutions) — commits its result and finally runs the injury pass for the whole matchday. */
  function handleManagedMatchFinished(result: MatchResult) {
    if (!liveMatch) return;
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

  /** Fresh fixture list for the same 20 clubs; squads (and any transfers made) carry over. No promotion/relegation between divisions — see SeasonSummaryScreen. */
  function startNewSeason() {
    setFixtures(generateFixtures(ALL_CLUB_IDS));
    setNextSeed(Math.floor(Math.random() * 1_000_000) + 1);
    setLastPlayedFixtureId(null);
    setShowingAnimation(false);
    setJanuaryWindowShown(false);
    setSeasonSummaryDismissed(false);
    openTransferWindow('preseason');
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
    const homeClub = PREMIER_LEAGUE_2008_09.find((c) => c.id === lastFixture.homeClubId);
    const awayClub = PREMIER_LEAGUE_2008_09.find((c) => c.id === lastFixture.awayClubId);
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
  } else if (seasonComplete && !seasonSummaryDismissed) {
    overlay = (
      <SeasonSummaryScreen
        club={club}
        leagueRow={table.find((r) => r.clubId === club.id)}
        leaguePosition={leaguePosition}
        totalClubs={ALL_CLUB_IDS.length}
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
          xiReady={selectedXI.length === 11}
          onPlayNext={playNextFixture}
          onViewSeasonSummary={seasonComplete ? () => setSeasonSummaryDismissed(false) : undefined}
          onViewTeamOfTheMonth={() => setScreen('totm')}
          onGoToTeamSelection={() => setScreen('team')}
        />
      )}

      {screen === 'table' && <LeagueTableScreen table={table} managedClubId={club.id} fixtures={fixtures} allSquads={allSquads} />}

      {screen === 'stats' && <StatsScreen stats={leagueSeasonTotals} managedClubId={club.id} />}

      {screen === 'totm' && <TeamOfTheMonthScreen fixtures={fixtures} allSquads={allSquads} managedClubId={club.id} />}

      {overlay && <div className="fixed inset-0 z-50 overflow-y-auto bg-pitch">{overlay}</div>}
    </div>
  );
}
