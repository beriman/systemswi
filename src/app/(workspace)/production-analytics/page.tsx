"use client";

import { useCallback, useEffect, useState } from "react";
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

type TimelineEntry = {
  brand: string;
  month: string;
  batches: number;
  totalQty: number;
  totalCost: number;
  avgHpp: number;
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

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "done" || s === "passed" || s === "completed") return <Badge variant="success">{status}</Badge>;
  if (s === "in progress" || s === "rework") return <Badge variant="warning">{status}</Badge>;
  if (s === "failed" || s === "scrap" || s === "cancelled") return <Badge variant="destructive">{status}</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

function VarianceBadge({ pct }: { pct: number }) {
  if (pct > 5) return <Badge variant="destructive">+{pct.toFixed(1)}%</Badge>;
  if (pct > 0) return <Badge variant="warning">+{pct.toFixed(1)}%</Badge>;
  if (pct < -5) return <Badge variant="success">{pct.toFixed(1)}%</Badge>;
  return <Badge variant="secondary">{pct.toFixed(1)}%</Badge>;
}

/* ── KPI Card ── */

function KpiCard({ title, value, subtitle, icon }: { title: string; value: string; subtitle?: string; icon: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <span className="text-3xl">{icon}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Loading Skeleton ── */

function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-2">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Main Page ── */

export default function ProductionAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [batches, setBatches] = useState<BatchYield[]>([]);
  const [variances, setVariances] = useState<CostVariance[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [wasteEvents, setWasteEvents] = useState<WasteEvent[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Waste form state
  const [wasteForm, setWasteForm] = useState({
    productionId: "",
    batchCode: "",
    brand: "",
    product: "",
    qtyRejected: "",
    reason: "",
    disposition: "Scrap",
    costImpact: "",
    notes: "",
  });
  const [wasteSubmitting, setWasteSubmitting] = useState(false);
  const [wasteMessage, setWasteMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, yieldRes, varianceRes, timelineRes, wasteRes, monthlyRes] = await Promise.all([
        fetch("/api/production/analytics"),
        fetch("/api/production/yield"),
        fetch("/api/production/cost-variance"),
        fetch("/api/production/timeline"),
        fetch("/api/production/waste"),
        fetch("/api/production/monthly"),
      ]);

      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (yieldRes.ok) {
        const data = await yieldRes.json();
        setBatches(data.batches || []);
      }
      if (varianceRes.ok) {
        const data = await varianceRes.json();
        setVariances(data.variances || []);
      }
      if (timelineRes.ok) {
        const data = await timelineRes.json();
        setTimeline(data.timeline || []);
      }
      if (wasteRes.ok) {
        const data = await wasteRes.json();
        setWasteEvents(data.wasteEvents || []);
      }
      if (monthlyRes.ok) {
        const data = await monthlyRes.json();
        setMonthlySummary(data.monthlySummary || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleWasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWasteSubmitting(true);
    setWasteMessage(null);
    try {
      const res = await fetch("/api/production/waste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productionId: wasteForm.productionId,
          batchCode: wasteForm.batchCode,
          brand: wasteForm.brand,
          product: wasteForm.product,
          qtyRejected: parseInt(wasteForm.qtyRejected, 10) || 0,
          reason: wasteForm.reason,
          disposition: wasteForm.disposition,
          costImpact: parseFloat(wasteForm.costImpact) || 0,
          notes: wasteForm.notes,
        }),
      });
      if (res.ok) {
        setWasteMessage({ type: "success", text: "Waste event logged successfully!" });
        setWasteForm({ productionId: "", batchCode: "", brand: "", product: "", qtyRejected: "", reason: "", disposition: "Scrap", costImpact: "", notes: "" });
        fetchAll();
      } else {
        const data = await res.json();
        setWasteMessage({ type: "error", text: data.error || "Failed to log waste event" });
      }
    } catch (err: any) {
      setWasteMessage({ type: "error", text: err.message || "Failed to log waste event" });
    } finally {
      setWasteSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📊 Production Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analitik produksi parfum — yield, cost, waste, dan tren bulanan
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-destructive text-sm">⚠️ {error}</p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="yield">Yield Analysis</TabsTrigger>
          <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
          <TabsTrigger value="waste">Waste Tracking</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
        </TabsList>

        {/* ── Tab: Overview ── */}
        <TabsContent value="overview" className="space-y-4">
          {loading && !analytics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : analytics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  title="Total Batches"
                  value={formatNumber(analytics.totalBatches)}
                  subtitle="All production batches"
                  icon="🏭"
                />
                <KpiCard
                  title="Total Units"
                  value={formatNumber(analytics.totalUnits)}
                  subtitle="Produced across all batches"
                  icon="📦"
                />
                <KpiCard
                  title="Avg HPP / Unit"
                  value={formatCurrency(analytics.avgHpp)}
                  subtitle="Weighted average"
                  icon="💰"
                />
                <KpiCard
                  title="Total Cost"
                  value={formatCurrency(analytics.totalCost)}
                  subtitle="Sum of all batch costs"
                  icon="📊"
                />
              </div>

              {/* Quick timeline preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Production Timeline</CardTitle>
                  <CardDescription>Ringkasan produksi per brand per bulan</CardDescription>
                </CardHeader>
                <CardContent>
                  {timeline.length === 0 ? (
                    <EmptyState icon="📅" title="No timeline data" description="Production timeline will appear here once data is available." />
                  ) : (
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
                        {timeline.map((entry, i) => (
                          <TableRow key={`${entry.brand}-${entry.month}-${i}`}>
                            <TableCell>{entry.month}</TableCell>
                            <TableCell className="font-medium">{entry.brand}</TableCell>
                            <TableCell className="text-right">{formatNumber(entry.batches)}</TableCell>
                            <TableCell className="text-right">{formatNumber(entry.totalQty)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(entry.avgHpp)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(entry.totalCost)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <EmptyState icon="📊" title="No analytics data" description="Data will appear here once production records are available." />
          )}
        </TabsContent>

        {/* ── Tab: Yield Analysis ── */}
        <TabsContent value="yield" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Yield per Batch</CardTitle>
              <CardDescription>Detail yield dan HPP untuk setiap batch produksi</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && batches.length === 0 ? (
                <TableSkeleton rows={5} cols={8} />
              ) : batches.length === 0 ? (
                <EmptyState icon="📋" title="No batch data" description="Production batches will appear here once data is available." />
              ) : (
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
                    {batches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-mono text-xs">{batch.batchCode}</TableCell>
                        <TableCell className="font-medium">{batch.brand}</TableCell>
                        <TableCell>{batch.product}</TableCell>
                        <TableCell className="text-right">{formatNumber(batch.qty)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(batch.hppPerUnit)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(batch.totalProductionCost)}</TableCell>
                        <TableCell><StatusBadge status={batch.status} /></TableCell>
                        <TableCell><StatusBadge status={batch.qcStatus} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Cost Analysis ── */}
        <TabsContent value="cost" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Variance Analysis</CardTitle>
              <CardDescription>Perbandingan HPP aktual vs target per batch</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && variances.length === 0 ? (
                <TableSkeleton rows={5} cols={7} />
              ) : variances.length === 0 ? (
                <EmptyState icon="💰" title="No cost data" description="Cost variance data will appear here once production and target data are available." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Code</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Product</TableHead>
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
                        <TableCell className="font-medium">{v.brand}</TableCell>
                        <TableCell>{v.product}</TableCell>
                        <TableCell className="text-right">{formatCurrency(v.totalCost)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(v.actualHpp)}</TableCell>
                        <TableCell className="text-right">{v.targetHpp > 0 ? formatCurrency(v.targetHpp) : "—"}</TableCell>
                        <TableCell className="text-right">
                          {v.targetHpp > 0 ? <VarianceBadge pct={v.variancePct} /> : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Waste Tracking ── */}
        <TabsContent value="waste" className="space-y-4">
          {/* Add Waste Form */}
          <Card>
            <CardHeader>
              <CardTitle>Log Waste Event</CardTitle>
              <CardDescription>Catat waste / reject dari proses produksi</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWasteSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="waste-production-id">Production ID</Label>
                  <Input
                    id="waste-production-id"
                    value={wasteForm.productionId}
                    onChange={(e) => setWasteForm({ ...wasteForm, productionId: e.target.value })}
                    placeholder="PROD-2026-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waste-batch-code">Batch Code</Label>
                  <Input
                    id="waste-batch-code"
                    value={wasteForm.batchCode}
                    onChange={(e) => setWasteForm({ ...wasteForm, batchCode: e.target.value })}
                    placeholder="BATCH-2026-01-15-1001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waste-brand">Brand</Label>
                  <Input
                    id="waste-brand"
                    value={wasteForm.brand}
                    onChange={(e) => setWasteForm({ ...wasteForm, brand: e.target.value })}
                    placeholder="Aura Bloom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waste-product">Product</Label>
                  <Input
                    id="waste-product"
                    value={wasteForm.product}
                    onChange={(e) => setWasteForm({ ...wasteForm, product: e.target.value })}
                    placeholder="Aura Bloom EDP 100ml"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waste-qty">Qty Rejected</Label>
                  <Input
                    id="waste-qty"
                    type="number"
                    value={wasteForm.qtyRejected}
                    onChange={(e) => setWasteForm({ ...wasteForm, qtyRejected: e.target.value })}
                    placeholder="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waste-reason">Reason</Label>
                  <Input
                    id="waste-reason"
                    value={wasteForm.reason}
                    onChange={(e) => setWasteForm({ ...wasteForm, reason: e.target.value })}
                    placeholder="Off-note on mixing"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waste-disposition">Disposition</Label>
                  <Input
                    id="waste-disposition"
                    value={wasteForm.disposition}
                    onChange={(e) => setWasteForm({ ...wasteForm, disposition: e.target.value })}
                    placeholder="Scrap / Rework"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waste-cost">Cost Impact (IDR)</Label>
                  <Input
                    id="waste-cost"
                    type="number"
                    value={wasteForm.costImpact}
                    onChange={(e) => setWasteForm({ ...wasteForm, costImpact: e.target.value })}
                    placeholder="500000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waste-notes">Notes</Label>
                  <Input
                    id="waste-notes"
                    value={wasteForm.notes}
                    onChange={(e) => setWasteForm({ ...wasteForm, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={wasteSubmitting} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    {wasteSubmitting ? "Logging..." : "Log Waste"}
                  </Button>
                </div>
              </form>
              {wasteMessage && (
                <div className={`mt-4 p-3 rounded-md text-sm ${wasteMessage.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {wasteMessage.type === "success" ? "✅" : "❌"} {wasteMessage.text}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Waste Events Table */}
          <Card>
            <CardHeader>
              <CardTitle>Waste Events</CardTitle>
              <CardDescription>Daftar waste / reject yang tercatat</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && wasteEvents.length === 0 ? (
                <TableSkeleton rows={3} cols={8} />
              ) : wasteEvents.length === 0 ? (
                <EmptyState icon="🗑️" title="No waste events" description="Waste events will appear here once logged." />
              ) : (
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
                        <TableCell className="font-medium">{w.brand}</TableCell>
                        <TableCell>{w.product}</TableCell>
                        <TableCell className="text-right">{formatNumber(w.qtyRejected)}</TableCell>
                        <TableCell>{w.reason}</TableCell>
                        <TableCell><StatusBadge status={w.disposition} /></TableCell>
                        <TableCell className="text-right">{formatCurrency(w.costImpact)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Monthly Summary ── */}
        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Production Summary</CardTitle>
              <CardDescription>Ringkasan produksi per brand per bulan</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && monthlySummary.length === 0 ? (
                <TableSkeleton rows={5} cols={6} />
              ) : monthlySummary.length === 0 ? (
                <EmptyState icon="📅" title="No monthly data" description="Monthly production summary will appear here once data is available." />
              ) : (
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
                    {monthlySummary.map((entry, i) => (
                      <TableRow key={`${entry.month}-${entry.brand}-${i}`}>
                        <TableCell>{entry.month}</TableCell>
                        <TableCell className="font-medium">{entry.brand}</TableCell>
                        <TableCell className="text-right">{formatNumber(entry.batches)}</TableCell>
                        <TableCell className="text-right">{formatNumber(entry.totalQty)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(entry.avgHpp)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(entry.totalCost)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
