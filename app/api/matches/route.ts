import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { mutateTeam } from "@/lib/store";
import type { Match } from "@/lib/types";

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function POST(req: Request) {
  const form = await req.formData();

  const date = String(form.get("date") ?? "");
  const opponent = String(form.get("opponent") ?? "").trim();
  const homeAway = String(form.get("homeAway") ?? "home") === "away" ? "away" : "home";
  const competition = String(form.get("competition") ?? "").trim();
  const ourScore = Number(form.get("ourScore") ?? 0);
  const theirScore = Number(form.get("theirScore") ?? 0);
  const notes = String(form.get("notes") ?? "").trim();

  if (!date || !opponent) {
    return NextResponse.json({ error: "date and opponent required" }, { status: 400 });
  }

  const match: Match = {
    id: randomId(),
    date,
    opponent,
    homeAway,
    competition,
    ourScore: Number.isFinite(ourScore) ? ourScore : 0,
    theirScore: Number.isFinite(theirScore) ? theirScore : 0,
    notes,
    stats: [],
  };

  await mutateTeam((d) => ({ ...d, matches: [...d.matches, match] }));
  revalidatePath("/", "layout");

  const url = new URL(req.url);
  url.pathname = `/admin/matches/${match.id}`;
  url.search = "";
  return NextResponse.redirect(url, { status: 303 });
}
