"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Pencil, Trash2 } from "lucide-react";

/* ── Types ── */

type ProductionBatch = {
  id: string;
  date: string;
  brandId: string;
  brandName: string;
  sku: string;
  productName: string;
  productType: string;
  batchCode: string;
  qtyProduced: number;
  unit: string;
  rawMaterialCost: number;
  bottlingCost: number;
  packagingCost: number;
  otherCost: number;
  hppPerUnit: number;
  totalProductionCost: number;
  status: string;
  qcStatus: string;
  stockLocation: string;
  notes: string;
};

type BrandSummary = {
  id: string;
  name: string;
  category: string;
  status: string;
  productionQty: number;
  productionCost: number;
  unitsSold: number;
  netRevenue: number;
  cogs: number;
  expenses: number;
  grossProfit: number;
  operatingProfit: number;
  avgHppPerUnit: number;
  stockEstimate: number;
  activeBatches: number;
};

type ApiData = {
  brands: BrandSummary[];
  productionBatches: ProductionBatch[];
  totals: {
    brandCount: number;
    productionQty: number;
    productionCost: number;
    activeBatches: number;
    unitsSold: number;
    netRevenue: number;
    cogs: number;
    expenses: number;
    grossProfit: number;
    operatingProfit: number;
    avgHppPerUnit: number;
    stockEstimate: number;
  };
};

type PipelineStage = {
  id: string;
  label: string;
  icon: string;
  description: string;
  batchCount: number;
  totalQty: number;
};

/* ── Helpers ── */

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value || 0);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function qcStatusVariant(s: string): "default" | "destructive" | "outline" | "secondary" {
  const v = s.toLowerCase();
  if (v === "passed") return "default";
  if (v === "failed") return "destructive";
  if (v === "rework") return "secondary";
  return "outline";
}

function statusVariant(s: string): "default" | "destructive" | "outline" | "secondary" {
  const v = s.toLowerCase();
  if (v === "done") return "default";
  if (v === "in progress") return "secondary";
  if (v === "qc") return "secondary";
  if (v === "planned") return "outline";
  return "outline";
}

