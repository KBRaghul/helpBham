# helpBham

Cold-night outreach for Birmingham, AL: report someone sleeping rough, a volunteer checks on them, a shelter with a free bed takes them in. All on one live map.

**Live:** https://help-bham.vercel.app

## Run locally

Requires **Node.js 22+**.

```bash
git clone https://github.com/KBRaghul/helpBham.git
cd helpBham
npm install
```

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
```

Both values are in Supabase → **Project Settings → API**. Use the `.supabase.co` API URL, not the dashboard URL.

```bash
npm run dev      # http://localhost:3000
```

## Database (new Supabase project only)

In Supabase → **SQL Editor**, run these in order:

1. `supabase/schema.sql`: tables, live updates, demo data
2. `supabase/002_atomic_beds.sql`: bed-count functions

Re-running `schema.sql` resets reports to the demo data.

## Demo logins

| Role | Username | Password |
|---|---|---|
| Reporter | `reporter` | `reporter123` |
| Helper | `helper` / `helper2` | `helper123` |
| Missionary (shelter) | `missionary` / `missionary2` | `missionary123` |
| Admin | `admin` | `admin123` |

Demo-only auth: not for real use.

## Stack

Next.js 16 · React 19 · Tailwind 4 · Supabase (Postgres + Realtime) · Leaflet/OpenStreetMap · Vercel

## Deploy

Pushing to `main` redeploys on Vercel. Set the two `NEXT_PUBLIC_SUPABASE_*` variables in Vercel → **Settings → Environment Variables**.
