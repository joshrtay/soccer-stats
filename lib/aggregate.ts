import type {
  Match,
  MatchStat,
  PlayerActionType,
} from "./types";

export type Counts = Record<PlayerActionType, number>;

export type Aggregate = Counts & {
  total: number;
  passAttempts: number;
  passPct: number | null;
  shotAttempts: number;
  shotPct: number | null;
  duelAttempts: number;
  duelPct: number | null;
};

export type MatchResult = "W" | "D" | "L";

export type TeamRecord = {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: MatchResult[];
};

export function emptyAggregate(): Aggregate {
  return {
    passComplete: 0,
    passMissed: 0,
    shotMade: 0,
    shotMissed: 0,
    duelWon: 0,
    duelLost: 0,
    total: 0,
    passAttempts: 0,
    passPct: null,
    shotAttempts: 0,
    shotPct: null,
    duelAttempts: 0,
    duelPct: null,
  };
}

function pct(num: number, den: number): number | null {
  return den > 0 ? Math.round((num / den) * 100) : null;
}

function finalize(a: Aggregate): Aggregate {
  a.passAttempts = a.passComplete + a.passMissed;
  a.shotAttempts = a.shotMade + a.shotMissed;
  a.duelAttempts = a.duelWon + a.duelLost;
  a.passPct = pct(a.passComplete, a.passAttempts);
  a.shotPct = pct(a.shotMade, a.shotAttempts);
  a.duelPct = pct(a.duelWon, a.duelAttempts);
  a.total = a.passAttempts + a.shotAttempts + a.duelAttempts;
  return a;
}

function bumpPlayerEvent(a: Aggregate, s: MatchStat): void {
  if (s.type === "opponentGoal") return;
  a[s.type] += 1;
}

export function aggregateByPlayer(stats: MatchStat[]): Map<string, Aggregate> {
  const out = new Map<string, Aggregate>();
  for (const s of stats) {
    if (!s.playerId) continue;
    if (s.type === "opponentGoal") continue;
    let cur = out.get(s.playerId);
    if (!cur) {
      cur = emptyAggregate();
      out.set(s.playerId, cur);
    }
    bumpPlayerEvent(cur, s);
  }
  for (const a of out.values()) finalize(a);
  return out;
}

export function aggregateMatchTeam(stats: MatchStat[]): Aggregate {
  const a = emptyAggregate();
  for (const s of stats) bumpPlayerEvent(a, s);
  return finalize(a);
}

export function aggregateSeason(matches: Match[]): Map<string, Aggregate> {
  const out = new Map<string, Aggregate>();
  for (const m of matches) {
    for (const s of m.stats) {
      if (!s.playerId) continue;
      if (s.type === "opponentGoal") continue;
      let cur = out.get(s.playerId);
      if (!cur) {
        cur = emptyAggregate();
        out.set(s.playerId, cur);
      }
      bumpPlayerEvent(cur, s);
    }
  }
  for (const a of out.values()) finalize(a);
  return out;
}

export function gamesPlayed(playerId: string, matches: Match[]): number {
  let n = 0;
  for (const m of matches) {
    if (m.stats.some((s) => s.playerId === playerId)) n += 1;
  }
  return n;
}

// Match-level scores — both derived from the event log.

export function ourScore(match: Match): number {
  let n = 0;
  for (const s of match.stats) {
    if (s.type === "shotMade" && s.playerId) n += 1;
  }
  return n;
}

export function theirScore(match: Match): number {
  let n = 0;
  for (const s of match.stats) {
    if (s.type === "opponentGoal") n += 1;
  }
  return n;
}

export function matchResult(match: Match): MatchResult {
  const ours = ourScore(match);
  const theirs = theirScore(match);
  if (ours > theirs) return "W";
  if (ours === theirs) return "D";
  return "L";
}

export function teamRecord(matches: Match[]): TeamRecord {
  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date));
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let gf = 0;
  let ga = 0;
  for (const m of sorted) {
    const ours = ourScore(m);
    const theirs = theirScore(m);
    gf += ours;
    ga += theirs;
    const r = matchResult(m);
    if (r === "W") wins += 1;
    else if (r === "D") draws += 1;
    else losses += 1;
  }
  return {
    played: sorted.length,
    wins,
    draws,
    losses,
    goalsFor: gf,
    goalsAgainst: ga,
    goalDifference: gf - ga,
    points: wins * 3 + draws,
    form: sorted.slice(-5).map(matchResult),
  };
}
