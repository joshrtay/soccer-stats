export type Position = "GK" | "DEF" | "MID" | "FWD";

export const POSITIONS: Position[] = ["GK", "DEF", "MID", "FWD"];

export type Player = {
  id: string;
  name: string;
  number: number;
  position: Position;
  active: boolean;
};

export type PlayerMatchStats = {
  playerId: string;
  started: boolean;
  minutes: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  saves: number;
  cleanSheet: boolean;
};

export type Match = {
  id: string;
  date: string;
  opponent: string;
  homeAway: "home" | "away";
  competition: string;
  ourScore: number;
  theirScore: number;
  notes: string;
  stats: PlayerMatchStats[];
};

export type TeamData = {
  teamName: string;
  season: string;
  players: Player[];
  matches: Match[];
};

export const emptyTeamData: TeamData = {
  teamName: "Our Team",
  season: new Date().getFullYear().toString(),
  players: [],
  matches: [],
};

export function emptyMatchStats(playerId: string): PlayerMatchStats {
  return {
    playerId,
    started: false,
    minutes: 0,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    saves: 0,
    cleanSheet: false,
  };
}
