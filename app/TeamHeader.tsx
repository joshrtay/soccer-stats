"use client";

import { useState, useTransition } from "react";
import { serialize } from "@/lib/serialize";
import { updateTeam } from "./actions";

export function TeamHeader({
  initialTeamName,
  initialSeason,
}: {
  initialTeamName: string;
  initialSeason: string;
}) {
  const [teamName, setTeamName] = useState(initialTeamName);
  const [season, setSeason] = useState(initialSeason);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const dirty =
    teamName !== initialTeamName || season !== initialSeason;

  function save() {
    startTransition(async () => {
      try {
        await serialize(() => updateTeam({ teamName, season }));
        setEditing(false);
      } catch (e) {
        alert(e instanceof Error ? e.message : "failed to save");
      }
    });
  }

  function cancel() {
    setTeamName(initialTeamName);
    setSeason(initialSeason);
    setEditing(false);
  }

  if (!editing) {
    return (
      <section style={{ paddingTop: 16 }}>
        <div className="row" style={{ alignItems: "baseline" }}>
          <h1 style={{ margin: 0, fontSize: 26, letterSpacing: "-0.01em" }}>
            {teamName}
          </h1>
          <span style={{ color: "var(--muted)", fontSize: 16 }}>
            · {season}
          </span>
          <span className="spacer" />
          <button
            type="button"
            className="secondary"
            onClick={() => setEditing(true)}
            style={{ padding: "4px 10px", fontSize: 13 }}
          >
            Edit
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="card" style={{ marginTop: 16 }}>
      <div className="form">
        <div className="form-row">
          <label htmlFor="teamName">Team name</label>
          <input
            id="teamName"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="form-row">
          <label htmlFor="season">Season</label>
          <input
            id="season"
            type="text"
            value={season}
            onChange={(e) => setSeason(e.target.value)}
          />
        </div>
        <div className="row">
          <button type="button" onClick={save} disabled={!dirty || pending}>
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={cancel}
            disabled={pending}
          >
            Cancel
          </button>
        </div>
      </div>
    </section>
  );
}
