import { Button } from '../components/ui/Button';
import { ClubCrest } from '../components/ui/ClubCrest';
import { Panel } from '../components/ui/Panel';
import { ALL_CLUBS } from '../data/leagues';
import type { PenaltyShootoutResult } from '../engine/penalties';
import type { PlayoffState, TwoLegTie } from '../engine/playoffs';
import type { Fixture } from '../engine/types';

function Crest({ clubId, size = 24 }: { clubId: string; size?: number }) {
  const club = ALL_CLUBS.find((c) => c.id === clubId);
  if (!club) return null;
  return <ClubCrest primaryColor={club.primaryColor} secondaryColor={club.secondaryColor} label={club.shortName} crestPath={club.crestPath} size={size} />;
}

function clubName(clubId: string): string {
  return ALL_CLUBS.find((c) => c.id === clubId)?.name ?? clubId;
}

function LegScore({ leg, homeClubId, awayClubId, wentToExtraTime }: { leg: Fixture; homeClubId: string; awayClubId: string; wentToExtraTime?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm text-ink">
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <Crest clubId={homeClubId} size={18} />
        <span className="truncate">{clubName(homeClubId)}</span>
      </span>
      <span className="shrink-0 font-black">
        {leg.played ? `${leg.result!.homeGoals} - ${leg.result!.awayGoals}` : 'vs'}
        {leg.played && wentToExtraTime && <span className="ml-1 text-[10px] font-bold text-ink/50">AET</span>}
      </span>
      <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5 text-right">
        <span className="truncate">{clubName(awayClubId)}</span>
        <Crest clubId={awayClubId} size={18} />
      </span>
    </div>
  );
}

function PenaltyLine({ homeClubId, awayClubId, shootout }: { homeClubId: string; awayClubId: string; shootout: PenaltyShootoutResult }) {
  return (
    <p className="text-center text-xs font-bold text-ink/70">
      Penalties: {clubName(homeClubId)} {shootout.homeScore} - {shootout.awayScore} {clubName(awayClubId)}
    </p>
  );
}

function TieCard({ tie, winnerClubId, label }: { tie: TwoLegTie; winnerClubId: string | null; label: string }) {
  const higherAgg = (tie.leg1.result?.awayGoals ?? 0) + (tie.leg2.result?.homeGoals ?? 0);
  const lowerAgg = (tie.leg1.result?.homeGoals ?? 0) + (tie.leg2.result?.awayGoals ?? 0);
  const bothLegsPlayed = tie.leg1.played && tie.leg2.played;

  return (
    <Panel title={label} className="mb-3">
      <div className="flex flex-col gap-2 p-1">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink/50">Leg 1</p>
          <LegScore leg={tie.leg1} homeClubId={tie.leg1.homeClubId} awayClubId={tie.leg1.awayClubId} />
        </div>
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink/50">Leg 2</p>
          <LegScore leg={tie.leg2} homeClubId={tie.leg2.homeClubId} awayClubId={tie.leg2.awayClubId} wentToExtraTime={tie.wentToExtraTime} />
        </div>
        {bothLegsPlayed && (
          <p className="text-center text-xs font-bold uppercase text-ink/70">
            Aggregate: {clubName(tie.higherSeedClubId)} {higherAgg} - {lowerAgg} {clubName(tie.lowerSeedClubId)}
          </p>
        )}
        {tie.penaltyShootout && <PenaltyLine homeClubId={tie.leg2.homeClubId} awayClubId={tie.leg2.awayClubId} shootout={tie.penaltyShootout} />}
        {winnerClubId && (
          <p className="text-center text-sm font-black uppercase text-pitch-dark">
            {clubName(winnerClubId)} win {tie.penaltyShootout ? 'on penalties ' : ''}through to the Final
          </p>
        )}
      </div>
    </Panel>
  );
}

/**
 * The Championship promotion playoff — 3rd-v-6th and 4th-v-5th play
 * two-legged semis (aggregate score decides; if still level, extra time,
 * then penalties if needed — see engine/playoffs.ts/penalties.ts), then
 * the two winners play a single final at a neutral venue, under the same
 * extra-time/penalties rule. Shown only while the managed club still has
 * a fixture ahead of it; once eliminated or not involved at all, the
 * bracket resolves itself in the background and this screen never
 * appears for that club's career. Mirrors FixturesScreen's "Play Next
 * Fixture" pattern, just for the extra games the playoff adds. Stops
 * being shown the moment a championClubId is resolved — CareerScreen
 * moves straight on to SeasonSummaryScreen for the actual "promoted!"/"so
 * close" headline, so there's no "continue" step in here.
 */
export function PlayoffScreen({ playoff, onPlayNext }: { playoff: PlayoffState; onPlayNext: () => void }) {
  const everythingPlayedForNow =
    playoff.semiFinal1.leg1.played && playoff.semiFinal1.leg2.played && playoff.semiFinal2.leg1.played && playoff.semiFinal2.leg2.played && (!playoff.final || playoff.final.played);

  return (
    <div className="mx-auto max-w-2xl p-4 text-white">
      <h2 className="mb-1 text-center text-xl font-black uppercase tracking-wide">Promotion Play-Offs</h2>
      <p className="mb-3 text-center text-sm text-white/70">3rd vs 6th and 4th vs 5th, two-legged — the winners meet in the Final for the 3rd promotion spot.</p>

      <TieCard tie={playoff.semiFinal1} winnerClubId={playoff.semiFinal1Winner} label="Semi-Final 1 (3rd v 6th)" />
      <TieCard tie={playoff.semiFinal2} winnerClubId={playoff.semiFinal2Winner} label="Semi-Final 2 (4th v 5th)" />

      {playoff.final && (
        <Panel title="Final" className="mb-3">
          <div className="flex flex-col gap-2 p-1">
            <LegScore leg={playoff.final} homeClubId={playoff.final.homeClubId} awayClubId={playoff.final.awayClubId} wentToExtraTime={playoff.finalWentToExtraTime} />
            {playoff.finalPenaltyShootout && <PenaltyLine homeClubId={playoff.final.homeClubId} awayClubId={playoff.final.awayClubId} shootout={playoff.finalPenaltyShootout} />}
          </div>
        </Panel>
      )}

      <div className="flex justify-center gap-2">
        <Button onClick={onPlayNext}>{everythingPlayedForNow ? 'Resolve Tie' : 'Play Next Leg'}</Button>
      </div>
    </div>
  );
}
