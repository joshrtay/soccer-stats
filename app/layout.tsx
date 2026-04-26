import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soccer Stats",
  description: "Season stat tracker for a soccer team",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
