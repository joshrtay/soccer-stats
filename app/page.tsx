import Link from "next/link";
import { readTeam } from "@/lib/store";
import { matchResult, playerSeasons, teamRecord } from "@/lib/stats";

export default async function Page() {
  const data = await readTeam();
  const record = teamRecord(data.matches);
  const seasons = playerSeasons(data);

  const topScorers = [...seasons]
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
    .filter((s) => s.goals > 0)
    .slice(0, 5);
  const topAssists = [...seasons]
    .sort((a, b) => b.assists - a.assists || b.goals - a.goals)
    .filter((s) => s.assists > 0)
    .slice(0, 5);
  const topAppearances = [...seasons]
    .sort((a, b) => b.appearances - a.appearances || b.minutes - a.minutes)
    .filter((s) => s.appearances > 0)
    .slice(0, 5);

  const recent = [...data.matches]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  if (data.matches.length === 0 && data.players.length === 0) {
    return (
      <section style={{ paddingTop: 24 }}>
        <h2>Welcome</h2>
        <p style={{ color: "var(--muted)" }}>
          No data yet. Sign in as the coach to add players and log matches.
        </p>
        <p>
          <Link className="btn" href="/login">
            Sign in
          </Link>
        </p>
      </section>
    );
  }

  return (
    <>
      <section style={{ paddingTop: 16 }}>
        <h3>Season record</h3>
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
            <span className="label">Goals (GF / GA)</span>
            <span className="num">
              {record.goalsFor} / {record.goalsAgainst}{" "}
              <span style={{ fontSize: 16, color: "var(--muted)" }}>
                (
                {record.goalDifference >= 0 ? "+" : ""}
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

      <section style={{ marginTop: 32 }}>
        <h3>Leaders</h3>
        <div className="grid cols-3">
          <Leaderboard
            title="Top scorers"
            rows={topScorers.map((s) => ({
              name: s.player.name,
              detail: `#${s.player.number}`,
              value: s.goals,
            }))}
            valueLabel="G"
          />
          <Leaderboard
            title="Top assists"
            rows={topAssists.map((s) => ({
              name: s.player.name,
              detail: `#${s.player.number}`,
              value: s.assists,
            }))}
            valueLabel="A"
          />
          <Leaderboard
            title="Most appearances"
            rows={topAppearances.map((s) => ({
              name: s.player.name,
              detail: `#${s.player.number}`,
              value: s.appearances,
            }))}
            valueLabel="App"
          />
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h3>Recent matches</h3>
        {recent.length === 0 ? (
          <div className="empty">No matches logged yet.</div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Match</th>
                  <th className="num">Score</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((m) => {
                  const r = matchResult(m);
                  return (
                    <tr key={m.id}>
                      <td>{m.date}</td>
                      <td>
                        {m.homeAway === "home" ? "vs" : "at"} {m.opponent}
                        {m.competition && (
                          <span
                            style={{
                              marginLeft: 8,
                              color: "var(--muted)",
                              fontSize: 12,
                            }}
                          >
                            {m.competition}
                          </span>
                        )}
                      </td>
                      <td className="num">
                        {m.ourScore} – {m.theirScore}
                      </td>
                      <td>
                        <span
                          className={`pill ${r === "W" ? "win" : r === "D" ? "draw" : "loss"}`}
                        >
                          {r}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={{ marginTop: 32 }}>
        <h3>Roster</h3>
        {data.players.length === 0 ? (
          <div className="empty">No players yet.</div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th className="num">#</th>
                  <th>Name</th>
                  <th>Position</th>
                  <th className="num">App</th>
                  <th className="num">Min</th>
                  <th className="num">G</th>
                  <th className="num">A</th>
                  <th className="num">G+A</th>
                  <th className="num">Y</th>
                  <th className="num">R</th>
                </tr>
              </thead>
              <tbody>
                {seasons
                  .filter((s) => s.player.active)
                  .sort(
                    (a, b) =>
                      a.player.number - b.player.number ||
                      a.player.name.localeCompare(b.player.name),
                  )
                  .map((s) => (
                    <tr key={s.player.id}>
                      <td className="num">{s.player.number}</td>
                      <td>{s.player.name}</td>
                      <td>
                        <span className="pill">{s.player.position}</span>
                      </td>
                      <td className="num">{s.appearances}</td>
                      <td className="num">{s.minutes}</td>
                      <td className="num">{s.goals}</td>
                      <td className="num">{s.assists}</td>
                      <td className="num">{s.contributions}</td>
                      <td className="num">{s.yellowCards}</td>
                      <td className="num">{s.redCards}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Leaderboard({
  title,
  rows,
  valueLabel,
}: {
  title: string;
  rows: { name: string; detail: string; value: number }[];
  valueLabel: string;
}) {
  return (
    <div className="card">
      <h3 style={{ marginBottom: 12 }}>{title}</h3>
      {rows.length === 0 ? (
        <div style={{ color: "var(--muted)", fontSize: 14 }}>—</div>
      ) : (
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          {rows.map((r, i) => (
            <li key={i} style={{ marginBottom: 4 }}>
              <span>{r.name}</span>
              <span style={{ color: "var(--muted)", marginLeft: 6 }}>
                {r.detail}
              </span>
              <span style={{ float: "right", fontVariantNumeric: "tabular-nums" }}>
                {r.value} {valueLabel}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
