import { useMemo, useState } from 'react';
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

const ALL_CLUB_IDS = PREMIER_LEAGUE_2008_09.map((c) => c.id);
const AI_FORMATION = FORMATIONS.find((f) => f.id === DEFAULT_FORMATION_ID) ?? FORMATIONS[0];

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

/**
 * Owns a single club's career session: team selection, the league's
 * fixture list, and the table. Match simulation here is the engine parked
 * in PLAN.md — a provisional statistical stand-in, not the original's real
 * (still-unknown) match mechanics. That's flagged on the result screen too,
 * not just buried in a comment.
 */
export function CareerScreen({ club, squad, onChangeClub }: { club: ClubListing; squad: Player[]; onChangeClub: () => void }) {
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

  const table = useMemo(() => computeLeagueTable(ALL_CLUB_IDS, fixtures), [fixtures]);
  const topScorers = useMemo(() => computeTopScorers(fixtures).slice(0, 20), [fixtures]);
  const lastFixture = lastPlayedFixtureId ? fixtures.find((f) => f.id === lastPlayedFixtureId) ?? null : null;

  function playNextFixture() {
    const unplayed = fixtures.filter((f) => !f.played);
    if (unplayed.length === 0) return;

    const matchday = Math.min(...unplayed.map((f) => f.matchday));
    const fixturesThisMatchday = unplayed.filter((f) => f.matchday === matchday);

    const formation = getFormation(formationId);
    const managedXI = squad.filter((p) => selectedXI.includes(p.id));
    let managedFixtureId: string | null = null;

    let seed = nextSeed;
    const resultsByFixtureId = new Map<string, ReturnType<typeof simulateMatch>>();

    for (const fixture of fixturesThisMatchday) {
      const isManagedHome = fixture.homeClubId === club.id;
      const isManagedAway = fixture.awayClubId === club.id;

      const homeListing = PREMIER_LEAGUE_2008_09.find((c) => c.id === fixture.homeClubId);
      const awayListing = PREMIER_LEAGUE_2008_09.find((c) => c.id === fixture.awayClubId);
      const homeSquad = isManagedHome ? squad : SQUADS_BY_CLUB_ID[fixture.homeClubId];
      const awaySquad = isManagedAway ? squad : SQUADS_BY_CLUB_ID[fixture.awayClubId];
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

  if (lastFixture) {
    if (showingAnimation) {
      const homeClub = PREMIER_LEAGUE_2008_09.find((c) => c.id === lastFixture.homeClubId);
      const awayClub = PREMIER_LEAGUE_2008_09.find((c) => c.id === lastFixture.awayClubId);
      if (homeClub && awayClub) {
        return <MatchAnimationScreen fixture={lastFixture} homeClub={homeClub} awayClub={awayClub} onFinished={() => setShowingAnimation(false)} />;
      }
    }
    return <MatchResultScreen fixture={lastFixture} onContinue={() => setLastPlayedFixtureId(null)} />;
  }

  return (
    <div>
      <CareerNav club={club} screen={screen} onNavigate={setScreen} onChangeClub={onChangeClub} />

      <div hidden={screen !== 'team'}>
        <TeamSelectionScreen
          clubName={club.name}
          clubShortName={club.shortName}
          primaryColor={club.primaryColor}
          secondaryColor={club.secondaryColor}
          crestPath={club.crestPath}
          squad={squad}
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
    </div>
  );
}
