"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Step = {
  id: string;
  label: string;
  description: string;
  status: "ready" | "attention" | "blocked" | "draft";
  source: string;
  metric: string;
  metricValue: number | string;
  nextAction: string;
  href: string;
};

type OperationsResponse = {
  source: string;
  sourceStatus?: "degraded" | "blocked" | "live";
  warning?: string;
  generatedAt: string;
  summary: {
    totalSteps: number;
    ready: number;
    attention: number;
    blocked: number;
    draft: number;
    stockAlerts: number;
    openPo: number;
    qcPending: number;
    productionRows: number;
    salesRows: number;
    customerRows: number;
  };
  steps: Step[];
  recentActivity: Record<string, string[][]>;
  weeklyCadence: Array<{
    id: string;
    agenda: string;
    owner: string;
    cadence: string;
    prepSource: string;
    output: string;
    href: string;
  }>;
  guardrails: string[];
};

const statusClass: Record<string, string> = {
  ready: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/20",
  attention: "bg-amber-500/15 text-amber-200 ring-amber-400/20",
  blocked: "bg-red-500/15 text-red-200 ring-red-400/20",
  draft: "bg-slate-500/15 text-slate-200 ring-slate-400/20",
};

const statusLabel: Record<string, string> = {
  ready: "Ready",
  attention: "Perlu perhatian",
  blocked: "Blocked",
  draft: "Draft / belum ada data",
};

function Metric({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <div className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
      <p className="text-xs uppercase tracking-[0.25em] text-[#6b9e8f]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/45">{hint}</p>
    </div>
  );
}

