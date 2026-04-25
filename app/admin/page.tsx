import Link from "next/link";
import { readTeam } from "@/lib/store";
import { matchResult } from "@/lib/stats";

export default async function AdminHome() {
  const data = await readTeam();
  const matches = [...data.matches].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  return (
    <>
      <section style={{ paddingTop: 16 }}>
        <div className="row">
          <h2 style={{ margin: 0 }}>Admin</h2>
          <span className="spacer" />
          <Link className="btn secondary" href="/admin/players">
            Manage roster
          </Link>
          <Link className="btn" href="/admin/matches/new">
            New match
          </Link>
        </div>
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <h3>Team settings</h3>
        <form action="/api/team" method="post" className="form">
          <div className="form-row">
            <label htmlFor="teamName">Team name</label>
            <input
              id="teamName"
              name="teamName"
              type="text"
              defaultValue={data.teamName}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="season">Season</label>
            <input
              id="season"
              name="season"
              type="text"
              defaultValue={data.season}
              required
            />
          </div>
          <div>
            <button type="submit">Save</button>
          </div>
        </form>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>Matches</h3>
        {matches.length === 0 ? (
          <div className="empty">
            No matches yet.{" "}
            <Link href="/admin/matches/new">Log the first one →</Link>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Match</th>
                  <th className="num">Score</th>
                  <th>Result</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => {
                  const r = matchResult(m);
                  return (
                    <tr key={m.id}>
                      <td>{m.date}</td>
                      <td>
                        {m.homeAway === "home" ? "vs" : "at"} {m.opponent}
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
                      <td className="num">
                        <Link href={`/admin/matches/${m.id}`}>Edit</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
