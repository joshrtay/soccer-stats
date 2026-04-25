import type { Metadata } from "next";
import Link from "next/link";
import { readTeam } from "@/lib/store";
import { isAdmin } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soccer Stats",
  description: "Season stat tracker for a soccer team",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await readTeam();
  const admin = await isAdmin();

  return (
    <html lang="en">
      <body>
        <header className="site">
          <div className="container">
            <h1>
              <Link href="/" style={{ color: "inherit" }}>
                {data.teamName}
              </Link>{" "}
              <span style={{ color: "var(--muted)", fontWeight: 400 }}>
                · {data.season}
              </span>
            </h1>
            <nav>
              <Link href="/">Dashboard</Link>
              {admin ? (
                <>
                  <Link href="/admin">Admin</Link>
                  <form action="/api/logout" method="post" style={{ margin: 0 }}>
                    <button
                      type="submit"
                      className="secondary"
                      style={{ padding: "4px 10px", fontSize: 13 }}
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/login">Sign in</Link>
              )}
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="site">
          Soccer Stats · powered by Vercel Blob
        </footer>
      </body>
    </html>
  );
}
