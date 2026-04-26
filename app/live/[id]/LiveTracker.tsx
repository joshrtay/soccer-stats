"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  type ActionType,
  type Match,
  type MatchStat,
  type Player,
} from "@/lib/types";
import { aggregateByPlayer, emptyAggregate } from "@/lib/aggregate";
import { serialize } from "@/lib/serialize";
import { saveMatchEvents } from "../actions";

type Screen = "track" | "stats";

const OPPONENT_SENTINEL = "__opp__";

function makeId(): string {
  return Math.random().toString(36).slice(2, 12);
}

export function LiveTracker({
  match,
  players,
}: {
  match: Match;
  players: Player[];
}) {
  const [screen, setScreen] = useState<Screen>("track");
  const [events, setEvents] = useState<MatchStat[]>(() => match.stats);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const aggregates = useMemo(() => aggregateByPlayer(events), [events]);

  const ours = useMemo(
    () => events.filter((e) => e.type === "shotMade" && e.playerId).length,
    [events],
  );
  const theirs = useMemo(
    () => events.filter((e) => e.type === "opponentGoal").length,
    [events],
  );

  // Mirror of `events` so we can read the latest synchronously from
  // event handlers without depending on closure-captured state.
  const eventsRef = useRef<MatchStat[]>(match.stats);
  const inFlightRef = useRef(false);
  const pendingRef = useRef<MatchStat[] | null>(null);

  const save = useCallback(
    async (snapshot: MatchStat[]) => {
      pendingRef.current = snapshot;
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        while (pendingRef.current) {
          const current = pendingRef.current;
          pendingRef.current = null;
          try {
            await serialize(() => saveMatchEvents(match.id, current));
            setLastSavedAt(Date.now());
            setSyncError(false);
          } catch {
            pendingRef.current = current;
            setSyncError(true);
            break;
          }
        }
      } finally {
        inFlightRef.current = false;
      }
    },
    [match.id],
  );

  // Update both the ref and React state, then kick off the save outside
  // of any setState updater (calling save() inside an updater can poke
  // Next.js Router state mid-render → "setState while rendering" warning).
  const commitEvents = useCallback(
    (next: MatchStat[]) => {
      eventsRef.current = next;
      setEvents(next);
      void save(next);
    },
    [save],
  );

  function logStat(playerId: string, type: ActionType) {
    const stat: MatchStat = { id: makeId(), playerId, type, ts: Date.now() };
    commitEvents([...eventsRef.current, stat]);
    setFlashId(playerId);
    setTimeout(() => setFlashId((id) => (id === playerId ? null : id)), 400);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }
    setSelectedPlayerId(null);
  }

  function undo() {
    if (eventsRef.current.length === 0) return;
    commitEvents(eventsRef.current.slice(0, -1));
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([10, 30, 10]);
    }
  }

  function logOpponentGoal() {
    const stat: MatchStat = {
      id: makeId(),
      type: "opponentGoal",
      ts: Date.now(),
    };
    commitEvents([...eventsRef.current, stat]);
    setFlashId(OPPONENT_SENTINEL);
    setTimeout(
      () => setFlashId((id) => (id === OPPONENT_SENTINEL ? null : id)),
      400,
    );
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }
    setSelectedPlayerId(null);
  }

  const retry = useCallback(() => {
    void save(pendingRef.current ?? eventsRef.current);
  }, [save]);

  const cellName = (p: Player) =>
    p.name ? (p.name.length > 10 ? p.name.slice(0, 10) : p.name) : "—";
  const displayName = (p: Player) =>
    p.number > 0 ? `#${p.number} ${p.name}` : p.name;
  const matchTitle = `vs ${match.opponent}`;

  if (screen === "track") {
    const opponentSelected = selectedPlayerId === OPPONENT_SENTINEL;
    const selectedPlayer =
      selectedPlayerId && !opponentSelected
        ? players.find((p) => p.id === selectedPlayerId)
        : null;
    return (
      <div className="live live-app">
        <div className="live-header">
          <Link className="live-back" href="/">
            <span className="live-chev">‹</span>
            <div>
              <div className="live-eyebrow">
                Live · {ours}–{theirs}
                {lastSavedAt && !syncError && (
                  <>
                    {" · "}
                    <span className="live-saved">
                      Saved {formatTime(lastSavedAt)}
                    </span>
                  </>
                )}
              </div>
              <div className="live-title-sm live-title-on">● {matchTitle}</div>
            </div>
          </Link>
          <div className="live-icon-row">
            <button
              type="button"
              className="live-icon-btn"
              onClick={undo}
              disabled={events.length === 0}
              aria-label="Undo"
            >
              ↶
            </button>
            <button
              type="button"
              className="live-icon-btn"
              onClick={() => setScreen("stats")}
              aria-label="Stats"
            >
              ☰
            </button>
          </div>
        </div>

        {syncError && (
          <div className="live-sync-warn">
            Sync error — taps are buffered locally.{" "}
            <button
              type="button"
              className="live-sync-retry"
              onClick={retry}
            >
              Retry now
            </button>
          </div>
        )}

        <div className="live-grid">
          {players.length === 0 ? (
            <div className="live-empty live-empty-grid">
              No players.{" "}
              <Link href="/">Add some →</Link>
            </div>
          ) : (
            <>
              {players.map((p) => {
                const agg = aggregates.get(p.id);
                const total = agg ? agg.total : 0;
                const isFlashing = flashId === p.id;
                const isSelected = selectedPlayerId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      setSelectedPlayerId((cur) =>
                        cur === p.id ? null : p.id,
                      )
                    }
                    className={[
                      "live-player",
                      isSelected ? "is-selected" : "",
                      isFlashing ? "is-flash" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {p.number > 0 && (
                      <span className="live-player-num">#{p.number}</span>
                    )}
                    <span className="live-player-name">{cellName(p)}</span>
                    {total > 0 && (
                      <span className="live-player-total">{total}</span>
                    )}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  setSelectedPlayerId((cur) =>
                    cur === OPPONENT_SENTINEL ? null : OPPONENT_SENTINEL,
                  )
                }
                className={[
                  "live-player",
                  "live-player--opponent",
                  opponentSelected ? "is-selected" : "",
                  flashId === OPPONENT_SENTINEL ? "is-flash" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="live-player-name">Opponent</span>
                {theirs > 0 && (
                  <span className="live-player-total">{theirs}</span>
                )}
              </button>
            </>
          )}
        </div>

        {selectedPlayer ? (
          <div className="live-bottom">
            <div className="live-bottom-head">
              <span>
                Logging for{" "}
                <span className="live-bottom-name">
                  {displayName(selectedPlayer)}
                </span>
              </span>
              <button
                type="button"
                className="live-bottom-cancel"
                onClick={() => setSelectedPlayerId(null)}
              >
                cancel
              </button>
            </div>
            <div className="live-stat-row">
              <StatBtn
                color="emerald"
                label="Pass ✓"
                glyph="✓"
                onClick={() => logStat(selectedPlayer.id, "passComplete")}
              />
              <StatBtn
                color="stone"
                label="Pass ✗"
                glyph="✗"
                onClick={() => logStat(selectedPlayer.id, "passMissed")}
              />
              <StatBtn
                color="emerald"
                label="Goal"
                glyph="⚽"
                onClick={() => logStat(selectedPlayer.id, "shotMade")}
              />
              <StatBtn
                color="amber"
                label="Shot ✗"
                glyph="⌖"
                onClick={() => logStat(selectedPlayer.id, "shotMissed")}
              />
              <StatBtn
                color="sky"
                label="Duel ✓"
                glyph="⚔"
                onClick={() => logStat(selectedPlayer.id, "duelWon")}
              />
              <StatBtn
                color="red"
                label="Duel ✗"
                glyph="⊘"
                onClick={() => logStat(selectedPlayer.id, "duelLost")}
              />
            </div>
          </div>
        ) : opponentSelected ? (
          <div className="live-bottom">
            <div className="live-bottom-head">
              <span>
                Logging for{" "}
                <span className="live-bottom-name">Opponent</span>
              </span>
              <button
                type="button"
                className="live-bottom-cancel"
                onClick={() => setSelectedPlayerId(null)}
              >
                cancel
              </button>
            </div>
            <div className="live-stat-row live-stat-row--single">
              <StatBtn
                color="red"
                label="Goal"
                glyph="⚽"
                onClick={logOpponentGoal}
              />
            </div>
          </div>
        ) : (
          <div className="live-hint">Tap a player to log a stat</div>
        )}
      </div>
    );
  }

  // ===== Stats screen =====
  return (
    <div className="live live-app">
      <div className="live-header">
        <button
          type="button"
          className="live-back"
          onClick={() => setScreen("track")}
        >
          <span className="live-chev">‹</span>
          <div>
            <div className="live-eyebrow">Game</div>
            <div className="live-title-sm">{matchTitle}</div>
          </div>
        </button>
      </div>

      <div className="live-stats-wrap">
        <div className="live-stats-row live-stats-head">
          <div>Player</div>
          <div className="num">G</div>
          <div className="num">P✓</div>
          <div className="num">P%</div>
          <div className="num">Sh</div>
          <div className="num">Sh%</div>
          <div className="num">Du</div>
          <div className="num">Du%</div>
          <div className="num">Tot</div>
        </div>
        {players.map((p) => {
          const a = aggregates.get(p.id) ?? emptyAggregate();
          return (
            <div key={p.id} className="live-stats-row">
              <div className="live-stats-name">
                {p.number > 0 ? `#${p.number} ` : ""}
                {p.name}
              </div>
              <div className="num live-color-emerald">{a.shotMade}</div>
              <div className="num live-color-emerald">{a.passComplete}</div>
              <div className="num live-color-muted">{fmtPct(a.passPct)}</div>
              <div className="num live-color-amber">{a.shotAttempts}</div>
              <div className="num live-color-muted">{fmtPct(a.shotPct)}</div>
              <div className="num live-color-sky">{a.duelAttempts}</div>
              <div className="num live-color-muted">{fmtPct(a.duelPct)}</div>
              <div className="num live-color-bold">{a.total}</div>
            </div>
          );
        })}
        {players.length === 0 && (
          <div className="live-empty">No players.</div>
        )}
      </div>
    </div>
  );
}

function StatBtn({
  color,
  label,
  glyph,
  onClick,
}: {
  color: "emerald" | "stone" | "amber" | "sky" | "red";
  label: string;
  glyph: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`live-stat-btn live-stat-btn-${color}`}
    >
      <span className="live-stat-glyph">{glyph}</span>
      <span className="live-stat-label">{label}</span>
    </button>
  );
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function fmtPct(p: number | null): string {
  return p === null ? "—" : `${p}%`;
}
