"use server";

import { revalidatePath } from "next/cache";
import { mutateTeam } from "@/lib/store";
import {
  POSITIONS,
  type Match,
  type Player,
  type Position,
} from "@/lib/types";

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// === Team ===

export type TeamInput = {
  teamName: string;
  season: string;
};

export async function updateTeam(input: TeamInput): Promise<void> {
  const teamName = input.teamName.trim() || "Our Team";
  const season =
    input.season.trim() || new Date().getFullYear().toString();
  await mutateTeam((d) => ({ ...d, teamName, season }));
  revalidatePath("/", "layout");
}

// === Players ===

export type PlayerInput = {
  name: string;
  number: number;
  position: Position;
};

function normalizePlayer(input: PlayerInput, id: string): Player {
  const name = input.name.trim();
  if (!name) throw new Error("name required");
  if (!POSITIONS.includes(input.position)) throw new Error("invalid position");
  return {
    id,
    name,
    number: Number.isFinite(input.number) ? input.number : 0,
    position: input.position,
  };
}

export async function createPlayer(input: PlayerInput): Promise<Player> {
  const player = normalizePlayer(input, randomId());
  await mutateTeam((d) => ({ ...d, players: [...d.players, player] }));
  revalidatePath("/", "layout");
  return player;
}

export async function updatePlayer(
  id: string,
  input: PlayerInput,
): Promise<Player> {
  const player = normalizePlayer(input, id);
  await mutateTeam((d) => ({
    ...d,
    players: d.players.map((p) => (p.id === id ? player : p)),
  }));
  revalidatePath("/", "layout");
  return player;
}

export async function deletePlayer(id: string): Promise<void> {
  await mutateTeam((d) => ({
    ...d,
    players: d.players.filter((p) => p.id !== id),
    matches: d.matches.map((m) => ({
      ...m,
      stats: m.stats.filter((s) => s.playerId !== id),
    })),
  }));
  revalidatePath("/", "layout");
}

// === Matches ===

export type MatchInput = {
  date: string;
  opponent: string;
};

function normalizeMatch(input: MatchInput): MatchInput {
  return {
    date: input.date || new Date().toISOString().slice(0, 10),
    opponent: input.opponent.trim() || "Opponent",
  };
}

export async function createMatch(input: MatchInput): Promise<Match> {
  const m = normalizeMatch(input);
  if (!m.opponent) throw new Error("opponent required");
  const match: Match = { id: randomId(), ...m, stats: [] };
  await mutateTeam((d) => ({ ...d, matches: [...d.matches, match] }));
  revalidatePath("/", "layout");
  return match;
}

export async function updateMatch(
  id: string,
  input: MatchInput,
): Promise<void> {
  const m = normalizeMatch(input);
  await mutateTeam((d) => ({
    ...d,
    matches: d.matches.map((mm) => (mm.id === id ? { ...mm, ...m } : mm)),
  }));
  revalidatePath("/", "layout");
}

export async function deleteMatch(id: string): Promise<void> {
  await mutateTeam((d) => ({
    ...d,
    matches: d.matches.filter((m) => m.id !== id),
  }));
  revalidatePath("/", "layout");
}
