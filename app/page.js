"use client";

import { useEffect, useState } from "react";
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

function clamp(n, min, max) {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export default function Home() {
  const [jobId, setJobId] = useState("roof");
  const [region, setRegion] = useState("SC");
  const [values, setValues] = useState(() => defaultValues(JOBS.roof));
  const [customerName, setCustomerName] = useState("");
  const [jobAddress, setJobAddress] = useState("");

  const [contractor, setContractor] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [signInOpen, setSignInOpen] = useState(false);
  const [signInFields, setSignInFields] = useState({ name: "", email: "", company: "" });
  const [signInError, setSignInError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [savedQuote, setSavedQuote] = useState(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setContractor(d.contractor))
      .catch(() => {})
      .finally(() => setCheckingSession(false));
  }, []);

  async function handleSignIn(e) {
    e.preventDefault();
    setSignInError("");
    setSigningIn(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...signInFields, state: region }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setContractor(data.contractor);
        setSignInOpen(false);
      } else {
        setSignInError(data.error || "Couldn't sign in — check your details and try again.");
      }
    } catch {
      setSignInError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSigningIn(false);
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
          customerName: customerName || null, jobAddress: jobAddress || null,
          materials: result.materials, labor: result.labor,
          overhead: result.overhead, profit: result.profit, total: result.total,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSaveStatus("saved");
        setSavedQuote(data.quote);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  }

  function handlePrint() {
    window.print();
  }

  const job = JOBS[jobId];

  function handleJobChange(nextJobId) {
    setJobId(nextJobId);
    setValues(defaultValues(JOBS[nextJobId]));
    setSaveStatus("idle");
    setSavedQuote(null);
  }

  function handleFieldChange(fieldId, raw, type) {
    setValues((v) => ({ ...v, [fieldId]: type === "number" ? Number(raw) : raw }));
    setSaveStatus("idle");
    setSavedQuote(null);
  }

  function handleFieldBlur(field) {
    if (field.type !== "number") return;
    setValues((v) => ({ ...v, [field.id]: clamp(Number(v[field.id]) || field.default, field.min, field.max) }));
  }

  function handleNewQuote() {
    setValues(defaultValues(JOBS[jobId]));
    setCustomerName("");
    setJobAddress("");
    setSaveStatus("idle");
    setSavedQuote(null);
  }

  const result = estimate(jobId, region, values);

  const pillClass =
    result.comparison === "above" ? "bg-rose-50 text-rose-700"
    : result.comparison === "below" ? "bg-rose-50 text-rose-700"
    : "bg-emerald-50 text-emerald-700";
  const pillLabel =
    result.comparison === "above" ? "Above typical range"
    : result.comparison === "below" ? "Below typical range — double check"
    : "Within typical range";

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const reference = savedQuote ? savedQuote.id.slice(-8).toUpperCase() : null;

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 print:max-w-none print:p-0">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-4 border-slate-900 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 64 64" className="h-9 w-9 shrink-0" aria-hidden="true">
            <rect x="4" y="4" width="56" height="56" rx="12" fill="#1d4ed8" />
            <path d="M18 33 L27 42 L46 21" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tight text-slate-900">
              Squared Away
            </h1>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              A rough price, with every number shown — so nobody has to just take someone&rsquo;s word for it.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {checkingSession ? null : contractor ? (
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
            Beta
          </span>
        </div>
      </header>

      {signInOpen && !contractor && (
        <form onSubmit={handleSignIn} className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm print:hidden">
          <div className="grid gap-3 sm:grid-cols-4">
            <input required placeholder="Name" className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm sm:col-span-1"
              value={signInFields.name} onChange={(e) => setSignInFields((f) => ({ ...f, name: e.target.value }))} />
            <input required type="email" placeholder="Email" className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm sm:col-span-1"
              value={signInFields.email} onChange={(e) => setSignInFields((f) => ({ ...f, email: e.target.value }))} />
            <input placeholder="Company (optional)" className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm sm:col-span-1"
              value={signInFields.company} onChange={(e) => setSignInFields((f) => ({ ...f, company: e.target.value }))} />
            <button type="submit" disabled={signingIn} className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-1">
              {signingIn ? "Signing in…" : "Sign in"}
            </button>
          </div>
          {signInError && <p className="mt-3 text-sm text-rose-600">{signInError}</p>}
        </form>
      )}

      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        <section className="h-fit rounded-lg border border-slate-200 bg-white p-6 shadow-sm print:hidden">
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
                  onBlur={() => handleFieldBlur(f)}
                />
              )}
            </div>
          ))}

          <p className="mb-5 text-xs leading-relaxed text-slate-400">{job.hint}</p>

          <div className="border-t border-slate-200 pt-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">For the printed quote (optional)</h3>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Customer name</label>
            <input
              className="mb-3 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
              placeholder="Jane Homeowner"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <label className="mb-1 block text-xs font-semibold text-slate-500">Job address</label>
            <input
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
              placeholder="123 Main St, Spartanburg, SC"
              value={jobAddress}
              onChange={(e) => setJobAddress(e.target.value)}
            />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-7 shadow-sm print:border-0 print:p-0 print:shadow-none">
          <div className="hidden print:mb-6 print:flex print:items-center print:gap-3 print:border-b-4 print:border-slate-900 print:pb-4">
            <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
              <rect x="4" y="4" width="56" height="56" rx="12" fill="#1d4ed8" />
              <path d="M18 33 L27 42 L46 21" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <div className="text-xl font-extrabold uppercase tracking-tight">
                {contractor?.company || contractor?.name || "Squared Away"}
              </div>
              <div className="text-xs text-slate-500">
                {contractor?.name}{contractor?.email ? ` · ${contractor.email}` : ""}
              </div>
            </div>
          </div>

          <div className="hidden print:mb-5 print:grid print:grid-cols-2 print:gap-4 print:text-sm">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Prepared for</div>
              <div>{customerName || "—"}</div>
              {jobAddress && <div className="text-slate-500">{jobAddress}</div>}
            </div>
            <div className="text-right">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Date</div>
              <div>{today}</div>
              {reference && <div className="mt-1 font-mono text-xs text-slate-400">Ref #{reference}</div>}
            </div>
          </div>

          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-blue-800 print:text-base">The Price, Broken Down</h2>
          <p className="mb-4 text-sm text-slate-500">{result.jobName} · {result.stateName}</p>

          <Line label="Materials" why="What the parts and supplies actually cost" amount={result.materials} />
          <Line label="Labor" why="The crew's time, at local rates" amount={result.labor} />
          <Line label="Business costs (12%)" why="Truck, tools, insurance — the real cost of showing up" amount={result.overhead} />
          <Line label="Fair profit (15%)" why="What keeps a good contractor in business" amount={result.profit} />

          <div className="mt-3 flex items-baseline justify-between border-t-2 border-slate-900 pt-4">
            <span className="font-extrabold uppercase tracking-wide text-slate-900">Total estimate</span>
            <span className="font-mono text-3xl font-semibold text-blue-900">{fmt(result.total)}</span>
          </div>

          <div className="mt-5 print:hidden">
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

          <div className="print:hidden">
            {contractor ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveQuote}
                  disabled={saveStatus === "saving"}
                  className="flex-1 rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saveStatus === "saved" ? "Saved ✓" : saveStatus === "saving" ? "Saving…" : "Save this estimate"}
                </button>
                <button
                  onClick={handlePrint}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  Print / Save PDF
                </button>
                <button
                  onClick={handleNewQuote}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  New quote
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-400">Sign in above to save this estimate to your quote history.</p>
                <button
                  onClick={handlePrint}
                  className="shrink-0 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  Print / Save PDF
                </button>
              </div>
            )}
            {saveStatus === "error" && (
              <p className="mt-2 text-sm text-rose-600">Couldn&rsquo;t save that quote — check your connection and try again.</p>
            )}
            {saveStatus === "saved" && reference && (
              <p className="mt-2 text-xs text-slate-400">Saved · reference #{reference}</p>
            )}
          </div>

          <p className="hidden text-center text-[10px] text-slate-400 print:mt-8 print:block">
            Prepared with Squared Away · squared-away.app · This is an estimate, not a final invoice.
          </p>
        </section>
      </div>

      <footer className="mt-8 text-center text-xs text-slate-400 print:hidden">
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
        <div className="text-xs text-slate-400 print:hidden">{why}</div>
      </div>
      <div className="font-mono text-sm text-slate-800">{fmt(amount)}</div>
    </div>
  );
}
