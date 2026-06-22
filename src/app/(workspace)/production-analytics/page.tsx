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

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === "done" || s === "passed") return "bg-green-100 text-green-800";
  if (s === "in progress" || s === "unchecked") return "bg-yellow-100 text-yellow-800";
  if (s === "failed" || s === "rejected") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
}

function varianceColor(pct: number): string {
  if (pct <= 0) return "text-green-600";
  if (pct <= 5) return "text-yellow-600";
  return "text-red-600";
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

/* ── Waste Form Modal ── */

function WasteForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      qtyRejected: parseInt(form.qtyRejected, 10) || 0,
      costImpact: parseFloat(form.costImpact) || 0,
    });
  };

  const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Log Waste Event</CardTitle>
          <CardDescription>Record a new production waste / reject event</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Production ID</Label>
                <Input className={inputCls} value={form.productionId} onChange={(e) => setForm({ ...form, productionId: e.target.value })} />
              </div>
              <div>
                <Label>Batch Code</Label>
                <Input className={inputCls} value={form.batchCode} onChange={(e) => setForm({ ...form, batchCode: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Brand *</Label>
                <Input className={inputCls} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required />
              </div>
              <div>
                <Label>Product *</Label>
                <Input className={inputCls} value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Qty Rejected *</Label>
                <Input className={inputCls} type="number" value={form.qtyRejected} onChange={(e) => setForm({ ...form, qtyRejected: e.target.value })} required />
              </div>
              <div>
                <Label>Reason</Label>
                <Input className={inputCls} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Disposition</Label>
                <select className={inputCls} value={form.disposition} onChange={(e) => setForm({ ...form, disposition: e.target.value })}>
                  <option value="Scrap">Scrap</option>
                  <option value="Rework">Rework</option>
                  <option value="Return">Return</option>
                </select>
              </div>
              <div>
                <Label>Cost Impact (IDR)</Label>
                <Input className={inputCls} type="number" value={form.costImpact} onChange={(e) => setForm({ ...form, costImpact: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
              <Button type="submit">Log Waste Event</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Main Page ── */

export default function ProductionAnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [batches, setBatches] = useState<BatchYield[]>([]);
  const [variances, setVariances] = useState<CostVariance[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [wasteEvents, setWasteEvents] = useState<WasteEvent[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWasteForm, setShowWasteForm] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, yieldRes, varianceRes, timelineRes, wasteRes, monthlyRes] = await Promise.all([
        fetch("/api/production/analytics"),
        fetch("/api/production/yield"),
        fetch("/api/production/cost-variance"),
        fetch("/api/production/timeline"),
        fetch("/api/production/waste"),
        fetch("/api/production/monthly"),
      ]);

      const [analytics, yieldData, varianceData, timelineData, wasteData, monthlyData] = await Promise.all([
        analyticsRes.json(),
        yieldRes.json(),
        varianceRes.json(),
        timelineRes.json(),
        wasteRes.json(),
        monthlyRes.json(),
      ]);

      setSummary(analytics);
      setBatches(yieldData.batches || []);
      setVariances(varianceData.variances || []);
      setTimeline(timelineData.timeline || []);
      setWasteEvents(wasteData.wasteEvents || []);
      setMonthlySummary(monthlyData.monthlySummary || []);
    } catch (err) {
      console.error("Failed to fetch production analytics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleWasteSubmit = async (data: any) => {
    try {
      const res = await fetch("/api/production/waste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowWasteForm(false);
        fetchAll();
      }
    } catch (err) {
      console.error("Failed to log waste:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📊 Production Analytics</h1>
          <p className="text-muted-foreground">Analitik produksi parfum — yield, cost, waste & monthly summary</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="yield">Yield Analysis</TabsTrigger>
          <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
          <TabsTrigger value="waste">Waste Tracking</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
        </TabsList>

        {/* ── Tab: Overview ── */}
        <TabsContent value="overview" className="space-y-6">
          {loading || !summary ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard icon="🏭" title="Total Batches" value={formatNumber(summary.totalBatches)} subtitle="All production batches" />
              <KpiCard icon="📦" title="Total Units" value={formatNumber(summary.totalUnits)} subtitle="Units produced" />
              <KpiCard icon="💰" title="Avg HPP" value={formatCurrency(summary.avgHpp)} subtitle="Weighted avg per unit" />
              <KpiCard icon="💸" title="Total Cost" value={formatCurrency(summary.totalCost)} subtitle="All production costs" />
            </div>
          )}

          {/* Quick timeline preview */}
          <Card>
            <CardHeader>
              <CardTitle>Production Timeline</CardTitle>
              <CardDescription>Monthly production overview per brand</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton rows={4} cols={6} />
              ) : timeline.length === 0 ? (
                <EmptyState icon="📅" title="No timeline data" description="Seed production data to see the timeline." />
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
                    {timeline.map((t, i) => (
                      <TableRow key={`${t.month}-${t.brand}-${i}`}>
                        <TableCell>{t.month}</TableCell>
                        <TableCell>{t.brand}</TableCell>
                        <TableCell className="text-right">{formatNumber(t.batches)}</TableCell>
                        <TableCell className="text-right">{formatNumber(t.totalQty)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(t.avgHpp)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(t.totalCost)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Yield Analysis ── */}
        <TabsContent value="yield">
          <Card>
            <CardHeader>
              <CardTitle>Yield Analysis</CardTitle>
              <CardDescription>Per-batch yield data with HPP and QC status</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton rows={5} cols={8} />
              ) : batches.length === 0 ? (
                <EmptyState icon="📊" title="No batch data" description="Seed production data to see yield analysis." />
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
                            <Badge className={statusColor(b.status)}>{b.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColor(b.qcStatus)}>{b.qcStatus}</Badge>
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

        {/* ── Tab: Cost Analysis ── */}
        <TabsContent value="cost">
          <Card>
            <CardHeader>
              <CardTitle>Cost Variance Analysis</CardTitle>
              <CardDescription>Budget vs actual HPP per batch with variance percentage</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton rows={5} cols={7} />
              ) : variances.length === 0 ? (
                <EmptyState icon="💰" title="No cost data" description="Seed production and target data to see cost variance." />
              ) : (
                <div className="overflow-x-auto">
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
                          <TableCell>{v.brand}</TableCell>
                          <TableCell>{v.product}</TableCell>
                          <TableCell className="text-right">{formatCurrency(v.totalCost)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(v.actualHpp)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(v.targetHpp)}</TableCell>
                          <TableCell className={`text-right font-medium ${varianceColor(v.variancePct)}`}>
                            {v.variancePct > 0 ? "+" : ""}{v.variancePct.toFixed(2)}%
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

        {/* ── Tab: Waste Tracking ── */}
        <TabsContent value="waste" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowWasteForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Log Waste Event
            </Button>
          </div>

          {showWasteForm && (
            <WasteForm onSubmit={handleWasteSubmit} onCancel={() => setShowWasteForm(false)} />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Waste Events</CardTitle>
              <CardDescription>Production waste and reject tracking</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton rows={3} cols={8} />
              ) : wasteEvents.length === 0 ? (
                <EmptyState icon="🗑️" title="No waste events" description="No waste events recorded yet. Click 'Log Waste Event' to add one." />
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
                        <TableHead>Notes</TableHead>
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
                            <Badge variant="outline">{w.disposition}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(w.costImpact)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{w.notes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Monthly Summary ── */}
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Production Summary</CardTitle>
              <CardDescription>Aggregated production data grouped by month and brand</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton rows={5} cols={6} />
              ) : monthlySummary.length === 0 ? (
                <EmptyState icon="📅" title="No monthly data" description="Seed production data to see monthly summary." />
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
                          <TableCell>{m.month}</TableCell>
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
