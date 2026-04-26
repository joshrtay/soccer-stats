import Link from "next/link";
import { notFound } from "next/navigation";
import { readTeam } from "@/lib/store";
import {
  aggregateByPlayer,
  aggregateMatchTeam,
  matchResult,
  ourScore,
  theirScore,
} from "@/lib/aggregate";

const POSITION_ORDER: Record<string, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };

type Props = {
  params: Promise<{ id: string }>;
};

function fmtPct(p: number | null): string {
  return p === null ? "—" : `${p}%`;
}

export default async function MatchStatsPage({ params }: Props) {
  const { id } = await params;
  const data = await readTeam();
  const match = data.matches.find((m) => m.id === id);
  if (!match) notFound();

  const playerById = new Map(data.players.map((p) => [p.id, p]));
  const r = matchResult(match);
  const goals = ourScore(match);
  const oppGoals = theirScore(match);
  const team = aggregateMatchTeam(match.stats);
  const byPlayer = aggregateByPlayer(match.stats);

  const rows = [...byPlayer.entries()]
    .map(([pid, agg]) => {
      const player = playerById.get(pid);
      return player ? { player, agg } : null;
    })
    .filter(<T,>(v: T | null): v is T => v !== null)
    .sort(
      (a, b) =>
        (POSITION_ORDER[a.player.position] ?? 4) -
          (POSITION_ORDER[b.player.position] ?? 4) ||
        a.player.number - b.player.number,
    );

  return (
    <>
      <section style={{ paddingTop: 16 }}>
        <div className="row">
          <h2 style={{ margin: 0 }}>vs {match.opponent}</h2>
          <span className="spacer" />
          <Link className="btn secondary" href="/">
            ← Back
          </Link>
          <Link className="btn secondary" href={`/live/${match.id}`}>
            Track live
          </Link>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>{match.date}</p>
      </section>

      <section className="grid cols-3" style={{ marginTop: 16 }}>
        <div className="card stat">
          <span className="label">Score</span>
          <span className="num">
            {goals} – {oppGoals}{" "}
            <span
              className={`pill ${r === "W" ? "win" : r === "D" ? "draw" : "loss"}`}
              style={{ fontSize: 12, verticalAlign: "middle" }}
            >
              {r}
            </span>
          </span>
        </div>
        <div className="card stat">
          <span className="label">Pass / Shot / Duel %</span>
          <span className="num" style={{ fontSize: 22 }}>
            {fmtPct(team.passPct)} · {fmtPct(team.shotPct)} ·{" "}
            {fmtPct(team.duelPct)}
          </span>
        </div>
        <div className="card stat">
          <span className="label">Total actions</span>
          <span className="num">{team.total}</span>
        </div>
      </section>

      {rows.length === 0 ? (
        <div className="empty" style={{ marginTop: 24 }}>
          No stats logged for this match yet.{" "}
          <Link href={`/live/${match.id}`}>Start live tracking →</Link>
        </div>
      ) : (
        <section style={{ marginTop: 32 }}>
          <h3>Player stats</h3>
          <div className="card" style={{ padding: 0, overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th className="num">#</th>
                  <th>Name</th>
                  <th>Pos</th>
                  <th className="num">G</th>
                  <th className="num">P✓</th>
                  <th className="num">P%</th>
                  <th className="num">Sh</th>
                  <th className="num">Sh%</th>
                  <th className="num">Du</th>
                  <th className="num">Du%</th>
                  <th className="num">Tot</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ player, agg }) => (
                  <tr key={player.id}>
                    <td className="num">{player.number}</td>
                    <td>{player.name}</td>
                    <td>
                      <span className="pill">{player.position}</span>
                    </td>
                    <td className="num">{agg.shotMade}</td>
                    <td className="num">{agg.passComplete}</td>
                    <td className="num">{fmtPct(agg.passPct)}</td>
                    <td className="num">{agg.shotAttempts}</td>
                    <td className="num">{fmtPct(agg.shotPct)}</td>
                    <td className="num">{agg.duelAttempts}</td>
                    <td className="num">{fmtPct(agg.duelPct)}</td>
                    <td className="num">{agg.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 8 }}>
            G goals · P passes · Sh shot attempts · Du duel attempts · Tot total events
          </p>
        </section>
      )}
    </>
  );
}
