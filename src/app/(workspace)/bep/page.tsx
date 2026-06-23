"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Types ──
interface BEPRow {
  id: string;
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
  createdAt?: string;
}

interface BEPSummary {
  totalFixedCosts: number;
  totalProfitLoss: number;
  totalCurrentSales: number;
  overallMarginOfSafety: number;
  brandCount: number;
  profitableCount: number;
  atRiskCount: number;
}

interface BrandSummary {
  brand: string;
  fixedCost: number;
  currentSales: number;
  profitLoss: number;
  bepUnits: number;
  marginOfSafety: number;
  productCount: number;
  status: string;
}

interface WhatIfScenario {
  label: string;
  fixedCost: number;
  variableCostPerUnit: number;
  sellingPricePerUnit: number;
  contributionMargin: number;
  bepUnits: number;
  bepRevenue: number;
  currentSales: number;
  marginOfSafety: number;
  profitLoss: number;
}

interface WhatIfResult {
  scenarios: {
    base: WhatIfScenario;
    adjusted: WhatIfScenario;
    optimistic: WhatIfScenario;
    pessimistic: WhatIfScenario;
  };
}

// ── Helpers ──
function formatRp(amount: number): string {
  if (!amount && amount !== 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatShortRp(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  }
  return `Rp ${amount}`;
}

// ── Slider component ──
function SliderInput({
  label,
  value,
  onChange,
  min = -50,
  max = 50,
  step = 1,
  suffix = "%",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm font-mono font-bold text-primary">
          {value > 0 ? "+" : ""}{value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}{suffix}</span>
        <span>0</span>
        <span>+{max}{suffix}</span>
      </div>
    </div>
  );
}

// ── Main Page Component ──
export default function BEPPage() {
  const [bepRows, setBepRows] = useState<BEPRow[]>([]);
  const [summary, setSummary] = useState<BEPSummary | null>(null);
  const [brandSummaries, setBrandSummaries] = useState<BrandSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Calculator form
  const [calcFixedCost, setCalcFixedCost] = useState("");
  const [calcVariableCost, setCalcVariableCost] = useState("");
  const [calcSellingPrice, setCalcSellingPrice] = useState("");
  const [calcCurrentSales, setCalcCurrentSales] = useState("");
  const [calcResult, setCalcResult] = useState<{
    contributionMargin: number;
    bepUnits: number;
    bepRevenue: number;
    marginOfSafety: number;
    profitLoss: number;
  } | null>(null);

  // What-if form
  const [wiFixedCost, setWiFixedCost] = useState("45000000");
  const [wiVariableCost, setWiVariableCost] = useState("85000");
  const [wiSellingPrice, setWiSellingPrice] = useState("180000");
  const [wiCurrentSales, setWiCurrentSales] = useState("320");
  const [wiPriceAdj, setWiPriceAdj] = useState(0);
  const [wiVolumeAdj, setWiVolumeAdj] = useState(0);
  const [wiCostAdj, setWiCostAdj] = useState(0);
  const [wiResult, setWiResult] = useState<WhatIfResult | null>(null);
  const [wiLoading, setWiLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [bepRes, summaryRes] = await Promise.all([
        fetch("/api/bep"),
        fetch("/api/bep/summary"),
      ]);

      if (bepRes.ok) {
        const json = await bepRes.json();
        setBepRows(json.data || []);
      }
      if (summaryRes.ok) {
        const json = await summaryRes.json();
        setSummary(json.summary || null);
        setBrandSummaries(json.brands || []);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculator handler
  const handleCalculate = () => {
    const fc = Number(calcFixedCost) || 0;
    const vc = Number(calcVariableCost) || 0;
    const sp = Number(calcSellingPrice) || 0;
    const cs = Number(calcCurrentSales) || 0;

    const cm = sp - vc;
    if (cm <= 0) {
      setCalcResult({ contributionMargin: 0, bepUnits: 0, bepRevenue: 0, marginOfSafety: 0, profitLoss: 0 });
      return;
    }
    const bepU = Math.ceil(fc / cm);
    const bepR = bepU * sp;
    const mos = cs > 0 ? Math.round(((cs - bepU) / cs) * 100) : 0;
    const pl = (cs * cm) - fc;

    setCalcResult({ contributionMargin: cm, bepUnits: bepU, bepRevenue: bepR, marginOfSafety: mos, profitLoss: pl });
  };

  // What-if handler
  const handleWhatIf = async () => {
    setWiLoading(true);
    try {
      const res = await fetch("/api/bep/what-if", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fixedCost: Number(wiFixedCost) || 0,
          variableCostPerUnit: Number(wiVariableCost) || 0,
          sellingPricePerUnit: Number(wiSellingPrice) || 0,
          currentSales: Number(wiCurrentSales) || 0,
          priceAdjustment: wiPriceAdj,
          volumeAdjustment: wiVolumeAdj,
          costAdjustment: wiCostAdj,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setWiResult(json);
      }
    } catch (err) {
      console.error("What-if error:", err);
    } finally {
      setWiLoading(false);
    }
  };

  // Auto-compute what-if when sliders change
  useEffect(() => {
    const timer = setTimeout(() => {
      handleWhatIf();
    }, 300);
    return () => clearTimeout(timer);
  }, [wiPriceAdj, wiVolumeAdj, wiCostAdj, wiFixedCost, wiVariableCost, wiSellingPrice, wiCurrentSales]);

  const profitableBrands = brandSummaries.filter((b) => b.profitLoss >= 0);
  const atRiskBrands = brandSummaries.filter((b) => b.profitLoss < 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📐 Break-Even Analysis</h1>
          <p className="text-muted-foreground">Analisis BEP untuk decision-making — Brand, Produk, & What-If Scenarios</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Error: {error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-1/2">
          <TabsTrigger value="overview">📊 Overview</TabsTrigger>
          <TabsTrigger value="calculator">🧮 Calculator</TabsTrigger>
          <TabsTrigger value="brands">🏷️ Brand Analysis</TabsTrigger>
          <TabsTrigger value="whatif">🔮 What-If</TabsTrigger>
        </TabsList>

        {/* ═══ TAB: Overview ═══ */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          {summary && summary.brandCount > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Total Fixed Costs</p>
                  <p className="text-2xl font-bold text-blue-600">{formatRp(summary.totalFixedCosts)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{summary.brandCount} brands</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Total Profit/Loss</p>
                  <p className={`text-2xl font-bold ${summary.totalProfitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatRp(summary.totalProfitLoss)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.profitableCount} profitable · {summary.atRiskCount} at risk
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Total Sales Volume</p>
                  <p className="text-2xl font-bold text-purple-600">{summary.totalCurrentSales.toLocaleString("id-ID")} unit</p>
                  <p className="text-xs text-muted-foreground mt-1">Current sales</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Avg Margin of Safety</p>
                  <p className={`text-2xl font-bold ${
                    summary.overallMarginOfSafety >= 30 ? "text-green-600" :
                    summary.overallMarginOfSafety >= 15 ? "text-yellow-600" : "text-red-600"
                  }`}>
                    {summary.overallMarginOfSafety}%
                  </p>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        summary.overallMarginOfSafety >= 30 ? "bg-green-500" :
                        summary.overallMarginOfSafety >= 15 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(Math.max(summary.overallMarginOfSafety, 0), 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">Belum ada data BEP. Seed data terlebih dahulu.</p>
                <Button onClick={async () => {
                  const res = await fetch("/api/bep/seed?force=true", { method: "POST" });
                  const json = await res.json();
                  alert(json.message || JSON.stringify(json));
                  fetchData();
                }}>
                  🔄 Seed BEP Data
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Brand Cards */}
          {brandSummaries.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">BEP Summary per Brand</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {brandSummaries.map((brand) => (
                  <Card key={brand.brand} className={brand.status === "profitable" ? "border-green-200" : "border-red-200"}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{brand.brand}</CardTitle>
                        <Badge className={brand.status === "profitable" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                          {brand.status === "profitable" ? "✅ PROFIT" : "⚠️ AT RISK"}
                        </Badge>
                      </div>
                      <CardDescription>{brand.productCount} produk</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fixed Cost</span>
                        <span className="font-medium">{formatShortRp(brand.fixedCost)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">BEP (units)</span>
                        <span className="font-medium">{brand.bepUnits.toLocaleString("id-ID")} unit</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current Sales</span>
                        <span className="font-medium">{brand.currentSales.toLocaleString("id-ID")} unit</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Margin of Safety</span>
                        <span className={`font-bold ${brand.marginOfSafety >= 30 ? "text-green-600" : brand.marginOfSafety >= 15 ? "text-yellow-600" : "text-red-600"}`}>
                          {brand.marginOfSafety}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Profit/Loss</span>
                        <span className={`font-bold ${brand.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatShortRp(brand.profitLoss)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ═══ TAB: Calculator ═══ */}
        <TabsContent value="calculator" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle>🧮 BEP Calculator</CardTitle>
                <CardDescription>Masukkan data untuk menghitung Break-Even Point</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Fixed Cost (Biaya Tetap)</Label>
                  <Input
                    type="number"
                    value={calcFixedCost}
                    onChange={(e) => setCalcFixedCost(e.target.value)}
                    placeholder="45000000"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Variable Cost / Unit (Biaya Variabel per Unit)</Label>
                  <Input
                    type="number"
                    value={calcVariableCost}
                    onChange={(e) => setCalcVariableCost(e.target.value)}
                    placeholder="85000"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Selling Price / Unit (Harga Jual per Unit)</Label>
                  <Input
                    type="number"
                    value={calcSellingPrice}
                    onChange={(e) => setCalcSellingPrice(e.target.value)}
                    placeholder="180000"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Current Sales (Penjualan Saat Ini)</Label>
                  <Input
                    type="number"
                    value={calcCurrentSales}
                    onChange={(e) => setCalcCurrentSales(e.target.value)}
                    placeholder="320"
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleCalculate} className="w-full">
                  ⚡ Hitung BEP
                </Button>
              </CardContent>
            </Card>

            {/* Result */}
            <Card>
              <CardHeader>
                <CardTitle>📊 Hasil Perhitungan</CardTitle>
                <CardDescription>Break-Even Point Analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {calcResult ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 mb-1">Contribution Margin</p>
                      <p className="text-2xl font-bold text-blue-700">{formatRp(calcResult.contributionMargin)}</p>
                      <p className="text-xs text-blue-500 mt-1">Selling Price − Variable Cost/Unit</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-purple-600 mb-1">BEP (Units)</p>
                        <p className="text-2xl font-bold text-purple-700">{calcResult.bepUnits.toLocaleString("id-ID")}</p>
                        <p className="text-xs text-purple-500 mt-1">unit</p>
                      </div>
                      <div className="bg-indigo-50 rounded-lg p-4">
                        <p className="text-sm text-indigo-600 mb-1">BEP (Revenue)</p>
                        <p className="text-2xl font-bold text-indigo-700">{formatRp(calcResult.bepRevenue)}</p>
                        <p className="text-xs text-indigo-500 mt-1">rupiah</p>
                      </div>
                    </div>

                    <div className={`rounded-lg p-4 ${calcResult.marginOfSafety >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                      <p className={`text-sm mb-1 ${calcResult.marginOfSafety >= 0 ? "text-green-600" : "text-red-600"}`}>
                        Margin of Safety
                      </p>
                      <p className={`text-2xl font-bold ${calcResult.marginOfSafety >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {calcResult.marginOfSafety}%
                      </p>
                      <p className={`text-xs mt-1 ${calcResult.marginOfSafety >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {calcResult.marginOfSafety >= 30 ? "Aman — di atas 30%" :
                         calcResult.marginOfSafety >= 15 ? "Waspada — 15-30%" :
                         calcResult.marginOfSafety >= 0 ? "Kritis — di bawah 15%" : "Rugi — di bawah BEP"}
                      </p>
                    </div>

                    <div className={`rounded-lg p-4 ${calcResult.profitLoss >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                      <p className={`text-sm mb-1 ${calcResult.profitLoss >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        Profit / Loss
                      </p>
                      <p className={`text-2xl font-bold ${calcResult.profitLoss >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                        {formatRp(calcResult.profitLoss)}
                      </p>
                      <p className={`text-xs mt-1 ${calcResult.profitLoss >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        (Current Sales × CM) − Fixed Cost
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <p className="text-center">Masukkan data dan klik <strong>Hitung BEP</strong><br />untuk melihat hasil</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ TAB: Brand Analysis ═══ */}
        <TabsContent value="brands" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🏷️ Brand Analysis Table</CardTitle>
              <CardDescription>Detail BEP per brand dan produk</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : bepRows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Tidak ada data BEP. Seed data terlebih dahulu.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Brand</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Fixed Cost</TableHead>
                        <TableHead className="text-right">Var Cost/Unit</TableHead>
                        <TableHead className="text-right">Selling Price</TableHead>
                        <TableHead className="text-right">CM</TableHead>
                        <TableHead className="text-right">BEP (units)</TableHead>
                        <TableHead className="text-right">BEP (revenue)</TableHead>
                        <TableHead className="text-right">Current Sales</TableHead>
                        <TableHead className="text-right">MoS</TableHead>
                        <TableHead className="text-right">Profit/Loss</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bepRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.brand}</TableCell>
                          <TableCell>{row.product}</TableCell>
                          <TableCell className="text-right">{formatShortRp(row.fixedCost)}</TableCell>
                          <TableCell className="text-right">{formatRp(row.variableCostPerUnit)}</TableCell>
                          <TableCell className="text-right">{formatRp(row.sellingPricePerUnit)}</TableCell>
                          <TableCell className="text-right font-medium text-blue-600">{formatRp(row.contributionMargin)}</TableCell>
                          <TableCell className="text-right font-bold">{row.bepUnits.toLocaleString("id-ID")}</TableCell>
                          <TableCell className="text-right">{formatShortRp(row.bepRevenue)}</TableCell>
                          <TableCell className="text-right">{row.currentSales.toLocaleString("id-ID")}</TableCell>
                          <TableCell className="text-right">
                            <Badge className={
                              row.marginOfSafety >= 30 ? "bg-green-100 text-green-700" :
                              row.marginOfSafety >= 15 ? "bg-yellow-100 text-yellow-700" :
                              row.marginOfSafety >= 0 ? "bg-orange-100 text-orange-700" :
                              "bg-red-100 text-red-700"
                            }>
                              {row.marginOfSafety}%
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-bold ${row.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatShortRp(row.profitLoss)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Brand Summary Table */}
          {brandSummaries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>📋 Brand Summary</CardTitle>
                <CardDescription>Ringkasan agregat per brand</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Brand</TableHead>
                        <TableHead className="text-right">Products</TableHead>
                        <TableHead className="text-right">Total Fixed Cost</TableHead>
                        <TableHead className="text-right">Total BEP (units)</TableHead>
                        <TableHead className="text-right">Total Sales</TableHead>
                        <TableHead className="text-right">Avg MoS</TableHead>
                        <TableHead className="text-right">Total P/L</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {brandSummaries.map((b) => (
                        <TableRow key={b.brand}>
                          <TableCell className="font-semibold">{b.brand}</TableCell>
                          <TableCell className="text-right">{b.productCount}</TableCell>
                          <TableCell className="text-right">{formatShortRp(b.fixedCost)}</TableCell>
                          <TableCell className="text-right">{b.bepUnits.toLocaleString("id-ID")}</TableCell>
                          <TableCell className="text-right">{b.currentSales.toLocaleString("id-ID")}</TableCell>
                          <TableCell className="text-right">
                            <Badge className={
                              b.marginOfSafety >= 30 ? "bg-green-100 text-green-700" :
                              b.marginOfSafety >= 15 ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            }>
                              {b.marginOfSafety}%
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-bold ${b.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatShortRp(b.profitLoss)}
                          </TableCell>
                          <TableCell>
                            <Badge className={b.status === "profitable" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                              {b.status === "profitable" ? "✅ PROFIT" : "⚠️ AT RISK"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ TAB: What-If ═══ */}
        <TabsContent value="whatif" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Panel */}
            <Card>
              <CardHeader>
                <CardTitle>🔮 What-If Parameters</CardTitle>
                <CardDescription>Atur base values dan slider untuk simulasi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Fixed Cost</Label>
                    <Input type="number" value={wiFixedCost} onChange={(e) => setWiFixedCost(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Var Cost/Unit</Label>
                    <Input type="number" value={wiVariableCost} onChange={(e) => setWiVariableCost(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Selling Price</Label>
                    <Input type="number" value={wiSellingPrice} onChange={(e) => setWiSellingPrice(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Current Sales</Label>
                    <Input type="number" value={wiCurrentSales} onChange={(e) => setWiCurrentSales(e.target.value)} />
                  </div>
                </div>

                <hr className="my-4" />

                <SliderInput label="Harga Jual" value={wiPriceAdj} onChange={setWiPriceAdj} />
                <SliderInput label="Volume Penjualan" value={wiVolumeAdj} onChange={setWiVolumeAdj} />
                <SliderInput label="Biaya (Fixed & Variable)" value={wiCostAdj} onChange={setWiCostAdj} />

                <Button onClick={handleWhatIf} className="w-full" disabled={wiLoading}>
                  {wiLoading ? "Menghitung..." : "⚡ Hitung Skenario"}
                </Button>
              </CardContent>
            </Card>

            {/* Results Panel */}
            <div className="lg:col-span-2 space-y-4">
              {wiResult ? (
                <>
                  {/* Scenario Comparison Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>📊 Scenario Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Metric</TableHead>
                              <TableHead className="text-right">Base</TableHead>
                              <TableHead className="text-right">Your Scenario</TableHead>
                              <TableHead className="text-right">Optimistic</TableHead>
                              <TableHead className="text-right">Pessimistic</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">Contribution Margin</TableCell>
                              <TableCell className="text-right">{formatRp(wiResult.scenarios.base.contributionMargin)}</TableCell>
                              <TableCell className="text-right">{formatRp(wiResult.scenarios.adjusted.contributionMargin)}</TableCell>
                              <TableCell className="text-right text-green-600">{formatRp(wiResult.scenarios.optimistic.contributionMargin)}</TableCell>
                              <TableCell className="text-right text-red-600">{formatRp(wiResult.scenarios.pessimistic.contributionMargin)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">BEP (units)</TableCell>
                              <TableCell className="text-right">{wiResult.scenarios.base.bepUnits.toLocaleString("id-ID")}</TableCell>
                              <TableCell className="text-right">{wiResult.scenarios.adjusted.bepUnits.toLocaleString("id-ID")}</TableCell>
                              <TableCell className="text-right text-green-600">{wiResult.scenarios.optimistic.bepUnits.toLocaleString("id-ID")}</TableCell>
                              <TableCell className="text-right text-red-600">{wiResult.scenarios.pessimistic.bepUnits.toLocaleString("id-ID")}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">BEP (revenue)</TableCell>
                              <TableCell className="text-right">{formatShortRp(wiResult.scenarios.base.bepRevenue)}</TableCell>
                              <TableCell className="text-right">{formatShortRp(wiResult.scenarios.adjusted.bepRevenue)}</TableCell>
                              <TableCell className="text-right text-green-600">{formatShortRp(wiResult.scenarios.optimistic.bepRevenue)}</TableCell>
                              <TableCell className="text-right text-red-600">{formatShortRp(wiResult.scenarios.pessimistic.bepRevenue)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Margin of Safety</TableCell>
                              <TableCell className="text-right">{wiResult.scenarios.base.marginOfSafety}%</TableCell>
                              <TableCell className="text-right">{wiResult.scenarios.adjusted.marginOfSafety}%</TableCell>
                              <TableCell className="text-right text-green-600 font-bold">{wiResult.scenarios.optimistic.marginOfSafety}%</TableCell>
                              <TableCell className="text-right text-red-600 font-bold">{wiResult.scenarios.pessimistic.marginOfSafety}%</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Profit/Loss</TableCell>
                              <TableCell className={`text-right font-bold ${wiResult.scenarios.base.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {formatShortRp(wiResult.scenarios.base.profitLoss)}
                              </TableCell>
                              <TableCell className={`text-right font-bold ${wiResult.scenarios.adjusted.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {formatShortRp(wiResult.scenarios.adjusted.profitLoss)}
                              </TableCell>
                              <TableCell className={`text-right font-bold ${wiResult.scenarios.optimistic.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {formatShortRp(wiResult.scenarios.optimistic.profitLoss)}
                              </TableCell>
                              <TableCell className={`text-right font-bold ${wiResult.scenarios.pessimistic.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {formatShortRp(wiResult.scenarios.pessimistic.profitLoss)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Visual Cards for each scenario */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-green-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-green-700">😊 Optimistic</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1 text-sm">
                        <p>BEP: <strong>{wiResult.scenarios.optimistic.bepUnits.toLocaleString("id-ID")} unit</strong></p>
                        <p>MoS: <strong>{wiResult.scenarios.optimistic.marginOfSafety}%</strong></p>
                        <p className={wiResult.scenarios.optimistic.profitLoss >= 0 ? "text-green-600" : "text-red-600"}>
                          P/L: <strong>{formatShortRp(wiResult.scenarios.optimistic.profitLoss)}</strong>
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-blue-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-blue-700">📊 Your Scenario</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1 text-sm">
                        <p>BEP: <strong>{wiResult.scenarios.adjusted.bepUnits.toLocaleString("id-ID")} unit</strong></p>
                        <p>MoS: <strong>{wiResult.scenarios.adjusted.marginOfSafety}%</strong></p>
                        <p className={wiResult.scenarios.adjusted.profitLoss >= 0 ? "text-green-600" : "text-red-600"}>
                          P/L: <strong>{formatShortRp(wiResult.scenarios.adjusted.profitLoss)}</strong>
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-red-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-red-700">😰 Pessimistic</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1 text-sm">
                        <p>BEP: <strong>{wiResult.scenarios.pessimistic.bepUnits.toLocaleString("id-ID")} unit</strong></p>
                        <p>MoS: <strong>{wiResult.scenarios.pessimistic.marginOfSafety}%</strong></p>
                        <p className={wiResult.scenarios.pessimistic.profitLoss >= 0 ? "text-green-600" : "text-red-600"}>
                          P/L: <strong>{formatShortRp(wiResult.scenarios.pessimistic.profitLoss)}</strong>
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <p>Atur parameter dan slider, lalu klik <strong>Hitung Skenario</strong><br />untuk melihat simulasi what-if</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
