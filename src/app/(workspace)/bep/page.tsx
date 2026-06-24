"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

/* ── Types ── */

type BEPRow = {
  calculationId: string;
  brand: string;
  product: string;
  fixedCost: number;
  variableCostPerUnit: number;
  sellingPricePerUnit: number;
  contributionMargin: number;
  bepUnits: number;
  bepRevenue: number;
  currentSales: number;
  marginOfSafety: number;
  profitLoss: number;
};

type SummaryData = {
  brands: Array<{
    brand: string;
    product: string;
    fixedCost: number;
    variableCostPerUnit: number;
    sellingPricePerUnit: number;
    contributionMargin: number;
    bepUnits: number;
    bepRevenue: number;
    currentSales: number;
    marginOfSafety: number;
    profitLoss: number;
    status: "profit" | "loss" | "break-even";
  }>;
  totalFixedCosts: number;
  totalProfitLoss: number;
  profitableCount: number;
  lossCount: number;
};

type WhatIfResult = {
  scenarioId: string;
  brand: string;
  product: string;
  fixedCost: number;
  variableCostPerUnit: number;
  sellingPricePerUnit: number;
  currentSales: number;
  contributionMargin: number;
  bepUnits: number;
  bepRevenue: number;
  marginOfSafety: number;
  profitLoss: number;
  priceChange: number;
  volumeChange: number;
  costChange: number;
};

/* ── Helpers ── */

