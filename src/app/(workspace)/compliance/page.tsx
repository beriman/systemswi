"use client";

import { FormEvent, useEffect, useState } from "react";

type ComplianceRegisterEntry = {
  id: string;
  area: string;
  obligation: string;
  period: string;
  dueDate: string;
  status: string;
  owner: string;
  sourceProof: string;
  riskLevel: string;
  notes: string;
  daysUntilDue: number | null;
  riskBadge: "green" | "yellow" | "red" | "gray";
};

type ComplianceData = {
  source: string;
  generatedAt: string;
  summary: {
    totalChecks: number;
    needsReview: number;
    blocked: number;
    totalBatches: number;
    qcPassed: number;
    qcFailed: number;
    traceabilityDraft: number;
  };
  complianceRegisterSummary?: { total: number; open: number; overdue: number; dueSoon: number; completed: number; missingProof: number };
  complianceRegister?: ComplianceRegisterEntry[];
  checks: Array<{ formulaId: string; formulaName: string; product: string; ifraCategory: string; status: string; allergenLabel: string; findings: string; reference: string }>;
  batches: Array<{ batchId: string; product: string; formulaId: string; productionDate: string; quantity: number; unit: string; qcStatus: string; traceabilityStatus: string; inventoryReference: string; proofUrl: string }>;
  qcChecklist: Array<{ checklistId: string; batchId: string; stage: string; item: string; result: string; proofUrl: string; notes: string }>;
};

const badgeClass: Record<string, string> = {
  passed: "bg-emerald-500/15 text-emerald-300",
  needs_review: "bg-amber-500/15 text-amber-300",
  draft: "bg-white/10 text-white/60",
  blocked: "bg-red-500/15 text-red-300",
  failed: "bg-red-500/15 text-red-300",
  pending: "bg-amber-500/15 text-amber-300",
  complete: "bg-emerald-500/15 text-emerald-300",
  incomplete: "bg-orange-500/15 text-orange-300",
  green: "bg-emerald-500/15 text-emerald-300",
  yellow: "bg-amber-500/15 text-amber-300",
  red: "bg-red-500/15 text-red-300",
  gray: "bg-white/10 text-white/60",
};

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl bg-white/[0.04] p-5 shadow-sm ring-1 ring-white/10">
      <p className="text-sm text-[#6b9e8f]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/45">{hint}</p>
    </div>
  );
}

function Field({ name, label, placeholder, required, type = "text" }: { name: string; label: string; placeholder?: string; required?: boolean; type?: string }) {
  return (
    <label className="block text-sm text-white/60">{label}
      <input name={name} required={required} type={type} placeholder={placeholder} className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10" />
    </label>
  );
}

