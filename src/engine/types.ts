// Core football domain models. Pure data — no React, no DOM, no side effects.

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface PlayerAttributes {
  pace: number; // 1-99
  shooting: number;
  passing: number;
  defending: number;
  physical: number;
  goalkeeping: number;
}

export interface Player {
  id: string;
  name: string;
  position: Position;
  age: number;
  squadNumber?: number;
  injured?: boolean;
  /** Set only while injured=true — the matchday this player becomes available again. See engine/injuries.ts. */
  injuryReturnMatchday?: number;
  attributes: PlayerAttributes;
}

export interface ClubColors {
  primary: string;
  secondary: string;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  colors: ClubColors;
  reputation: number; // 1-99, nudges generated player quality
  players: Player[];
}

export interface FormationSlot {
  position: Position;
  count: number;
}

export interface Formation {
  id: string;
  name: string; // e.g. "4-4-2"
  slots: FormationSlot[];
  attackBias: number; // multiplier applied to attack rating
  defenseBias: number; // multiplier applied to defense rating
}

export interface Fixture {
  id: string;
  matchday: number;
  homeClubId: string;
  awayClubId: string;
  played: boolean;
  result: MatchResult | null;
}

export type MatchEventType = 'goal' | 'chance' | 'yellow-card';

export interface MatchEvent {
  minute: number;
  type: MatchEventType;
  side: 'home' | 'away';
  playerId?: string;
  playerName?: string;
  /** Goal events only, and only when the goal had one. */
  assistPlayerId?: string;
  assistPlayerName?: string;
  description: string;
}

export interface Scorer {
  playerId: string;
  playerName: string;
  minutes: number[];
}

/** Same shape as Scorer — a player plus which minutes something happened to them. Used for assists and bookings too, not just goals. */
export type PlayerMinuteTally = Scorer;

export interface MatchResult {
  fixtureId: string;
  homeGoals: number;
  awayGoals: number;
  events: MatchEvent[];
  homeScorers: Scorer[];
  awayScorers: Scorer[];
  /** Who provided the assist, where a goal had one — not every goal does. */
  homeAssists: PlayerMinuteTally[];
  awayAssists: PlayerMinuteTally[];
  /** Yellow cards shown, aggregated the same way as scorers/assists. */
  homeBookings: PlayerMinuteTally[];
  awayBookings: PlayerMinuteTally[];
  /** Player ids who started this match for each side — needed to rate/credit everyone, not just scorers. */
  homeXI: string[];
  awayXI: string[];
  seed: number;
}

export interface TeamMatchInput {
  club: Club;
  formation: Formation;
  selectedXI: Player[]; // exactly 11 players
}

export interface LeagueTableRow {
  clubId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}
