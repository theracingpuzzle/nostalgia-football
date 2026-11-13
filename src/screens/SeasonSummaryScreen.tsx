import { useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { ClubCrest } from '../components/ui/ClubCrest';
import { FormationXIPitch } from '../components/ui/FormationXIPitch';
import { Panel } from '../components/ui/Panel';
import { FORMATIONS } from '../data/formations';
import { ALL_CLUBS } from '../data/leagues';
import type { LeagueDefinition } from '../data/leagues';
import { computeMonthlyPlayerStats, pickTeamOfTheMonth } from '../engine';
import type { Fixture, LeagueTableRow, Player } from '../engine/types';
import { getLeagueZone, ordinal } from '../utils/leagueZones';
import type { PlayerSeasonTotal } from './StatsScreen';

const HEADLINES: Record<'champion' | 'champions' | 'europa' | 'promotion' | 'playoff' | 'relegation' | 'mid', { title: string; tone: string }> = {
  champion: { title: '🏆 Champions!', tone: 'bg-amber-400 text-ink border-amber-600' },
  champions: { title: 'Champions League qualification!', tone: 'bg-blue-600 text-white border-blue-800' },
  europa: { title: 'Europa League / UEFA Cup qualification!', tone: 'bg-orange-500 text-white border-orange-700' },
  promotion: { title: 'Automatic promotion!', tone: 'bg-emerald-600 text-white border-emerald-800' },
  playoff: { title: 'Promotion playoff spot!', tone: 'bg-teal-500 text-white border-teal-700' },
  relegation: { title: 'Relegated', tone: 'bg-red-700 text-white border-red-900' },
  mid: { title: 'Season complete', tone: 'bg-ink/80 text-white border-ink' },
};

/**
 * A real division-crossing outcome (only ever set for a league actually
 * linked into the real pyramid chain — see CareerScreen's divisionOutcome
 * and utils/pyramid.ts/ENGLISH_PYRAMID). When present, this overrides the
 * zone-based headline above with what actually happened, since
 * `getLeagueZone` only ever reflects REGULAR-SEASON position — a club in
 * the playoff zone might have gone on to win it or get knocked out, which
 * the zone alone can't say.
 */
export type DivisionOutcome = 'promoted-automatic' | 'promoted-playoff' | 'lost-playoff-semifinal' | 'lost-playoff-final' | 'relegated-real';

/**
 * Division names are parameterized (not hardcoded to "Premier
 * League"/"Championship") since this outcome can now fire at any boundary
 * in the pyramid chain — League One promoted into the Championship, say,
 * not just the Championship into the Premier League. `divisionAboveName`
 * is the real division above (for a promotion); `currentLeagueName` is
 * this league's own name (for a playoff loss, which leaves a club right
 * where it already was); `divisionBelowName` is the real division below
 * (for a relegation).
 */
function divisionOutcomeHeadline(
  outcome: DivisionOutcome,
  divisionAboveName: string | undefined,
  currentLeagueName: string,
  divisionBelowName: string | undefined,
): { title: string; tone: string; subtitle: string } {
  switch (outcome) {
    case 'promoted-automatic':
      return { title: '🏆 Promoted!', tone: 'bg-emerald-600 text-white border-emerald-800', subtitle: `Automatic promotion — see you in ${divisionAboveName}.` };
    case 'promoted-playoff':
      return { title: '🏆 Promoted!', tone: 'bg-emerald-600 text-white border-emerald-800', subtitle: `Promotion playoff final winners — see you in ${divisionAboveName}.` };
    case 'lost-playoff-semifinal':
      return { title: 'Play-off heartbreak', tone: 'bg-ink/80 text-white border-ink', subtitle: `Lost in the promotion playoff semi-final — back to ${currentLeagueName} next season.` };
    case 'lost-playoff-final':
      return { title: 'So close', tone: 'bg-ink/80 text-white border-ink', subtitle: 'Lost the promotion playoff final at the last hurdle.' };
    case 'relegated-real':
      return { title: 'Relegated', tone: 'bg-red-700 text-white border-red-900', subtitle: `Down to ${divisionBelowName} next season.` };
  }
}

/**
 * End-of-season recap — a new addition (the original's actual end-of-season
 * screen, if it had one, isn't confirmed/known, see PLAN.md). Shows the final
 * finish, top scorers, a season-long Team of the Season, and a button to
 * kick off a fresh season. Real promotion/relegation through the English
 * pyramid (Premier League/Championship/League One/League Two) is modeled
 * (see CareerScreen/utils/pyramid.ts) — `divisionOutcome` carries the
 * actual result when one applies. La Liga has no pyramid to move within,
 * and League Two's own relegation zone has nowhere to actually go (no
 * division below it is modeled), so both of those still show the older
 * "not modeled yet" disclaimer.
 */
export function SeasonSummaryScreen({
  club,
  leagueName,
  leagueTier,
  leagueRow,
  leaguePosition,
  totalClubs,
  divisionOutcome,
  divisionAboveName,
  divisionBelowName,
  topScorers,
  fixtures,
  allSquads,
  onNewSeason,
  onClose,
}: {
  club: { name: string; shortName: string; primaryColor: string; secondaryColor: string; crestPath?: string; id: string };
  leagueName: string;
  leagueTier: LeagueDefinition['tier'];
  leagueRow: LeagueTableRow | undefined;
  leaguePosition: number;
  totalClubs: number;
  /** The real promotion/relegation result, when one applies (any league actually linked into the pyramid chain — see CareerScreen/ENGLISH_PYRAMID). null for every other case, including La Liga, which has no division to move to/from. */
  divisionOutcome: DivisionOutcome | null;
  /** The real division directly above this one in the pyramid chain, for a promotion subtitle. Undefined if this league isn't in the chain or is already at the top. */
  divisionAboveName?: string;
  /** The real division directly below this one in the pyramid chain, for a relegation subtitle. Undefined if this league isn't in the chain or is already at the bottom. */
  divisionBelowName?: string;
  topScorers: PlayerSeasonTotal[];
  fixtures: Fixture[];
  allSquads: Record<string, Player[]>;
  onNewSeason: () => void;
  onClose: () => void;
}) {
  const zone = getLeagueZone(leaguePosition, totalClubs, leagueTier);
  const headlineKey = leaguePosition === 1 ? 'champion' : zone ?? 'mid';
  const zoneHeadline = HEADLINES[headlineKey];
  const outcomeHeadline = divisionOutcome ? divisionOutcomeHeadline(divisionOutcome, divisionAboveName, leagueName, divisionBelowName) : null;
  const headline = outcomeHeadline ?? zoneHeadline;
  // A real outcome always comes with its own subtitle explaining what
  // happens next (see divisionOutcomeHeadline); short of that, fall back
  // to the old disclaimer for every case that WOULD move a club between
  // divisions if that were modeled yet — League Two's own relegation zone
  // (nothing modeled below it) and every La Liga zone.
  const movesDivisionButNotModeled =
    !outcomeHeadline && (headlineKey === 'relegation' || headlineKey === 'promotion' || headlineKey === 'playoff' || (headlineKey === 'champion' && leagueTier !== 'top'));

  const playerIndex = useMemo(() => {
    const map = new Map<string, { player: Player; clubId: string }>();
    for (const [clubId, players] of Object.entries(allSquads)) {
      for (const player of players) map.set(player.id, { player, clubId });
    }
    return map;
  }, [allSquads]);

  const totalMatchdays = (totalClubs - 1) * 2;
  const teamOfSeason = useMemo(() => {
    const stats = computeMonthlyPlayerStats(fixtures, 1, totalMatchdays, (id) => playerIndex.get(id));
    return pickTeamOfTheMonth(stats, FORMATIONS);
  }, [fixtures, playerIndex, totalMatchdays]);

  return (
    <div className="mx-auto max-w-3xl p-4 text-white">
      <h2 className="mb-3 text-center text-xl font-black uppercase tracking-wide">Season Complete</h2>

      <div className={`mb-3 flex flex-col items-center gap-2 rounded-sm border-2 p-3 text-center ${headline.tone}`}>
        <ClubCrest primaryColor={club.primaryColor} secondaryColor={club.secondaryColor} label={club.shortName} crestPath={club.crestPath} size={40} />
        <span className="text-lg font-black uppercase tracking-wide">{headline.title}</span>
        <span className="text-sm font-semibold">
          {club.name} finished {ordinal(leaguePosition)} of {totalClubs}
        </span>
        {outcomeHeadline && <span className="text-sm font-semibold">{outcomeHeadline.subtitle}</span>}
        {movesDivisionButNotModeled && (
          <span className="text-xs italic opacity-80">
            (Promotion/relegation between divisions isn't modeled yet — next season starts back in the same {totalClubs}-club {leagueName}.)
          </span>
        )}
      </div>

      {leagueRow && (
        <Panel title="Final Record" className="mb-3">
          <div className="grid grid-cols-3 gap-2 p-1 text-center text-sm sm:grid-cols-6">
            <Stat label="P" value={leagueRow.played} />
            <Stat label="W" value={leagueRow.won} />
            <Stat label="D" value={leagueRow.drawn} />
            <Stat label="L" value={leagueRow.lost} />
            <Stat label="GD" value={leagueRow.goalDifference} />
            <Stat label="Pts" value={leagueRow.points} />
          </div>
        </Panel>
      )}

      {topScorers.length > 0 && (
        <Panel title="Top Scorers" className="mb-3">
          <ul className="flex flex-col gap-1 text-sm text-ink">
            {topScorers.slice(0, 5).map((s, i) => {
              const scorerClub = ALL_CLUBS.find((c) => c.id === s.clubId);
              return (
                <li key={s.playerId} className={`flex items-center gap-2 rounded-sm px-2 py-1 ${s.clubId === club.id ? 'bg-pitch-light/40 font-bold' : ''}`}>
                  <span className="w-4 text-right text-ink/60">{i + 1}</span>
                  {scorerClub && (
                    <ClubCrest primaryColor={scorerClub.primaryColor} secondaryColor={scorerClub.secondaryColor} label={scorerClub.shortName} crestPath={scorerClub.crestPath} size={18} />
                  )}
                  <span className="flex-1">{s.playerName}</span>
                  <span>{s.goals}</span>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      <Panel title={teamOfSeason.players.length > 0 ? `Team of the Season (${teamOfSeason.formationName})` : 'Team of the Season'} className="mb-3">
        {teamOfSeason.players.length === 0 ? (
          <p className="p-3 text-center text-sm text-ink/70">Not enough matches played to pick one.</p>
        ) : (
          <FormationXIPitch entries={teamOfSeason.players} managedClubId={club.id} />
        )}
      </Panel>

      <div className="flex justify-center gap-3">
        <Button variant="secondary" onClick={onClose}>
          Review First
        </Button>
        <Button style={{ backgroundColor: club.primaryColor, borderColor: club.secondaryColor }} onClick={onNewSeason}>
          Start New Season
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-lg font-black text-ink">{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-ink/60">{label}</span>
    </div>
  );
}
