# Soccer Stats

A single-team, season-long soccer stat tracker. Public read-only dashboard, single-coach login for editing. Data is stored as a JSON document in Vercel Blob.

## What it tracks

- Roster (name, number, position, active flag)
- Match log (date, opponent, home/away, competition, score, notes)
- Per-match per-player stats: minutes, started, goals, assists, yellow/red cards, GK saves & clean sheets
- Aggregated season view: W–D–L, GF/GA/GD, recent form, top scorers / assists / appearances

## Stack

- Next.js 15 (App Router) + TypeScript, plain CSS
- `@vercel/blob` for persistence (one JSON document at `team-data.json`)
- HMAC-signed cookie auth (Web Crypto, edge-safe)

## Local development

```bash
npm install

# Provision Blob from a Vercel project (recommended) and pull env:
vercel link
vercel env pull .env.local

# Or set env vars manually:
cp .env.example .env.local
# Then edit .env.local and set ADMIN_PASSWORD, SESSION_SECRET, BLOB_READ_WRITE_TOKEN

npm run dev
```

Visit http://localhost:3000. Click **Sign in** and use the password from `ADMIN_PASSWORD`.

## Environment variables

| Var | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | Coach login password. |
| `SESSION_SECRET` | 32+ random bytes. Generate with `openssl rand -hex 32`. |
| `BLOB_READ_WRITE_TOKEN` | Auto-set by the Vercel Blob integration. |

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. In the project's **Storage** tab, create a Vercel Blob store. `BLOB_READ_WRITE_TOKEN` is injected automatically.
4. In **Settings → Environment Variables**, add `ADMIN_PASSWORD` and `SESSION_SECRET` for Production (and Preview, if you want).
5. Trigger a deploy.

That's it — the first time the coach saves data, a `team-data.json` blob is created in the store.

## Notes

- Storage is last-write-wins. Fine for one coach. If two devices edit at once, the later save wins.
- All routes are server-rendered with `export const dynamic = 'force-dynamic'` so the dashboard reflects the latest blob on each request.
- The middleware gates `/admin/*` and write methods on `/api/players`, `/api/matches`, `/api/team`. Public reads are unauthenticated.
- To wipe and start over, delete `team-data.json` from the Blob store.
