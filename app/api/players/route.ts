import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { mutateTeam } from "@/lib/store";
import { POSITIONS, type Player, type Position } from "@/lib/types";

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function parsePlayer(form: FormData, existingId?: string): Player {
  const name = String(form.get("name") ?? "").trim();
  const number = Number(form.get("number") ?? 0);
  const position = String(form.get("position") ?? "MID") as Position;
  const active = form.get("active") === "on" || form.get("active") === "true";
  if (!name) throw new Error("name required");
  if (!POSITIONS.includes(position)) throw new Error("invalid position");
  return {
    id: existingId ?? randomId(),
    name,
    number: Number.isFinite(number) ? number : 0,
    position,
    active,
  };
}

export async function POST(req: Request) {
  const form = await req.formData();
  const action = String(form.get("_action") ?? "create");

  try {
    if (action === "create") {
      const player = parsePlayer(form);
      await mutateTeam((d) => ({ ...d, players: [...d.players, player] }));
    } else if (action === "update") {
      const id = String(form.get("id") ?? "");
      if (!id) throw new Error("id required");
      const player = parsePlayer(form, id);
      await mutateTeam((d) => ({
        ...d,
        players: d.players.map((p) => (p.id === id ? player : p)),
      }));
    } else if (action === "delete") {
      const id = String(form.get("id") ?? "");
      if (!id) throw new Error("id required");
      await mutateTeam((d) => ({
        ...d,
        players: d.players.filter((p) => p.id !== id),
        matches: d.matches.map((m) => ({
          ...m,
          stats: m.stats.filter((s) => s.playerId !== id),
        })),
      }));
    } else {
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "bad request" },
      { status: 400 },
    );
  }

  revalidatePath("/", "layout");

  const accept = req.headers.get("accept") ?? "";
  if (accept.includes("application/json")) {
    return NextResponse.json({ ok: true });
  }
  const url = new URL(req.url);
  url.pathname = "/admin/players";
  url.search = "";
  return NextResponse.redirect(url, { status: 303 });
}
