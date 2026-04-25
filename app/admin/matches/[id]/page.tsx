import Link from "next/link";
import { notFound } from "next/navigation";
import { readTeam } from "@/lib/store";
import { getMatchStat } from "@/lib/stats";
import { emptyMatchStats } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
};

const POSITION_ORDER: Record<string, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };

export default async function EditMatchPage({ params }: Props) {
  const { id } = await params;
  const data = await readTeam();
  const match = data.matches.find((m) => m.id === id);
  if (!match) notFound();

  const players = [...data.players]
    .filter((p) => p.active)
    .sort(
      (a, b) =>
        POSITION_ORDER[a.position] - POSITION_ORDER[b.position] ||
        a.number - b.number,
    );

  return (
    <>
      <section style={{ paddingTop: 16 }}>
        <div className="row">
          <h2 style={{ margin: 0 }}>
            {match.homeAway === "home" ? "vs" : "at"} {match.opponent}
          </h2>
          <span className="spacer" />
          <Link className="btn secondary" href="/admin">
            ← Back
          </Link>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>
          {match.date} · final {match.ourScore}–{match.theirScore}
        </p>
      </section>

      {players.length === 0 && (
        <div className="form-warn" style={{ marginTop: 16 }}>
          No active players in the roster yet.{" "}
          <Link href="/admin/players">Add players →</Link>
        </div>
      )}

      <form action={`/api/matches/${match.id}`} method="post">
        <section className="card" style={{ marginTop: 24 }}>
          <h3>Match details</h3>
          <div className="form">
            <div className="form-row">
              <label htmlFor="date">Date</label>
              <input
                id="date"
                name="date"
                type="date"
                defaultValue={match.date}
                required
              />
            </div>
            <div className="form-row">
              <label htmlFor="opponent">Opponent</label>
              <input
                id="opponent"
                name="opponent"
                type="text"
                defaultValue={match.opponent}
                required
              />
            </div>
            <div className="form-row">
              <label htmlFor="homeAway">Home / Away</label>
              <select
                id="homeAway"
                name="homeAway"
                defaultValue={match.homeAway}
              >
                <option value="home">Home</option>
                <option value="away">Away</option>
              </select>
            </div>
            <div className="form-row">
              <label htmlFor="competition">Competition</label>
              <input
                id="competition"
                name="competition"
                type="text"
                defaultValue={match.competition}
              />
            </div>
            <div className="form-row">
              <label htmlFor="ourScore">Our score</label>
              <input
                id="ourScore"
                name="ourScore"
                type="number"
                min={0}
                defaultValue={match.ourScore}
              />
            </div>
            <div className="form-row">
              <label htmlFor="theirScore">Their score</label>
              <input
                id="theirScore"
                name="theirScore"
                type="number"
                min={0}
                defaultValue={match.theirScore}
              />
            </div>
            <div className="form-row">
              <label htmlFor="notes">Notes</label>
              <textarea id="notes" name="notes" defaultValue={match.notes} />
            </div>
          </div>
        </section>

        {players.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h3>Player stats</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, marginTop: -4 }}>
              Tick the box to mark a player as available for this match. Goalkeeper
              fields apply only to GKs.
            </p>
            <div className="card" style={{ padding: 0, overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th className="num">Pos</th>
                    <th>Avail</th>
                    <th>Start</th>
                    <th className="num">Min</th>
                    <th className="num">G</th>
                    <th className="num">A</th>
                    <th className="num">Y</th>
                    <th className="num">R</th>
                    <th className="num">Sv</th>
                    <th>CS</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p) => {
                    const s =
                      getMatchStat(match, p.id) ?? emptyMatchStats(p.id);
                    const present =
                      s.minutes > 0 ||
                      s.started ||
                      s.goals > 0 ||
                      s.assists > 0 ||
                      s.yellowCards > 0 ||
                      s.redCards > 0 ||
                      s.saves > 0 ||
                      s.cleanSheet;
                    const isGK = p.position === "GK";
                    return (
                      <tr key={p.id}>
                        <td>
                          {p.name}{" "}
                          <span style={{ color: "var(--muted)" }}>
                            #{p.number}
                          </span>
                        </td>
                        <td className="num">
                          <span className="pill">{p.position}</span>
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            name={`p_${p.id}_present`}
                            defaultChecked={present}
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            name={`p_${p.id}_started`}
                            defaultChecked={s.started}
                          />
                        </td>
                        <td className="num">
                          <input
                            type="number"
                            name={`p_${p.id}_minutes`}
                            min={0}
                            max={120}
                            defaultValue={s.minutes}
                            style={{ width: 70 }}
                          />
                        </td>
                        <td className="num">
                          <input
                            type="number"
                            name={`p_${p.id}_goals`}
                            min={0}
                            defaultValue={s.goals}
                            style={{ width: 56 }}
                          />
                        </td>
                        <td className="num">
                          <input
                            type="number"
                            name={`p_${p.id}_assists`}
                            min={0}
                            defaultValue={s.assists}
                            style={{ width: 56 }}
                          />
                        </td>
                        <td className="num">
                          <input
                            type="number"
                            name={`p_${p.id}_yellow`}
                            min={0}
                            max={2}
                            defaultValue={s.yellowCards}
                            style={{ width: 56 }}
                          />
                        </td>
                        <td className="num">
                          <input
                            type="number"
                            name={`p_${p.id}_red`}
                            min={0}
                            max={1}
                            defaultValue={s.redCards}
                            style={{ width: 56 }}
                          />
                        </td>
                        <td className="num">
                          <input
                            type="number"
                            name={`p_${p.id}_saves`}
                            min={0}
                            defaultValue={s.saves}
                            disabled={!isGK}
                            style={{ width: 64 }}
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            name={`p_${p.id}_cleanSheet`}
                            defaultChecked={s.cleanSheet}
                            disabled={!isGK}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section style={{ marginTop: 24 }}>
          <div className="row">
            <button type="submit">Save match</button>
            <span className="spacer" />
            <button
              type="submit"
              className="danger"
              name="_action"
              value="delete"
              formNoValidate
            >
              Delete match
            </button>
          </div>
        </section>
      </form>

    </>
  );
}
