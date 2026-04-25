import { put, list } from "@vercel/blob";
import { emptyTeamData, type TeamData } from "./types";

const PATHNAME = "team-data.json";

export async function readTeam(): Promise<TeamData> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return emptyTeamData;
  }
  const { blobs } = await list({ prefix: PATHNAME, limit: 1 });
  const blob = blobs.find((b) => b.pathname === PATHNAME);
  if (!blob) return emptyTeamData;
  const res = await fetch(blob.url, { cache: "no-store" });
  if (!res.ok) return emptyTeamData;
  const data = (await res.json()) as Partial<TeamData>;
  return {
    teamName: data.teamName ?? emptyTeamData.teamName,
    season: data.season ?? emptyTeamData.season,
    players: data.players ?? [],
    matches: data.matches ?? [],
  };
}

export async function writeTeam(data: TeamData): Promise<void> {
  await put(PATHNAME, JSON.stringify(data, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function mutateTeam(
  fn: (data: TeamData) => TeamData | Promise<TeamData>,
): Promise<TeamData> {
  const current = await readTeam();
  const next = await fn(current);
  await writeTeam(next);
  return next;
}