export default function CompliancePage() {
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadCompliance() {
    setLoading(true);
    const res = await fetch("/api/compliance", { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal load compliance");
    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadCompliance()).catch((error) => {
      setMessage(`❌ ${String(error)}`);
      setLoading(false);
    });
  }, []);

  async function submit(action: "check" | "batch" | "qc", event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const res = await fetch("/api/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal simpan compliance");
      setMessage(`OK: ${action} tersimpan ke ${json.syncedSheets?.join(", ")}`);
      event.currentTarget.reset();
      await loadCompliance();
    } catch (error) {
      setMessage(`ERROR: ${String(error)}`);
    } finally {
      setSaving(false);
    }
  }

  async function seedKnownGcgCompliance() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/governance/compliance-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "seed-known",
          actor: "ETIKA TARIF",
          role: "Autonomous Governance Agent",
          notes: "Seed LKPM/BPJS known obligations dari plan GCG; idempotent dan tidak mengisi bukti/status fiktif.",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.warning || "Gagal seed Compliance_Register");
      setMessage(`OK: Compliance_Register dicek — ${json.seeded || 0} baru, ${json.skipped || 0} sudah ada. Audit: Governance_Audit_Log.`);
      await loadCompliance();
    } catch (error) {
      setMessage(`ERROR: ${String(error)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080c0a] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[2rem] bg-gradient-to-br from-[#0D9488]/25 via-white/[0.04] to-[#F97316]/15 p-8 shadow-xl ring-1 ring-white/10">
          <p className="text-sm uppercase tracking-[0.35em] text-[#6b9e8f]">Compliance & Traceability</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold">Formula, Batch, QC, Label/BPOM/IFRA Tracker</h1>
              <p className="mt-3 max-w-3xl text-white/65">
                Operational v1 untuk mencatat draft compliance formula, allergen label, product batch traceability,
                dan QC checklist. Google Sheets tetap source of truth; fakta yang belum verified disimpan sebagai TBA/draft.
              </p>
            </div>
            <button onClick={() => loadCompliance()} className="rounded-full bg-[#0D9488] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0f766e]">
              Refresh Sheets
            </button>
          </div>
        </header>

        {message && <div className="rounded-2xl bg-white/[0.06] p-4 text-sm text-white/80 ring-1 ring-white/10">{message}</div>}

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Formula Checks" value={String(data?.summary.totalChecks || 0)} hint="IFRA/BPOM/label review" />
          <MetricCard label="Needs Review" value={String(data?.summary.needsReview || 0)} hint="draft / belum approved" />
          <MetricCard label="GCG Overdue" value={String(data?.complianceRegisterSummary?.overdue || 0)} hint="LKPM/BPJS/Pajak/legal" />
          <MetricCard label="GCG Due Soon" value={String(data?.complianceRegisterSummary?.dueSoon || 0)} hint="jatuh tempo ≤ 7 hari" />
        </section>

        <section className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">GCG Compliance Register</h2>
              <p className="text-sm text-white/45">LKPM, BPJSKT, BPJSKS, pajak, legal, BPOM/Halal. Bukti kosong berarti belum dicatat, bukan diasumsikan selesai.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => void seedKnownGcgCompliance()}
                className="rounded-full bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50"
              >
                Seed LKPM/BPJS plan
              </button>
              <a href="/api/governance/compliance-register" className="rounded-full bg-white/10 px-4 py-2 text-sm text-[#5eead4] hover:bg-white/15">API register →</a>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-xs uppercase text-white/40"><tr><th className="py-3 pr-4">Area</th><th className="py-3 pr-4">Obligation</th><th className="py-3 pr-4">Due</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Owner</th><th className="py-3 pr-4">Proof</th></tr></thead>
              <tbody className="divide-y divide-white/10">
                {data?.complianceRegister?.slice(0, 12).map((item) => <tr key={item.id} className="text-white/70"><td className="py-3 pr-4"><div className="font-medium text-white">{item.area}</div><div className="text-xs text-white/40">{item.id}</div></td><td className="py-3 pr-4"><div>{item.obligation}</div><div className="text-xs text-white/40">{item.period || "TBA"} • Risiko: {item.riskLevel || "TBA"}</div></td><td className="py-3 pr-4">{item.dueDate || "TBA"}</td><td className="py-3 pr-4"><span className={`rounded-full px-2 py-1 text-xs ${badgeClass[item.riskBadge] || badgeClass.gray}`}>{item.status || "TBA"}</span></td><td className="py-3 pr-4">{item.owner || "Belum dicatat"}</td><td className="py-3 pr-4">{item.sourceProof ? <a href={item.sourceProof} className="text-[#5eead4] hover:underline">Bukti</a> : <span className="text-white/40">Belum dicatat</span>}</td></tr>)}
                {!data?.complianceRegister?.length && <tr><td colSpan={6} className="py-6 text-center text-white/45">Belum ada Compliance_Register.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <form onSubmit={(event) => submit("check", event)} className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
            <h2 className="text-xl font-semibold">Input Formula Check</h2>
            <p className="mt-1 text-sm text-white/45">Catat hasil review formula, IFRA category, dan label allergen draft.</p>
            <div className="mt-5 space-y-4">
              <Field name="formulaId" label="Formula ID" required placeholder="FORM-ARC-001" />
              <Field name="formulaName" label="Formula Name" required placeholder="L'Arc Signature EDT" />
              <Field name="product" label="Product" required placeholder="Eau de Parfum 30ml" />
              <Field name="ifraCategory" label="IFRA Category" placeholder="TBA / Category 4" />
              <label className="block text-sm text-white/60">Status
                <select name="status" defaultValue="needs_review" className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10">
                  <option value="needs_review">Needs Review</option><option value="draft">Draft</option><option value="passed">Passed</option><option value="blocked">Blocked</option>
                </select>
              </label>
              <Field name="materials" label="Material keywords / allergens" placeholder="limonene; linalool; coumarin" />
              <Field name="reference" label="Reference/Proof URL" placeholder="Drive SDS/COA/BPOM note" />
              <label className="block text-sm text-white/60">Findings / Notes<textarea name="notes" rows={3} className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10" /></label>
              <button disabled={saving} className="w-full rounded-full bg-[#F97316] px-5 py-3 font-semibold text-white hover:bg-[#ea580c] disabled:opacity-50">Simpan Check</button>
            </div>
          </form>

          <form onSubmit={(event) => submit("batch", event)} className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
            <h2 className="text-xl font-semibold">Input Product Batch</h2>
            <p className="mt-1 text-sm text-white/45">Hubungkan batch produk ke formula, inventory movement, proof, dan QC.</p>
            <div className="mt-5 space-y-4">
              <Field name="batchId" label="Batch ID" required placeholder="BATCH-20260610-001" />
              <Field name="product" label="Product" required placeholder="Pixel Potion 30ml" />
              <Field name="formulaId" label="Formula ID" placeholder="FORM-PXL-001" />
              <Field name="productionDate" label="Production Date" type="date" />
              <Field name="quantity" label="Qty" type="number" placeholder="100" />
              <Field name="unit" label="Unit" placeholder="botol" />
              <label className="block text-sm text-white/60">QC Status
                <select name="qcStatus" defaultValue="pending" className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10"><option value="pending">Pending</option><option value="passed">Passed</option><option value="failed">Failed</option></select>
              </label>
              <Field name="inventoryReference" label="Inventory Reference" placeholder="MOVEMENT/BOM/PO reference" />
              <Field name="proofUrl" label="Proof URL" placeholder="Drive batch record / foto QC" />
              <label className="block text-sm text-white/60">Notes<textarea name="notes" rows={3} className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10" /></label>
              <button disabled={saving} className="w-full rounded-full bg-[#0D9488] px-5 py-3 font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50">Simpan Batch</button>
            </div>
          </form>

          <form onSubmit={(event) => submit("qc", event)} className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
            <h2 className="text-xl font-semibold">Input QC Checklist</h2>
            <p className="mt-1 text-sm text-white/45">Checklist per stage: incoming, mixing, bottling, packaging, finished.</p>
            <div className="mt-5 space-y-4">
              <Field name="batchId" label="Batch ID" required placeholder="BATCH-20260610-001" />
              <Field name="stage" label="Stage" placeholder="finished" />
              <Field name="item" label="QC Item" required placeholder="Label batch code terbaca" />
              <label className="block text-sm text-white/60">Result
                <select name="result" defaultValue="needs_review" className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10"><option value="needs_review">Needs Review</option><option value="passed">Passed</option><option value="failed">Failed</option></select>
              </label>
              <Field name="proofUrl" label="Proof URL" placeholder="Drive foto/video QC" />
              <label className="block text-sm text-white/60">Notes<textarea name="notes" rows={3} className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10" /></label>
              <button disabled={saving} className="w-full rounded-full bg-white px-5 py-3 font-semibold text-[#080c0a] hover:bg-white/90 disabled:opacity-50">Simpan QC</button>
            </div>
          </form>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
            <h2 className="text-xl font-semibold">Latest Formula Checks</h2>
            <p className="text-sm text-white/45">{loading ? "Loading…" : data?.source}</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm"><thead className="text-xs uppercase text-white/40"><tr><th className="py-3 pr-4">Formula</th><th className="py-3 pr-4">Product</th><th className="py-3 pr-4">IFRA</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Label</th></tr></thead><tbody className="divide-y divide-white/10">
                {data?.checks.slice(0, 12).map((check) => <tr key={`${check.formulaId}-${check.product}`} className="text-white/70"><td className="py-3 pr-4"><div className="font-medium text-white">{check.formulaName}</div><div className="text-xs text-white/40">{check.formulaId}</div></td><td className="py-3 pr-4">{check.product}</td><td className="py-3 pr-4">{check.ifraCategory}</td><td className="py-3 pr-4"><span className={`rounded-full px-2 py-1 text-xs ${badgeClass[check.status] || badgeClass.draft}`}>{check.status}</span></td><td className="py-3 pr-4 text-xs">{check.allergenLabel}</td></tr>)}
                {!data?.checks.length && <tr><td colSpan={5} className="py-6 text-center text-white/45">Belum ada compliance check.</td></tr>}
              </tbody></table>
            </div>
          </div>

          <div className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
            <h2 className="text-xl font-semibold">Batch Traceability & QC</h2>
            <div className="mt-4 space-y-3">
              {data?.batches.slice(0, 10).map((batch) => <div key={batch.batchId} className="rounded-2xl bg-black/20 p-4 ring-1 ring-white/10"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{batch.product}</p><p className="text-xs text-white/45">{batch.batchId} • {batch.quantity} {batch.unit} • {batch.productionDate}</p></div><span className={`rounded-full px-2 py-1 text-xs ${badgeClass[batch.qcStatus] || badgeClass.pending}`}>{batch.qcStatus}</span></div><p className="mt-2 text-sm text-white/55">Traceability: {batch.traceabilityStatus || "draft"} • Ref: {batch.inventoryReference || "TBA"}</p>{batch.proofUrl && <a href={batch.proofUrl} className="mt-2 inline-block text-sm text-[#5eead4] hover:underline">Proof</a>}</div>)}
              {!data?.batches.length && <p className="text-sm text-white/45">Belum ada batch traceability.</p>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
