import { BlobNotFoundError, head, put } from "@vercel/blob";
import { emptyTeamData, type TeamData } from "./types";

const PATHNAME = "team-data.json";

// Vercel Blob is the persistence layer, not the read path. The CDN body
// is eventually consistent after a put (~seconds), which makes
// read-after-write through the CDN unreliable. We avoid that entirely:
// load once on cold start, then keep the team in process memory. Writes
// go to the blob (for durability) AND update the in-memory copy.
//
// Cache lives on globalThis so it survives Next.js's module
// re-evaluation between server actions and page renders. Single-writer
// is assumed (one user, one tab); multi-writer would need a real DB.

declare global {
  // eslint-disable-next-line no-var
  var __teamCache: { data: TeamData; loaded: boolean } | undefined;
}

function getCache(): { data: TeamData; loaded: boolean } {
  if (!globalThis.__teamCache) {
    globalThis.__teamCache = { data: emptyTeamData, loaded: false };
  }
  return globalThis.__teamCache;
}

async function loadFromBlob(): Promise<TeamData> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return emptyTeamData;
  try {
    const blob = await head(PATHNAME);
    const res = await fetch(`${blob.url}?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) return emptyTeamData;
    const data = (await res.json()) as Partial<TeamData>;
    return {
      teamName: data.teamName ?? emptyTeamData.teamName,
      season: data.season ?? emptyTeamData.season,
      players: data.players ?? [],
      matches: data.matches ?? [],
    };
  } catch (e) {
    if (e instanceof BlobNotFoundError) return emptyTeamData;
    throw e;
  }
}

export async function readTeam(): Promise<TeamData> {
  const c = getCache();
  if (!c.loaded) {
    console.log("[store] cold load from blob");
    c.data = await loadFromBlob();
    c.loaded = true;
  }
  return c.data;
}

export async function writeTeam(data: TeamData): Promise<void> {
  const c = getCache();
  // Update in-memory state first so any concurrent reader sees the new
  // state regardless of blob timing.
  c.data = data;
  c.loaded = true;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put(PATHNAME, JSON.stringify(data, null, 2), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 0,
    });
  }
}

export async function mutateTeam(
  fn: (data: TeamData) => TeamData | Promise<TeamData>,
): Promise<TeamData> {
  const current = await readTeam();
  const next = await fn(current);
  await writeTeam(next);
  return next;
}
