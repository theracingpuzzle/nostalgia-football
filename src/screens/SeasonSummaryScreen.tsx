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
 * End-of-season recap — a new addition (the original's actual end-of-season
 * screen, if it had one, isn't confirmed/known, see PLAN.md). Shows the final
 * finish, top scorers, a season-long Team of the Season, and a button to
 * kick off a fresh season with the same 20 clubs (there's no promotion/
 * relegation between divisions modeled — see the note below when relegated).
 */
export function SeasonSummaryScreen({
  club,
  leagueName,
  leagueTier,
  leagueRow,
  leaguePosition,
  totalClubs,
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
  topScorers: PlayerSeasonTotal[];
  fixtures: Fixture[];
  allSquads: Record<string, Player[]>;
  onNewSeason: () => void;
  onClose: () => void;
}) {
  const zone = getLeagueZone(leaguePosition, totalClubs, leagueTier);
  const headlineKey = leaguePosition === 1 ? 'champion' : zone ?? 'mid';
  const headline = HEADLINES[headlineKey];
  const movesDivision = headlineKey === 'relegation' || headlineKey === 'promotion' || headlineKey === 'playoff' || (headlineKey === 'champion' && leagueTier === 'second');

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
        {movesDivision && (
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
