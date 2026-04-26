import { readTeam } from "@/lib/store";
import {
  aggregateMatchTeam,
  aggregateSeason,
  type Aggregate,
  teamRecord,
} from "@/lib/aggregate";
import { TeamHeader } from "./TeamHeader";
import { RosterSection } from "./RosterSection";
import { MatchesSection } from "./MatchesSection";

function fmtPct(p: number | null): string {
  return p === null ? "—" : `${p}%`;
}

export default async function Page() {
  const data = await readTeam();

  const record = teamRecord(data.matches);
  const playerAgg = aggregateSeason(data.matches);

  const allEvents = data.matches.flatMap((m) => m.stats);
  const teamAgg = aggregateMatchTeam(allEvents);

  const matchAgg = new Map<string, Aggregate>();
  for (const m of data.matches) {
    matchAgg.set(m.id, aggregateMatchTeam(m.stats));
  }

  return (
    <>
      <TeamHeader
        initialTeamName={data.teamName}
        initialSeason={data.season}
      />

      <section style={{ marginTop: 24 }}>
        <h3>Season</h3>
        <div className="grid cols-3">
          <div className="card stat">
            <span className="label">Played</span>
            <span className="num">{record.played}</span>
          </div>
          <div className="card stat">
            <span className="label">W – D – L</span>
            <span className="num">
              {record.wins} – {record.draws} – {record.losses}
            </span>
          </div>
          <div className="card stat">
            <span className="label">GF / GA</span>
            <span className="num">
              {record.goalsFor} / {record.goalsAgainst}
              <span
                style={{
                  fontSize: 16,
                  color: "var(--muted)",
                  marginLeft: 6,
                }}
              >
                ({record.goalDifference >= 0 ? "+" : ""}
                {record.goalDifference})
              </span>
            </span>
          </div>
        </div>
        {record.form.length > 0 && (
          <div className="row" style={{ marginTop: 12 }}>
            <span style={{ color: "var(--muted)", fontSize: 13 }}>Form</span>
            {record.form.map((r, i) => (
              <span
                key={i}
                className={`pill ${r === "W" ? "win" : r === "D" ? "draw" : "loss"}`}
              >
                {r}
              </span>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>Team stats</h3>
        <div className="grid cols-3">
          <div className="card stat">
            <span className="label">Pass / Shot / Duel %</span>
            <span className="num" style={{ fontSize: 22 }}>
              {fmtPct(teamAgg.passPct)} · {fmtPct(teamAgg.shotPct)} ·{" "}
              {fmtPct(teamAgg.duelPct)}
            </span>
          </div>
          <div className="card stat">
            <span className="label">Goals</span>
            <span className="num">{teamAgg.shotMade}</span>
          </div>
          <div className="card stat">
            <span className="label">Total actions</span>
            <span className="num">{teamAgg.total}</span>
          </div>
        </div>
      </section>

      <RosterSection
        initialPlayers={data.players}
        aggregates={playerAgg}
      />
      <MatchesSection
        initialMatches={data.matches}
        aggregates={matchAgg}
      />
    </>
  );
}
