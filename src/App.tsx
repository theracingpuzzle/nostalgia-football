import { useState } from 'react';
import { Panel } from './components/ui/Panel';
import { ClubListScreen } from './screens/ClubListScreen';
import { CareerScreen } from './screens/CareerScreen';
import { SQUADS_BY_CLUB_ID } from './data/clubSquads';
import { PREMIER_LEAGUE_2008_09 } from './data/premierLeague0809';

function App() {
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-pitch">
      {!selectedClubId ? (
        <ClubListScreen onSelectClub={setSelectedClubId} />
      ) : (
        <ClubRoute clubId={selectedClubId} onChangeClub={() => setSelectedClubId(null)} />
      )}
    </div>
  );
}

function ClubRoute({ clubId, onChangeClub }: { clubId: string; onChangeClub: () => void }) {
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
  return <CareerScreen key={club.id} club={club} squad={squad} onChangeClub={onChangeClub} />;
}

export default App;
