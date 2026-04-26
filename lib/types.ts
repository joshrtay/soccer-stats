export type Position = "GK" | "DEF" | "MID" | "FWD";

export const POSITIONS: Position[] = ["GK", "DEF", "MID", "FWD"];

export type Player = {
  id: string;
  name: string;
  number: number;
  position: Position;
};

export const ACTION_TYPES = [
  "passComplete",
  "passMissed",
  "shotMade",
  "shotMissed",
  "duelWon",
  "duelLost",
  "opponentGoal",
] as const;

export type ActionType = (typeof ACTION_TYPES)[number];

// Player-attributable actions — everything except opponentGoal.
export type PlayerActionType = Exclude<ActionType, "opponentGoal">;

export type MatchStat = {
  id: string;
  type: ActionType;
  ts: number;
  // Player-attributable events have a playerId. opponentGoal events do not.
  playerId?: string;
};

export type Match = {
  id: string;
  date: string;
  opponent: string;
  stats: MatchStat[];
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
