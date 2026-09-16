import { cookies } from "next/headers";
import Link from "next/link";
import { prisma } from "@/lib/db";

function fmt(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export default async function QuotesPage() {
  const cookieStore = await cookies();
  const contractorId = cookieStore.get("contractorId")?.value;

  if (!contractorId) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16 text-center">
        <p className="text-slate-600">Sign in on the calculator page to see saved quotes.</p>
        <Link href="/" className="mt-4 inline-block text-blue-700 underline">Back to calculator</Link>
      </main>
    );
  }

  let contractor = null;
  let quotes = [];
  let dbError = false;
  try {
    contractor = await prisma.contractor.findUnique({ where: { id: contractorId } });
    quotes = await prisma.quote.findMany({
      where: { contractorId },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("QuotesPage failed to load:", err);
    dbError = true;
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <header className="mb-6 flex items-center gap-3 border-b-4 border-slate-900 pb-4">
        <svg viewBox="0 0 64 64" className="h-9 w-9 shrink-0" aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="12" fill="#1d4ed8" />
          <path d="M18 33 L27 42 L46 21" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-slate-900">Saved Quotes</h1>
          <p className="text-sm text-slate-500">
            {contractor?.name}{contractor?.company ? ` · ${contractor.company}` : ""}
          </p>
        </div>
      </header>

      {dbError && (
        <p className="mb-6 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Couldn&rsquo;t reach the database. If this is a fresh deploy, make sure <code>DATABASE_URL</code> is set in Vercel.
        </p>
      )}

      {!dbError && quotes.length === 0 && (
        <p className="text-slate-500">No quotes saved yet — generate one on the calculator and save it.</p>
      )}

      <div className="space-y-3">
        {quotes.map((q) => (
          <div key={q.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="font-semibold text-slate-800">{q.jobType}</span>
                <span className="text-slate-400"> · {q.state}</span>
                {q.customerName && <span className="text-slate-500"> · for {q.customerName}</span>}
              </div>
              <span className="font-mono text-lg text-blue-900">{fmt(q.total)}</span>
            </div>
            {q.jobAddress && <div className="mt-0.5 text-xs text-slate-400">{q.jobAddress}</div>}

            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 border-t border-dashed border-slate-200 pt-3 text-xs text-slate-500 sm:grid-cols-4">
              <div>Materials <span className="block font-mono text-slate-700">{fmt(q.materials)}</span></div>
              <div>Labor <span className="block font-mono text-slate-700">{fmt(q.labor)}</span></div>
              <div>Overhead <span className="block font-mono text-slate-700">{fmt(q.overhead)}</span></div>
              <div>Profit <span className="block font-mono text-slate-700">{fmt(q.profit)}</span></div>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span>{new Date(q.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
              <span className="font-mono">Ref #{q.id.slice(-8).toUpperCase()}</span>
            </div>
          </div>
        ))}
      </div>

      <Link href="/" className="mt-6 inline-block text-sm text-blue-700 underline">Back to calculator</Link>
    </main>
  );
}
