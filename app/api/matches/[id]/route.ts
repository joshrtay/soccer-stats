import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { mutateTeam } from "@/lib/store";
import { emptyMatchStats, type Match, type PlayerMatchStats } from "@/lib/types";

function num(v: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool(v: FormDataEntryValue | null): boolean {
  return v === "on" || v === "true" || v === "1";
}

function parseStats(form: FormData, playerIds: string[]): PlayerMatchStats[] {
  return playerIds.map((id) => {
    const present = form.has(`p_${id}_present`);
    if (!present) return emptyMatchStats(id);
    return {
      playerId: id,
      started: bool(form.get(`p_${id}_started`)),
      minutes: num(form.get(`p_${id}_minutes`)),
      goals: num(form.get(`p_${id}_goals`)),
      assists: num(form.get(`p_${id}_assists`)),
      yellowCards: num(form.get(`p_${id}_yellow`)),
      redCards: num(form.get(`p_${id}_red`)),
      saves: num(form.get(`p_${id}_saves`)),
      cleanSheet: bool(form.get(`p_${id}_cleanSheet`)),
    };
  });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const form = await req.formData();
  const action = String(form.get("_action") ?? "update");

  if (action === "delete") {
    await mutateTeam((d) => ({
      ...d,
      matches: d.matches.filter((m) => m.id !== id),
    }));
    revalidatePath("/", "layout");
    const url = new URL(req.url);
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url, { status: 303 });
  }

  const date = String(form.get("date") ?? "");
  const opponent = String(form.get("opponent") ?? "").trim();
  const homeAway =
    String(form.get("homeAway") ?? "home") === "away" ? "away" : "home";
  const competition = String(form.get("competition") ?? "").trim();
  const ourScore = num(form.get("ourScore"));
  const theirScore = num(form.get("theirScore"));
  const notes = String(form.get("notes") ?? "").trim();

  await mutateTeam((d) => {
    const playerIds = d.players.map((p) => p.id);
    const stats = parseStats(form, playerIds);
    const updated: Match = {
      id,
      date: date || new Date().toISOString().slice(0, 10),
      opponent: opponent || "Opponent",
      homeAway,
      competition,
      ourScore,
      theirScore,
      notes,
      stats,
    };
    return {
      ...d,
      matches: d.matches.map((m) => (m.id === id ? updated : m)),
    };
  });

  revalidatePath("/", "layout");
  const url = new URL(req.url);
  url.pathname = `/admin/matches/${id}`;
  url.search = "";
  return NextResponse.redirect(url, { status: 303 });
}
