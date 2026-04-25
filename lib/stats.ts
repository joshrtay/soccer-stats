import type { Match, Player, PlayerMatchStats, TeamData } from "./types";

export type PlayerSeason = {
  player: Player;
  appearances: number;
  starts: number;
  minutes: number;
  goals: number;
  assists: number;
  contributions: number;
  yellowCards: number;
  redCards: number;
  saves: number;
  cleanSheets: number;
};

export type TeamRecord = {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ("W" | "D" | "L")[];
};

export function matchResult(m: Match): "W" | "D" | "L" {
  if (m.ourScore > m.theirScore) return "W";
  if (m.ourScore === m.theirScore) return "D";
  return "L";
}

export function teamRecord(matches: Match[]): TeamRecord {
  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date));
  let wins = 0,
    draws = 0,
    losses = 0,
    gf = 0,
    ga = 0;
  for (const m of sorted) {
    const r = matchResult(m);
    if (r === "W") wins++;
    else if (r === "D") draws++;
    else losses++;
    gf += m.ourScore;
    ga += m.theirScore;
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

export function playerSeasons(data: TeamData): PlayerSeason[] {
  const totals = new Map<string, PlayerSeason>();
  for (const p of data.players) {
    totals.set(p.id, {
      player: p,
      appearances: 0,
      starts: 0,
      minutes: 0,
      goals: 0,
      assists: 0,
      contributions: 0,
      yellowCards: 0,
      redCards: 0,
      saves: 0,
      cleanSheets: 0,
    });
  }
  for (const m of data.matches) {
    for (const s of m.stats) {
      const t = totals.get(s.playerId);
      if (!t) continue;
      if (s.minutes > 0 || s.started) t.appearances++;
      if (s.started) t.starts++;
      t.minutes += s.minutes;
      t.goals += s.goals;
      t.assists += s.assists;
      t.yellowCards += s.yellowCards;
      t.redCards += s.redCards;
      t.saves += s.saves;
      if (s.cleanSheet) t.cleanSheets++;
    }
  }
  for (const t of totals.values()) {
    t.contributions = t.goals + t.assists;
  }
  return [...totals.values()].sort((a, b) => {
    if (b.contributions !== a.contributions) return b.contributions - a.contributions;
    if (b.goals !== a.goals) return b.goals - a.goals;
    return b.minutes - a.minutes;
  });
}

export function getMatchStat(
  m: Match,
  playerId: string,
): PlayerMatchStats | undefined {
  return m.stats.find((s) => s.playerId === playerId);
}
