import { Button } from '../components/ui/Button';
import { ClubCrest } from '../components/ui/ClubCrest';
import { Panel } from '../components/ui/Panel';
import type { ClubListing } from '../data/premierLeague0809';

/**
 * An unsolicited job offer — the one genuinely voluntary way to leave a
 * job in this game without being sacked (see engine/managers.ts
 * checkForJobApproach): doing well enough, for long enough, with some
 * other same-league club currently vacant, triggers a real Accept/
 * Decline choice. Unlike ManagerSackedScreen's forced shortlist, this is
 * always exactly one specific club making contact.
 */
export function ManagerApproachScreen({
  approachingClub,
  currentClub,
  managerName,
  leagueName,
  onAccept,
  onDecline,
}: {
  approachingClub: ClubListing;
  currentClub: ClubListing;
  managerName: string;
  leagueName: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl p-4 text-white">
      <h2 className="mb-3 text-center text-xl font-black uppercase tracking-wide">You've Been Approached</h2>

      <div className="mb-4 flex flex-col items-center gap-2 rounded-sm border-2 border-emerald-800 bg-emerald-600 p-3 text-center">
        <ClubCrest primaryColor={approachingClub.primaryColor} secondaryColor={approachingClub.secondaryColor} label={approachingClub.shortName} crestPath={approachingClub.crestPath} size={40} />
        <span className="text-lg font-black uppercase tracking-wide">{approachingClub.name}</span>
        <span className="text-sm font-semibold">
          {leagueName}'s {approachingClub.name} have asked to speak to {managerName} about their vacancy.
        </span>
      </div>

      <Panel>
        <p className="p-1 text-sm text-ink">
          Your work at {currentClub.name} has caught their eye. You're under no obligation to leave — turning this down costs nothing, and{' '}
          {currentClub.name} never needs to know.
        </p>
      </Panel>

      <div className="mt-4 flex justify-center gap-3">
        <Button variant="secondary" onClick={onDecline}>
          Stay at {currentClub.shortName}
        </Button>
        <Button onClick={onAccept}>Take the {approachingClub.shortName} Job</Button>
      </div>
    </div>
  );
}
