import Link from "next/link";
import { readTeam } from "@/lib/store";
import { POSITIONS } from "@/lib/types";

export default async function PlayersAdmin() {
  const data = await readTeam();
  const players = [...data.players].sort(
    (a, b) => a.number - b.number || a.name.localeCompare(b.name),
  );

  return (
    <>
      <section style={{ paddingTop: 16 }}>
        <div className="row">
          <h2 style={{ margin: 0 }}>Roster</h2>
          <span className="spacer" />
          <Link className="btn secondary" href="/admin">
            ← Back
          </Link>
        </div>
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <h3>Add player</h3>
        <form action="/api/players" method="post" className="form">
          <input type="hidden" name="_action" value="create" />
          <div className="form-row">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" type="text" required />
          </div>
          <div className="form-row">
            <label htmlFor="number">Number</label>
            <input
              id="number"
              name="number"
              type="number"
              min={0}
              max={99}
              defaultValue={0}
            />
          </div>
          <div className="form-row">
            <label htmlFor="position">Position</label>
            <select id="position" name="position" defaultValue="MID">
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="active">Active</label>
            <div>
              <input
                id="active"
                name="active"
                type="checkbox"
                defaultChecked
              />
            </div>
          </div>
          <div>
            <button type="submit">Add player</button>
          </div>
        </form>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>Current roster</h3>
        {players.length === 0 ? (
          <div className="empty">No players yet.</div>
        ) : (
          <div className="grid" style={{ gap: 12 }}>
            {players.map((p) => (
              <form
                key={p.id}
                action="/api/players"
                method="post"
                className="card"
                style={{ display: "grid", gap: 10 }}
              >
                <input type="hidden" name="id" value={p.id} />
                <div
                  className="row"
                  style={{ gap: 10, alignItems: "flex-end" }}
                >
                  <div style={{ flex: "0 0 80px" }}>
                    <label>#</label>
                    <input
                      type="number"
                      name="number"
                      defaultValue={p.number}
                      min={0}
                      max={99}
                    />
                  </div>
                  <div style={{ flex: "1 1 240px" }}>
                    <label>Name</label>
                    <input type="text" name="name" defaultValue={p.name} required />
                  </div>
                  <div style={{ flex: "0 0 110px" }}>
                    <label>Position</label>
                    <select name="position" defaultValue={p.position}>
                      {POSITIONS.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: "0 0 80px" }}>
                    <label>Active</label>
                    <div style={{ paddingTop: 8 }}>
                      <input
                        type="checkbox"
                        name="active"
                        defaultChecked={p.active}
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <button
                    type="submit"
                    className="secondary"
                    name="_action"
                    value="update"
                  >
                    Save
                  </button>
                  <button
                    type="submit"
                    className="danger"
                    name="_action"
                    value="delete"
                  >
                    Delete
                  </button>
                </div>
              </form>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
