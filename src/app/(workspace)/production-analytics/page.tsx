"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2 } from "lucide-react";

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
  id: string;
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "completed" || s === "done" || s === "pass" || s === "passed")
    return <Badge variant="success">{status}</Badge>;
  if (s === "pending" || s === "in progress" || s === "processing")
    return <Badge variant="warning">{status}</Badge>;
  if (s === "failed" || s === "reject" || s === "rejected")
    return <Badge variant="destructive">{status}</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

/* ── Main Page ── */

export default function ProductionAnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  // Overview
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Yield
  const [batches, setBatches] = useState<BatchYield[]>([]);
  const [yieldLoading, setYieldLoading] = useState(true);

  // Cost Variance
  const [variances, setVariances] = useState<CostVariance[]>([]);
  const [varianceLoading, setVarianceLoading] = useState(true);

  // Timeline
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);

  // Waste
  const [wasteEvents, setWasteEvents] = useState<WasteEvent[]>([]);
  const [wasteTotal, setWasteTotal] = useState(0);
  const [wasteLoading, setWasteLoading] = useState(true);

  // Monthly
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState(true);

  // Waste form
  const [wasteForm, setWasteForm] = useState({
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
  const [wasteMessage, setWasteMessage] = useState("");

  // Fetch all data
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch("/api/production/analytics");
      const json = await res.json();
      setAnalytics(json);
    } catch {
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const fetchYield = useCallback(async () => {
    setYieldLoading(true);
    try {
      const res = await fetch("/api/production/yield");
      const json = await res.json();
      setBatches(json.batches || []);
    } catch {
      setBatches([]);
    } finally {
      setYieldLoading(false);
    }
  }, []);

  const fetchVariance = useCallback(async () => {
    setVarianceLoading(true);
    try {
      const res = await fetch("/api/production/cost-variance");
      const json = await res.json();
      setVariances(json.variances || []);
    } catch {
      setVariances([]);
    } finally {
      setVarianceLoading(false);
    }
  }, []);

  const fetchTimeline = useCallback(async () => {
    setTimelineLoading(true);
    try {
      const res = await fetch("/api/production/timeline");
      const json = await res.json();
      setTimeline(json.timeline || []);
    } catch {
      setTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  const fetchWaste = useCallback(async () => {
    setWasteLoading(true);
    try {
      const res = await fetch("/api/production/waste");
      const json = await res.json();
      setWasteEvents(json.wasteEvents || []);
      setWasteTotal(json.totalWasteCost || 0);
    } catch {
      setWasteEvents([]);
    } finally {
      setWasteLoading(false);
    }
  }, []);

  const fetchMonthly = useCallback(async () => {
    setMonthlyLoading(true);
    try {
      const res = await fetch("/api/production/monthly");
      const json = await res.json();
      setMonthlySummary(json.monthlySummary || []);
    } catch {
      setMonthlySummary([]);
    } finally {
      setMonthlyLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    fetchYield();
    fetchVariance();
    fetchTimeline();
    fetchWaste();
    fetchMonthly();
  }, [fetchAnalytics, fetchYield, fetchVariance, fetchTimeline, fetchWaste, fetchMonthly]);

  // Waste form submit
  const handleWasteSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setWasteSubmitting(true);
    setWasteMessage("");
    try {
      const res = await fetch("/api/production/waste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchCode: wasteForm.batchCode,
          brand: wasteForm.brand,
          product: wasteForm.product,
          qtyRejected: parseFloat(wasteForm.qtyRejected) || 0,
          reason: wasteForm.reason,
          disposition: wasteForm.disposition,
          costImpact: parseFloat(wasteForm.costImpact) || 0,
          notes: wasteForm.notes,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setWasteMessage("✅ Waste event logged successfully");
        setWasteForm({
          batchCode: "",
          brand: "",
          product: "",
          qtyRejected: "",
          reason: "",
          disposition: "Scrap",
          costImpact: "",
          notes: "",
        });
        fetchWaste();
      } else {
        setWasteMessage(`❌ ${json.error || "Failed to log waste event"}`);
      }
    } catch {
      setWasteMessage("❌ Network error");
    } finally {
      setWasteSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">📊 Production Analytics</h1>
        <p className="text-muted-foreground">
          Analitik produksi parfum — yield, cost variance, waste tracking, dan ringkasan bulanan.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="yield">Yield Analysis</TabsTrigger>
          <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
          <TabsTrigger value="waste">Waste Tracking</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Overview ── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Batches</CardDescription>
                <CardTitle className="text-3xl">
                  {analyticsLoading ? <Skeleton className="h-8 w-20" /> : formatNumber(analytics?.totalBatches || 0)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Units Produced</CardDescription>
                <CardTitle className="text-3xl">
                  {analyticsLoading ? <Skeleton className="h-8 w-20" /> : formatNumber(analytics?.totalUnits || 0)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Avg HPP / Unit</CardDescription>
                <CardTitle className="text-3xl">
                  {analyticsLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(analytics?.avgHpp || 0)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Production Cost</CardDescription>
                <CardTitle className="text-3xl">
                  {analyticsLoading ? <Skeleton className="h-8 w-28" /> : formatCurrency(analytics?.totalCost || 0)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Timeline summary table */}
          <Card>
            <CardHeader>
              <CardTitle>Production Timeline</CardTitle>
              <CardDescription>Ringkasan produksi per brand per bulan</CardDescription>
            </CardHeader>
            <CardContent>
              {timelineLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : timeline.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No production data available</p>
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
                      <TableRow key={`${entry.month}-${entry.brand}-${i}`}>
                        <TableCell>{entry.month}</TableCell>
                        <TableCell>{entry.brand}</TableCell>
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

        {/* ── Tab 2: Yield Analysis ── */}
        <TabsContent value="yield">
          <Card>
            <CardHeader>
              <CardTitle>Yield Analysis</CardTitle>
              <CardDescription>Detail yield per batch — brand, product, qty, HPP, status, QC</CardDescription>
            </CardHeader>
            <CardContent>
              {yieldLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : batches.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No batch data available</p>
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
                    {batches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-mono text-sm">{batch.batchCode}</TableCell>
                        <TableCell>{batch.brand}</TableCell>
                        <TableCell>{batch.product}</TableCell>
                        <TableCell className="text-right">{formatNumber(batch.qty)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(batch.hppPerUnit)}</TableCell>
                        <TableCell>
                          <StatusBadge status={batch.status} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={batch.qcStatus} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Cost Analysis ── */}
        <TabsContent value="cost">
          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis</CardTitle>
              <CardDescription>Perbandingan HPP aktual vs target per batch</CardDescription>
            </CardHeader>
            <CardContent>
              {varianceLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : variances.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No cost data available</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch</TableHead>
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
                        <TableCell className="font-mono text-sm">{v.batchCode}</TableCell>
                        <TableCell>{v.brand}</TableCell>
                        <TableCell>{v.product}</TableCell>
                        <TableCell className="text-right">{formatCurrency(v.totalCost)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(v.actualHpp)}</TableCell>
                        <TableCell className="text-right">
                          {v.targetHpp > 0 ? formatCurrency(v.targetHpp) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {v.targetHpp > 0 ? (
                            <Badge variant={v.variancePct > 0 ? "destructive" : "success"}>
                              {v.variancePct > 0 ? "+" : ""}
                              {v.variancePct.toFixed(1)}%
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 4: Waste Tracking ── */}
        <TabsContent value="waste" className="space-y-4">
          {/* KPI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Waste Events</CardDescription>
                <CardTitle className="text-3xl">
                  {wasteLoading ? <Skeleton className="h-8 w-16" /> : wasteEvents.length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Waste Cost</CardDescription>
                <CardTitle className="text-3xl">
                  {wasteLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(wasteTotal)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Qty Rejected</CardDescription>
                <CardTitle className="text-3xl">
                  {wasteLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    formatNumber(wasteEvents.reduce((sum, w) => sum + w.qtyRejected, 0))
                  )}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Add waste form */}
          <Card>
            <CardHeader>
              <CardTitle>Log Waste Event</CardTitle>
              <CardDescription>Catat reject / damage / waste produksi</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWasteSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="waste-batch">Batch Code</Label>
                  <Input
                    id="waste-batch"
                    value={wasteForm.batchCode}
                    onChange={(e) => setWasteForm({ ...wasteForm, batchCode: e.target.value })}
                    placeholder="BATCH-001"
                  />
                </div>
                <div>
                  <Label htmlFor="waste-brand">Brand</Label>
                  <Input
                    id="waste-brand"
                    value={wasteForm.brand}
                    onChange={(e) => setWasteForm({ ...wasteForm, brand: e.target.value })}
                    placeholder="Brand name"
                  />
                </div>
                <div>
                  <Label htmlFor="waste-product">Product</Label>
                  <Input
                    id="waste-product"
                    value={wasteForm.product}
                    onChange={(e) => setWasteForm({ ...wasteForm, product: e.target.value })}
                    placeholder="Product name"
                  />
                </div>
                <div>
                  <Label htmlFor="waste-qty">Qty Rejected</Label>
                  <Input
                    id="waste-qty"
                    type="number"
                    value={wasteForm.qtyRejected}
                    onChange={(e) => setWasteForm({ ...wasteForm, qtyRejected: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="waste-reason">Reason</Label>
                  <Input
                    id="waste-reason"
                    value={wasteForm.reason}
                    onChange={(e) => setWasteForm({ ...wasteForm, reason: e.target.value })}
                    placeholder="Contoh: QC fail, damage"
                  />
                </div>
                <div>
                  <Label htmlFor="waste-disposition">Disposition</Label>
                  <select
                    id="waste-disposition"
                    value={wasteForm.disposition}
                    onChange={(e) => setWasteForm({ ...wasteForm, disposition: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="Rework">Rework</option>
                    <option value="Scrap">Scrap</option>
                    <option value="Return">Return</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="waste-cost">Cost Impact (IDR)</Label>
                  <Input
                    id="waste-cost"
                    type="number"
                    value={wasteForm.costImpact}
                    onChange={(e) => setWasteForm({ ...wasteForm, costImpact: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="waste-notes">Notes</Label>
                  <Input
                    id="waste-notes"
                    value={wasteForm.notes}
                    onChange={(e) => setWasteForm({ ...wasteForm, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-4 flex items-center gap-4">
                  <Button type="submit" disabled={wasteSubmitting}>
                    <Plus className="w-4 h-4 mr-2" />
                    {wasteSubmitting ? "Logging..." : "Log Waste Event"}
                  </Button>
                  {wasteMessage && (
                    <span className="text-sm">{wasteMessage}</span>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Waste events table */}
          <Card>
            <CardHeader>
              <CardTitle>Waste Events</CardTitle>
              <CardDescription>Daftar semua waste / reject events</CardDescription>
            </CardHeader>
            <CardContent>
              {wasteLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : wasteEvents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No waste events recorded</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Batch</TableHead>
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
                      <TableRow key={w.id}>
                        <TableCell>{w.date}</TableCell>
                        <TableCell className="font-mono text-sm">{w.batchCode}</TableCell>
                        <TableCell>{w.brand}</TableCell>
                        <TableCell>{w.product}</TableCell>
                        <TableCell className="text-right">{formatNumber(w.qtyRejected)}</TableCell>
                        <TableCell>{w.reason}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              w.disposition === "Scrap"
                                ? "destructive"
                                : w.disposition === "Rework"
                                ? "warning"
                                : "secondary"
                            }
                          >
                            {w.disposition}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(w.costImpact)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 5: Monthly Summary ── */}
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Production Summary</CardTitle>
              <CardDescription>Ringkasan produksi per brand per bulan</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : monthlySummary.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No monthly data available</p>
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
                        <TableCell>{entry.brand}</TableCell>
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
