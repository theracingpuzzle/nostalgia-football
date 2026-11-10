import type { Player } from '../engine/types';
import { REAL_SQUADS_2008_09 } from './realSquads2008_09';

/**
 * Real squads, keyed by the club ids in premierLeague0809.ts. All 20 clubs
 * are populated (see realSquads2008_09.ts for the data and its caveats).
 */
export const SQUADS_BY_CLUB_ID: Record<string, Player[]> = REAL_SQUADS_2008_09;