function genBatchCode(): string {
  const d = new Date();
  return `BATCH-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

/* ── Main Component ── */

export default function ProductionPage() {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pipeline");
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editBatch, setEditBatch] = useState<ProductionBatch | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/brands", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.details || json.error || "Gagal memuat data produksi");
      setData(json);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submitBatch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const brandId = String(form.get("brandId") || "");
    const brandName = data?.brands.find((b) => b.id === brandId)?.name || "";
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "production",
          date: String(form.get("date") || today()),
          brandId,
          brandName,
          sku: String(form.get("sku") || ""),
          productName: String(form.get("productName") || ""),
          productType: String(form.get("productType") || "Perfume"),
          batchCode: String(form.get("batchCode") || genBatchCode()),
          qtyProduced: Number(form.get("qtyProduced") || 0),
          unit: String(form.get("unit") || "pcs"),
          rawMaterialCost: Number(form.get("rawMaterialCost") || 0),
          bottlingCost: Number(form.get("bottlingCost") || 0),
          packagingCost: Number(form.get("packagingCost") || 0),
          otherCost: Number(form.get("otherCost") || 0),
          status: String(form.get("status") || "Planned"),
          qcStatus: String(form.get("qcStatus") || "Unchecked"),
          stockLocation: String(form.get("stockLocation") || "Gudang"),
          notes: String(form.get("notes") || ""),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.details || json.error || "Gagal menyimpan batch");
      e.currentTarget.reset();
      const bcInput = e.currentTarget.querySelector('[name="batchCode"]') as HTMLInputElement | null;
      if (bcInput) bcInput.value = genBatchCode();
      await load();
      setActiveTab("batches");
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editBatch) return;
    setSaving(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-batch",
          id: editBatch.id,
          date: String(form.get("date") || editBatch.date),
          brandId: String(form.get("brandId") || editBatch.brandId),
          brandName: data?.brands.find((b) => b.id === String(form.get("brandId")))?.name || editBatch.brandName,
          sku: String(form.get("sku") || editBatch.sku),
          productName: String(form.get("productName") || editBatch.productName),
          productType: String(form.get("productType") || editBatch.productType),
          batchCode: String(form.get("batchCode") || editBatch.batchCode),
          qtyProduced: Number(form.get("qtyProduced") || editBatch.qtyProduced),
          unit: String(form.get("unit") || editBatch.unit),
          rawMaterialCost: Number(form.get("rawMaterialCost") || editBatch.rawMaterialCost),
          bottlingCost: Number(form.get("bottlingCost") || editBatch.bottlingCost),
          packagingCost: Number(form.get("packagingCost") || editBatch.packagingCost),
          otherCost: Number(form.get("otherCost") || editBatch.otherCost),
          status: String(form.get("status") || editBatch.status),
          qcStatus: String(form.get("qcStatus") || editBatch.qcStatus),
          stockLocation: String(form.get("stockLocation") || editBatch.stockLocation),
          notes: String(form.get("notes") || editBatch.notes),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.details || json.error || "Gagal update batch");
      setEditBatch(null);
      await load();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus batch ini? Data di Google Sheets akan dihapus permanen.")) return;
    setDeleting(id);
    setError(null);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-batch", id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.details || json.error || "Gagal hapus batch");
      await load();
    } catch (err) {
      setError(String(err));
    } finally {
      setDeleting(null);
    }
  }

  /* ── Derived data ── */

  const batches = data?.productionBatches || [];
  const filteredBatches = batches.filter((b) => {
    if (filterBrand !== "all" && b.brandId !== filterBrand) return false;
    if (filterStatus !== "all" && b.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
    return true;
  });

  const pipelineStages: PipelineStage[] = [
    {
      id: "planned",
      label: "Perencanaan",
      icon: "📋",
      description: "Bahan baku dipesan, formula disiapkan",
      batchCount: batches.filter((b) => b.status.toLowerCase() === "planned").length,
      totalQty: batches.filter((b) => b.status.toLowerCase() === "planned").reduce((s, b) => s + b.qtyProduced, 0),
    },
    {
      id: "inprogress",
      label: "Produksi",
      icon: "⚗️",
      description: "Bottling & mixing berjalan",
      batchCount: batches.filter((b) => b.status.toLowerCase() === "in progress").length,
      totalQty: batches.filter((b) => b.status.toLowerCase() === "in progress").reduce((s, b) => s + b.qtyProduced, 0),
    },
    {
      id: "packaging",
      label: "Packaging",
      icon: "📦",
      description: "Labeling, boxing, finishing",
      batchCount: batches.filter((b) => b.status.toLowerCase() === "packaging" || b.status.toLowerCase() === "qc").length,
      totalQty: batches
        .filter((b) => b.status.toLowerCase() === "packaging" || b.status.toLowerCase() === "qc")
        .reduce((s, b) => s + b.qtyProduced, 0),
    },
    {
      id: "qc",
      label: "Quality Control",
      icon: "✅",
      description: "Allergen, aroma, visual check",
      batchCount: batches.filter((b) => b.qcStatus.toLowerCase() !== "unchecked" || b.status.toLowerCase() === "qc").length,
      totalQty: batches
        .filter((b) => b.qcStatus.toLowerCase() !== "unchecked" || b.status.toLowerCase() === "qc")
        .reduce((s, b) => s + b.qtyProduced, 0),
    },
    {
      id: "done",
      label: "Ready Stock",
      icon: "🏪",
      description: "QC passed, siap dijual / distribusi",
      batchCount: batches.filter((b) => b.status.toLowerCase() === "done" && b.qcStatus.toLowerCase() === "passed").length,
      totalQty: batches
        .filter((b) => b.status.toLowerCase() === "done" && b.qcStatus.toLowerCase() === "passed")
        .reduce((s, b) => s + b.qtyProduced, 0),
    },
  ];

  const totals = data?.totals;
  const qcPassed = batches.filter((b) => b.qcStatus.toLowerCase() === "passed").length;
  const qcFailed = batches.filter((b) => b.qcStatus.toLowerCase() === "failed").length;
  const qcPending = batches.filter((b) => b.qcStatus.toLowerCase() === "unchecked").length;
  const qcRework = batches.filter((b) => b.qcStatus.toLowerCase() === "rework").length;

  return (
    <div className="space-y-6">
      {/* Edit Modal */}
      {editBatch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Edit Batch</CardTitle>
                <CardDescription>{editBatch.batchCode} — {editBatch.productName}</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEditBatch(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveEdit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Brand *</Label>
                    <select name="brandId" defaultValue={editBatch.brandId} required className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                      {data?.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Tanggal</Label>
                    <input name="date" type="date" defaultValue={editBatch.date} required className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Batch Code</Label>
                    <input name="batchCode" defaultValue={editBatch.batchCode} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">SKU</Label>
                    <input name="sku" defaultValue={editBatch.sku} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Nama Produk *</Label>
                    <input name="productName" defaultValue={editBatch.productName} required className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Tipe</Label>
                    <input name="productType" defaultValue={editBatch.productType} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Qty</Label>
                    <input name="qtyProduced" type="number" defaultValue={editBatch.qtyProduced} min={1} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Unit</Label>
                    <input name="unit" defaultValue={editBatch.unit} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Lokasi Stok</Label>
                    <input name="stockLocation" defaultValue={editBatch.stockLocation} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold mb-2">Rincian Biaya</div>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <Label className="mb-1 block text-xs text-muted-foreground">Bahan Baku</Label>
                      <input name="rawMaterialCost" type="number" defaultValue={editBatch.rawMaterialCost} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs text-muted-foreground">Bottling</Label>
                      <input name="bottlingCost" type="number" defaultValue={editBatch.bottlingCost} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs text-muted-foreground">Packaging</Label>
                      <input name="packagingCost" type="number" defaultValue={editBatch.packagingCost} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs text-muted-foreground">Biaya Lain</Label>
                      <input name="otherCost" type="number" defaultValue={editBatch.otherCost} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Status Produksi</Label>
                    <select name="status" defaultValue={editBatch.status} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                      <option value="Planned">Planned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="QC">QC</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">QC Status</Label>
                    <select name="qcStatus" defaultValue={editBatch.qcStatus} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                      <option value="Unchecked">Unchecked</option>
                      <option value="Passed">Passed</option>
                      <option value="Rework">Rework</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">Catatan</Label>
                  <textarea name="notes" rows={2} defaultValue={editBatch.notes} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setEditBatch(null)}>Batal</Button>
                  <Button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "💾 Simpan Perubahan"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">🏭 Tracking Produksi</h2>
          <p className="text-muted-foreground">
            Pipeline produksi per batch: bahan baku → bottling → packaging → QC → ready stock.
          </p>
        </div>
        <Button onClick={load} disabled={loading} variant="outline">
          {loading ? "Memuat..." : "↻ Refresh"}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
          <CardContent className="py-4 text-red-700 dark:text-red-300 text-sm">{error}</CardContent>
        </Card>
      )}

      {/* KPI Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Batch" value={loading ? "..." : formatNumber(batches.length)} note="semua status" />
        <KpiCard title="Qty Diproduksi" value={loading ? "..." : formatNumber(totals?.productionQty || 0)} note="unit" />
        <KpiCard title="Total Biaya Produksi" value={loading ? "..." : formatCurrency(totals?.productionCost || 0)} note="semua batch" />
        <KpiCard title="HPP Rata-rata" value={loading ? "..." : formatCurrency(totals?.avgHppPerUnit || 0)} note="per unit" />
        <KpiCard title="Stock Estimate" value={loading ? "..." : formatNumber(totals?.stockEstimate || 0)} note="unit siap jual" />
        <KpiCard title="QC Passed" value={loading ? "..." : formatNumber(qcPassed)} note={`dari ${batches.length} batch`} accent="text-green-600" />
        <KpiCard title="QC Pending" value={loading ? "..." : formatNumber(qcPending)} note="belum diperiksa" accent={qcPending > 0 ? "text-amber-600" : ""} />
        <KpiCard title="COGS" value={loading ? "..." : formatCurrency(totals?.cogs || 0)} note="cost of goods sold" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="batches">Batch List</TabsTrigger>
          <TabsTrigger value="qc">QC Center</TabsTrigger>
          <TabsTrigger value="input">Input Batch</TabsTrigger>
        </TabsList>

        {/* ── Pipeline Tab ── */}
        <TabsContent value="pipeline" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Alur Produksi</CardTitle>
              <CardDescription>Setiap batch melewati 5 tahap. Klik batch di tab Batch List untuk update status.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-5">
                {pipelineStages.map((stage, i) => (
                  <div key={stage.id} className="relative">
                    {i < pipelineStages.length - 1 && (
                      <div className="hidden md:block absolute top-6 -right-2 text-muted-foreground text-lg z-10">→</div>
                    )}
                    <div className="rounded-xl border bg-muted/20 p-4 h-full">
                      <div className="text-2xl mb-1">{stage.icon}</div>
                      <div className="font-semibold text-sm">{stage.label}</div>
                      <div className="text-xs text-muted-foreground mt-1 min-h-[2.5rem]">{stage.description}</div>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-xl font-bold">{loading ? "..." : formatNumber(stage.batchCount)}</span>
                        <span className="text-xs text-muted-foreground">batch</span>
                      </div>
                      {stage.totalQty > 0 && (
                        <div className="text-xs text-muted-foreground">{formatNumber(stage.totalQty)} unit</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produksi per Brand</CardTitle>
              <CardDescription>Ringkasan batch dan biaya produksi per brand.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : data?.brands?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Brand</TableHead>
                      <TableHead className="text-right">Batch Aktif</TableHead>
                      <TableHead className="text-right">Qty Produksi</TableHead>
                      <TableHead className="text-right">Biaya Produksi</TableHead>
                      <TableHead className="text-right">HPP Avg</TableHead>
                      <TableHead className="text-right">Stock Est.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.brands.map((brand) => (
                      <TableRow key={brand.id}>
                        <TableCell className="font-medium">{brand.name}</TableCell>
                        <TableCell className="text-right">{formatNumber(brand.activeBatches)}</TableCell>
                        <TableCell className="text-right">{formatNumber(brand.productionQty)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(brand.productionCost)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(brand.avgHppPerUnit)}</TableCell>
                        <TableCell className="text-right">{formatNumber(brand.stockEstimate)} unit</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState title="Belum ada brand" description="Tambah brand & batch produksi untuk mulai tracking." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Batch List Tab ── */}
        <TabsContent value="batches" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Semua Batch Produksi</CardTitle>
                  <CardDescription>{filteredBatches.length} dari {batches.length} batch ditampilkan — data real-time dari Google Sheets</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select className="h-9 rounded-md border bg-background px-3 text-sm" value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}>
                    <option value="all">Semua Brand</option>
                    {data?.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <select className="h-9 rounded-md border bg-background px-3 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">Semua Status</option>
                    <option value="planned">Planned</option>
                    <option value="in progress">In Progress</option>
                    <option value="qc">QC</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : filteredBatches.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Batch Code</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">HPP/Unit</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>QC</TableHead>
                        <TableHead>Lokasi</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBatches.slice(0, 50).map((batch) => (
                        <TableRow key={batch.id}>
                          <TableCell className="whitespace-nowrap text-sm">{batch.date || "-"}</TableCell>
                          <TableCell className="font-medium text-sm">{batch.brandName || "-"}</TableCell>
                          <TableCell>
                            <div className="text-xs font-mono">{batch.batchCode || "-"}</div>
                            <div className="text-xs text-muted-foreground">{batch.sku || "-"}</div>
                          </TableCell>
                          <TableCell className="text-sm max-w-[180px] truncate">{batch.productName || "-"}</TableCell>
                          <TableCell className="text-right text-sm">{formatNumber(batch.qtyProduced)} {batch.unit}</TableCell>
                          <TableCell className="text-right text-sm">{formatCurrency(batch.hppPerUnit)}</TableCell>
                          <TableCell className="text-right text-sm font-medium">{formatCurrency(batch.totalProductionCost)}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(batch.status)} className="text-xs">{batch.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={qcStatusVariant(batch.qcStatus)} className="text-xs">{batch.qcStatus}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{batch.stockLocation || "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setEditBatch(batch)} title="Edit batch">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(batch.id)}
                                disabled={deleting === batch.id}
                                title="Hapus batch"
                                className="text-red-500 hover:text-red-700"
                              >
                                {deleting === batch.id ? "..." : <Trash2 className="h-3.5 w-3.5" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState title="Belum ada batch produksi" description="Input batch pertama melalui tab Input Batch." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── QC Center Tab ── */}
        <TabsContent value="qc" className="space-y-4 mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="QC Passed" value={formatNumber(qcPassed)} note="batch lolos" accent="text-green-600" />
            <KpiCard title="QC Pending" value={formatNumber(qcPending)} note="belum diperiksa" accent={qcPending > 0 ? "text-amber-600" : ""} />
            <KpiCard title="QC Rework" value={formatNumber(qcRework)} note="perlu perbaikan" accent={qcRework > 0 ? "text-orange-600" : ""} />
            <KpiCard title="QC Failed" value={formatNumber(qcFailed)} note="gagal QC" accent={qcFailed > 0 ? "text-red-600" : ""} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Batch Perlu QC</CardTitle>
              <CardDescription>Batch dengan status QC Unchecked atau Rework.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch Code</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>QC</TableHead>
                        <TableHead>Catatan</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batches
                        .filter((b) => b.qcStatus.toLowerCase() === "unchecked" || b.qcStatus.toLowerCase() === "rework")
                        .slice(0, 30)
                        .map((batch) => (
                          <TableRow key={batch.id}>
                            <TableCell className="font-mono text-xs">{batch.batchCode || "-"}</TableCell>
                            <TableCell className="font-medium text-sm">{batch.brandName || "-"}</TableCell>
                            <TableCell className="text-sm">{batch.productName || "-"}</TableCell>
                            <TableCell className="text-right text-sm">{formatNumber(batch.qtyProduced)} {batch.unit}</TableCell>
                            <TableCell>
                              <Badge variant={statusVariant(batch.status)} className="text-xs">{batch.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={qcStatusVariant(batch.qcStatus)} className="text-xs">{batch.qcStatus}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{batch.notes || "-"}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => setEditBatch(batch)} title="Update QC">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      {!batches.filter((b) => b.qcStatus.toLowerCase() === "unchecked" || b.qcStatus.toLowerCase() === "rework").length && (
                        <TableRow>
                          <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                            Semua batch sudah diperiksi QC. ✅
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Input Batch Tab ── */}
        <TabsContent value="input" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Input Batch Produksi Baru</CardTitle>
              <CardDescription>
                Catat batch produksi — data langsung tersimpan ke Google Sheets Brand_Production secara real-time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitBatch} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Brand *</Label>
                    <select name="brandId" required className="h-9 w-full rounded-md border bg-background px-3 text-sm" defaultValue="">
                      <option value="" disabled>Pilih brand</option>
                      {data?.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <Field name="date" label="Tanggal Produksi" type="date" defaultValue={today()} required />
                  <Field name="batchCode" label="Batch Code" defaultValue={genBatchCode()} placeholder="BATCH-2026-001" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field name="sku" label="SKU" placeholder="ARC-EDP-30" />
                  <Field name="productName" label="Nama Produk" placeholder="Eau de Parfum 30ml" required />
                  <Field name="productType" label="Tipe Produk" placeholder="Perfume" defaultValue="Perfume" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field name="qtyProduced" label="Qty Diproduksi" type="number" placeholder="100" required min={1} />
                  <Field name="unit" label="Unit" placeholder="pcs / botol / set" defaultValue="pcs" />
                  <Field name="stockLocation" label="Lokasi Stok" placeholder="Gudang / Booth" defaultValue="Gudang" />
                </div>
                <div>
                  <div className="text-sm font-semibold mb-2">Rincian Biaya (COGS)</div>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Field name="rawMaterialCost" label="Bahan Baku" type="number" placeholder="2500000" />
                    <Field name="bottlingCost" label="Bottling" type="number" placeholder="500000" />
                    <Field name="packagingCost" label="Packaging" type="number" placeholder="750000" />
                    <Field name="otherCost" label="Biaya Lain" type="number" placeholder="0" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Status Produksi</Label>
                    <select name="status" defaultValue="Planned" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                      <option value="Planned">Planned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="QC">QC</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">QC Status</Label>
                    <select name="qcStatus" defaultValue="Unchecked" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                      <option value="Unchecked">Unchecked</option>
                      <option value="Passed">Passed</option>
                      <option value="Rework">Rework</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">Catatan</Label>
                  <textarea name="notes" rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Formula, vendor, issue QC, dll" />
                </div>
                <Button type="submit" disabled={saving} className="w-full md:w-auto">
                  {saving ? "Menyimpan..." : "💾 Simpan Batch Produksi"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Sub-components ── */

function KpiCard({ title, value, note, accent = "" }: { title: string; value: string; note: string; accent?: string }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs text-muted-foreground font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-xl font-bold ${accent}`}>{value}</div>
        <div className="text-xs text-muted-foreground">{note}</div>
      </CardContent>
    </Card>
  );
}

function Field({ label, className = "", ...props }: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <Label className="mb-1 block text-xs text-muted-foreground">{label}</Label>
      <Input {...props} />
    </div>
  );
}
