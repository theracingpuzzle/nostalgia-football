import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CareerNav, type CareerScreenId } from '../components/layout/CareerNav';
import { SQUADS_BY_CLUB_ID } from '../data/clubSquads';
import { DEFAULT_FORMATION_ID, FORMATIONS } from '../data/formations';
import type { ClubListing } from '../data/premierLeague0809';
import { PREMIER_LEAGUE_2008_09 } from '../data/premierLeague0809';
import { applyInjuryUpdates, computeLeagueTable, computeMonthlyPlayerStats, createRandom, generateFixtures, pickBestXI, simulateMatch } from '../engine';
import type { Fixture, Player } from '../engine/types';
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
): { updatedSquads: Record<string, Player[]>; news: string[] } {
  const next = cloneSquads(allSquads);
  const news: string[] = [];
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
    news.push(template(outPlayer.name, sellingName, picked.inPlayer.name, buyingName));
  }

  return { updatedSquads: next, news };
}

/**
 * Spreads this window's news items and your own offers across the fixed
 * "deadline day" hours (see TransferWindowScreen), in random order, each
 * getting its own hour — so the live sequence reveals a mix of both rather
 * than all the news first and all your offers after.
 */
function scheduleTransferTimeline(news: string[], offers: TransferOffer[]): TransferTimelineEntry[] {
  type TimelineItem = { kind: 'news'; id: string; text: string } | { kind: 'offer'; id: string; offerId: string };
  const items: TimelineItem[] = [
    ...news.map((text, i): TimelineItem => ({ kind: 'news', id: `news-${i}-${text.length}`, text })),
    ...offers.map((offer): TimelineItem => ({ kind: 'offer', id: `offer-${offer.id}`, offerId: offer.id })),
  ];
  const shuffledItems = [...items].sort(() => Math.random() - 0.5);

  const availableHours: number[] = [];
  for (let h = DEADLINE_DAY_START_HOUR; h <= DEADLINE_DAY_END_HOUR; h++) availableHours.push(h);
  const chosenHours = availableHours.sort(() => Math.random() - 0.5).slice(0, shuffledItems.length).sort((a, b) => a - b);

  return shuffledItems.map((item, i) => ({ ...item, hour: chosenHours[i] }));
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
}: {
  club: ClubListing;
  squad: Player[];
  managerName: string;
  onChangeClub: () => void;
}) {
  const [screen, setScreen] = useState<CareerScreenId>('team');

  // Switching tabs (or landing back on Team Selection after a match) should
  // open at the top of that screen, not wherever the page happened to be
  // scrolled to before — Team Selection in particular stays mounted (just
  // hidden) between visits, so without this it can reopen scrolled partway
  // down the pitch from a previous visit.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  const [formationId, setFormationId] = useState(DEFAULT_FORMATION_ID);
  const [selectedXI, setSelectedXI] = useState<string[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>(() => generateFixtures(ALL_CLUB_IDS));
  // Randomized per career start (not a fixed constant) so replaying the same
  // fixture list doesn't always reproduce the identical result. The engine
  // itself stays a pure, deterministic function of its seed — same seed still
  // always gives the same match, which is what the unit tests check.
  const [nextSeed, setNextSeed] = useState(() => Math.floor(Math.random() * 1_000_000) + 1);
  const [lastPlayedFixtureId, setLastPlayedFixtureId] = useState<string | null>(null);
  const [showingAnimation, setShowingAnimation] = useState(false);

  // Per-career mutable squads (starts as a copy of the shared static data) so
  // transfer-window swaps only affect this playthrough, not the app-wide
  // data. Other clubs make their own deadline-day moves too (see
  // simulateLeagueTransferActivity) — applied here so the very first
  // pre-season window already reflects it; the ref is just a same-render
  // side channel so the news initializer below can read what this one
  // generated, without rerolling a different random outcome.
  const initialTransferNewsRef = useRef<string[]>([]);
  const [allSquads, setAllSquads] = useState<Record<string, Player[]>>(() => {
    const { updatedSquads, news } = simulateLeagueTransferActivity(cloneSquads(SQUADS_BY_CLUB_ID), club.id, 5);
    initialTransferNewsRef.current = news;
    return updatedSquads;
  });
  const [transferWindow, setTransferWindow] = useState<'preseason' | 'january' | null>('preseason');
  const [januaryWindowShown, setJanuaryWindowShown] = useState(false);
  const [transferOffers, setTransferOffers] = useState<TransferOffer[]>(() => generateTransferOffers(club.id, allSquads, new Set(selectedXI)));
  const [transferTimeline, setTransferTimeline] = useState<TransferTimelineEntry[]>(() =>
    scheduleTransferTimeline(initialTransferNewsRef.current, transferOffers),
  );
  const [seasonSummaryDismissed, setSeasonSummaryDismissed] = useState(false);

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
    const offers = generateTransferOffers(club.id, updatedSquads, new Set(selectedXI));
    setAllSquads(updatedSquads);
    setTransferOffers(offers);
    setTransferTimeline(scheduleTransferTimeline(news, offers));
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
    let managedFixtureId: string | null = null;

    let seed = nextSeed;
    const resultsByFixtureId = new Map<string, ReturnType<typeof simulateMatch>>();
    const playedPlayerIdsByClub: Record<string, string[]> = {};

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

      const result = simulateMatch({ fixtureId: fixture.id, home: homeInput, away: awayInput, seed });
      seed += 1;
      resultsByFixtureId.set(fixture.id, result);
      playedPlayerIdsByClub[fixture.homeClubId] = result.homeXI;
      playedPlayerIdsByClub[fixture.awayClubId] = result.awayXI;
      if (isManagedHome || isManagedAway) managedFixtureId = fixture.id;
    }

    setFixtures((prev) => prev.map((f) => {
      const result = resultsByFixtureId.get(f.id);
      return result ? { ...f, played: true, result } : f;
    }));

    // Injuries/recoveries for every club, not just the one you manage — uses
    // the next seed in the same sequence as the matches themselves, so a
    // career replays identically from its starting seed.
    const injuryRandom = createRandom(seed);
    seed += 1;
    const updatedAllSquads = applyInjuryUpdates(allSquads, matchday, playedPlayerIdsByClub, injuryRandom);
    setAllSquads(updatedAllSquads);
    // A player newly injured mid-season can't stay in your selected XI —
    // same rule as picking the team in the first place.
    const stillFitIds = new Set((updatedAllSquads[club.id] ?? []).filter((p) => !p.injured).map((p) => p.id));
    setSelectedXI((prev) => prev.filter((id) => stillFitIds.has(id)));

    setNextSeed(seed);
    setLastPlayedFixtureId(managedFixtureId);
    setShowingAnimation(true);
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
    if (showingAnimation && homeClub && awayClub) {
      overlay = <MatchAnimationScreen fixture={lastFixture} homeClub={homeClub} awayClub={awayClub} onFinished={() => setShowingAnimation(false)} />;
    } else {
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
        />
      )}

      {screen === 'table' && <LeagueTableScreen table={table} managedClubId={club.id} fixtures={fixtures} allSquads={allSquads} />}

      {screen === 'stats' && <StatsScreen stats={leagueSeasonTotals} managedClubId={club.id} />}

      {screen === 'totm' && <TeamOfTheMonthScreen fixtures={fixtures} allSquads={allSquads} managedClubId={club.id} />}

      {overlay && <div className="fixed inset-0 z-50 overflow-y-auto bg-pitch">{overlay}</div>}
    </div>
  );
}