function formatRp(n: number): string {
  if (n === 0) return "Rp 0";
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("id-ID");
  return n < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

function formatNum(n: number): string {
  return n.toLocaleString("id-ID");
}

function statusVariant(status: string): "default" | "destructive" | "outline" {
  return status === "profit" ? "default" : status === "loss" ? "destructive" : "outline";
}

/* ── KPI Card ── */

function KpiCard({
  title, value, note, accent,
}: {
  title: string; value: string; note?: string; accent?: string;
}) {
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

export default function BEPPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [bepData, setBepData] = useState<BEPRow[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  // Calculator form state
  const [calcBrand, setCalcBrand] = useState("");
  const [calcProduct, setCalcProduct] = useState("");
  const [calcFixedCost, setCalcFixedCost] = useState("");
  const [calcVariableCost, setCalcVariableCost] = useState("");
  const [calcSellingPrice, setCalcSellingPrice] = useState("");
  const [calcCurrentSales, setCalcCurrentSales] = useState("");
  const [calcResult, setCalcResult] = useState<BEPRow | null>(null);
  const [calcSaving, setCalcSaving] = useState(false);

  // What-if state
  const [wiBrand, setWiBrand] = useState("");
  const [wiProduct, setWiProduct] = useState("");
  const [wiFixedCost, setWiFixedCost] = useState("");
  const [wiVariableCost, setWiVariableCost] = useState("");
  const [wiSellingPrice, setWiSellingPrice] = useState("");
  const [wiCurrentSales, setWiCurrentSales] = useState("");
  const [wiPriceChange, setWiPriceChange] = useState(0);
  const [wiVolumeChange, setWiVolumeChange] = useState(0);
  const [wiCostChange, setWiCostChange] = useState(0);
  const [wiResult, setWiResult] = useState<WhatIfResult | null>(null);
  const [wiSaving, setWiSaving] = useState(false);

  // Load data
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, summaryRes] = await Promise.all([
        fetch("/api/bep", { cache: "no-store" }),
        fetch("/api/bep/summary", { cache: "no-store" }),
      ]);
      if (listRes.ok) {
        const j = await listRes.json();
        setBepData(j.data || []);
      }
      if (summaryRes.ok) {
        const j = await summaryRes.json();
        setSummary(j);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Seed handler
  async function handleSeed() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bep/seed", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal seed data");
      await loadAll();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  // Calculate BEP (local preview)
  function previewCalc() {
    const fc = Number(calcFixedCost) || 0;
    const vc = Number(calcVariableCost) || 0;
    const sp = Number(calcSellingPrice) || 0;
    const cs = Number(calcCurrentSales) || 0;
    if (fc <= 0 || sp <= 0 || vc < 0) return null;
    const cm = sp - vc;
    if (cm <= 0) return null;
    const bepUnits = Math.ceil(fc / cm);
    const bepRevenue = bepUnits * sp;
    const mos = cs > 0 ? Math.round(((cs - bepUnits) / cs) * 100 * 100) / 100 : 0;
    const profit = cs * cm - fc;
    return { contributionMargin: cm, bepUnits, bepRevenue, marginOfSafety: mos, profitLoss: profit };
  }

  // Submit BEP calculation
  async function handleCalcSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setCalcResult(null);

    if (!calcBrand || !calcProduct) {
      setError("Brand dan Product wajib diisi");
      return;
    }

    setCalcSaving(true);
    try {
      const res = await fetch("/api/bep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: calcBrand,
          product: calcProduct,
          fixedCost: Number(calcFixedCost),
          variableCostPerUnit: Number(calcVariableCost),
          sellingPricePerUnit: Number(calcSellingPrice),
          currentSales: Number(calcCurrentSales) || 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghitung BEP");
      setCalcResult(json.data);
      await loadAll();
    } catch (err) {
      setError(String(err));
    } finally {
      setCalcSaving(false);
    }
  }

  // What-if scenario
  async function handleWhatIf(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!wiBrand || !wiFixedCost || !wiVariableCost || !wiSellingPrice) {
      setError("Brand, Fixed Cost, Variable Cost, dan Selling Price wajib diisi");
      return;
    }
    setWiSaving(true);
    try {
      const res = await fetch("/api/bep/what-if", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: wiBrand,
          product: wiProduct || "Scenario",
          fixedCost: Number(wiFixedCost),
          variableCostPerUnit: Number(wiVariableCost),
          sellingPricePerUnit: Number(wiSellingPrice),
          currentSales: Number(wiCurrentSales) || 0,
          priceChange: wiPriceChange,
          volumeChange: wiVolumeChange,
          costChange: wiCostChange,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghitung what-if");
      setWiResult(json.scenario);
    } catch (err) {
      setError(String(err));
    } finally {
      setWiSaving(false);
    }
  }

  // Live what-if preview (local)
  function previewWhatIf() {
    const fc = Number(wiFixedCost) || 0;
    const vc = Number(wiVariableCost) || 0;
    const sp = Number(wiSellingPrice) || 0;
    const cs = Number(wiCurrentSales) || 0;
    if (fc <= 0 || sp <= 0) return null;
    const priceMult = 1 + wiPriceChange / 100;
    const volMult = 1 + wiVolumeChange / 100;
    const costMult = 1 + wiCostChange / 100;
    const adjFc = fc * costMult;
    const adjVc = vc * costMult;
    const adjSp = sp * priceMult;
    const adjCs = cs * volMult;
    const cm = adjSp - adjVc;
    if (cm <= 0) return null;
    const bepUnits = Math.ceil(adjFc / cm);
    const bepRevenue = bepUnits * adjSp;
    const mos = adjCs > 0 ? Math.round(((adjCs - bepUnits) / adjCs) * 100 * 100) / 100 : 0;
    const profit = adjCs * cm - adjFc;
    return { contributionMargin: cm, bepUnits, bepRevenue, marginOfSafety: mos, profitLoss: profit };
  }

  const livePreview = previewCalc();
  const liveWhatIfPreview = previewWhatIf();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">📐 Break-Even Analysis</h2>
          <p className="text-muted-foreground">
            Analisis BEP untuk decision-making: kapan titik impas, berapa margin safety, dan proyeksi profit.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSeed} variant="outline" disabled={loading}>
            🌱 Seed Data
          </Button>
          <Button onClick={loadAll} disabled={loading} variant="outline">
            {loading ? "Memuat..." : "↻ Refresh"}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
          <CardContent className="py-4 text-red-700 dark:text-red-300 text-sm">{error}</CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="overview">📊 Overview</TabsTrigger>
          <TabsTrigger value="calculator">🧮 Calculator</TabsTrigger>
          <TabsTrigger value="brands">🏷️ Brand Analysis</TabsTrigger>
          <TabsTrigger value="whatif">🔮 What-If</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Overview ── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Total Fixed Costs"
              value={loading ? "..." : formatRp(summary?.totalFixedCosts || 0)}
              note={`${summary?.brands?.length || 0} brands`}
              accent="text-blue-600"
            />
            <KpiCard
              title="Total Profit/Loss"
              value={loading ? "..." : formatRp(summary?.totalProfitLoss || 0)}
              note="current period"
              accent={(summary?.totalProfitLoss || 0) >= 0 ? "text-green-600" : "text-red-600"}
            />
            <KpiCard
              title="Profitable Brands"
              value={loading ? "..." : String(summary?.profitableCount || 0)}
              note="in profit zone"
              accent="text-green-600"
            />
            <KpiCard
              title="Brands in Loss"
              value={loading ? "..." : String(summary?.lossCount || 0)}
              note="need attention"
              accent="text-red-600"
            />
          </div>

          {/* Brand cards */}
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : summary?.brands?.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Belum ada data BEP. Klik &quot;Seed Data&quot; untuk mengisi data contoh.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {summary?.brands?.map((b) => (
                <Card key={b.brand}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{b.brand}</CardTitle>
                      <Badge variant={statusVariant(b.status)}>
                        {b.status === "profit" ? "✅ Profit" : b.status === "loss" ? "❌ Loss" : "➖ BEP"}
                      </Badge>
                    </div>
                    <CardDescription>{b.product}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fixed Cost:</span>
                      <span className="font-medium">{formatRp(b.fixedCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">BEP (units):</span>
                      <span className="font-medium">{formatNum(b.bepUnits)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">BEP (revenue):</span>
                      <span className="font-medium">{formatRp(b.bepRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Sales:</span>
                      <span className="font-medium">{formatNum(b.currentSales)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Margin of Safety:</span>
                      <span className={`font-medium ${b.marginOfSafety >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {b.marginOfSafety}%
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-1 mt-1">
                      <span className="font-medium">Profit/Loss:</span>
                      <span className={`font-bold ${b.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatRp(b.profitLoss)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Tab 2: BEP Calculator ── */}
        <TabsContent value="calculator" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>🧮 BEP Calculator</CardTitle>
              <CardDescription>Masukkan cost dan selling price, dapatkan BEP secara instant</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCalcSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="c-brand">Brand</Label>
                  <Input
                    id="c-brand"
                    placeholder="Wangi Signature"
                    value={calcBrand}
                    onChange={(e) => setCalcBrand(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-product">Product</Label>
                  <Input
                    id="c-product"
                    placeholder="Eau de Parfum 50ml"
                    value={calcProduct}
                    onChange={(e) => setCalcProduct(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-fc">Fixed Cost (Rp)</Label>
                  <Input
                    id="c-fc"
                    type="number"
                    min="0"
                    step="100000"
                    placeholder="45000000"
                    value={calcFixedCost}
                    onChange={(e) => setCalcFixedCost(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-vc">Variable Cost/Unit (Rp)</Label>
                  <Input
                    id="c-vc"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="85000"
                    value={calcVariableCost}
                    onChange={(e) => setCalcVariableCost(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-sp">Selling Price/Unit (Rp)</Label>
                  <Input
                    id="c-sp"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="180000"
                    value={calcSellingPrice}
                    onChange={(e) => setCalcSellingPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-cs">Current Sales (units)</Label>
                  <Input
                    id="c-cs"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="320"
                    value={calcCurrentSales}
                    onChange={(e) => setCalcCurrentSales(e.target.value)}
                  />
                </div>

                {/* Live preview */}
                {livePreview && (
                  <div className="sm:col-span-2 lg:col-span-3 grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-xs text-muted-foreground">Contribution Margin</p>
                      <p className="font-bold text-green-600">{formatRp(livePreview.contributionMargin)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">BEP (units)</p>
                      <p className="font-bold">{formatNum(livePreview.bepUnits)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">BEP (revenue)</p>
                      <p className="font-bold">{formatRp(livePreview.bepRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Margin of Safety</p>
                      <p className={`font-bold ${livePreview.marginOfSafety >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {livePreview.marginOfSafety}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Profit/Loss</p>
                      <p className={`font-bold ${livePreview.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatRp(livePreview.profitLoss)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCalcBrand("");
                      setCalcProduct("");
                      setCalcFixedCost("");
                      setCalcVariableCost("");
                      setCalcSellingPrice("");
                      setCalcCurrentSales("");
                      setCalcResult(null);
                    }}
                  >
                    Reset
                  </Button>
                  <Button type="submit" disabled={calcSaving}>
                    {calcSaving ? "Menyimpan..." : "💾 Simpan ke Sheet"}
                  </Button>
                </div>
              </form>

              {/* Result after save */}
              {calcResult && (
                <div className="mt-4 p-4 rounded-lg border bg-green-50 dark:bg-green-950/30 dark:border-green-900">
                  <p className="font-medium text-green-700 dark:text-green-300 mb-2">
                    ✅ Tersimpan: {calcResult.calculationId}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">CM:</span>{" "}
                      <span className="font-medium">{formatRp(calcResult.contributionMargin)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">BEP:</span>{" "}
                      <span className="font-medium">{formatNum(calcResult.bepUnits)} unit</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Revenue:</span>{" "}
                      <span className="font-medium">{formatRp(calcResult.bepRevenue)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">MoS:</span>{" "}
                      <span className="font-medium">{calcResult.marginOfSafety}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Profit:</span>{" "}
                      <span className={`font-medium ${calcResult.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatRp(calcResult.profitLoss)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Brand Analysis ── */}
        <TabsContent value="brands" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>🏷️ Brand Analysis</CardTitle>
              <CardDescription>Tabel analisa BEP per brand dengan margin of safety dan profit</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : bepData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Belum ada data. Klik &quot;Seed Data&quot; atau tambah via Calculator.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Brand</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Fixed Cost</TableHead>
                        <TableHead className="text-right">Var Cost/Unit</TableHead>
                        <TableHead className="text-right">Sell Price</TableHead>
                        <TableHead className="text-right">CM</TableHead>
                        <TableHead className="text-right">BEP (units)</TableHead>
                        <TableHead className="text-right">Current Sales</TableHead>
                        <TableHead className="text-right">MoS %</TableHead>
                        <TableHead className="text-right">Profit/Loss</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bepData.map((row) => (
                        <TableRow key={row.calculationId}>
                          <TableCell className="font-medium">{row.brand}</TableCell>
                          <TableCell>{row.product}</TableCell>
                          <TableCell className="text-right">{formatRp(row.fixedCost)}</TableCell>
                          <TableCell className="text-right">{formatRp(row.variableCostPerUnit)}</TableCell>
                          <TableCell className="text-right">{formatRp(row.sellingPricePerUnit)}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            {formatRp(row.contributionMargin)}
                          </TableCell>
                          <TableCell className="text-right font-bold">{formatNum(row.bepUnits)}</TableCell>
                          <TableCell className="text-right">{formatNum(row.currentSales)}</TableCell>
                          <TableCell className={`text-right font-medium ${row.marginOfSafety >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {row.marginOfSafety}%
                          </TableCell>
                          <TableCell className={`text-right font-bold ${row.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatRp(row.profitLoss)}
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

        {/* ── Tab 4: What-If ── */}
        <TabsContent value="whatif" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>🔮 What-If Scenario</CardTitle>
              <CardDescription>Simulasikan perubahan harga, volume, dan cost untuk melihat dampak ke BEP</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWhatIf} className="space-y-4">
                {/* Base inputs */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="wi-brand">Brand</Label>
                    <Input
                      id="wi-brand"
                      placeholder="Wangi Signature"
                      value={wiBrand}
                      onChange={(e) => setWiBrand(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wi-product">Product (optional)</Label>
                    <Input
                      id="wi-product"
                      placeholder="Eau de Parfum 50ml"
                      value={wiProduct}
                      onChange={(e) => setWiProduct(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wi-fc">Fixed Cost (Rp)</Label>
                    <Input
                      id="wi-fc"
                      type="number"
                      min="0"
                      step="100000"
                      placeholder="45000000"
                      value={wiFixedCost}
                      onChange={(e) => setWiFixedCost(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wi-vc">Variable Cost/Unit (Rp)</Label>
                    <Input
                      id="wi-vc"
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="85000"
                      value={wiVariableCost}
                      onChange={(e) => setWiVariableCost(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wi-sp">Selling Price/Unit (Rp)</Label>
                    <Input
                      id="wi-sp"
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="180000"
                      value={wiSellingPrice}
                      onChange={(e) => setWiSellingPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wi-cs">Current Sales (units)</Label>
                    <Input
                      id="wi-cs"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="320"
                      value={wiCurrentSales}
                      onChange={(e) => setWiCurrentSales(e.target.value)}
                    />
                  </div>
                </div>

                {/* Sliders */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Price Change: {wiPriceChange > 0 ? "+" : ""}{wiPriceChange}%</Label>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      step="1"
                      value={wiPriceChange}
                      onChange={(e) => setWiPriceChange(Number(e.target.value))}
                      className="w-full accent-green-600"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>-50%</span>
                      <span>0%</span>
                      <span>+50%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Volume Change: {wiVolumeChange > 0 ? "+" : ""}{wiVolumeChange}%</Label>
                    <input
                      type="range"
                      min="-50"
                      max="100"
                      step="1"
                      value={wiVolumeChange}
                      onChange={(e) => setWiVolumeChange(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>-50%</span>
                      <span>0%</span>
                      <span>+100%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cost Change: {wiCostChange > 0 ? "+" : ""}{wiCostChange}%</Label>
                    <input
                      type="range"
                      min="-30"
                      max="50"
                      step="1"
                      value={wiCostChange}
                      onChange={(e) => setWiCostChange(Number(e.target.value))}
                      className="w-full accent-red-600"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>-30%</span>
                      <span>0%</span>
                      <span>+50%</span>
                    </div>
                  </div>
                </div>

                {/* Live what-if preview */}
                {liveWhatIfPreview && (
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-5 p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-xs text-muted-foreground">Adj. CM</p>
                      <p className="font-bold text-green-600">{formatRp(liveWhatIfPreview.contributionMargin)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Adj. BEP</p>
                      <p className="font-bold">{formatNum(liveWhatIfPreview.bepUnits)} unit</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Adj. Revenue</p>
                      <p className="font-bold">{formatRp(liveWhatIfPreview.bepRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Adj. MoS</p>
                      <p className={`font-bold ${liveWhatIfPreview.marginOfSafety >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {liveWhatIfPreview.marginOfSafety}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Adj. Profit</p>
                      <p className={`font-bold ${liveWhatIfPreview.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatRp(liveWhatIfPreview.profitLoss)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={wiSaving}>
                    {wiSaving ? "Menghitung..." : "🔮 Simulasikan"}
                  </Button>
                </div>
              </form>

              {/* What-if result */}
              {wiResult && (
                <div className="mt-4 p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
                  <p className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                    🔮 Scenario: {wiResult.scenarioId}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Brand: {wiResult.brand} | Price: {wiResult.priceChange > 0 ? "+" : ""}{wiResult.priceChange}% | Volume: {wiResult.volumeChange > 0 ? "+" : ""}{wiResult.volumeChange}% | Cost: {wiResult.costChange > 0 ? "+" : ""}{wiResult.costChange}%
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Adj. Fixed Cost:</span>
                      <p className="font-medium">{formatRp(wiResult.fixedCost)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Adj. Var Cost:</span>
                      <p className="font-medium">{formatRp(wiResult.variableCostPerUnit)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Adj. Price:</span>
                      <p className="font-medium">{formatRp(wiResult.sellingPricePerUnit)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">BEP:</span>
                      <p className="font-bold">{formatNum(wiResult.bepUnits)} unit</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Profit:</span>
                      <p className={`font-bold ${wiResult.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatRp(wiResult.profitLoss)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
