import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";
import { checkPassword } from "@/lib/session";

export async function POST(req: Request) {
  const form = await req.formData();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/admin");

  if (!checkPassword(password)) {
    const url = new URL(req.url);
    url.pathname = "/login";
    url.searchParams.set("error", "1");
    if (next) url.searchParams.set("next", next);
    return NextResponse.redirect(url, { status: 303 });
  }

  await setSessionCookie();
  const url = new URL(req.url);
  url.pathname = next.startsWith("/") ? next : "/admin";
  url.search = "";
  return NextResponse.redirect(url, { status: 303 });
}
