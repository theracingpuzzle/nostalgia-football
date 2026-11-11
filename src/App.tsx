import { useState } from 'react';
import { Panel } from './components/ui/Panel';
import { ClubListScreen } from './screens/ClubListScreen';
import { CareerScreen } from './screens/CareerScreen';
import { ManagerNameScreen } from './screens/ManagerNameScreen';
import { TitleScreen } from './screens/TitleScreen';
import { SQUADS_BY_CLUB_ID } from './data/clubSquads';
import { PREMIER_LEAGUE_2008_09 } from './data/premierLeague0809';
import { clearCareer, loadCareer, type CareerSaveData } from './utils/careerStorage';

type Stage = 'title' | 'managerName' | 'clubSelect' | { kind: 'career'; clubId: string };

function App() {
  // Read once at startup — this app only ever writes this key from its own
  // autosave, so there's no need to re-check it after the initial load.
  const [savedCareer, setSavedCareer] = useState<CareerSaveData | null>(() => loadCareer());
  const [stage, setStage] = useState<Stage>('title');
  const [managerName, setManagerName] = useState('');

  if (stage === 'title') {
    const savedClub = savedCareer ? PREMIER_LEAGUE_2008_09.find((c) => c.id === savedCareer.clubId) : undefined;
    return (
      <TitleScreen
        onNewCareer={() => {
          clearCareer();
          setSavedCareer(null);
          setStage('managerName');
        }}
        continueLabel={savedClub ? `Continue as ${savedClub.shortName} — ${savedCareer?.managerName}` : undefined}
        onContinueCareer={
          savedCareer && savedClub
            ? () => {
                setManagerName(savedCareer.managerName);
                setStage({ kind: 'career', clubId: savedCareer.clubId });
              }
            : undefined
        }
      />
    );
  }

  if (stage === 'managerName') {
    return (
      <ManagerNameScreen
        onContinue={(name) => {
          setManagerName(name);
          setStage('clubSelect');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-pitch">
      {stage === 'clubSelect' ? (
        <ClubListScreen onSelectClub={(clubId) => setStage({ kind: 'career', clubId })} />
      ) : (
        <ClubRoute
          clubId={stage.clubId}
          managerName={managerName}
          initialSave={savedCareer ?? undefined}
          onChangeClub={() => {
            // "Change Club" abandons this career — the save would otherwise
            // be silently overwritten by whatever club is picked next, but
            // clearing it now is more honest about what's happening. Also
            // clears the in-memory copy, so re-picking the same club
            // doesn't resurrect the career just abandoned.
            clearCareer();
            setSavedCareer(null);
            setStage('clubSelect');
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
}: {
  clubId: string;
  managerName: string;
  initialSave?: CareerSaveData;
  onChangeClub: () => void;
}) {
  const club = PREMIER_LEAGUE_2008_09.find((c) => c.id === clubId);
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
  return <CareerScreen key={club.id} club={club} squad={squad} managerName={managerName} onChangeClub={onChangeClub} initialSave={initialSave} />;
}

export default App;