export default function OperationsPage() {
  const [data, setData] = useState<OperationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [handoff, setHandoff] = useState<any>(null);

  async function loadOperations() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/operations", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal load operations");
      setData(json);
    } catch (error) {
      setMessage(`❌ ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOperations();
  }, []);

  async function prepareHandoff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setHandoff(null);
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "prepare_handoff", stepId: form.get("stepId"), reference: form.get("reference") }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal prepare handoff");
      setHandoff(json);
      setMessage("✅ Handoff disiapkan. Belum ada write otomatis dari Operations v1.");
    } catch (error) {
      setMessage(`❌ ${String(error)}`);
    }
  }

  const summary = data?.summary;

  return (
    <main className="min-h-screen bg-[#080c0a] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[2rem] bg-gradient-to-br from-[#0D9488]/30 via-white/[0.05] to-[#F97316]/20 p-8 shadow-xl ring-1 ring-white/10">
          <p className="text-sm uppercase tracking-[0.35em] text-[#6b9e8f]">End-to-End Operational Workflow</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold">Operations Command Center</h1>
              <p className="mt-3 max-w-3xl text-white/65">
                Satu alur bahan → PO → receive/QC → inventory → produksi → compliance → jual → CRM → report,
                membaca Google Sheets sebagai source of truth dan memberi handoff ke modul operasional yang sudah ada.
              </p>
            </div>
            <button onClick={loadOperations} className="rounded-full bg-[#0D9488] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0f766e]">
              Refresh Sheets
            </button>
          </div>
        </header>

        {data?.sourceStatus === "degraded" && (
          <section className="rounded-3xl border border-amber-400/30 bg-amber-500/10 p-5 text-amber-100">
            <div className="font-semibold">⚠️ Google Workspace degraded</div>
            <p className="mt-1 text-sm">{data.warning}</p>
          </section>
        )}

        {message && <section className="rounded-3xl bg-white/[0.05] p-4 text-sm ring-1 ring-white/10">{message}</section>}

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Metric label="Workflow steps" value={loading ? "..." : summary?.totalSteps || 0} hint="PO sampai report" />
          <Metric label="Ready" value={loading ? "..." : summary?.ready || 0} hint="Tahap aman dilanjutkan" />
          <Metric label="Perlu perhatian" value={loading ? "..." : summary?.attention || 0} hint="Stock/QC/PO/CRM perlu follow-up" />
          <Metric label="QC pending" value={loading ? "..." : summary?.qcPending || 0} hint="Receiving, produksi, checklist" />
        </section>

        <section className="grid gap-4 lg:grid-cols-7">
          <div className="space-y-4 lg:col-span-4">
            {(data?.steps || []).map((step, index) => (
              <div key={step.id} className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0D9488]/20 text-sm font-bold text-[#9ee7dc]">{index + 1}</span>
                      <h2 className="text-xl font-semibold">{step.label}</h2>
                    </div>
                    <p className="mt-3 text-sm text-white/60">{step.description}</p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClass[step.status]}`}>{statusLabel[step.status]}</span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-black/20 p-3">
                    <p className="text-xs text-white/40">Source</p>
                    <p className="mt-1 text-sm">{step.source}</p>
                  </div>
                  <div className="rounded-2xl bg-black/20 p-3">
                    <p className="text-xs text-white/40">{step.metric}</p>
                    <p className="mt-1 text-lg font-semibold">{step.metricValue}</p>
                  </div>
                  <Link href={step.href} className="rounded-2xl bg-[#F97316]/15 p-3 text-sm font-semibold text-orange-100 hover:bg-[#F97316]/25">
                    Buka modul →<br /><span className="text-xs font-normal text-orange-100/60">{step.href}</span>
                  </Link>
                </div>
                <p className="mt-4 text-sm text-[#b8d8cf]">Next action: {step.nextAction}</p>
              </div>
            ))}
          </div>

          <aside className="space-y-4 lg:col-span-3">
            <section className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
              <h2 className="text-xl font-semibold">Prepare handoff</h2>
              <p className="mt-2 text-sm text-white/55">Validasi awal sebelum operator menulis ke modul tujuan. Endpoint ini tidak melakukan write otomatis.</p>
              <form onSubmit={prepareHandoff} className="mt-4 space-y-3">
                <label className="block text-sm text-white/60">
                  Step
                  <select name="stepId" className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0f1713] px-3 py-3 text-white">
                    {(data?.steps || []).map((step) => <option key={step.id} value={step.id}>{step.label}</option>)}
                  </select>
                </label>
                <label className="block text-sm text-white/60">
                  Reference / bukti
                  <input name="reference" placeholder="PO-..., batch, invoice, Drive URL" className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0f1713] px-3 py-3 text-white placeholder:text-white/30" />
                </label>
                <button className="w-full rounded-2xl bg-[#0D9488] px-4 py-3 font-semibold hover:bg-[#0f766e]">Prepare Handoff</button>
              </form>
              {handoff && (
                <div className="mt-4 rounded-2xl bg-black/25 p-4 text-sm">
                  <div className="font-semibold">{handoff.step?.label}</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-white/65">
                    {handoff.checklist?.map((item: string) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              )}
            </section>

            <section className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
              <h2 className="text-xl font-semibold">Guardrails</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/65">
                {(data?.guardrails || []).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>

            <section className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
              <h2 className="text-xl font-semibold">Weekly cadence & reporting</h2>
              <p className="mt-2 text-sm text-white/55">Ritme rapat lintas divisi agar data operasional masuk ke laporan mingguan tanpa write otomatis dari halaman Operations.</p>
              <div className="mt-4 space-y-3">
                {(data?.weeklyCadence || []).map((item) => (
                  <div key={item.id} className="rounded-2xl bg-black/20 p-4 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">{item.agenda}</div>
                        <div className="mt-1 text-xs text-[#9ee7dc]">Owner: {item.owner}</div>
                      </div>
                      <Link href={item.href} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 hover:bg-white/20">Buka</Link>
                    </div>
                    <p className="mt-3 text-white/60">{item.cadence}</p>
                    <p className="mt-2 text-xs text-white/40">Prep: {item.prepSource}</p>
                    <p className="mt-1 text-xs text-white/50">Output: {item.output}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
              <h2 className="text-xl font-semibold">Recent activity</h2>
              <div className="mt-3 space-y-3 text-xs text-white/55">
                {Object.entries(data?.recentActivity || {}).map(([key, rows]) => (
                  <div key={key} className="rounded-2xl bg-black/20 p-3">
                    <div className="font-semibold text-white/80">{key}</div>
                    <div>{rows.length ? `${rows.length} row terakhir terbaca` : "Belum ada row / degraded"}</div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>

        <footer className="text-xs text-white/35">
          Source: {data?.source || "Google Sheets"} • Generated: {data?.generatedAt || "TBA"}
        </footer>
      </div>
    </main>
  );
}
