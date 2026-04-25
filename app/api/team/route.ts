import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { mutateTeam } from "@/lib/store";

export async function POST(req: Request) {
  const form = await req.formData();
  const teamName = String(form.get("teamName") ?? "").trim();
  const season = String(form.get("season") ?? "").trim();

  await mutateTeam((d) => ({
    ...d,
    teamName: teamName || d.teamName,
    season: season || d.season,
  }));

  revalidatePath("/", "layout");
  const url = new URL(req.url);
  url.pathname = "/admin";
  url.search = "";
  return NextResponse.redirect(url, { status: 303 });
}
