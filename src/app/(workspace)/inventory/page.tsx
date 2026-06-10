"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  qty: number;
  minimumQty: number;
  reorderQty: number;
  unitCost: number;
  supplier: string;
  location: string;
  status: "ok" | "low" | "critical" | "empty";
  lastMovementAt: string;
  notes: string;
};

type Movement = {
  id: string;
  timestamp: string;
  date: string;
  itemId: string;
  sku: string;
  type: string;
  quantity: number;
  reference: string;
  proofUrl: string;
  pic: string;
  notes: string;
};

type InventoryResponse = {
  source: string;
  items: InventoryItem[];
  movements: Movement[];
  summary: {
    totalItems: number;
    totalValue: number;
    alertCount: number;
    lowStockCount: number;
    criticalCount: number;
    alerts: InventoryItem[];
  };
};

const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);

const statusClass: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-300",
  low: "bg-amber-500/15 text-amber-300",
  critical: "bg-orange-500/15 text-orange-300",
  empty: "bg-red-500/15 text-red-300",
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

export default function InventoryPage() {
  const [data, setData] = useState<InventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState("");

  async function loadInventory() {
    setLoading(true);
    const res = await fetch("/api/inventory", { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal load inventory");
    setData(json);
    if (!selectedId && json.items?.[0]?.id) setSelectedId(json.items[0].id);
    setLoading(false);
  }

  useEffect(() => {
    loadInventory().catch((error) => {
      setMessage(String(error));
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedItem = useMemo(
    () => data?.items.find((item) => item.id === selectedId) || data?.items[0],
    [data?.items, selectedId]
  );

  async function submitMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      itemId: form.get("itemId"),
      type: form.get("type"),
      quantity: form.get("quantity"),
      reference: form.get("reference"),
      proofUrl: form.get("proofUrl"),
      pic: form.get("pic"),
      notes: form.get("notes"),
    };
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal simpan movement");
      setMessage(`✅ Movement tersimpan: ${json.item.name} sekarang ${json.item.qty} ${json.item.unit}`);
      event.currentTarget.reset();
      await loadInventory();
    } catch (error) {
      setMessage(`❌ ${String(error)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080c0a] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[2rem] bg-gradient-to-br from-[#0D9488]/25 via-white/[0.04] to-[#F97316]/15 p-8 shadow-xl ring-1 ring-white/10">
          <p className="text-sm uppercase tracking-[0.35em] text-[#6b9e8f]">Operations Command Center</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold">Inventory Bahan Baku & Packaging</h1>
              <p className="mt-3 max-w-3xl text-white/65">
                Source of truth Google Sheets: master stok, movement masuk/keluar/adjustment, nilai inventory,
                dan minimum stock alert untuk mendukung produksi serta procurement.
              </p>
            </div>
            <button
              onClick={() => loadInventory()}
              className="rounded-full bg-[#0D9488] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0f766e]"
            >
              Refresh Sheets
            </button>
          </div>
        </header>

        {message && <div className="rounded-2xl bg-white/[0.06] p-4 text-sm text-white/80 ring-1 ring-white/10">{message}</div>}

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Total SKU" value={String(data?.summary.totalItems || 0)} hint="bahan, packaging, barang jadi" />
          <MetricCard label="Nilai Inventory" value={rupiah(data?.summary.totalValue || 0)} hint="qty × unit cost" />
          <MetricCard label="Low Stock" value={String(data?.summary.lowStockCount || 0)} hint="perlu monitor" />
          <MetricCard label="Critical/Empty" value={String(data?.summary.criticalCount || 0)} hint="prioritas restock" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Master Stok</h2>
                <p className="text-sm text-white/45">{data?.source || "Google Sheets"}</p>
              </div>
              {loading && <span className="text-sm text-white/50">Loading…</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="text-xs uppercase text-white/40">
                  <tr>
                    <th className="py-3 pr-4">Item</th>
                    <th className="py-3 pr-4">Kategori</th>
                    <th className="py-3 pr-4">Qty</th>
                    <th className="py-3 pr-4">Minimum</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Supplier</th>
                    <th className="py-3 pr-4">Lokasi</th>
                    <th className="py-3 pr-4">Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {data?.items.map((item) => (
                    <tr key={item.id} className="text-white/75">
                      <td className="py-3 pr-4">
                        <button onClick={() => setSelectedId(item.id)} className="text-left hover:text-[#5eead4]">
                          <div className="font-medium text-white">{item.name}</div>
                          <div className="text-xs text-white/40">{item.sku || item.id}</div>
                        </button>
                      </td>
                      <td className="py-3 pr-4">{item.category}</td>
                      <td className="py-3 pr-4">{item.qty} {item.unit}</td>
                      <td className="py-3 pr-4">{item.minimumQty} {item.unit}</td>
                      <td className="py-3 pr-4"><span className={`rounded-full px-3 py-1 text-xs ${statusClass[item.status]}`}>{item.status}</span></td>
                      <td className="py-3 pr-4">{item.supplier}</td>
                      <td className="py-3 pr-4">{item.location}</td>
                      <td className="py-3 pr-4">{rupiah(item.qty * item.unitCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-6">
            <form onSubmit={submitMovement} className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
              <h2 className="text-xl font-semibold">Input Movement</h2>
              <p className="mt-1 text-sm text-white/45">Masuk, keluar produksi, atau adjustment stock.</p>
              <div className="mt-5 space-y-4">
                <label className="block text-sm text-white/60">Item
                  <select name="itemId" value={selectedItem?.id || ""} onChange={(e) => setSelectedId(e.target.value)} className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10">
                    {data?.items.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.qty} {item.unit}</option>)}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm text-white/60">Tipe
                    <select name="type" className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10">
                      <option value="in">Masuk</option>
                      <option value="out">Keluar</option>
                      <option value="adjustment">Adjustment Qty Final</option>
                    </select>
                  </label>
                  <label className="block text-sm text-white/60">Qty
                    <input name="quantity" required type="number" min="0.01" step="0.01" className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10" />
                  </label>
                </div>
                <label className="block text-sm text-white/60">Referensi PO/Batch/Invoice
                  <input name="reference" placeholder="PO-20260610-001 / BATCH-ARC" className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10" />
                </label>
                <label className="block text-sm text-white/60">Proof URL
                  <input name="proofUrl" placeholder="Drive URL bukti pembelian / QC" className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10" />
                </label>
                <label className="block text-sm text-white/60">PIC
                  <input name="pic" defaultValue="HemuHemu/OWL" className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10" />
                </label>
                <label className="block text-sm text-white/60">Catatan
                  <textarea name="notes" rows={3} className="mt-1 w-full rounded-2xl bg-black/30 p-3 text-white ring-1 ring-white/10" />
                </label>
                <button disabled={saving} className="w-full rounded-full bg-[#F97316] px-5 py-3 font-semibold text-white hover:bg-[#ea580c] disabled:opacity-50">
                  {saving ? "Menyimpan…" : "Simpan ke Google Sheets"}
                </button>
              </div>
            </form>

            <div className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
              <h2 className="text-xl font-semibold">Alert Restock</h2>
              <div className="mt-4 space-y-3">
                {data?.summary.alerts.length ? data.summary.alerts.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-black/20 p-3 ring-1 ring-white/10">
                    <div className="flex justify-between gap-3">
                      <p className="font-medium">{item.name}</p>
                      <span className={`rounded-full px-2 py-1 text-xs ${statusClass[item.status]}`}>{item.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-white/50">Stock {item.qty} {item.unit}; minimum {item.minimumQty}. Reorder disarankan {item.reorderQty} {item.unit}.</p>
                  </div>
                )) : <p className="text-sm text-white/45">Tidak ada alert aktif.</p>}
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
          <h2 className="text-xl font-semibold">Recent Movements</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase text-white/40"><tr><th className="py-2 pr-4">Tanggal</th><th className="py-2 pr-4">SKU</th><th className="py-2 pr-4">Tipe</th><th className="py-2 pr-4">Qty</th><th className="py-2 pr-4">Ref</th><th className="py-2 pr-4">PIC</th><th className="py-2 pr-4">Proof</th></tr></thead>
              <tbody className="divide-y divide-white/10">
                {data?.movements.map((movement) => (
                  <tr key={movement.id} className="text-white/70"><td className="py-2 pr-4">{movement.date}</td><td className="py-2 pr-4">{movement.sku}</td><td className="py-2 pr-4">{movement.type}</td><td className="py-2 pr-4">{movement.quantity}</td><td className="py-2 pr-4">{movement.reference || "-"}</td><td className="py-2 pr-4">{movement.pic || "-"}</td><td className="py-2 pr-4">{movement.proofUrl ? <a href={movement.proofUrl} className="text-[#5eead4]" target="_blank">open</a> : "-"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
