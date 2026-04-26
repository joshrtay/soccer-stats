"use client";

// All mutating server actions are routed through this chain so concurrent
// browser-initiated calls don't race on the read-modify-write inside
// mutateTeam. Vercel Blob has no CAS, so without this two parallel calls
// can each fetch the same starting state, each compute their own update,
// and the second write silently overwrites the first.
//
// Scope: protects against races within a single browser tab. Concurrent
// writes from another tab or device aren't covered — that would need
// server-side coordination (a database with row-level locking, or a
// distributed mutex).

let chain: Promise<unknown> = Promise.resolve();

export function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  // Don't let a rejection poison the chain; subsequent calls should still run.
  chain = next.then(
    () => undefined,
    () => undefined,
  );
  return next as Promise<T>;
}
