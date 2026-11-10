import { useState } from 'react';
import { Panel } from './components/ui/Panel';
import { ClubListScreen } from './screens/ClubListScreen';
import { CareerScreen } from './screens/CareerScreen';
import { ManagerNameScreen } from './screens/ManagerNameScreen';
import { TitleScreen } from './screens/TitleScreen';
import { SQUADS_BY_CLUB_ID } from './data/clubSquads';
import { PREMIER_LEAGUE_2008_09 } from './data/premierLeague0809';

type Stage = 'title' | 'managerName' | 'clubSelect' | { kind: 'career'; clubId: string };

function App() {
  const [stage, setStage] = useState<Stage>('title');
  const [managerName, setManagerName] = useState('');

  if (stage === 'title') {
    return <TitleScreen onNewCareer={() => setStage('managerName')} />;
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
        <ClubRoute clubId={stage.clubId} managerName={managerName} onChangeClub={() => setStage('clubSelect')} />
      )}
    </div>
  );
}

function ClubRoute({ clubId, managerName, onChangeClub }: { clubId: string; managerName: string; onChangeClub: () => void }) {
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
  return <CareerScreen key={club.id} club={club} squad={squad} managerName={managerName} onChangeClub={onChangeClub} />;
}

export default App;
