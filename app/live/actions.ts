"use server";

import { mutateTeam } from "@/lib/store";
import type { MatchStat } from "@/lib/types";

export async function saveMatchEvents(
  matchId: string,
  events: MatchStat[],
): Promise<void> {
  await mutateTeam((d) => ({
    ...d,
    matches: d.matches.map((m) =>
      m.id === matchId ? { ...m, stats: events } : m,
    ),
  }));
}
