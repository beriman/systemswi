"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Supplier = {
  id: string;
  name: string;
  category: string;
  contact: string;
  channel: string;
  leadTimeDays: number;
  rating: number;
  status: string;
  lastPo: string;
  notes: string;
};

type PurchaseOrder = {
  id: string;
  date: string;
  supplierId: string;
  supplierName: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  total: number;
  status: string;
  expectedDate: string;
  proofUrl: string;
  notes: string;
};

type Receipt = {
  timestamp: string;
  id: string;
  poId: string;
  date: string;
  itemId: string;
  sku: string;
  quantity: number;
  qcStatus: string;
  qcNotes: string;
  proofUrl: string;
  pic: string;
  movementRef: string;
  notes: string;
};

type ProcurementResponse = {
  source: string;
  sourceStatus?: "live" | "degraded" | "blocked";
  warning?: string;
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  receipts: Receipt[];
  summary: {
    totalPo: number;
    openPo: number;
    orderedValue: number;
    pendingReceive: number;
    qcFailed: number;
    latestPo: PurchaseOrder[];
    latestReceipts: Receipt[];
  };
};

const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);

const statusClass: Record<string, string> = {
  draft: "bg-white/10 text-white/70",
  ordered: "bg-sky-500/15 text-sky-300",
  partial: "bg-amber-500/15 text-amber-300",
  received: "bg-emerald-500/15 text-emerald-300",
  cancelled: "bg-red-500/15 text-red-300",
  pending: "bg-white/10 text-white/70",
  passed: "bg-emerald-500/15 text-emerald-300",
  failed: "bg-red-500/15 text-red-300",
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

export default function ProcurementPage() {
  const [data, setData] = useState<ProcurementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPo, setSavingPo] = useState(false);
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedPo, setSelectedPo] = useState("");

  async function loadProcurement() {
    setLoading(true);
    const res = await fetch("/api/procurement", { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal load procurement");
    setData(json);
    if (!selectedSupplier && json.suppliers?.[0]?.id) setSelectedSupplier(json.suppliers[0].id);
    const openPo = json.purchaseOrders?.find((po: PurchaseOrder) => po.status !== "received" && po.status !== "cancelled");
    if (!selectedPo && openPo?.id) setSelectedPo(openPo.id);
    setLoading(false);
  }

  useEffect(() => {
    loadProcurement().catch((error) => {
      setMessage(`❌ ${String(error)}`);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPos = useMemo(
    () => data?.purchaseOrders.filter((po) => po.status !== "received" && po.status !== "cancelled") || [],
    [data?.purchaseOrders]
  );

  const selectedPoData = openPos.find((po) => po.id === selectedPo) || openPos[0];

  async function submitPo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingPo(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      action: "create-po",
      supplierId: form.get("supplierId"),
      itemId: form.get("itemId"),
      itemName: form.get("itemName"),
      quantity: form.get("quantity"),
      unit: form.get("unit"),
      unitCost: form.get("unitCost"),
      expectedDate: form.get("expectedDate"),
      proofUrl: form.get("proofUrl"),
      notes: form.get("notes"),
    };
    try {
      const res = await fetch("/api/procurement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat PO");
      setMessage(`✅ PO dibuat: ${json.po.id} (${json.po.supplierName}) total ${rupiah(json.po.total)}`);
      event.currentTarget.reset();
      await loadProcurement();
    } catch (error) {
      setMessage(`❌ ${String(error)}`);
    } finally {
      setSavingPo(false);
    }
  }

  async function submitReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingReceipt(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      action: "receive",
      poId: form.get("poId"),
      quantity: form.get("quantity"),
      qcStatus: form.get("qcStatus"),
      qcNotes: form.get("qcNotes"),
      proofUrl: form.get("proofUrl"),
      pic: form.get("pic"),
      notes: form.get("notes"),
    };
    try {
      const res = await fetch("/api/procurement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menerima barang");
      setMessage(`✅ Receiving tersimpan: ${json.receipt.id}, QC ${json.receipt.qcStatus}, inventory ${json.inventoryUpdated ? "terupdate" : "tidak diubah"}`);
      event.currentTarget.reset();
      await loadProcurement();
    } catch (error) {
      setMessage(`❌ ${String(error)}`);
    } finally {
      setSavingReceipt(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080c0a] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[2rem] bg-gradient-to-br from-[#0D9488]/25 via-white/[0.04] to-[#F97316]/15 p-8 shadow-xl ring-1 ring-white/10">
          <p className="text-sm uppercase tracking-[0.35em] text-[#6b9e8f]">Procurement Command Center</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold">Supplier, Purchase Order & Receiving QC</h1>
              <p className="mt-3 max-w-3xl text-white/65">
                Source of truth Google Sheets untuk supplier, PO, penerimaan barang, QC intake, dan auto-update inventory saat QC passed.
              </p>
            </div>
            <button onClick={() => loadProcurement()} className="rounded-full bg-[#0D9488] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0f766e]">
              Refresh Sheets
            </button>
          </div>
        </header>

        {message && <div className="rounded-2xl bg-white/[0.06] p-4 text-sm text-white/80 ring-1 ring-white/10">{message}</div>}
        {data?.sourceStatus === "degraded" && (
          <div className="rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-100 ring-1 ring-amber-400/30">
            ⚠️ Google Workspace perlu re-auth. Halaman procurement tetap read-only dengan fallback kosong; write PO/receiving diblokir sampai OAuth aktif kembali. {data.warning}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-5">
          <MetricCard label="Supplier" value={String(data?.suppliers.length || 0)} hint="vendor aktif/draft" />
          <MetricCard label="Open PO" value={String(data?.summary.openPo || 0)} hint="draft/ordered/partial" />
          <MetricCard label="Nilai Open PO" value={rupiah(data?.summary.orderedValue || 0)} hint="belum full received" />
          <MetricCard label="Pending Receive" value={String(data?.summary.pendingReceive || 0)} hint="perlu follow up" />
          <MetricCard label="QC Failed" value={String(data?.summary.qcFailed || 0)} hint="butuh tindakan" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_430px]">
          <div className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Purchase Orders</h2>
                <p className="text-sm text-white/45">{data?.source || "Google Sheets"}</p>
              </div>
              {loading && <span className="text-sm text-white/50">Loading…</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="text-xs uppercase text-white/40">
                  <tr><th className="py-3 pr-4">PO</th><th className="py-3 pr-4">Supplier</th><th className="py-3 pr-4">Item</th><th className="py-3 pr-4">Qty</th><th className="py-3 pr-4">Total</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">ETA</th><th className="py-3 pr-4">Proof</th></tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {data?.purchaseOrders.map((po) => (
                    <tr key={po.id} className="text-white/75">
                      <td className="py-3 pr-4"><button onClick={() => setSelectedPo(po.id)} className="font-medium text-white hover:text-[#5eead4]">{po.id}</button><div className="text-xs text-white/40">{po.date}</div></td>
                      <td className="py-3 pr-4">{po.supplierName}</td>
                      <td className="py-3 pr-4"><div>{po.itemName}</div><div className="text-xs text-white/40">{po.itemId}</div></td>
                      <td className="py-3 pr-4">{po.quantity} {po.unit}</td>
                      <td className="py-3 pr-4">{rupiah(po.total)}</td>
                      <td className="py-3 pr-4"><span className={`rounded-full px-3 py-1 text-xs ${statusClass[po.status] || statusClass.draft}`}>{po.status}</span></td>
                      <td className="py-3 pr-4">{po.expectedDate}</td>
                      <td className="py-3 pr-4">{po.proofUrl ? <a href={po.proofUrl} target="_blank" className="text-[#5eead4]">open</a> : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-6">
            <form onSubmit={submitPo} className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
              <h2 className="text-xl font-semibold">Buat Purchase Order</h2>
              <p className="mt-1 text-sm text-white/45">Buat PO berbasis Supplier_Master. Gunakan TBA untuk detail yang belum terverifikasi.</p>
              <div className="mt-5 space-y-4">
                <label className="block text-sm text-white/60">Supplier
                  <select name="supplierId" value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10">
                    {data?.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name} — {supplier.category}</option>)}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm text-white/60">Item ID / SKU<input name="itemId" required placeholder="RM-ESS-001" className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10" /></label>
                  <label className="block text-sm text-white/60">Nama Item<input name="itemName" required placeholder="Essential Oil TBA" className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10" /></label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <label className="block text-sm text-white/60">Qty<input name="quantity" required type="number" min="0.01" step="0.01" className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10" /></label>
                  <label className="block text-sm text-white/60">Unit<input name="unit" defaultValue="unit" className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10" /></label>
                  <label className="block text-sm text-white/60">Unit Cost<input name="unitCost" type="number" min="0" step="1" className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10" /></label>
                </div>
                <label className="block text-sm text-white/60">Expected Date<input name="expectedDate" type="date" className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10" /></label>
                <label className="block text-sm text-white/60">Proof / Invoice URL<input name="proofUrl" placeholder="Drive URL invoice/quotation" className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10" /></label>
                <label className="block text-sm text-white/60">Catatan<textarea name="notes" rows={2} className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10" /></label>
                <button disabled={savingPo} className="w-full rounded-full bg-[#F97316] px-5 py-3 font-semibold text-white hover:bg-[#ea580c] disabled:opacity-50">{savingPo ? "Menyimpan…" : "Simpan PO ke Sheets"}</button>
              </div>
            </form>

            <form onSubmit={submitReceipt} className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
              <h2 className="text-xl font-semibold">Receiving + QC</h2>
              <p className="mt-1 text-sm text-white/45">Jika QC passed dan item ada di Inventory_Master, stok otomatis bertambah.</p>
              <div className="mt-5 space-y-4">
                <label className="block text-sm text-white/60">Open PO
                  <select name="poId" value={selectedPoData?.id || ""} onChange={(e) => setSelectedPo(e.target.value)} className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10">
                    {openPos.map((po) => <option key={po.id} value={po.id}>{po.id} — {po.itemName}</option>)}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm text-white/60">Qty Received<input name="quantity" required type="number" min="0.01" step="0.01" defaultValue={selectedPoData?.quantity || ""} className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10" /></label>
                  <label className="block text-sm text-white/60">QC Status<select name="qcStatus" className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10"><option value="passed">Passed</option><option value="pending">Pending</option><option value="failed">Failed</option></select></label>
                </div>
                <label className="block text-sm text-white/60">QC Notes<textarea name="qcNotes" rows={2} placeholder="Batch diterima, COA/expiry/fisik dicek" className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10" /></label>
                <label className="block text-sm text-white/60">Proof URL<input name="proofUrl" placeholder="Drive URL surat jalan/foto barang/QC" className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10" /></label>
                <label className="block text-sm text-white/60">PIC<input name="pic" defaultValue="HemuHemu/OWL" className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10" /></label>
                <button disabled={savingReceipt || !openPos.length} className="w-full rounded-full bg-[#0D9488] px-5 py-3 font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50">{savingReceipt ? "Menyimpan…" : "Simpan Receiving QC"}</button>
              </div>
            </form>
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
            <h2 className="text-xl font-semibold">Supplier Master</h2>
            <div className="mt-4 space-y-3">
              {data?.suppliers.map((supplier) => (
                <div key={supplier.id} className="rounded-2xl bg-black/20 p-4 ring-1 ring-white/10">
                  <div className="flex items-start justify-between gap-3"><div><p className="font-medium">{supplier.name}</p><p className="text-xs text-white/40">{supplier.id} • {supplier.category}</p></div><span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/65">{supplier.status}</span></div>
                  <p className="mt-2 text-sm text-white/55">Kontak: {supplier.contact} / {supplier.channel} • Lead time {supplier.leadTimeDays || 0} hari • Rating {supplier.rating || 0}/5</p>
                  {supplier.notes && <p className="mt-1 text-xs text-white/40">{supplier.notes}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
            <h2 className="text-xl font-semibold">Recent Goods Receipts</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="text-xs uppercase text-white/40"><tr><th className="py-2 pr-4">Tanggal</th><th className="py-2 pr-4">Receipt</th><th className="py-2 pr-4">PO</th><th className="py-2 pr-4">Qty</th><th className="py-2 pr-4">QC</th><th className="py-2 pr-4">Proof</th></tr></thead>
                <tbody className="divide-y divide-white/10">
                  {data?.receipts.slice(0, 20).map((receipt) => (
                    <tr key={receipt.id} className="text-white/70"><td className="py-2 pr-4">{receipt.date}</td><td className="py-2 pr-4">{receipt.id}</td><td className="py-2 pr-4">{receipt.poId}</td><td className="py-2 pr-4">{receipt.quantity}</td><td className="py-2 pr-4"><span className={`rounded-full px-2 py-1 text-xs ${statusClass[receipt.qcStatus] || statusClass.pending}`}>{receipt.qcStatus}</span></td><td className="py-2 pr-4">{receipt.proofUrl ? <a href={receipt.proofUrl} className="text-[#5eead4]" target="_blank">open</a> : "-"}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
