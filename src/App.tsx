import { useState } from 'react';
import { Panel } from './components/ui/Panel';
import { CareerOverviewScreen } from './screens/CareerOverviewScreen';
import { ClubListScreen } from './screens/ClubListScreen';
import { CareerScreen } from './screens/CareerScreen';
import { LeagueSelectScreen } from './screens/LeagueSelectScreen';
import { ManagerNameScreen } from './screens/ManagerNameScreen';
import { TitleScreen } from './screens/TitleScreen';
import { UnemployedScreen } from './screens/UnemployedScreen';
import { SQUADS_BY_CLUB_ID } from './data/clubSquads';
import { ALL_CLUBS, LEAGUES, getLeagueForClub } from './data/leagues';
import { clearCareer, loadCareer, saveCareer, type CareerSaveData, type EmployedSaveData, type UnemployedSaveData } from './utils/careerStorage';
import { currentStintSnapshotFromSave } from './utils/careerTransition';

type Stage = 'title' | 'managerName' | 'leagueSelect' | { kind: 'clubSelect'; leagueId: string } | { kind: 'career'; clubId: string } | 'unemployed';

function App() {
  // Read once at startup — this app only ever writes this key from its own
  // autosave, so there's no need to re-check it after the initial load.
  const [savedCareer, setSavedCareer] = useState<CareerSaveData | null>(() => loadCareer());
  const [stage, setStage] = useState<Stage>('title');
  const [managerName, setManagerName] = useState('');
  // Lets the title screen show the Career Overview without ever clicking
  // Continue — reads straight off `savedCareer`, no live career needed.
  const [showOverviewFromTitle, setShowOverviewFromTitle] = useState(false);

  // Reused by both ClubRoute's approach-accept and UnemployedScreen's own
  // Apply action — in both cases it's "save + jump to that club's career,"
  // nothing about the handler itself differs.
  function handleTakeNewJob(newClubId: string, nextSave: EmployedSaveData) {
    saveCareer(nextSave);
    setSavedCareer(nextSave);
    setStage({ kind: 'career', clubId: newClubId });
  }

  if (stage === 'title') {
    if (showOverviewFromTitle) {
      return (
        <div className="min-h-screen bg-pitch">
          <CareerOverviewScreen
            managerName={savedCareer?.managerName ?? ''}
            history={savedCareer?.careerHistory ?? []}
            currentStint={savedCareer && savedCareer.status !== 'unemployed' ? currentStintSnapshotFromSave(savedCareer) : null}
            onClose={() => setShowOverviewFromTitle(false)}
          />
        </div>
      );
    }

    const isUnemployedSave = savedCareer?.status === 'unemployed';
    const savedClub = savedCareer && !isUnemployedSave ? ALL_CLUBS.find((c) => c.id === savedCareer.clubId) : undefined;
    const savedLeague = savedClub ? getLeagueForClub(savedClub.id) : undefined;
    return (
      <TitleScreen
        onNewCareer={() => {
          clearCareer();
          setSavedCareer(null);
          setStage('managerName');
        }}
        continueLabel={
          isUnemployedSave
            ? `Continue as Unemployed Manager — ${savedCareer.managerName}, Season ${savedCareer.seasonNumber}`
            : savedClub
              ? `Continue as ${savedClub.shortName}${savedLeague ? ` (${savedLeague.name})` : ''} — ${savedCareer?.managerName}, Season ${savedCareer && !isUnemployedSave ? (savedCareer.seasonNumber ?? 1) : 1}`
              : undefined
        }
        onContinueCareer={
          isUnemployedSave
            ? () => {
                setManagerName(savedCareer.managerName);
                setStage('unemployed');
              }
            : savedCareer && savedClub
              ? () => {
                  setManagerName(savedCareer.managerName);
                  setStage({ kind: 'career', clubId: savedClub.id });
                }
              : undefined
        }
        onViewCareerOverview={savedCareer ? () => setShowOverviewFromTitle(true) : undefined}
      />
    );
  }

  if (stage === 'managerName') {
    return (
      <ManagerNameScreen
        onContinue={(name) => {
          setManagerName(name);
          setStage('leagueSelect');
        }}
      />
    );
  }

  if (stage === 'leagueSelect') {
    return (
      <div className="min-h-screen bg-pitch">
        <LeagueSelectScreen onSelectLeague={(leagueId) => setStage({ kind: 'clubSelect', leagueId })} />
      </div>
    );
  }

  if (stage === 'unemployed') {
    // Only reachable via a real transition (a sacking, or the title
    // screen's unemployed-continue branch above) — both always set
    // savedCareer to an unemployed save before/with this stage, so it's
    // never actually missing here; the fallback just satisfies the type.
    const unemployedSave = savedCareer && savedCareer.status === 'unemployed' ? savedCareer : undefined;
    return (
      <div className="min-h-screen bg-pitch">
        {unemployedSave && <UnemployedScreen initialSave={unemployedSave} onApply={handleTakeNewJob} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pitch">
      {stage.kind === 'clubSelect' ? (
        <ClubListScreen
          league={LEAGUES.find((l) => l.id === stage.leagueId) ?? LEAGUES[0]}
          onSelectClub={(clubId) => setStage({ kind: 'career', clubId })}
          onBack={() => setStage('leagueSelect')}
        />
      ) : (
        <ClubRoute
          clubId={stage.clubId}
          managerName={managerName}
          initialSave={savedCareer && savedCareer.status !== 'unemployed' ? savedCareer : undefined}
          onChangeClub={() => {
            // "Change Club" abandons this career — the save would otherwise
            // be silently overwritten by whatever club is picked next, but
            // clearing it now is more honest about what's happening. Also
            // clears the in-memory copy, so re-picking the same club
            // doesn't resurrect the career just abandoned.
            clearCareer();
            setSavedCareer(null);
            setStage('leagueSelect');
          }}
          onTakeNewJob={handleTakeNewJob}
          onBecomeUnemployed={(nextSave) => {
            // Being sacked, like "Change Club," moves away from this
            // club's CareerScreen entirely — but keeps the career going
            // (as an unemployed spell) rather than abandoning it.
            saveCareer(nextSave);
            setSavedCareer(nextSave);
            setStage('unemployed');
          }}
        />
      )}
    </div>
  );
}

function ClubRoute({
  clubId,
  managerName,
  initialSave,
  onChangeClub,
  onTakeNewJob,
  onBecomeUnemployed,
}: {
  clubId: string;
  managerName: string;
  initialSave?: EmployedSaveData;
  onChangeClub: () => void;
  onTakeNewJob: (newClubId: string, nextSave: EmployedSaveData) => void;
  onBecomeUnemployed: (nextSave: UnemployedSaveData) => void;
}) {
  const club = ALL_CLUBS.find((c) => c.id === clubId);
  const squad = SQUADS_BY_CLUB_ID[clubId];

  if (!club || !squad) {
    return (
      <div className="mx-auto max-w-xl p-4 text-white">
        <Panel title="Squad not added yet">
          <p className="text-xs text-ink/70">
            {club?.name ?? clubId} doesn't have a real squad built out yet — that's Stage 4 (see PLAN.md).
          </p>
        </Panel>
        <button onClick={onChangeClub} className="mt-3 text-xs font-bold uppercase underline text-white">
          Back to Club List
        </button>
      </div>
    );
  }

  // key={club.id} forces a fresh CareerScreen (and its fixtures/table/XI state) whenever the club changes.
  return (
    <CareerScreen
      key={club.id}
      club={club}
      squad={squad}
      managerName={managerName}
      onChangeClub={onChangeClub}
      onTakeNewJob={onTakeNewJob}
      onBecomeUnemployed={onBecomeUnemployed}
      initialSave={initialSave}
    />
  );
}

export default App;
