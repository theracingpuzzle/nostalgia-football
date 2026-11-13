import { Button } from '../components/ui/Button';
import { ClubCrest } from '../components/ui/ClubCrest';
import { Panel } from '../components/ui/Panel';
import type { ClubListing } from '../data/premierLeague0809';
import { ordinal } from '../utils/leagueZones';

/**
 * The player's own job-security mechanic actually biting — a bad enough
 * run gets the board's patience to zero (see engine/managers.ts) and the
 * career doesn't end, it just moves: take one of a short list of other
 * jobs in the SAME league (cross-league sacking is out of scope — see
 * PLAN.md) and carry on. Deliberately no "decline" option anywhere —
 * this game has no other hard "game over" state, and a sacking shouldn't
 * be the first one.
 */
export function ManagerSackedScreen({
  oldClub,
  managerName,
  leagueName,
  offeredClubs,
  onTakeJob,
}: {
  oldClub: ClubListing;
  managerName: string;
  leagueName: string;
  offeredClubs: { club: ClubListing; position: number }[];
  onTakeJob: (clubId: string) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl p-4 text-white">
      <h2 className="mb-3 text-center text-xl font-black uppercase tracking-wide">Season Complete? Not quite.</h2>

      <div className="mb-4 flex flex-col items-center gap-2 rounded-sm border-2 border-red-900 bg-red-700 p-3 text-center">
        <ClubCrest primaryColor={oldClub.primaryColor} secondaryColor={oldClub.secondaryColor} label={oldClub.shortName} crestPath={oldClub.crestPath} size={40} />
        <span className="text-lg font-black uppercase tracking-wide">You've been sacked!</span>
        <span className="text-sm font-semibold">
          {oldClub.name}'s board have lost patience with {managerName}.
        </span>
      </div>

      <p className="mb-3 text-center text-sm text-white/80">
        The phone's already ringing — a few {leagueName} clubs want to talk. Pick your next job.
      </p>

      <div className="flex flex-col gap-3">
        {offeredClubs.map(({ club, position }) => (
          <Panel key={club.id}>
            <button onClick={() => onTakeJob(club.id)} className="flex w-full items-center gap-3 text-left">
              <ClubCrest primaryColor={club.primaryColor} secondaryColor={club.secondaryColor} label={club.shortName} crestPath={club.crestPath} size={34} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-bold text-ink">{club.name}</span>
                <span className="block text-xs font-semibold text-ink/60">Currently {ordinal(position)}</span>
              </span>
              <Button className="shrink-0">Take the job</Button>
            </button>
          </Panel>
        ))}
      </div>
    </div>
  );
}
