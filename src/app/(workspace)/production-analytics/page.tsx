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
  hppPerUnit: number;
  totalProductionCost: number;
  status: string;
  qcStatus: string;
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

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "done" || s === "passed") return <Badge className="bg-green-100 text-green-800">{status}</Badge>;
  if (s === "in progress" || s === "ongoing") return <Badge className="bg-yellow-100 text-yellow-800">{status}</Badge>;
  if (s === "failed" || s === "rejected" || s === "unchecked") return <Badge className="bg-red-100 text-red-800">{status}</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function varianceBadge(pct: number) {
  if (pct > 5) return <Badge className="bg-red-100 text-red-800">+{pct.toFixed(1)}%</Badge>;
  if (pct > 0) return <Badge className="bg-yellow-100 text-yellow-800">+{pct.toFixed(1)}%</Badge>;
  if (pct <= 0 && pct !== 0) return <Badge className="bg-green-100 text-green-800">{pct.toFixed(1)}%</Badge>;
  return <Badge variant="outline">N/A</Badge>;
}

/* ── KPI Card ── */

function KpiCard({ title, value, subtitle, icon }: { title: string; value: string; subtitle?: string; icon: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className="text-2xl">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

/* ── Waste Form Modal ── */

function WasteFormModal({ onSubmit, onClose }: { onSubmit: (data: Record<string, string>) => void; onClose: () => void }) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    formData.forEach ( (value, key) => { data[key] = value as string; });
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Log Waste Event</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><span>✕</span></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Date</Label>
            <Input type="date" name="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
          </div>
          <div>
            <Label>Production ID</Label>
            <Input name="productionId" placeholder="PROD-2026-001" required />
          </div>
          <div>
            <Label>Batch Code</Label>
            <Input name="batchCode" placeholder="BATCH-2026-01-15-1001" required />
          </div>
          <div>
            <Label>Brand</Label>
            <Input name="brand" placeholder="Aura Bloom" required />
          </div>
          <div>
            <Label>Product</Label>
            <Input name="product" placeholder="Aura Bloom EDP 100ml" required />
          </div>
          <div>
            <Label>Qty Rejected</Label>
            <Input name="qtyRejected" type="number" min="0" defaultValue="0" required />
          </div>
          <div>
            <Label>Reason</Label>
            <Input name="reason" placeholder="Off-note on mixing" required />
          </div>
          <div>
            <Label>Disposition</Label>
            <Input name="disposition" defaultValue="Scrap" required />
          </div>
          <div>
            <Label>Cost Impact (IDR)</Label>
            <Input name="costImpact" type="number" min="0" defaultValue="0" required />
          </div>
          <div>
            <Label>Notes</Label>
            <Input name="notes" placeholder="Additional notes" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">Submit</Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Page ── */

export default function ProductionAnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [showWasteForm, setShowWasteForm] = useState(false);

  // Data states
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [batches, setBatches] = useState<BatchYield[]>([]);
  const [variances, setVariances] = useState<CostVariance[]>([]);
  const [wasteEvents, setWasteEvents] = useState<WasteEvent[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, yieldRes, varianceRes, wasteRes, monthlyRes] = await Promise.all([
        fetch("/api/production/analytics"),
        fetch("/api/production/yield"),
        fetch("/api/production/cost-variance"),
        fetch("/api/production/waste"),
        fetch("/api/production/monthly"),
      ]);

      if (analyticsRes.ok) setSummary(await analyticsRes.json());
      if (yieldRes.ok) {
        const data = await yieldRes.json();
        setBatches(data.batches || []);
      }
      if (varianceRes.ok) {
        const data = await varianceRes.json();
        setVariances(data.variances || []);
      }
      if (wasteRes.ok) {
        const data = await wasteRes.json();
        setWasteEvents(data.wasteEvents || []);
      }
      if (monthlyRes.ok) {
        const data = await monthlyRes.json();
        setMonthlySummary(data.monthlySummary || []);
      }
    } catch (err) {
      console.error("Failed to fetch analytics data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleWasteSubmit = async (formData: Record<string, string>) => {
    try {
      const res = await fetch("/api/production/waste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          qtyRejected: parseInt(formData.qtyRejected || "0", 10),
          costImpact: parseFloat(formData.costImpact || "0"),
        }),
      });
      if (res.ok) {
        setShowWasteForm(false);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to log waste:", err);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Production Analytics</h1>
        <p className="text-muted-foreground mt-1">Analitik produksi parfum — yield, cost, waste &amp; monthly summary</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="yield">Yield Analysis</TabsTrigger>
          <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
          <TabsTrigger value="waste">Waste Tracking</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-4">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2"><Skeleton className="h-4 w-32" /></CardHeader>
                  <CardContent><Skeleton className="h-8 w-24" /></CardContent>
                </Card>
              ))}
            </div>
          ) : summary ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  title="Total Batches"
                  value={formatNumber(summary.totalBatches)}
                  subtitle="All production batches"
                  icon="🏭"
                />
                <KpiCard
                  title="Total Units"
                  value={formatNumber(summary.totalUnits)}
                  subtitle="Produced across all brands"
                  icon="📦"
                />
                <KpiCard
                  title="Avg HPP"
                  value={formatCurrency(summary.avgHpp)}
                  subtitle="Weighted avg per unit"
                  icon="💰"
                />
                <KpiCard
                  title="Total Cost"
                  value={formatCurrency(summary.totalCost)}
                  subtitle="Sum of all production costs"
                  icon="💸"
                />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Production Insights</CardTitle>
                  <CardDescription>Ringkasan metrik utama produksi</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Cost per batch (avg)</span>
                    <span className="text-sm font-medium">
                      {summary.totalBatches > 0 ? formatCurrency(summary.totalCost / summary.totalBatches) : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Units per batch (avg)</span>
                    <span className="text-sm font-medium">
                      {summary.totalBatches > 0 ? formatNumber(Math.round(summary.totalUnits / summary.totalBatches)) : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Waste events logged</span>
                    <span className="text-sm font-medium">{formatNumber(wasteEvents.length)}</span>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <EmptyState title="No data available" description="Seed production data to see analytics." />
          )}
        </TabsContent>

        {/* ── Yield Analysis Tab ── */}
        <TabsContent value="yield" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Yield Analysis</CardTitle>
              <CardDescription>Detail yield per batch — brand, product, qty, HPP, status, QC</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : batches.length > 0 ? (
                <div className="overflow-x-auto">
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
                      {batches.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="font-mono text-xs">{b.batchCode}</TableCell>
                          <TableCell>{b.brand}</TableCell>
                          <TableCell>{b.product}</TableCell>
                          <TableCell className="text-right">{formatNumber(b.qty)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(b.hppPerUnit)}</TableCell>
                          <TableCell>{statusBadge(b.status)}</TableCell>
                          <TableCell>{statusBadge(b.qcStatus)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState title="No batch data" description="No production batches found." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Cost Analysis Tab ── */}
        <TabsContent value="cost" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis</CardTitle>
              <CardDescription>Budget vs actual HPP — cost variance per batch</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : variances.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch Code</TableHead>
                        <TableHead>Brand</TableHead>
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
                          <TableCell className="text-right">{formatCurrency(v.totalCost)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(v.actualHpp)}</TableCell>
                          <TableCell className="text-right">{v.targetHpp > 0 ? formatCurrency(v.targetHpp) : "N/A"}</TableCell>
                          <TableCell className="text-right">{varianceBadge(v.variancePct)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState title="No variance data" description="No cost variance data available." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Waste Tracking Tab ── */}
        <TabsContent value="waste" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Waste Tracking</CardTitle>
                <CardDescription>Log and track waste/reject events per batch</CardDescription>
              </div>
              <Button onClick={() => setShowWasteForm(true)}>+ Log Waste</Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : wasteEvents.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Waste ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Batch Code</TableHead>
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
                          <TableCell>{statusBadge(w.disposition)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(w.costImpact)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState title="No waste events" description="No waste events logged yet. Click 'Log Waste' to add one." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Monthly Summary Tab ── */}
        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Production Summary</CardTitle>
              <CardDescription>Ringkasan produksi per bulan per brand</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : monthlySummary.length > 0 ? (
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
                      {monthlySummary.map((m, idx) => (
                        <TableRow key={`${m.month}-${m.brand}-${idx}`}>
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
              ) : (
                <EmptyState title="No monthly data" description="No monthly production summary available." />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Waste Form Modal */}
      {showWasteForm && (
        <WasteFormModal
          onSubmit={handleWasteSubmit}
          onClose={() => setShowWasteForm(false)}
        />
      )}
    </div>
  );
}
