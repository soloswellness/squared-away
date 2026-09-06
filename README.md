# Open Book Estimate

A transparent job-cost calculator: contractors and homeowners get a rough price
for a job, broken into materials, labor, business costs, and profit — nothing
hidden. Built for the Carolinas home-services market (roofing, HVAC, plumbing,
remodeling), designed to expand.

This is the working MVP scaffold. The pricing logic itself lives in
`lib/pricingEngine.js` — that file is the actual product; everything else is
plumbing around it.

## Running it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). That's it — the
calculator works with no database connected, since the pricing engine runs
entirely in the browser.

## Adding the database (accounts + saved quotes)

The Prisma schema in `prisma/schema.prisma` defines two tables: `Contractor`
(accounts) and `Quote` (every estimate generated, so real-quote data can
start improving the pricing engine over time — see the project doc's "Scale"
section).

1. Get a free Postgres database — [Supabase](https://supabase.com) or
   [Neon](https://neon.tech) both work well and take about two minutes to set up.
2. Copy `.env.example` to `.env` and paste in your connection string.
3. Run:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```
4. Wire up accounts (`Contractor`) and saving a quote (`Quote`) wherever you're
   ready — the schema's there, the UI isn't yet. That's the next real step.

## Deploying (getting it live)

This has to happen from your own machine or accounts — the environment this
was built in can't reach GitHub or Vercel's servers to do it for you.
Five minutes, no coding required:

**1. Push it to GitHub** (from this unzipped folder):
```bash
git init
git add -A
git commit -m "Open Book Estimate MVP"
gh repo create open-book-estimate --public --source=. --push
```
(No `gh` installed? Create an empty repo at github.com/new instead, then
`git remote add origin <the URL it gives you>` and `git push -u origin main`.)

**2. Import it on Vercel** — go to [vercel.com/new](https://vercel.com/new),
sign in with the GitHub account you just pushed to, click "Import" on the
repo. It auto-detects Next.js — no settings to change. Click Deploy.

**3. Add the database** once you're ready for accounts to work — get a free
connection string from [Supabase](https://supabase.com) or
[Neon](https://neon.tech), paste it into the Vercel project's Environment
Variables as `DATABASE_URL`, and redeploy. Every push to GitHub after that
auto-deploys — no more manual steps, ever.

Bring this back to me any time and I'll keep building on the pushed repo.

## What's here

```
app/page.js            the calculator UI
lib/pricingEngine.js    the actual pricing logic — materials, labor, overhead,
                        profit, and the state-by-state wage data behind it
prisma/schema.prisma    Contractor + Quote tables, ready for a real database
```

## Where the numbers came from

Every figure in `pricingEngine.js` — the crew sizes, hours per job, state
wages, materials costs — is sourced and explained in the project outline doc
(in your Claude project, "Solidified numbers" section). When your brother's
real quotes start coming in, that's what replaces these industry-guide
estimates with your own real data.
