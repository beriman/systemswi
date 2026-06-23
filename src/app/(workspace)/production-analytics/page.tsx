"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

function qcVariant(s: string): "default" | "destructive" | "outline" | "secondary" {
  const v = s.toLowerCase();
  if (v === "passed") return "default";
  if (v === "failed") return "destructive";
  if (v === "rework") return "secondary";
  return "outline";
}

function varianceColor(pct: number): string {
  if (pct <= 0) return "text-green-600";
  if (pct <= 10) return "text-amber-600";
  return "text-red-600";
}

/* ── KPI Card ── */

function KpiCard({ title, value, note, accent }: { title: string; value: string; note?: string; accent?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${accent || ""}`}>{value}</div>
        {note && <p className="text-xs text-muted-foreground mt-1">{note}</p>}
      </CardContent>
    </Card>
  );
}

/* ── Main Component ── */

export default function ProductionAnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [batches, setBatches] = useState<BatchYield[]>([]);
  const [variances, setVariances] = useState<CostVariance[]>([]);
  const [wasteEvents, setWasteEvents] = useState<WasteEvent[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);

  // Waste form state
  const [wasteSubmitting, setWasteSubmitting] = useState(false);
  const [wasteSuccess, setWasteSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, yieldRes, varianceRes, wasteRes, monthlyRes] = await Promise.all([
        fetch("/api/production/analytics", { cache: "no-store" }),
        fetch("/api/production/yield", { cache: "no-store" }),
        fetch("/api/production/cost-variance", { cache: "no-store" }),
        fetch("/api/production/waste", { cache: "no-store" }),
        fetch("/api/production/monthly", { cache: "no-store" }),
      ]);

      if (analyticsRes.ok) {
        const json = await analyticsRes.json();
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

  // Waste form handler
  async function handleWasteSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setWasteSubmitting(true);
    setWasteSuccess(null);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/production/waste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productionId: String(form.get("productionId") || ""),
          batchCode: String(form.get("batchCode") || ""),
          brand: String(form.get("brand") || ""),
          product: String(form.get("product") || ""),
          qtyRejected: Number(form.get("qtyRejected") || 0),
          reason: String(form.get("reason") || ""),
          disposition: String(form.get("disposition") || "Scrap"),
          costImpact: Number(form.get("costImpact") || 0),
          notes: String(form.get("notes") || ""),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mencatat waste event");
      setWasteSuccess(`Waste event ${json.wasteId} berhasil dicatat`);
      e.currentTarget.reset();
      await loadData();
    } catch (err) {
      setError(String(err));
    } finally {
      setWasteSubmitting(false);
    }
  }

  // Derived stats
  const totalWasteQty = wasteEvents.reduce((s, w) => s + w.qtyRejected, 0);
  const totalWasteCost = wasteEvents.reduce((s, w) => s + w.costImpact, 0);
  const passedQc = batches.filter((b) => b.qcStatus.toLowerCase() === "passed").length;

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
        <Button onClick={loadData} disabled={loading} variant="outline">
          {loading ? "Memuat..." : "↻ Refresh"}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
          <CardContent className="py-4 text-red-700 dark:text-red-300 text-sm">{error}</CardContent>
        </Card>
      )}

      {wasteSuccess && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
          <CardContent className="py-4 text-green-700 dark:text-green-300 text-sm">{wasteSuccess}</CardContent>
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
              note="semua brand"
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
              title="QC Passed"
              value={loading ? "..." : formatNumber(passedQc)}
              note={`dari ${batches.length} batch`}
              accent="text-green-600"
            />
            <KpiCard
              title="Waste Events"
              value={loading ? "..." : formatNumber(wasteEvents.length)}
              note={`${formatNumber(totalWasteQty)} unit rejected`}
              accent={wasteEvents.length > 0 ? "text-amber-600" : ""}
            />
            <KpiCard
              title="Waste Cost Impact"
              value={loading ? "..." : formatCurrency(totalWasteCost)}
              note="total kerugian"
              accent={totalWasteCost > 0 ? "text-red-600" : ""}
            />
            <KpiCard
              title="Brands Active"
              value={loading ? "..." : formatNumber(new Set(batches.map((b) => b.brand)).size)}
              note="brand diproduksi"
            />
          </div>

          {/* Quick brand breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Production Summary</CardTitle>
              <CardDescription>Ringkasan produksi per brand</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-32 w-full" />
              ) : batches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada data produksi</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Brand</TableHead>
                      <TableHead className="text-right">Batches</TableHead>
                      <TableHead className="text-right">Total Qty</TableHead>
                      <TableHead className="text-right">Avg HPP</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(
                      batches.reduce<Record<string, { count: number; qty: number; hppSum: number; qtySum: number; cost: number }>>((acc, b) => {
                        if (!acc[b.brand]) acc[b.brand] = { count: 0, qty: 0, hppSum: 0, qtySum: 0, cost: 0 };
                        acc[b.brand].count += 1;
                        acc[b.brand].qty += b.qty;
                        acc[b.brand].hppSum += b.hppPerUnit * b.qty;
                        acc[b.brand].qtySum += b.qty;
                        acc[b.brand].cost += b.totalProductionCost;
                        return acc;
                      }, {})
                  ).map(([brand, data]) => (
                    <TableRow key={brand}>
                      <TableCell className="font-medium">{brand}</TableCell>
                      <TableCell className="text-right">{data.count}</TableCell>
                      <TableCell className="text-right">{formatNumber(data.qty)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.qtySum > 0 ? data.hppSum / data.qtySum : 0)}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(data.cost)}</TableCell>
                    </TableRow>
                  )}
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Yield Analysis Tab ── */}
        <TabsContent value="yield" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Yield per Batch</CardTitle>
              <CardDescription>Detail yield dan HPP setiap batch produksi</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : batches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada data batch</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch Code</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Product</TableHead>
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
                          <TableCell className="text-right">{formatNumber(b.qty)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(b.hppPerUnit)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(b.totalProductionCost)}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={qcVariant(b.qcStatus)}>{b.qcStatus}</Badge>
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

        {/* ── Cost Analysis Tab ── */}
        <TabsContent value="cost" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Variance Analysis</CardTitle>
              <CardDescription>Perbandingan HPP aktual vs target per batch</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : variances.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada data cost variance</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                        <TableHead className="text-right">HPP/Unit</TableHead>
                        <TableHead className="text-right">Target</TableHead>
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
                          <TableCell className="text-right">{formatCurrency(v.targetHpp)}</TableCell>
                          <TableCell className={`text-right font-semibold ${varianceColor(v.variancePct)}`}>
                            {v.variancePct > 0 ? "+" : ""}
                            {v.variancePct.toFixed(2)}%
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
              <CardDescription>Catat event waste / reject produksi</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWasteSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Production ID</Label>
                    <Input name="productionId" placeholder="PROD-2026-001" />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Batch Code</Label>
                    <Input name="batchCode" placeholder="BATCH-2026-01-15-1001" />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Brand</Label>
                    <Input name="brand" placeholder="Aura Bloom" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Product</Label>
                    <Input name="product" placeholder="Aura Bloom EDP 100ml" />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Qty Rejected</Label>
                    <Input name="qtyRejected" type="number" min={0} placeholder="0" />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Disposition</Label>
                    <Select name="disposition" defaultValue="Scrap">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Scrap">Scrap</SelectItem>
                        <SelectItem value="Rework">Rework</SelectItem>
                        <SelectItem value="Repack">Repack</SelectItem>
                        <SelectItem value="Donate">Donate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Reason</Label>
                    <Input name="reason" placeholder="Off-note on mixing" />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Cost Impact (Rp)</Label>
                    <Input name="costImpact" type="number" min={0} placeholder="0" />
                  </div>
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">Notes</Label>
                  <Textarea name="notes" rows={2} placeholder="Keterangan tambahan..." />
                </div>
                <Button type="submit" disabled={wasteSubmitting}>
                  {wasteSubmitting ? "Menyimpan..." : "➕ Log Waste Event"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Waste Events Table */}
          <Card>
            <CardHeader>
              <CardTitle>Waste Events</CardTitle>
              <CardDescription>Daftar event waste / reject produksi</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-32 w-full" />
              ) : wasteEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada waste event</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Waste ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty Rej.</TableHead>
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
                            <Badge variant={w.disposition === "Scrap" ? "destructive" : "secondary"}>
                              {w.disposition}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCurrency(w.costImpact)}
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

        {/* ── Monthly Summary Tab ── */}
        <TabsContent value="monthly" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Production Summary</CardTitle>
              <CardDescription>Ringkasan produksi per bulan per brand</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : monthlySummary.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada data produksi bulanan</p>
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
                          <TableCell className="font-medium">{m.brand}</TableCell>
                          <TableCell className="text-right">{m.batches}</TableCell>
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
