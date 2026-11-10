import { useMemo, useState, type ReactNode } from 'react';
import { CareerNav, type CareerScreenId } from '../components/layout/CareerNav';
import { SQUADS_BY_CLUB_ID } from '../data/clubSquads';
import { DEFAULT_FORMATION_ID, FORMATIONS } from '../data/formations';
import type { ClubListing } from '../data/premierLeague0809';
import { PREMIER_LEAGUE_2008_09 } from '../data/premierLeague0809';
import { computeLeagueTable, generateFixtures, pickBestXI, simulateMatch } from '../engine';
import type { Fixture, Player } from '../engine/types';
import { FixturesScreen } from './FixturesScreen';
import { LeagueTableScreen } from './LeagueTableScreen';
import { MatchAnimationScreen } from './MatchAnimationScreen';
import { MatchResultScreen } from './MatchResultScreen';
import { ScorersScreen, type ScorerTotal } from './ScorersScreen';
import { TeamSelectionScreen } from './TeamSelectionScreen';
import { TransferWindowScreen, type TransferOffer } from './TransferWindowScreen';

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

function getFormation(formationId: string) {
  return FORMATIONS.find((f) => f.id === formationId) ?? FORMATIONS[0];
}

function computeTopScorers(fixtures: Fixture[]): ScorerTotal[] {
  const totals = new Map<string, ScorerTotal>();

  function addGoals(playerId: string, playerName: string, clubId: string, goals: number) {
    const existing = totals.get(playerId);
    if (existing) existing.goals += goals;
    else totals.set(playerId, { playerId, playerName, clubId, goals });
  }

  for (const fixture of fixtures) {
    if (!fixture.played || !fixture.result) continue;
    for (const scorer of fixture.result.homeScorers) addGoals(scorer.playerId, scorer.playerName, fixture.homeClubId, scorer.minutes.length);
    for (const scorer of fixture.result.awayScorers) addGoals(scorer.playerId, scorer.playerName, fixture.awayClubId, scorer.minutes.length);
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
  // transfer-window swaps only affect this playthrough, not the app-wide data.
  const [allSquads, setAllSquads] = useState<Record<string, Player[]>>(() => cloneSquads(SQUADS_BY_CLUB_ID));
  const [transferWindow, setTransferWindow] = useState<'preseason' | 'january' | null>('preseason');
  const [januaryWindowShown, setJanuaryWindowShown] = useState(false);
  const [transferOffers, setTransferOffers] = useState<TransferOffer[]>(() => generateTransferOffers(club.id, allSquads, new Set(selectedXI)));

  const liveSquad = allSquads[club.id] ?? squad;
  const table = useMemo(() => computeLeagueTable(ALL_CLUB_IDS, fixtures), [fixtures]);
  const topScorers = useMemo(() => computeTopScorers(fixtures).slice(0, 20), [fixtures]);
  const lastFixture = lastPlayedFixtureId ? fixtures.find((f) => f.id === lastPlayedFixtureId) ?? null : null;
  const leaguePosition = table.findIndex((r) => r.clubId === club.id) + 1;

  function openTransferWindow(which: 'preseason' | 'january') {
    setTransferOffers(generateTransferOffers(club.id, allSquads, new Set(selectedXI)));
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
      if (isManagedHome || isManagedAway) managedFixtureId = fixture.id;
    }

    setFixtures((prev) => prev.map((f) => {
      const result = resultsByFixtureId.get(f.id);
      return result ? { ...f, played: true, result } : f;
    }));
    setNextSeed(seed);
    setLastPlayedFixtureId(managedFixtureId);
    setShowingAnimation(true);
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
      overlay = <MatchResultScreen fixture={lastFixture} onContinue={() => setLastPlayedFixtureId(null)} />;
    }
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
          onTeamChange={(nextFormationId, xiIds) => {
            setFormationId(nextFormationId);
            setSelectedXI(xiIds);
          }}
          onContinue={() => setScreen('fixtures')}
        />
      </div>

      {screen === 'fixtures' && (
        <FixturesScreen managedClubId={club.id} fixtures={fixtures} xiReady={selectedXI.length === 11} onPlayNext={playNextFixture} />
      )}

      {screen === 'table' && <LeagueTableScreen table={table} managedClubId={club.id} />}

      {screen === 'scorers' && <ScorersScreen scorers={topScorers} managedClubId={club.id} />}

      {overlay && <div className="fixed inset-0 z-50 overflow-y-auto bg-pitch">{overlay}</div>}
    </div>
  );
}
