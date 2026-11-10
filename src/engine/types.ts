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
  injured?: boolean; // visual flag only (pink highlight) — no injury mechanic wired up yet
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
  description: string;
}

export interface Scorer {
  playerId: string;
  playerName: string;
  minutes: number[];
}

export interface MatchResult {
  fixtureId: string;
  homeGoals: number;
  awayGoals: number;
  events: MatchEvent[];
  homeScorers: Scorer[];
  awayScorers: Scorer[];
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
