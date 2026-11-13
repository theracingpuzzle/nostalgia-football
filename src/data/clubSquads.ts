import type { Player } from '../engine/types';
import { REAL_SQUADS_2008_09 } from './realSquads2008_09';
import { REAL_SQUADS_LA_LIGA_2008_09 } from './realSquadsLaLiga0809';
import { REAL_SQUADS_CHAMPIONSHIP_2008_09 } from './realSquadsChampionship0809';
import { REAL_SQUADS_LEAGUE_ONE_2008_09 } from './realSquadsLeagueOne0809';
import { REAL_SQUADS_LEAGUE_TWO_2008_09 } from './realSquadsLeagueTwo0809';

/**
 * Real squads for every league, keyed by club id (see leagues.ts). All
 * clubs across all registered leagues are populated — see
 * realSquads2008_09.ts, realSquadsLaLiga0809.ts,
 * realSquadsChampionship0809.ts, realSquadsLeagueOne0809.ts and
 * realSquadsLeagueTwo0809.ts for the data and its caveats, one file per
 * league.
 */
export const SQUADS_BY_CLUB_ID: Record<string, Player[]> = {
  ...REAL_SQUADS_2008_09,
  ...REAL_SQUADS_LA_LIGA_2008_09,
  ...REAL_SQUADS_CHAMPIONSHIP_2008_09,
  ...REAL_SQUADS_LEAGUE_ONE_2008_09,
  ...REAL_SQUADS_LEAGUE_TWO_2008_09,
};
