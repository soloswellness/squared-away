import { cookies } from "next/headers";
import Link from "next/link";
import { prisma } from "@/lib/db";

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

  const contractor = await prisma.contractor.findUnique({ where: { id: contractorId } });
  const quotes = await prisma.quote.findMany({
    where: { contractorId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="mb-1 text-2xl font-extrabold uppercase text-slate-900">Saved Quotes</h1>
      <p className="mb-6 text-sm text-slate-500">{contractor?.name}{contractor?.company ? ` · ${contractor.company}` : ""}</p>

      {quotes.length === 0 ? (
        <p className="text-slate-500">No quotes saved yet — generate one on the calculator and save it.</p>
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <div key={q.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-slate-800">{q.jobType} · {q.state}</span>
                <span className="font-mono text-lg text-blue-900">${Math.round(q.total).toLocaleString()}</span>
              </div>
              <div className="mt-1 text-xs text-slate-400">{new Date(q.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}

      <Link href="/" className="mt-6 inline-block text-sm text-blue-700 underline">Back to calculator</Link>
    </main>
  );
}
