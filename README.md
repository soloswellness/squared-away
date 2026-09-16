# Squared Away

A transparent job-cost calculator: contractors and homeowners get a rough price
for a job, broken into materials, labor, business costs, and profit — nothing
hidden. Built for the Carolinas home-services market (roofing, HVAC, plumbing,
remodeling), designed to expand.

The pricing logic lives in `lib/pricingEngine.js` — that file is the actual
product; everything else is plumbing around it.

## What's in the box

- **Calculator** (`/`) — pick a job and a state, get an itemized price
  (materials, labor, overhead, profit) plus a "typical market range" sanity
  check, live as you type.
- **Accounts + saved quotes** (`/quotes`) — a lightweight sign-in (name + email,
  no password — see the note in `app/api/login/route.js`) so a contractor can
  save quotes and pull up their history later.
- **Print / Save as PDF** — every quote can be printed or saved as a clean,
  branded PDF with the contractor's company name, the customer's name and job
  address, a reference number, and the date — something you can actually hand
  to a customer.

## Running it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The calculator itself
works with no database connected — pricing runs entirely in the browser.
Signing in and saving quotes need a database (below).

## The database

The Prisma schema in `prisma/schema.prisma` defines two tables: `Contractor`
(accounts) and `Quote` (every estimate generated, so real-quote data can start
improving the pricing engine over time — see the project doc's "Scale"
section).

**Schema changes push automatically on every deploy** — `package.json`'s
`vercel-build` script runs `prisma db push` before building, so there's no
manual migration step. Edit `schema.prisma`, push to GitHub, and the live
database reshapes itself on the next deploy. (This trades away migration
history for zero manual steps, which is the right tradeoff for a small,
fast-moving app — worth revisiting `prisma migrate` once the schema settles
down and there's real customer data to protect.)

To develop locally against a real database:

1. Get a free Postgres database — [Neon](https://neon.tech) or
   [Supabase](https://supabase.com), about two minutes to set up.
2. Copy `.env.example` to `.env` and paste in your connection string.
3. Run `npx prisma db push` to create the tables.

## Deploying (getting it live)

**1. Push to GitHub:**
```bash
git add -A
git commit -m "your change"
git push
```

**2. Vercel auto-deploys on every push** once the repo is imported (already
done for this project — see below if starting fresh). No manual steps.

**3. The database connection** — add a Postgres connection string as the
`DATABASE_URL` environment variable in the Vercel project (Settings →
Environment Variables), then redeploy once. After that, every push both
deploys the app *and* pushes any schema changes automatically.

### Starting fresh on a new repo

```bash
git init
git add -A
git commit -m "Squared Away MVP"
gh repo create squared-away --public --source=. --push
```
Then import it at [vercel.com/new](https://vercel.com/new) — it auto-detects
Next.js, no settings to change.

## What's here

```
app/page.js              the calculator UI (and the printable quote view)
app/quotes/page.js       saved-quote history for a signed-in contractor
app/api/login            simple sign-in / sign-out
app/api/me                who's currently signed in
app/api/quotes           save + list quotes
lib/pricingEngine.js     the actual pricing logic — materials, labor, overhead,
                         profit, and the state-by-state wage data behind it
prisma/schema.prisma     Contractor + Quote tables
app/icon.svg             favicon
app/opengraph-image.js   the preview image shown when a link is shared
```

## Where the numbers came from

Every figure in `pricingEngine.js` — the crew sizes, hours per job, state
wages, materials costs — is sourced and explained in the project outline doc
(in your Claude project, "Solidified numbers" section). When real quotes start
coming in from the field, that's what replaces these industry-guide estimates
with your own real data — the `actualTotal` field on `Quote` is there for
exactly that, once it's worth wiring up.

## Before a public launch

This is built and priced for a small, trusted testing group. Before opening it
up more broadly:

- Swap the name-and-email sign-in for real auth (magic link or NextAuth).
- Move from `prisma db push` to tracked `prisma migrate` history.
- Add rate limiting to the API routes.
- Get a real domain and update `metadataBase` in `app/layout.js` to match.
