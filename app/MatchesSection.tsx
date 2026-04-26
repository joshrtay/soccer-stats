"use client";

import Link from "next/link";
import { useCallback, useRef, useState, useTransition } from "react";
import type { Match } from "@/lib/types";
import {
  type Aggregate,
  emptyAggregate,
  matchResult,
  ourScore,
  theirScore,
} from "@/lib/aggregate";
import { serialize } from "@/lib/serialize";
import {
  createMatch,
  deleteMatch,
  updateMatch,
  type MatchInput,
} from "./actions";

function fmtPct(p: number | null): string {
  return p === null ? "—" : `${p}%`;
}

type Ops = {
  add: (m: Match) => void;
  replace: (id: string, m: Match) => void;
  remove: (id: string) => void;
};

export function MatchesSection({
  initialMatches,
  aggregates,
}: {
  initialMatches: Match[];
  aggregates: Map<string, Aggregate>;
}) {
  const [matches, setMatches] = useState(initialMatches);
  const [showAdd, setShowAdd] = useState(false);

  const ops: Ops = {
    add: useCallback((m) => setMatches((prev) => [...prev, m]), []),
    replace: useCallback(
      (id, m) => setMatches((prev) => prev.map((x) => (x.id === id ? m : x))),
      [],
    ),
    remove: useCallback(
      (id) => setMatches((prev) => prev.filter((x) => x.id !== id)),
      [],
    ),
  };

  const sorted = [...matches].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <section style={{ marginTop: 32 }}>
      <div className="row" style={{ alignItems: "baseline" }}>
        <h3 style={{ margin: 0 }}>Matches</h3>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>
          {sorted.length} {sorted.length === 1 ? "match" : "matches"}
        </span>
        <span className="spacer" />
        <button
          type="button"
          className="secondary"
          onClick={() => setShowAdd((s) => !s)}
        >
          {showAdd ? "Cancel" : "+ New match"}
        </button>
      </div>

      {showAdd && (
        <AddMatchForm ops={ops} onAdded={() => setShowAdd(false)} />
      )}

      {sorted.length === 0 ? (
        <div className="empty" style={{ marginTop: 12 }}>
          No matches yet.
        </div>
      ) : (
        <div className="grid" style={{ gap: 12, marginTop: 12 }}>
          {sorted.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              agg={aggregates.get(m.id) ?? emptyAggregate()}
              ops={ops}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function MatchCard({
  match,
  agg,
  ops,
}: {
  match: Match;
  agg: Aggregate;
  ops: Ops;
}) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(match.date);
  const [opponent, setOpponent] = useState(match.opponent);
  const [pending, startTransition] = useTransition();

  const isTemp = match.id.startsWith("tmp-");
  const goals = ourScore(match);
  const oppGoals = theirScore(match);
  const r = matchResult(match);

  function onSave() {
    if (isTemp) return;
    const trimmed = opponent.trim() || "Opponent";
    const next: Match = { ...match, date, opponent: trimmed };
    const previous = match;
    startTransition(async () => {
      ops.replace(match.id, next);
      try {
        await serialize(() =>
          updateMatch(match.id, { date, opponent: trimmed }),
        );
        setEditing(false);
      } catch (e) {
        ops.replace(match.id, previous);
        alert(e instanceof Error ? e.message : "failed to save");
      }
    });
  }

  function onCancel() {
    setDate(match.date);
    setOpponent(match.opponent);
    setEditing(false);
  }

  function onDelete() {
    if (isTemp) return;
    if (!confirm(`Delete the match vs ${match.opponent}?`)) return;
    const previous = match;
    startTransition(async () => {
      ops.remove(match.id);
      try {
        await serialize(() => deleteMatch(match.id));
      } catch (e) {
        ops.add(previous);
        alert(e instanceof Error ? e.message : "failed to delete");
      }
    });
  }

  if (editing && !isTemp) {
    return (
      <div className="card" style={{ opacity: pending ? 0.6 : 1 }}>
        <div className="row" style={{ gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: "0 0 150px" }}>
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div style={{ flex: "1 1 220px" }}>
            <label>Opponent</label>
            <input
              type="text"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <p
          style={{
            color: "var(--muted)",
            fontSize: 13,
            margin: "8px 0 0 0",
          }}
        >
          Score is derived from goals (ours) and opponent-goal events
          tracked in live tracking.
        </p>
        <div className="row" style={{ marginTop: 12 }}>
          <button type="button" onClick={onSave} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </button>
          <span className="spacer" />
          <button
            type="button"
            className="danger"
            onClick={onDelete}
            disabled={pending}
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ opacity: pending || isTemp ? 0.6 : 1 }}>
      <div className="row" style={{ alignItems: "baseline" }}>
        <span style={{ fontWeight: 600, fontSize: 16 }}>
          vs {match.opponent}
        </span>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>
          {match.date}
        </span>
        <span className="spacer" />
        <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
          {goals} – {oppGoals}
        </span>
        <span
          className={`pill ${r === "W" ? "win" : r === "D" ? "draw" : "loss"}`}
        >
          {r}
        </span>
      </div>
      <div
        className="row"
        style={{ marginTop: 8, fontSize: 13, color: "var(--muted)" }}
      >
        <span>Pass {fmtPct(agg.passPct)}</span>
        <span>·</span>
        <span>Shot {fmtPct(agg.shotPct)}</span>
        <span>·</span>
        <span>Duel {fmtPct(agg.duelPct)}</span>
        <span>·</span>
        <span>{agg.total} actions</span>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <Link className="btn" href={`/live/${match.id}`}>
          Track live →
        </Link>
        <Link className="btn secondary" href={`/matches/${match.id}`}>
          View
        </Link>
        <button
          type="button"
          className="secondary"
          onClick={() => setEditing(true)}
          disabled={pending || isTemp}
        >
          Edit
        </button>
      </div>
    </div>
  );
}

function AddMatchForm({
  ops,
  onAdded,
}: {
  ops: Ops;
  onAdded: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const input: MatchInput = {
      date: String(formData.get("date") ?? today),
      opponent: String(formData.get("opponent") ?? "").trim(),
    };
    if (!input.opponent) {
      setError("opponent required");
      return;
    }
    const tempId = `tmp-${Math.random().toString(36).slice(2)}`;
    const tempMatch: Match = {
      id: tempId,
      date: input.date,
      opponent: input.opponent,
      stats: [],
    };
    ops.add(tempMatch);
    try {
      const real = await serialize(() => createMatch(input));
      ops.replace(tempId, real);
      setError(null);
      formRef.current?.reset();
      onAdded();
    } catch (e) {
      ops.remove(tempId);
      setError(e instanceof Error ? e.message : "failed to create match");
    }
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="card"
      style={{ marginTop: 12 }}
    >
      <div className="row" style={{ gap: 8, alignItems: "flex-end" }}>
        <div style={{ flex: "0 0 150px" }}>
          <label>Date</label>
          <input type="date" name="date" defaultValue={today} required />
        </div>
        <div style={{ flex: "1 1 220px" }}>
          <label>Opponent</label>
          <input type="text" name="opponent" required autoFocus />
        </div>
        <button type="submit">Add</button>
      </div>
      {error && (
        <div className="error" style={{ marginTop: 8 }}>
          {error}
        </div>
      )}
    </form>
  );
}
