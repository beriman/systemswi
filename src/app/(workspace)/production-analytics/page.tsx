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
import { Plus, RefreshCw } from "lucide-react";

/* ── Types ── */

type AnalyticsSummary = {
  totalBatches: number;
  totalUnits: number;
  avgHpp: number;
  totalCost: number;
};

type BatchYield = {
  id: string;
  date: string;
  brand: string;
  sku: string;
  product: string;
  batchCode: string;
  qty: number;
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
};

type CostVariance = {
  id: string;
  batchCode: string;
  brand: string;
  product: string;
  date: string;
  month: string;
  qty: number;
  totalCost: number;
  actualHpp: number;
  targetHpp: number;
  variancePct: number;
};

type WasteEvent = {
  wasteId: string;
  date: string;
  productionId: string;
  batchCode: string;
  brand: string;
  product: string;
  qtyRejected: number;
  reason: string;
  disposition: string;
  costImpact: number;
  notes: string;
};

type MonthlySummary = {
  month: string;
  brand: string;
  batches: number;
  totalQty: number;
  avgHpp: number;
  totalCost: number;
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

function statusVariant(s: string): "default" | "destructive" | "outline" | "secondary" {
  const v = s.toLowerCase();
  if (v === "done" || v === "completed") return "default";
  if (v === "in progress") return "secondary";
  if (v === "qc") return "secondary";
  return "outline";
}

function qcStatusVariant(s: string): "default" | "destructive" | "outline" | "secondary" {
  const v = s.toLowerCase();
  if (v === "passed") return "default";
  if (v === "failed") return "destructive";
  if (v === "rework") return "secondary";
  return "outline";
}

/* ── KPI Card ── */

function KpiCard({ title, value, note, accent = "" }: { title: string; value: string; note: string; accent?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${accent}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{note}</p>
      </CardContent>
    </Card>
  );
}

/* ── Main Component ── */

export default function ProductionAnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  // Data states
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [batches, setBatches] = useState<BatchYield[]>([]);
  const [variances, setVariances] = useState<CostVariance[]>([]);
  const [wasteEvents, setWasteEvents] = useState<WasteEvent[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Waste form state
  const [wasteForm, setWasteForm] = useState({
    brand: "",
    product: "",
    qtyRejected: "",
    reason: "",
    disposition: "Scrap",
    costImpact: "",
    notes: "",
  });
  const [wasteSubmitting, setWasteSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, yieldRes, varianceRes, wasteRes, monthlyRes] = await Promise.all([
        fetch("/api/production/analytics", { cache: "no-store" }),
        fetch("/api/production/yield", { cache: "no-store" }),
        fetch("/api/production/cost-variance", { cache: "no-store" }),
        fetch("/api/production/waste", { cache: "no-store" }),
        fetch("/api/production/monthly", { cache: "no-store" }),
      ]);

      if (summaryRes.ok) {
        const json = await summaryRes.json();
        setSummary(json);
      }
      if (yieldRes.ok) {
        const json = await yieldRes.json();
        setBatches(json.batches || []);
      }
      if (varianceRes.ok) {
        const json = await varianceRes.json();
        setVariances(json.variances || []);
      }
      if (wasteRes.ok) {
        const json = await wasteRes.json();
        setWasteEvents(json.wasteEvents || []);
      }
      if (monthlyRes.ok) {
        const json = await monthlyRes.json();
        setMonthlySummary(json.monthlySummary || []);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function submitWaste(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setWasteSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/production/waste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: wasteForm.brand,
          product: wasteForm.product,
          qtyRejected: Number(wasteForm.qtyRejected) || 0,
          reason: wasteForm.reason,
          disposition: wasteForm.disposition,
          costImpact: Number(wasteForm.costImpact) || 0,
          notes: wasteForm.notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mencatat waste event");
      setWasteForm({ brand: "", product: "", qtyRejected: "", reason: "", disposition: "Scrap", costImpact: "", notes: "" });
      await loadData();
    } catch (err) {
      setError(String(err));
    } finally {
      setWasteSubmitting(false);
    }
  }

  // Derived
  const totalWasteCost = wasteEvents.reduce((s, w) => s + w.costImpact, 0);
  const totalWasteQty = wasteEvents.reduce((s, w) => s + w.qtyRejected, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">📊 Production Analytics</h2>
          <p className="text-muted-foreground">
            Analitik produksi parfum: yield, cost variance, waste tracking, dan ringkasan bulanan.
          </p>
        </div>
        <Button onClick={loadData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          {loading ? "Memuat..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
          <CardContent className="py-4 text-red-700 dark:text-red-300 text-sm">{error}</CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="yield">Yield Analysis</TabsTrigger>
          <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
          <TabsTrigger value="waste">Waste Tracking</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Total Batches"
              value={loading ? "..." : formatNumber(summary?.totalBatches || 0)}
              note="semua produksi"
            />
            <KpiCard
              title="Total Units"
              value={loading ? "..." : formatNumber(summary?.totalUnits || 0)}
              note="unit diproduksi"
            />
            <KpiCard
              title="Avg HPP"
              value={loading ? "..." : formatCurrency(summary?.avgHpp || 0)}
              note="per unit (weighted)"
            />
            <KpiCard
              title="Total Cost"
              value={loading ? "..." : formatCurrency(summary?.totalCost || 0)}
              note="semua batch"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Waste Events"
              value={loading ? "..." : formatNumber(wasteEvents.length)}
              note="kejadian reject"
            />
            <KpiCard
              title="Waste Qty"
              value={loading ? "..." : formatNumber(totalWasteQty)}
              note="unit ditolak"
            />
            <KpiCard
              title="Waste Cost Impact"
              value={loading ? "..." : formatCurrency(totalWasteCost)}
              note="kerugian akibat waste"
              accent="text-red-600"
            />
            <KpiCard
              title="Brands Active"
              value={loading ? "..." : formatNumber(new Set(batches.map((b) => b.brand)).size)}
              note="brand diproduksi"
            />
          </div>

          {/* Quick batch list */}
          <Card>
            <CardHeader>
              <CardTitle>Batch Terbaru</CardTitle>
              <CardDescription>5 batch produksi terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : batches.length === 0 ? (
                <EmptyState title="Belum ada data produksi" description="Data batch akan muncul di sini setelah produksi dimulai." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Code</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">HPP/Unit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>QC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.slice(0, 5).map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-xs">{b.batchCode}</TableCell>
                        <TableCell>{b.brand}</TableCell>
                        <TableCell>{b.product}</TableCell>
                        <TableCell className="text-right">{formatNumber(b.qty)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(b.hppPerUnit)}</TableCell>
                        <TableCell><Badge variant={statusVariant(b.status)}>{b.status}</Badge></TableCell>
                        <TableCell><Badge variant={qcStatusVariant(b.qcStatus)}>{b.qcStatus}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Yield Analysis Tab ── */}
        <TabsContent value="yield" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Yield Analysis</CardTitle>
              <CardDescription>Detail yield per batch: brand, product, qty, HPP, status, dan QC</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-60 w-full" />
              ) : batches.length === 0 ? (
                <EmptyState title="Belum ada data yield" description="Data yield batch akan muncul di sini." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch Code</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">HPP/Unit</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>QC</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batches.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="font-mono text-xs">{b.batchCode}</TableCell>
                          <TableCell>{b.brand}</TableCell>
                          <TableCell>{b.product}</TableCell>
                          <TableCell>{b.date}</TableCell>
                          <TableCell className="text-right">{formatNumber(b.qty)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(b.hppPerUnit)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(b.totalProductionCost)}</TableCell>
                          <TableCell><Badge variant={statusVariant(b.status)}>{b.status}</Badge></TableCell>
                          <TableCell><Badge variant={qcStatusVariant(b.qcStatus)}>{b.qcStatus}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Cost Analysis Tab ── */}
        <TabsContent value="cost" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Variance Analysis</CardTitle>
              <CardDescription>Perbandingan HPP aktual vs target per batch</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-60 w-full" />
              ) : variances.length === 0 ? (
                <EmptyState title="Belum ada data cost variance" description="Data variance akan muncul setelah ada data produksi dan target." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch Code</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                        <TableHead className="text-right">HPP/Unit</TableHead>
                        <TableHead className="text-right">Target HPP</TableHead>
                        <TableHead className="text-right">Variance %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variances.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell className="font-mono text-xs">{v.batchCode}</TableCell>
                          <TableCell>{v.brand}</TableCell>
                          <TableCell>{v.product}</TableCell>
                          <TableCell>{v.month}</TableCell>
                          <TableCell className="text-right">{formatCurrency(v.totalCost)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(v.actualHpp)}</TableCell>
                          <TableCell className="text-right">{v.targetHpp > 0 ? formatCurrency(v.targetHpp) : "—"}</TableCell>
                          <TableCell className="text-right">
                            {v.targetHpp > 0 ? (
                              <span className={v.variancePct > 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                                {v.variancePct > 0 ? "+" : ""}{v.variancePct.toFixed(1)}%
                              </span>
                            ) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Waste Tracking Tab ── */}
        <TabsContent value="waste" className="space-y-4 mt-4">
          {/* Add Waste Form */}
          <Card>
            <CardHeader>
              <CardTitle>Log Waste Event</CardTitle>
              <CardDescription>Catat kejadian reject / waste produksi</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitWaste} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Brand *</Label>
                    <Input
                      value={wasteForm.brand}
                      onChange={(e) => setWasteForm((f) => ({ ...f, brand: e.target.value }))}
                      placeholder="Nama brand"
                      required
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Product *</Label>
                    <Input
                      value={wasteForm.product}
                      onChange={(e) => setWasteForm((f) => ({ ...f, product: e.target.value }))}
                      placeholder="Nama produk"
                      required
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Qty Rejected *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={wasteForm.qtyRejected}
                      onChange={(e) => setWasteForm((f) => ({ ...f, qtyRejected: e.target.value }))}
                      placeholder="Jumlah unit ditolak"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Reason</Label>
                    <Input
                      value={wasteForm.reason}
                      onChange={(e) => setWasteForm((f) => ({ ...f, reason: e.target.value }))}
                      placeholder="Alasan reject"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Disposition</Label>
                    <select
                      value={wasteForm.disposition}
                      onChange={(e) => setWasteForm((f) => ({ ...f, disposition: e.target.value }))}
                      className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                    >
                      <option value="Scrap">Scrap</option>
                      <option value="Rework">Rework</option>
                      <option value="Recycle">Recycle</option>
                    </select>
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Cost Impact (IDR)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={wasteForm.costImpact}
                      onChange={(e) => setWasteForm((f) => ({ ...f, costImpact: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">Notes</Label>
                  <Input
                    value={wasteForm.notes}
                    onChange={(e) => setWasteForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Catatan tambahan"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={wasteSubmitting}>
                    <Plus className="h-4 w-4 mr-2" />
                    {wasteSubmitting ? "Menyimpan..." : "Log Waste Event"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Waste Events Table */}
          <Card>
            <CardHeader>
              <CardTitle>Waste Events</CardTitle>
              <CardDescription>
                {wasteEvents.length} kejadian | Total: {formatNumber(totalWasteQty)} unit | Cost impact: {formatCurrency(totalWasteCost)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : wasteEvents.length === 0 ? (
                <EmptyState title="Belum ada waste event" description="Waste event akan muncul di sini setelah dicatat." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Waste ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Batch Code</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty Rejected</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Disposition</TableHead>
                        <TableHead className="text-right">Cost Impact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wasteEvents.map((w) => (
                        <TableRow key={w.wasteId}>
                          <TableCell className="font-mono text-xs">{w.wasteId}</TableCell>
                          <TableCell>{w.date}</TableCell>
                          <TableCell className="font-mono text-xs">{w.batchCode}</TableCell>
                          <TableCell>{w.brand}</TableCell>
                          <TableCell>{w.product}</TableCell>
                          <TableCell className="text-right">{formatNumber(w.qtyRejected)}</TableCell>
                          <TableCell>{w.reason}</TableCell>
                          <TableCell>
                            <Badge variant={w.disposition === "Scrap" ? "destructive" : w.disposition === "Rework" ? "secondary" : "outline"}>
                              {w.disposition}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-red-600">{formatCurrency(w.costImpact)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Monthly Summary Tab ── */}
        <TabsContent value="monthly" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Production Summary</CardTitle>
              <CardDescription>Ringkasan produksi per brand per bulan</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-60 w-full" />
              ) : monthlySummary.length === 0 ? (
                <EmptyState title="Belum ada data bulanan" description="Data ringkasan bulanan akan muncul di sini." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead className="text-right">Batches</TableHead>
                        <TableHead className="text-right">Total Qty</TableHead>
                        <TableHead className="text-right">Avg HPP</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlySummary.map((m, i) => (
                        <TableRow key={`${m.month}-${m.brand}-${i}`}>
                          <TableCell className="font-mono">{m.month}</TableCell>
                          <TableCell>{m.brand}</TableCell>
                          <TableCell className="text-right">{formatNumber(m.batches)}</TableCell>
                          <TableCell className="text-right">{formatNumber(m.totalQty)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(m.avgHpp)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(m.totalCost)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
