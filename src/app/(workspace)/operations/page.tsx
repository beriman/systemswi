"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

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
  crossDivisionKpis: Array<{
    id: string;
    division: string;
    owner: string;
    health: "ready" | "attention" | "blocked" | "draft";
    primaryMetric: string;
    primaryValue: number | string;
    secondaryMetric: string;
    secondaryValue: number | string;
    source: string;
    nextAction: string;
    href: string;
  }>;
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

type ExecuteResult = {
  success: boolean;
  detail: string;
  sheetWrites: string[];
};

type ExecuteResponse = {
  source: string;
  sourceStatus: "live" | "degraded";
  warning?: string;
  action: "execute_step";
  step: Step;
  result: ExecuteResult;
  actionLog: {
    id: string;
    timestamp: string;
    status: "executed" | "failed";
    detail: string;
  };
  note: string;
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

const stepFields: Record<string, Array<{ name: string; label: string; type?: string; placeholder?: string; required?: boolean }>> = {
  po: [
    { name: "supplier", label: "Supplier", placeholder: "Nama supplier", required: true },
    { name: "item", label: "Item", placeholder: "Nama item / SKU", required: true },
    { name: "qty", label: "Qty", type: "number", placeholder: "0", required: true },
    { name: "unitPrice", label: "Harga satuan (Rp)", type: "number", placeholder: "0", required: true },
    { name: "dueDate", label: "Due date", type: "date" },
    { name: "notes", label: "Notes", placeholder: "Catatan tambahan" },
  ],
  receive: [
    { name: "poNumber", label: "PO Reference", placeholder: "PO-xxx" },
    { name: "item", label: "Item", placeholder: "Nama item", required: true },
    { name: "qtyReceived", label: "Qty diterima", type: "number", placeholder: "0", required: true },
    { name: "qcStatus", label: "QC status", placeholder: "Pending / Pass / Failed" },
    { name: "qcNotes", label: "QC notes", placeholder: "Catatan QC" },
    { name: "warehouse", label: "Warehouse", placeholder: "Lokasi gudang" },
  ],
  inventory: [
    { name: "item", label: "Item", placeholder: "Nama item / SKU", required: true },
    { name: "movementType", label: "Tipe", placeholder: "In / Out / Adjustment" },
    { name: "qty", label: "Qty", type: "number", placeholder: "0", required: true },
    { name: "warehouse", label: "Warehouse", placeholder: "Lokasi" },
    { name: "notes", label: "Notes", placeholder: "Catatan movement" },
  ],
  produce: [
    { name: "product", label: "Produk", placeholder: "Nama produk", required: true },
    { name: "brand", label: "Brand", placeholder: "L'Arc~en~Scent / Pixel Potion / Nuscentza" },
    { name: "batchSize", label: "Batch size", type: "number", placeholder: "0", required: true },
    { name: "formula", label: "Formula", placeholder: "Kode formula" },
    { name: "hpp", label: "HPP total (Rp)", type: "number", placeholder: "0" },
  ],
  compliance: [
    { name: "product", label: "Produk", placeholder: "Nama produk", required: true },
    { name: "checkType", label: "Check type", placeholder: "Formula Check / Allergen / Label / BPOM" },
    { name: "result", label: "Result", placeholder: "Review / Pass / Fail" },
    { name: "notes", label: "Notes", placeholder: "Catatan compliance" },
    { name: "batchNumber", label: "Batch number", placeholder: "BATCH-xxx" },
    { name: "stage", label: "Stage", placeholder: "Intake / Production / Final" },
    { name: "qcResult", label: "QC result", placeholder: "Pass / Fail / Pending" },
  ],
  sell: [
    { name: "product", label: "Produk", placeholder: "Nama produk", required: true },
    { name: "brand", label: "Brand", placeholder: "L'Arc~en~Scent / Pixel Potion / Nuscentza" },
    { name: "qty", label: "Qty", type: "number", placeholder: "0", required: true },
    { name: "unitPrice", label: "Harga satuan (Rp)", type: "number", placeholder: "0", required: true },
    { name: "channel", label: "Channel", placeholder: "Store / Online / Event" },
    { name: "customerName", label: "Customer name", placeholder: "Nama pembeli (opsional)" },
    { name: "customerPhone", label: "Phone", placeholder: "+62..." },
    { name: "customerEmail", label: "Email", placeholder: "email@..." },
    { name: "consent", label: "Consent", placeholder: "Yes / No" },
  ],
  report: [],
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
  const [executeStepId, setExecuteStepId] = useState<string>("po");
  const [executing, setExecuting] = useState(false);
  const [executeResult, setExecuteResult] = useState<ExecuteResponse | null>(null);

  const loadOperations = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadOperations();
  }, [loadOperations]);

  async function prepareHandoff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setHandoff(null);
    setExecuteResult(null);
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
      setMessage("✅ Handoff disiapkan. Eksekusi write via Execute Step.");
    } catch (error) {
      setMessage(`❌ ${String(error)}`);
    }
  }

  async function executeStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setHandoff(null);
    setExecuteResult(null);
    setExecuting(true);
    const form = new FormData(event.currentTarget);
    const payload: Record<string, string> = {};
    for (const [key, value] of form.entries()) {
      if (key !== "executeStepId" && key !== "executeReference") {
        payload[key] = String(value);
      }
    }
    try {
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute_step",
          stepId: form.get("executeStepId"),
          reference: form.get("executeReference"),
          payload,
        }),
      });
      const json: ExecuteResponse = await res.json();
      if (!res.ok && res.status !== 422) throw new Error(json.warning || "Gagal execute step");
      setExecuteResult(json);
      if (json.result.success) {
        setMessage(`✅ ${json.result.detail}`);
        loadOperations();
      } else {
        setMessage(`❌ ${json.result.detail}`);
      }
    } catch (error) {
      setMessage(`❌ ${String(error)}`);
    } finally {
      setExecuting(false);
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
                Satu alur bahan → PO → receive/QC → inventory → produksi → compliance → jual → CRM → report.
                Execute step langsung menulis ke Google Sheets sebagai source of truth.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/reports" className="rounded-full bg-white/10 px-4 py-2.5 text-sm text-white/80 hover:bg-white/20">Lihat Reports →</Link>
              <button onClick={loadOperations} className="rounded-full bg-[#0D9488] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0f766e]">
                Refresh Sheets
              </button>
            </div>
          </div>
        </header>

        {data?.sourceStatus === "degraded" && (
          <section className="rounded-3xl border border-amber-400/30 bg-amber-500/10 p-5 text-amber-100">
            <div className="font-semibold">⚠️ Google Workspace degraded</div>
            <p className="mt-1 text-sm">{data.warning}</p>
            <p className="mt-1 text-sm text-amber-200/70">Data yang ditampilkan mungkin kosong. Re-auth diperlukan untuk execute step.</p>
          </section>
        )}

        {message && <section className="rounded-3xl bg-white/[0.05] p-4 text-sm ring-1 ring-white/10">{message}</section>}

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Metric label="Workflow steps" value={loading ? "..." : summary?.totalSteps || 0} hint="PO sampai report" />
          <Metric label="Ready" value={loading ? "..." : summary?.ready || 0} hint="Tahap aman dilanjutkan" />
          <Metric label="Perlu perhatian" value={loading ? "..." : summary?.attention || 0} hint="Stock/QC/PO/CRM perlu follow-up" />
          <Metric label="QC pending" value={loading ? "..." : summary?.qcPending || 0} hint="Receiving, produksi, checklist" />
        </section>

        <section className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#6b9e8f]">Cross-division KPI tracking</p>
              <h2 className="mt-2 text-2xl font-semibold">KPI lintas divisi untuk rapat mingguan</h2>
              <p className="mt-1 text-sm text-white/55">Ringkasan konservatif dari Sheets agar Finance, Event, Ops, Production, dan CRM melihat bottleneck dari satu tempat.</p>
            </div>
            <Link href="/reports" className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/20">Generate report →</Link>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-5">
            {(data?.crossDivisionKpis || []).map((kpi) => (
              <div key={kpi.id} className="rounded-2xl bg-black/20 p-4 ring-1 ring-white/5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-white">{kpi.division}</h3>
                    <p className="mt-1 text-xs text-[#9ee7dc]">{kpi.owner}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ring-1 ${statusClass[kpi.health]}`}>{statusLabel[kpi.health]}</span>
                </div>
                <div className="mt-4 rounded-xl bg-white/[0.04] p-3">
                  <p className="text-xs text-white/40">{kpi.primaryMetric}</p>
                  <p className="mt-1 text-lg font-semibold text-white">{kpi.primaryValue}</p>
                </div>
                <p className="mt-3 text-xs text-white/45">{kpi.secondaryMetric}: {kpi.secondaryValue}</p>
                <p className="mt-2 text-xs text-white/35">Source: {kpi.source}</p>
                <p className="mt-3 text-sm text-white/60">{kpi.nextAction}</p>
                <Link href={kpi.href} className="mt-3 inline-flex text-sm font-semibold text-orange-100 hover:text-orange-200">Buka modul →</Link>
              </div>
            ))}
          </div>
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
                  <button
                    onClick={() => { setExecuteStepId(step.id); setExecuteResult(null); setHandoff(null); }}
                    className="rounded-2xl bg-[#F97316]/15 p-3 text-left text-sm font-semibold text-orange-100 hover:bg-[#F97316]/25"
                  >
                    Execute step →<br /><span className="text-xs font-normal text-orange-100/60">Buka form step ini</span>
                  </button>
                </div>
                <p className="mt-4 text-sm text-[#b8d8cf]">Next action: {step.nextAction}</p>
              </div>
            ))}
          </div>

          <aside className="space-y-4 lg:col-span-3">

            {/* Execute Step form */}
            <section className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
              <h2 className="text-xl font-semibold">⚡ Execute Step</h2>
              <p className="mt-2 text-sm text-white/55">Tulis langsung ke Google Sheets untuk step terpilih. OAuth harus aktif.</p>
              <form onSubmit={executeStep} className="mt-4 space-y-3">
                <input type="hidden" name="executeStepId" value={executeStepId} />
                <label className="block text-sm text-white/60">
                  Step
                  <select
                    value={executeStepId}
                    onChange={(e) => { setExecuteStepId(e.target.value); setExecuteResult(null); }}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0f1713] px-3 py-3 text-white"
                  >
                    {(data?.steps || []).map((step) => <option key={step.id} value={step.id}>{step.label} ({step.id})</option>)}
                  </select>
                </label>
                <label className="block text-sm text-white/60">
                  Reference
                  <input name="executeReference" placeholder="PO-..., batch, invoice" className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0f1713] px-3 py-3 text-white placeholder:text-white/30" />
                </label>

                {/* Dynamic fields per step */}
                {(stepFields[executeStepId] || []).length > 0 ? (
                  <div className="space-y-3 rounded-2xl bg-black/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#9ee7dc]">Payload fields</p>
                    {(stepFields[executeStepId] || []).map((field) => (
                      <label key={field.name} className="block text-sm text-white/60">
                        {field.label} {field.required && <span className="text-red-400">*</span>}
                        <input
                          name={field.name}
                          type={field.type || "text"}
                          placeholder={field.placeholder}
                          required={field.required}
                          className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0f1713] px-3 py-3 text-white placeholder:text-white/30"
                        />
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-black/20 p-4 text-sm text-white/50">
                    Step ini tidak memerlukan payload tambahan. Klik execute untuk memproses.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={executing}
                  className="w-full rounded-2xl bg-[#F97316] px-4 py-3 font-semibold text-white hover:bg-[#ea580c] disabled:opacity-50"
                >
                  {executing ? "⏳ Executing..." : "⚡ Execute & Write to Sheets"}
                </button>
              </form>

              {executeResult && (
                <div className={`mt-4 rounded-2xl p-4 text-sm ${executeResult?.result?.success ? "bg-emerald-500/10 border border-emerald-400/20" : "bg-red-500/10 border border-red-400/20"}`}>
                  <div className="font-semibold">{executeResult?.result?.success ? "✅ Berhasil" : "❌ Gagal"}</div>
                  <p className="mt-1 text-white/70">{executeResult?.result?.detail}</p>
                  {executeResult?.result?.sheetWrites?.length > 0 && (
                    <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-white/50">
                      {executeResult.result.sheetWrites.map((w) => <li key={w}>{w}</li>)}
                    </ul>
                  )}
                  {executeResult?.actionLog && (
                    <p className="mt-2 text-xs text-white/40">
                      Log: {executeResult.actionLog.id} • {executeResult.actionLog.status} • {new Date(executeResult.actionLog.timestamp).toLocaleString("id-ID")}
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* Prepare Handoff form */}
            <section className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
              <h2 className="text-xl font-semibold">📋 Prepare Handoff</h2>
              <p className="mt-2 text-sm text-white/55">Validasi awal tanpa write. Lihat checklist sebelum execute.</p>
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
                <button type="submit" className="w-full rounded-2xl bg-[#0D9488] px-4 py-3 font-semibold hover:bg-[#0f766e]">Prepare Handoff</button>
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
              <h2 className="text-xl font-semibold">🛡️ Guardrails</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/65">
                {(data?.guardrails || []).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>

            <section className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
              <h2 className="text-xl font-semibold">📅 Weekly cadence & reporting</h2>
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
              <h2 className="text-xl font-semibold">📊 Recent activity</h2>
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
