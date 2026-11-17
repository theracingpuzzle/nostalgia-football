import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { ClubCrest } from '../components/ui/ClubCrest';
import { Panel } from '../components/ui/Panel';
import { ALL_CLUBS, LEAGUES } from '../data/leagues';
import { DEFAULT_FORMATION_ID } from '../data/formations';
import { MANAGER_STARTING_CONFIDENCE, vacantClubIds } from '../engine';
import { saveCareer, type EmployedSaveData, type UnemployedSaveData } from '../utils/careerStorage';
import { advanceUnemployedMatchday, takeOverClub } from '../utils/careerTransition';
import { vacantManagerBand } from '../utils/managerDisplay';

/**
 * A genuinely unemployed spell — no managed club at all. Every league
 * (including whichever one the player just left) ticks along on its
 * own as an ordinary BackgroundLeagueState (see utils/careerTransition.ts),
 * including the normal vacancy-fill timer: a vacancy shown here can get
 * snapped up by an AI appointment before the player applies to it,
 * which is the one real cost of taking too long to decide. Owns its own
 * state and autosaves exactly the way CareerScreen does, so a reload
 * mid-unemployment resumes here rather than losing the spell.
 */
export function UnemployedScreen({
  initialSave,
  onApply,
}: {
  initialSave: UnemployedSaveData;
  onApply: (clubId: string, nextSave: EmployedSaveData) => void;
}) {
  const [seasonNumber, setSeasonNumber] = useState(initialSave.seasonNumber);
  const [leagues, setLeagues] = useState(initialSave.leagues);
  const [allSquads, setAllSquads] = useState(initialSave.allSquads);

  useEffect(() => {
    saveCareer({ status: 'unemployed', managerName: initialSave.managerName, seasonNumber, leagues, allSquads });
  }, [initialSave.managerName, seasonNumber, leagues, allSquads]);

  function handleAdvance() {
    const result = advanceUnemployedMatchday(leagues, allSquads);
    setLeagues(result.leagues);
    setAllSquads(result.allSquads);
    if (result.rolledOver) setSeasonNumber((n) => n + 1);
  }

  function handleApply(clubId: string) {
    const { newClubLeague, remainingLeagues } = takeOverClub(clubId, leagues);
    const newLeagueManagers = { ...newClubLeague.managers };
    delete newLeagueManagers[clubId];
    const lastPlayedMatchday = Math.max(0, ...newClubLeague.fixtures.filter((f) => f.played).map((f) => f.matchday));

    onApply(clubId, {
      clubId,
      leagueId: newClubLeague.leagueId,
      seasonNumber,
      managerName: initialSave.managerName,
      leagueClubIds: Object.fromEntries(leagues.map((l) => [l.leagueId, l.clubIds])),
      backgroundLeagues: remainingLeagues,
      managedPlayoff: newClubLeague.playoff,
      leagueManagers: newLeagueManagers,
      managerJobSecurity: MANAGER_STARTING_CONFIDENCE,
      managerTenureStartMatchday: lastPlayedMatchday,
      managerNews: newClubLeague.managerNews,
      managerApproachState: null,
      managerLastApproachMatchday: null,
      screen: 'team',
      formationId: DEFAULT_FORMATION_ID,
      selectedXI: [],
      fixtures: newClubLeague.fixtures,
      nextSeed: newClubLeague.nextSeed,
      lastPlayedFixtureId: null,
      allSquads,
      transferWindow: null,
      januaryWindowShown: false,
      transferOffers: [],
      transferTimeline: [],
      seasonSummaryDismissed: false,
    });
  }

  const anySeasonInProgress = leagues.some((bg) => bg.fixtures.some((f) => !f.played));

  return (
    <div className="mx-auto max-w-3xl p-4 text-white">
      <h2 className="mb-1 text-center text-xl font-black uppercase tracking-wide">Unemployed</h2>
      <p className="mb-3 text-center text-sm text-white/70">
        {initialSave.managerName} — Season {seasonNumber}. Browse the real vacancies below and apply whenever you're ready — take too long on one and another club might snap it up first.
      </p>

      {LEAGUES.map((leagueDef) => {
        const bg = leagues.find((l) => l.leagueId === leagueDef.id);
        if (!bg) return null;
        const currentMatchday = Math.max(0, ...bg.fixtures.filter((f) => f.played).map((f) => f.matchday));
        const vacancies = vacantClubIds(bg.managers, bg.clubIds);
        if (vacancies.length === 0) return null;

        return (
          <Panel key={leagueDef.id} title={leagueDef.name} className="mb-3">
            <div className="flex flex-col gap-2 p-1">
              {vacancies.map((clubId) => {
                const vacantClub = ALL_CLUBS.find((c) => c.id === clubId);
                if (!vacantClub) return null;
                const vacantFor = Math.max(0, currentMatchday - (bg.managers[clubId]?.tenureStartMatchday ?? currentMatchday));
                const band = vacantManagerBand();
                return (
                  <div key={clubId} className="flex items-center justify-between gap-3 rounded-sm border-2 border-ink/20 bg-white/70 px-3 py-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <ClubCrest primaryColor={vacantClub.primaryColor} secondaryColor={vacantClub.secondaryColor} label={vacantClub.shortName} crestPath={vacantClub.crestPath} size={28} />
                      <span className="min-w-0 leading-tight">
                        <span className="block truncate text-sm font-bold text-ink">{vacantClub.name}</span>
                        <span className="flex items-center gap-1.5 text-xs text-ink/60">
                          <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${band.dot}`} />
                          Vacant {vacantFor > 0 ? `for ${vacantFor} matchday${vacantFor === 1 ? '' : 's'}` : '(just opened up)'}
                        </span>
                      </span>
                    </span>
                    <Button className="shrink-0" onClick={() => handleApply(clubId)}>
                      Apply
                    </Button>
                  </div>
                );
              })}
            </div>
          </Panel>
        );
      })}

      <div className="flex justify-center">
        <Button variant="secondary" onClick={handleAdvance}>
          {anySeasonInProgress ? 'Advance to Next Matchday' : 'Start Next Season'}
        </Button>
      </div>
    </div>
  );
}
