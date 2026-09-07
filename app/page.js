"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { JOBS, STATE_ORDER, STATE_NAMES, ROOFER_ESTIMATED, estimate } from "@/lib/pricingEngine";

function defaultValues(job) {
  const values = {};
  job.fields.forEach((f) => { values[f.id] = f.default; });
  return values;
}

function fmt(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export default function Home() {
  const [jobId, setJobId] = useState("roof");
  const [region, setRegion] = useState("SC");
  const [values, setValues] = useState(() => defaultValues(JOBS.roof));

  const [contractor, setContractor] = useState(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [signInFields, setSignInFields] = useState({ name: "", email: "", company: "" });
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => setContractor(d.contractor)).catch(() => {});
  }, []);

  async function handleSignIn(e) {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...signInFields, state: region }),
    });
    if (res.ok) {
      const data = await res.json();
      setContractor(data.contractor);
      setSignInOpen(false);
    }
  }

  async function handleSignOut() {
    await fetch("/api/login", { method: "DELETE" });
    setContractor(null);
  }

  async function handleSaveQuote() {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobType: result.jobName, state: result.stateName, inputs: values,
          materials: result.materials, labor: result.labor,
          overhead: result.overhead, profit: result.profit, total: result.total,
        }),
      });
      setSaveStatus(res.ok ? "saved" : "error");
    } catch {
      setSaveStatus("error");
    }
  }

  const job = JOBS[jobId];

  function handleJobChange(nextJobId) {
    setJobId(nextJobId);
    setValues(defaultValues(JOBS[nextJobId]));
  }

  function handleFieldChange(fieldId, raw, type) {
    setValues((v) => ({ ...v, [fieldId]: type === "number" ? Number(raw) : raw }));
  }

  const result = useMemo(() => estimate(jobId, region, values), [jobId, region, values]);

  const pillClass =
    result.comparison === "above" ? "bg-rose-50 text-rose-700"
    : result.comparison === "below" ? "bg-rose-50 text-rose-700"
    : "bg-emerald-50 text-emerald-700";
  const pillLabel =
    result.comparison === "above" ? "Above typical range"
    : result.comparison === "below" ? "Below typical range — double check"
    : "Within typical range";

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-4 border-slate-900 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight text-slate-900">
            Squared Away
          </h1>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            A rough price, with every number shown — so nobody has to just take someone&rsquo;s word for it.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {contractor ? (
            <div className="flex items-center gap-3 text-sm">
              <Link href="/quotes" className="text-blue-700 underline">My quotes</Link>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600">{contractor.name}</span>
              <button onClick={handleSignOut} className="text-slate-400 underline">Sign out</button>
            </div>
          ) : (
            <button
              onClick={() => setSignInOpen((v) => !v)}
              className="rounded-md border border-blue-700 px-3 py-1.5 text-sm font-semibold text-blue-700"
            >
              Sign in to save quotes
            </button>
          )}
          <span className="rotate-[-2deg] rounded border border-blue-700 px-2.5 py-1 text-xs font-mono uppercase tracking-wide text-blue-700">
            MVP build
          </span>
        </div>
      </header>

      {signInOpen && !contractor && (
        <form onSubmit={handleSignIn} className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-4">
          <input required placeholder="Name" className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm sm:col-span-1"
            value={signInFields.name} onChange={(e) => setSignInFields((f) => ({ ...f, name: e.target.value }))} />
          <input required type="email" placeholder="Email" className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm sm:col-span-1"
            value={signInFields.email} onChange={(e) => setSignInFields((f) => ({ ...f, email: e.target.value }))} />
          <input placeholder="Company (optional)" className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm sm:col-span-1"
            value={signInFields.company} onChange={(e) => setSignInFields((f) => ({ ...f, company: e.target.value }))} />
          <button type="submit" className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white sm:col-span-1">
            Sign in
          </button>
        </form>
      )}

      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        <section className="h-fit rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-blue-800">The Job</h2>

          <label className="mb-1 block text-xs font-semibold text-slate-500">What&rsquo;s the job?</label>
          <select
            className="mb-4 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
            value={jobId}
            onChange={(e) => handleJobChange(e.target.value)}
          >
            {Object.entries(JOBS).map(([id, j]) => (
              <option key={id} value={id}>{j.name}</option>
            ))}
          </select>

          <label className="mb-1 block text-xs font-semibold text-slate-500">Where&rsquo;s the job?</label>
          <select
            className="mb-1 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            {STATE_ORDER.map((code) => (
              <option key={code} value={code}>{STATE_NAMES[code]}</option>
            ))}
          </select>
          {jobId === "roof" && ROOFER_ESTIMATED[region] && (
            <p className="mb-4 text-xs leading-snug text-slate-400">
              Roofer wage for this state is estimated (no direct published figure) — see the project doc.
            </p>
          )}

          {job.fields.map((f) => (
            <div key={f.id} className="mb-4">
              <label className="mb-1 block text-xs font-semibold text-slate-500">{f.label}</label>
              {f.type === "select" ? (
                <select
                  className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                  value={values[f.id]}
                  onChange={(e) => handleFieldChange(f.id, e.target.value, f.type)}
                >
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                  value={values[f.id]}
                  min={f.min} max={f.max} step={f.step}
                  onChange={(e) => handleFieldChange(f.id, e.target.value, f.type)}
                />
              )}
            </div>
          ))}

          <p className="text-xs leading-relaxed text-slate-400">{job.hint}</p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-blue-800">The Price, Broken Down</h2>
          <p className="mb-4 text-sm text-slate-500">{result.jobName} · {result.stateName}</p>

          <Line label="Materials" why="What the parts and supplies actually cost" amount={result.materials} />
          <Line label="Labor" why="The crew's time, at local rates" amount={result.labor} />
          <Line label="Business costs (12%)" why="Truck, tools, insurance — the real cost of showing up" amount={result.overhead} />
          <Line label="Fair profit (15%)" why="What keeps a good contractor in business" amount={result.profit} />

          <div className="mt-3 flex items-baseline justify-between border-t-2 border-slate-900 pt-4">
            <span className="font-extrabold uppercase tracking-wide text-slate-900">Total estimate</span>
            <span className="font-mono text-3xl font-semibold text-blue-900">{fmt(result.total)}</span>
          </div>

          <div className="mt-5">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${pillClass}`}>
              {pillLabel}
            </span>
            <div className="mt-2 flex justify-between font-mono text-xs text-slate-400">
              <span>{fmt(result.marketRange.low)}</span>
              <span>typical range for this job in your area</span>
              <span>{fmt(result.marketRange.high)}</span>
            </div>
          </div>

          <p className="mb-4 border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500">
            <strong className="text-slate-700">How this number is built:</strong> Price = materials + labor + business costs + profit.
            Materials are priced close to a national rate. Labor is priced off real, state-specific trade wages for {result.stateName}.
            This is a rough estimate to start a conversation, not a final quote.
          </p>

          {contractor ? (
            <button
              onClick={handleSaveQuote}
              disabled={saveStatus === "saving"}
              className="w-full rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saveStatus === "saved" ? "Saved ✓" : saveStatus === "saving" ? "Saving…" : "Save this estimate"}
            </button>
          ) : (
            <p className="text-center text-xs text-slate-400">Sign in above to save this estimate to your quote history.</p>
          )}
        </section>
      </div>

      <footer className="mt-8 text-center text-xs text-slate-400">
        Baseline costs from 2026 industry cost guides · regional wage data from BLS/OEWS 2025 · see the project doc for full sources.
      </footer>
    </main>
  );
}

function Line({ label, why, amount }) {
  return (
    <div className="flex items-baseline justify-between border-b border-dashed border-slate-200 py-3">
      <div>
        <div className="text-sm text-slate-800">{label}</div>
        <div className="text-xs text-slate-400">{why}</div>
      </div>
      <div className="font-mono text-sm text-slate-800">{fmt(amount)}</div>
    </div>
  );
}
