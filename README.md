# Soccer Stats

A single-team, season-long soccer stat tracker. Single shared interface for viewing and editing. Data is stored as a JSON document in Vercel Blob.

## What it tracks

- Roster (name, number, position, active flag)
- Match log (date, opponent, home/away, competition, score, notes)
- Per-match per-player stats: minutes, started, goals, assists, yellow/red cards, GK saves & clean sheets
- Aggregated season view: W–D–L, GF/GA/GD, recent form, top scorers / assists / appearances

## Stack

- Next.js 15 (App Router) + TypeScript, plain CSS
- `@vercel/blob` for persistence (one JSON document at `team-data.json`)

## Local development

```bash
npm install

# Provision Blob from a Vercel project (recommended) and pull env:
vercel link
vercel env pull .env.local

# Or set env vars manually:
cp .env.example .env.local
# Then edit .env.local and set BLOB_READ_WRITE_TOKEN

npm run dev
```

Visit http://localhost:3000.

## Environment variables

| Var | Purpose |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Auto-set by the Vercel Blob integration. |

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. In the project's **Storage** tab, create a Vercel Blob store. `BLOB_READ_WRITE_TOKEN` is injected automatically.
4. Trigger a deploy.

That's it — the first time data is saved, a `team-data.json` blob is created in the store.

## Notes

- Storage is last-write-wins. If two devices edit at once, the later save wins.
- All routes are server-rendered with `export const dynamic = 'force-dynamic'` so the dashboard reflects the latest blob on each request.
- There is no auth — anyone with the URL can edit. Don't expose the deployment publicly if that's a concern.
- To wipe and start over, delete `team-data.json` from the Blob store.
