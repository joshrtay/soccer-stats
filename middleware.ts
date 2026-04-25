import { NextResponse, type NextRequest } from "next/server";
import { isAdminFromCookieHeader } from "./lib/session";

const PROTECTED_API = ["/api/players", "/api/matches", "/api/team"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const cookieHeader = req.headers.get("cookie");
  const ok = await isAdminFromCookieHeader(cookieHeader);

  if (pathname.startsWith("/admin")) {
    if (!ok) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (PROTECTED_API.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (req.method === "GET") return NextResponse.next();
    if (!ok) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/players/:path*", "/api/matches/:path*", "/api/team/:path*"],
};
