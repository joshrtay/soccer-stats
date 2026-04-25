import Link from "next/link";

export default function NewMatchPage() {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <section style={{ paddingTop: 16 }}>
        <div className="row">
          <h2 style={{ margin: 0 }}>New match</h2>
          <span className="spacer" />
          <Link className="btn secondary" href="/admin">
            ← Back
          </Link>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>
          Create the match shell, then enter per-player stats on the next page.
        </p>
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <form action="/api/matches" method="post" className="form">
          <div className="form-row">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={today}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="opponent">Opponent</label>
            <input id="opponent" name="opponent" type="text" required />
          </div>
          <div className="form-row">
            <label htmlFor="homeAway">Home / Away</label>
            <select id="homeAway" name="homeAway" defaultValue="home">
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
              placeholder="League, cup, friendly…"
            />
          </div>
          <div className="form-row">
            <label htmlFor="ourScore">Our score</label>
            <input
              id="ourScore"
              name="ourScore"
              type="number"
              min={0}
              defaultValue={0}
            />
          </div>
          <div className="form-row">
            <label htmlFor="theirScore">Their score</label>
            <input
              id="theirScore"
              name="theirScore"
              type="number"
              min={0}
              defaultValue={0}
            />
          </div>
          <div className="form-row">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" />
          </div>
          <div>
            <button type="submit">Create match</button>
          </div>
        </form>
      </section>
    </>
  );
}
