"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { POSITIONS, type Player, type Position } from "@/lib/types";
import { type Aggregate, emptyAggregate } from "@/lib/aggregate";
import { serialize } from "@/lib/serialize";
import {
  createPlayer,
  deletePlayer,
  updatePlayer,
  type PlayerInput,
} from "./actions";

function fmtPct(p: number | null): string {
  return p === null ? "—" : `${p}%`;
}

type Ops = {
  add: (p: Player) => void;
  replace: (id: string, p: Player) => void;
  remove: (id: string) => void;
};

export function RosterSection({
  initialPlayers,
  aggregates,
}: {
  initialPlayers: Player[];
  aggregates: Map<string, Aggregate>;
}) {
  const [players, setPlayers] = useState(initialPlayers);
  const [showAdd, setShowAdd] = useState(false);

  const ops: Ops = {
    add: useCallback((p) => setPlayers((prev) => [...prev, p]), []),
    replace: useCallback(
      (id, p) => setPlayers((prev) => prev.map((x) => (x.id === id ? p : x))),
      [],
    ),
    remove: useCallback(
      (id) => setPlayers((prev) => prev.filter((x) => x.id !== id)),
      [],
    ),
  };

  const sorted = [...players].sort(
    (a, b) => a.number - b.number || a.name.localeCompare(b.name),
  );

  return (
    <section style={{ marginTop: 32 }}>
      <div className="row" style={{ alignItems: "baseline" }}>
        <h3 style={{ margin: 0 }}>Roster</h3>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>
          {sorted.length} {sorted.length === 1 ? "player" : "players"}
        </span>
        <span className="spacer" />
        <button
          type="button"
          className="secondary"
          onClick={() => setShowAdd((s) => !s)}
        >
          {showAdd ? "Cancel" : "+ Add player"}
        </button>
      </div>

      {showAdd && (
        <AddPlayerForm ops={ops} onAdded={() => setShowAdd(false)} />
      )}

      {sorted.length === 0 ? (
        <div className="empty" style={{ marginTop: 12 }}>
          No players yet.
        </div>
      ) : (
        <div
          className="card"
          style={{ padding: 0, marginTop: 12, overflowX: "auto" }}
        >
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
                <th />
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <PlayerRow
                  key={p.id}
                  player={p}
                  agg={aggregates.get(p.id) ?? emptyAggregate()}
                  ops={ops}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PlayerRow({
  player,
  agg,
  ops,
}: {
  player: Player;
  agg: Aggregate;
  ops: Ops;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(player.name);
  const [number, setNumber] = useState(player.number);
  const [position, setPosition] = useState<Position>(player.position);
  const [pending, startTransition] = useTransition();

  const isTemp = player.id.startsWith("tmp-");

  function onSave() {
    if (!name.trim() || isTemp) return;
    const next: Player = {
      id: player.id,
      name: name.trim(),
      number,
      position,
    };
    const previous = player;
    startTransition(async () => {
      ops.replace(player.id, next);
      try {
        await serialize(() =>
          updatePlayer(player.id, { name: next.name, number, position }),
        );
        setEditing(false);
      } catch (e) {
        ops.replace(player.id, previous);
        alert(e instanceof Error ? e.message : "failed to save");
      }
    });
  }

  function onCancel() {
    setName(player.name);
    setNumber(player.number);
    setPosition(player.position);
    setEditing(false);
  }

  function onDelete() {
    if (isTemp) return;
    if (!confirm(`Delete ${player.name}?`)) return;
    const previous = player;
    startTransition(async () => {
      ops.remove(player.id);
      try {
        await serialize(() => deletePlayer(player.id));
      } catch (e) {
        ops.add(previous);
        alert(e instanceof Error ? e.message : "failed to delete");
      }
    });
  }

  if (editing && !isTemp) {
    return (
      <tr style={{ opacity: pending ? 0.6 : 1 }}>
        <td>
          <input
            type="number"
            value={number}
            onChange={(e) => setNumber(Number(e.target.value))}
            min={0}
            max={99}
            style={{ width: 60 }}
          />
        </td>
        <td>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </td>
        <td>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as Position)}
          >
            {POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </td>
        <td colSpan={9} className="num">
          <button
            type="button"
            onClick={onSave}
            disabled={pending}
            style={{ padding: "4px 10px", fontSize: 12 }}
          >
            Save
          </button>
          <button
            type="button"
            className="secondary"
            onClick={onCancel}
            disabled={pending}
            style={{ padding: "4px 10px", fontSize: 12, marginLeft: 6 }}
          >
            Cancel
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr style={{ opacity: pending || isTemp ? 0.6 : 1 }}>
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
      <td className="num">
        <button
          type="button"
          className="secondary"
          onClick={() => setEditing(true)}
          disabled={pending || isTemp}
          style={{ padding: "4px 10px", fontSize: 12 }}
        >
          Edit
        </button>
        <button
          type="button"
          className="danger"
          onClick={onDelete}
          disabled={pending || isTemp}
          style={{ padding: "4px 10px", fontSize: 12, marginLeft: 6 }}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

function AddPlayerForm({
  ops,
  onAdded,
}: {
  ops: Ops;
  onAdded: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const input: PlayerInput = {
      name: String(formData.get("name") ?? ""),
      number: Number(formData.get("number") ?? 0),
      position: String(formData.get("position") ?? "MID") as Position,
    };
    if (!input.name.trim()) {
      setError("name required");
      return;
    }
    const tempId = `tmp-${Math.random().toString(36).slice(2)}`;
    const tempPlayer: Player = {
      id: tempId,
      name: input.name.trim(),
      number: input.number,
      position: input.position,
    };
    ops.add(tempPlayer);
    try {
      const real = await serialize(() => createPlayer(input));
      ops.replace(tempId, real);
      setError(null);
      formRef.current?.reset();
      onAdded();
    } catch (e) {
      ops.remove(tempId);
      setError(e instanceof Error ? e.message : "failed to add player");
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
        <div style={{ flex: "0 0 80px" }}>
          <label>#</label>
          <input
            type="number"
            name="number"
            min={0}
            max={99}
            defaultValue={0}
          />
        </div>
        <div style={{ flex: "1 1 240px" }}>
          <label>Name</label>
          <input type="text" name="name" required autoFocus />
        </div>
        <div style={{ flex: "0 0 110px" }}>
          <label>Position</label>
          <select name="position" defaultValue="MID">
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
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
