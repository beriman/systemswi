"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calculator, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  RefreshCw, Plus, Sliders, BarChart3, DollarSign, Package, Target
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";

// ── Types ──────────────────────────────────────────────────────────

interface BEPItem {
  calculationId: string;
  brand: string;
  product: string;
  fixedCost: number;
  variableCost: number;
  sellingPrice: number;
  contributionMargin: number;
  bepUnits: number;
  bepRevenue: number;
  currentSales: number;
  marginOfSafety: number;
  profit: number;
}

interface BrandSummary {
  brand: string;
  productCount: number;
  totalFixedCosts: number;
  totalProfit: number;
  avgMarginOfSafety: number;
  totalBEPRevenue: number;
  totalCurrentRevenue: number;
  profitable: boolean;
  products: BEPItem[];
}

interface SummaryData {
  totalBrands: number;
  totalProducts: number;
  totalFixedCosts: number;
  totalProfit: number;
  avgMarginOfSafety: number;
  profitableBrands: number;
  lossBrands: number;
}

interface WhatIfResult {
  base: {
    contributionMargin: number;
    bepUnits: number;
    bepRevenue: number;
    marginOfSafety: number;
    profit: number;
  };
  scenario: {
    sellingPrice: number;
    variableCost: number;
    fixedCost: number;
    currentSales: number;
    contributionMargin: number;
    bepUnits: number;
    bepRevenue: number;
    marginOfSafety: number;
    profit: number;
  };
  delta: {
    bepUnits: number;
    bepRevenue: number;
    marginOfSafety: number;
    profit: number;
  };
}

// ── Helpers ────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(v || 0);

const fmtNum = (v: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(v || 0);

const fmtPct = (v: number) =>
  `${(v || 0).toFixed(1)}%`;

function ProfitBadge({ profit }: { profit: number }) {
  if (profit > 0) return <Badge className="bg-emerald-600">Untung</Badge>;
  if (profit < 0) return <Badge className="bg-red-500">Rugi</Badge>;
  return <Badge variant="outline">BEP</Badge>;
}

function MoSBadge({ mos }: { mos: number }) {
  if (mos >= 30) return <Badge className="bg-emerald-600">{fmtPct(mos)}</Badge>;
  if (mos >= 15) return <Badge className="bg-yellow-500">{fmtPct(mos)}</Badge>;
  if (mos > 0) return <Badge className="bg-orange-500">{fmtPct(mos)}</Badge>;
  return <Badge className="bg-red-500">{fmtPct(mos)}</Badge>;
}

// ── Main Component ────────────────────────────────────────────────

export default function BEPAnalysisPage() {
  const [bepItems, setBepItems] = useState<BEPItem[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [status, setStatus] = useState("Memuat...");

  // Calculator form
  const [calcBrand, setCalcBrand] = useState("");
  const [calcProduct, setCalcProduct] = useState("");
  const [calcFixedCost, setCalcFixedCost] = useState("");
  const [calcVariableCost, setCalcVariableCost] = useState("");
  const [calcSellingPrice, setCalcSellingPrice] = useState("");
  const [calcCurrentSales, setCalcCurrentSales] = useState("");
  const [calcResult, setCalcResult] = useState<BEPItem | null>(null);
  const [calcSaving, setCalcSaving] = useState(false);

  // What-if state
  const [wiFixedCost, setWiFixedCost] = useState("50000000");
  const [wiVariableCost, setWiVariableCost] = useState("15000");
  const [wiSellingPrice, setWiSellingPrice] = useState("35000");
  const [wiCurrentSales, setWiCurrentSales] = useState("5000");
  const [wiPriceAdj, setWiPriceAdj] = useState(0);
  const [wiVolumeAdj, setWiVolumeAdj] = useState(0);
  const [wiCostAdj, setWiCostAdj] = useState(0);
  const [wiFixedAdj, setWiFixedAdj] = useState(0);
  const [wiResult, setWiResult] = useState<WhatIfResult | null>(null);
  const [wiRunning, setWiRunning] = useState(false);

  // ── Data Loading ─────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setRefreshing(true);
    setStatus("Memuat data BEP...");
    try {
      const [bepRes, summaryRes] = await Promise.all([
        fetch("/api/bep", { cache: "no-store" }),
        fetch("/api/bep/summary", { cache: "no-store" }),
      ]);
      const bepData = await bepRes.json();
      const summaryData = await summaryRes.json();

      if (bepRes.ok) setBepItems(bepData.bep || []);
      if (summaryRes.ok) {
        setSummary(summaryData.summary || null);
        setBrands(summaryData.brands || []);
      }

      setStatus(`Source: sheets | ${bepData.bep?.length || 0} calculations, ${summaryData.summary?.totalBrands || 0} brands`);
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Calculator (live preview) ────────────────────────────────────

  const liveCalc = useMemo(() => {
    const fc = Number(calcFixedCost) || 0;
    const vc = Number(calcVariableCost) || 0;
    const sp = Number(calcSellingPrice) || 0;
    const cs = Number(calcCurrentSales) || 0;
    if (fc <= 0 || sp <= vc) return null;
    const cm = sp - vc;
    const bepU = fc / cm;
    const bepR = bepU * sp;
    const mos = cs > 0 ? ((cs - bepU) / cs) * 100 : 0;
    const profit = (cs * cm) - fc;
    return { contributionMargin: cm, bepUnits: bepU, bepRevenue: bepR, marginOfSafety: mos, profit };
  }, [calcFixedCost, calcVariableCost, calcSellingPrice, calcCurrentSales]);

  // ── Handlers ─────────────────────────────────────────────────────

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    if (!calcBrand || !calcProduct || !calcFixedCost || !calcVariableCost || !calcSellingPrice) return;
    setCalcSaving(true);
    try {
      const res = await fetch("/api/bep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: calcBrand,
          product: calcProduct,
          fixedCost: Number(calcFixedCost),
          variableCost: Number(calcVariableCost),
          sellingPrice: Number(calcSellingPrice),
          currentSales: Number(calcCurrentSales) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghitung BEP");
      setCalcResult(data.bep);
      setStatus(`BEP calculated: ${data.bep.brand} - ${data.bep.product}`);
      // Reset form
      setCalcBrand("");
      setCalcProduct("");
      setCalcFixedCost("");
      setCalcVariableCost("");
      setCalcSellingPrice("");
      setCalcCurrentSales("");
      await loadData();
    } catch (err) {
      setStatus(`${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setCalcSaving(false);
    }
  }

  async function handleWhatIf() {
    setWiRunning(true);
    try {
      const res = await fetch("/api/bep/what-if", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fixedCost: Number(wiFixedCost) || 0,
          variableCost: Number(wiVariableCost) || 0,
          sellingPrice: Number(wiSellingPrice) || 0,
          currentSales: Number(wiCurrentSales) || 0,
          priceAdjustment: wiPriceAdj,
          volumeAdjustment: wiVolumeAdj,
          costAdjustment: wiCostAdj,
          fixedCostAdjustment: wiFixedAdj,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal what-if");
      setWiResult(data);
    } catch (err) {
      setStatus(`${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setWiRunning(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            📐 Break-Even Analysis
            <Badge variant="outline" className="text-xs">
              {loading ? "Loading..." : `${bepItems.length} calculations`}
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analisis BEP untuk decision-making — contribution margin, margin of safety, profit/loss
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{status}</p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">📊 Overview</TabsTrigger>
          <TabsTrigger value="calculator">🧮 Calculator</TabsTrigger>
          <TabsTrigger value="brands">🏷️ Brand Analysis</TabsTrigger>
          <TabsTrigger value="whatif">🔮 What-If</TabsTrigger>
        </TabsList>

        {/* ═══ TAB 1: Overview ═══ */}
        <TabsContent value="overview" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-1">
                      <Package className="h-3 w-3" /> Total Brands
                    </CardDescription>
                    <CardTitle className="text-2xl">{summary?.totalBrands || 0}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{summary?.totalProducts || 0} products analyzed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> Total Fixed Costs
                    </CardDescription>
                    <CardTitle className="text-2xl">{fmt(summary?.totalFixedCosts || 0)}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-1">
                      {summary && summary.totalProfit >= 0 ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                      Total Profit/Loss
                    </CardDescription>
                    <CardTitle className={`text-2xl ${(summary?.totalProfit || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {fmt(summary?.totalProfit || 0)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-1">
                      <Target className="h-3 w-3" /> Avg Margin of Safety
                    </CardDescription>
                    <CardTitle className="text-2xl">{fmtPct(summary?.avgMarginOfSafety || 0)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 text-xs">
                      <span className="text-emerald-600">{summary?.profitableBrands || 0} profitable</span>
                      <span className="text-red-600">{summary?.lossBrands || 0} loss</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Brand Cards */}
              <h2 className="text-lg font-semibold">BEP Summary per Brand</h2>
              {brands.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="text-4xl mb-4">📐</div>
                    <h3 className="text-lg font-semibold mb-2">Belum Ada Data BEP</h3>
                    <p className="text-sm text-muted-foreground">Mulai hitung BEP di tab Calculator.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {brands.map((b) => (
                    <Card key={b.brand} className={`hover:shadow-md transition-shadow ${b.profitable ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-red-500"}`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">🏷️ {b.brand}</CardTitle>
                            <CardDescription>{b.productCount} product(s)</CardDescription>
                          </div>
                          <ProfitBadge profit={b.totalProfit} />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Fixed Costs:</span>
                            <div className="font-medium">{fmt(b.totalFixedCosts)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Profit/Loss:</span>
                            <div className={`font-medium ${b.totalProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {fmt(b.totalProfit)}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">BEP Revenue:</span>
                            <div className="font-medium">{fmt(b.totalBEPRevenue)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Current Revenue:</span>
                            <div className="font-medium">{fmt(b.totalCurrentRevenue)}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-muted-foreground">Margin of Safety</span>
                          <MoSBadge mos={b.avgMarginOfSafety} />
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${b.avgMarginOfSafety >= 30 ? "bg-emerald-500" : b.avgMarginOfSafety >= 15 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${Math.min(Math.max(b.avgMarginOfSafety, 0), 100)}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ═══ TAB 2: BEP Calculator ═══ */}
        <TabsContent value="calculator" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" /> BEP Calculator
                </CardTitle>
                <CardDescription>
                  Masukkan data biaya dan harga untuk menghitung break-even point
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleCalculate}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Brand *</Label>
                      <Input
                        placeholder="e.g. Wangi Fresh"
                        value={calcBrand}
                        onChange={(e) => setCalcBrand(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Product *</Label>
                      <Input
                        placeholder="e.g. Eau de Toilette 50ml"
                        value={calcProduct}
                        onChange={(e) => setCalcProduct(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fixed Cost (Rp) *</Label>
                      <Input
                        type="number"
                        placeholder="50000000"
                        value={calcFixedCost}
                        onChange={(e) => setCalcFixedCost(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Variable Cost/Unit (Rp) *</Label>
                      <Input
                        type="number"
                        placeholder="15000"
                        value={calcVariableCost}
                        onChange={(e) => setCalcVariableCost(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Selling Price/Unit (Rp) *</Label>
                      <Input
                        type="number"
                        placeholder="35000"
                        value={calcSellingPrice}
                        onChange={(e) => setCalcSellingPrice(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Current Sales (units)</Label>
                      <Input
                        type="number"
                        placeholder="5000"
                        value={calcCurrentSales}
                        onChange={(e) => setCalcCurrentSales(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={calcSaving || !calcBrand || !calcProduct || !calcFixedCost || !calcVariableCost || !calcSellingPrice} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    {calcSaving ? "Menghitung..." : "Hitung & Simpan BEP"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Live Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" /> Live Preview
                </CardTitle>
                <CardDescription>Hasil perhitungan real-time</CardDescription>
              </CardHeader>
              <CardContent>
                {liveCalc ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 mb-1">Contribution Margin</p>
                        <p className="text-lg font-bold text-blue-700">{fmt(liveCalc.contributionMargin)}</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-xs text-purple-600 mb-1">BEP (units)</p>
                        <p className="text-lg font-bold text-purple-700">{fmtNum(Math.ceil(liveCalc.bepUnits))}</p>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg">
                        <p className="text-xs text-amber-600 mb-1">BEP (revenue)</p>
                        <p className="text-lg font-bold text-amber-700">{fmt(liveCalc.bepRevenue)}</p>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-lg">
                        <p className="text-xs text-emerald-600 mb-1">Margin of Safety</p>
                        <p className="text-lg font-bold text-emerald-700">{fmtPct(liveCalc.marginOfSafety)}</p>
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg text-center ${liveCalc.profit >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                      <p className="text-xs text-muted-foreground mb-1">Projected Profit/Loss</p>
                      <p className={`text-2xl font-bold ${liveCalc.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {fmt(liveCalc.profit)}
                      </p>
                      {liveCalc.profit >= 0 ? (
                        <p className="text-xs text-emerald-600 mt-1 flex items-center justify-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Profitable
                        </p>
                      ) : (
                        <p className="text-xs text-red-600 mt-1 flex items-center justify-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Below BEP
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <Calculator className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Isi form untuk melihat preview perhitungan</p>
                  </div>
                )}

                {calcResult && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-700 font-medium">✅ Tersimpan:</p>
                    <p className="text-sm text-green-800">
                      {calcResult.brand} — {calcResult.product}: BEP {fmtNum(Math.ceil(calcResult.bepUnits))} units ({fmt(calcResult.bepRevenue)})
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ TAB 3: Brand Analysis ═══ */}
        <TabsContent value="brands" className="space-y-4">
          <h2 className="text-lg font-semibold">Brand | Product | BEP | Current Sales | MoS | Profit</h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 rounded" />)}
            </div>
          ) : bepItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>Belum ada data BEP. Gunakan Calculator untuk menghitung.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Brand</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">BEP (units)</TableHead>
                      <TableHead className="text-right">BEP (revenue)</TableHead>
                      <TableHead className="text-right">Current Sales</TableHead>
                      <TableHead className="text-right">MoS</TableHead>
                      <TableHead className="text-right">Profit/Loss</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bepItems.map((item) => (
                      <TableRow key={item.calculationId}>
                        <TableCell className="font-medium">{item.brand}</TableCell>
                        <TableCell>{item.product}</TableCell>
                        <TableCell className="text-right">{fmtNum(Math.ceil(item.bepUnits))}</TableCell>
                        <TableCell className="text-right">{fmt(item.bepRevenue)}</TableCell>
                        <TableCell className="text-right">{fmtNum(item.currentSales)}</TableCell>
                        <TableCell className="text-right"><MoSBadge mos={item.marginOfSafety} /></TableCell>
                        <TableCell className={`text-right font-medium ${item.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {fmt(item.profit)}
                        </TableCell>
                        <TableCell><ProfitBadge profit={item.profit} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ TAB 4: What-If ═══ */}
        <TabsContent value="whatif" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sliders className="h-5 w-5" /> What-If Scenario
                </CardTitle>
                <CardDescription>
                  Adjust price, volume, and cost to see impact on BEP
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Base values */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Fixed Cost (Rp)</Label>
                    <Input type="number" value={wiFixedCost} onChange={(e) => setWiFixedCost(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Variable Cost/Unit (Rp)</Label>
                    <Input type="number" value={wiVariableCost} onChange={(e) => setWiVariableCost(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Selling Price/Unit (Rp)</Label>
                    <Input type="number" value={wiSellingPrice} onChange={(e) => setWiSellingPrice(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Current Sales (units)</Label>
                    <Input type="number" value={wiCurrentSales} onChange={(e) => setWiCurrentSales(e.target.value)} />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <p className="text-sm font-medium">Adjustments</p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <Label>Price Adjustment</Label>
                      <span className={wiPriceAdj > 0 ? "text-emerald-600" : wiPriceAdj < 0 ? "text-red-600" : ""}>
                        {wiPriceAdj > 0 ? "+" : ""}{wiPriceAdj}%
                      </span>
                    </div>
                    <Slider min={-50} max={50} step={1} value={[wiPriceAdj]} onValueChange={([v]) => setWiPriceAdj(v)} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <Label>Volume Adjustment</Label>
                      <span className={wiVolumeAdj > 0 ? "text-emerald-600" : wiVolumeAdj < 0 ? "text-red-600" : ""}>
                        {wiVolumeAdj > 0 ? "+" : ""}{wiVolumeAdj}%
                      </span>
                    </div>
                    <Slider min={-50} max={100} step={1} value={[wiVolumeAdj]} onValueChange={([v]) => setWiVolumeAdj(v)} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <Label>Variable Cost Adjustment</Label>
                      <span className={wiCostAdj > 0 ? "text-red-600" : wiCostAdj < 0 ? "text-emerald-600" : ""}>
                        {wiCostAdj > 0 ? "+" : ""}{wiCostAdj}%
                      </span>
                    </div>
                    <Slider min={-30} max={50} step={1} value={[wiCostAdj]} onValueChange={([v]) => setWiCostAdj(v)} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <Label>Fixed Cost Adjustment</Label>
                      <span className={wiFixedAdj > 0 ? "text-red-600" : wiFixedAdj < 0 ? "text-emerald-600" : ""}>
                        {wiFixedAdj > 0 ? "+" : ""}{wiFixedAdj}%
                      </span>
                    </div>
                    <Slider min={-30} max={50} step={1} value={[wiFixedAdj]} onValueChange={([v]) => setWiFixedAdj(v)} />
                  </div>
                </div>

                <Button onClick={handleWhatIf} disabled={wiRunning} className="w-full">
                  <Sliders className="h-4 w-4 mr-2" />
                  {wiRunning ? "Menghitung..." : "Run What-If Analysis"}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle>What-If Result</CardTitle>
                <CardDescription>Perbandingan base vs scenario</CardDescription>
              </CardHeader>
              <CardContent>
                {wiResult ? (
                  <div className="space-y-4">
                    {/* Scenario values */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 mb-1">New Selling Price</p>
                        <p className="text-lg font-bold text-blue-700">{fmt(wiResult.scenario.sellingPrice)}</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <p className="text-xs text-orange-600 mb-1">New Variable Cost</p>
                        <p className="text-lg font-bold text-orange-700">{fmt(wiResult.scenario.variableCost)}</p>
                      </div>
                    </div>

                    {/* Comparison table */}
                    <div className="rounded-md border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/60">
                          <tr>
                            <th className="p-2 text-left">Metric</th>
                            <th className="p-2 text-right">Base</th>
                            <th className="p-2 text-right">Scenario</th>
                            <th className="p-2 text-right">Δ</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t">
                            <td className="p-2 text-muted-foreground">BEP (units)</td>
                            <td className="p-2 text-right">{fmtNum(Math.ceil(wiResult.base.bepUnits))}</td>
                            <td className="p-2 text-right font-medium">{fmtNum(Math.ceil(wiResult.scenario.bepUnits))}</td>
                            <td className={`p-2 text-right text-xs ${wiResult.delta.bepUnits <= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {wiResult.delta.bepUnits > 0 ? "+" : ""}{fmtNum(Math.ceil(wiResult.delta.bepUnits))}
                            </td>
                          </tr>
                          <tr className="border-t">
                            <td className="p-2 text-muted-foreground">BEP (revenue)</td>
                            <td className="p-2 text-right">{fmt(wiResult.base.bepRevenue)}</td>
                            <td className="p-2 text-right font-medium">{fmt(wiResult.scenario.bepRevenue)}</td>
                            <td className={`p-2 text-right text-xs ${wiResult.delta.bepRevenue <= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {wiResult.delta.bepRevenue > 0 ? "+" : ""}{fmt(wiResult.delta.bepRevenue)}
                            </td>
                          </tr>
                          <tr className="border-t">
                            <td className="p-2 text-muted-foreground">Margin of Safety</td>
                            <td className="p-2 text-right">{fmtPct(wiResult.base.marginOfSafety)}</td>
                            <td className="p-2 text-right font-medium">{fmtPct(wiResult.scenario.marginOfSafety)}</td>
                            <td className={`p-2 text-right text-xs ${wiResult.delta.marginOfSafety >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {wiResult.delta.marginOfSafety > 0 ? "+" : ""}{fmtPct(wiResult.delta.marginOfSafety)}
                            </td>
                          </tr>
                          <tr className="border-t">
                            <td className="p-2 text-muted-foreground">Profit/Loss</td>
                            <td className="p-2 text-right">{fmt(wiResult.base.profit)}</td>
                            <td className={`p-2 text-right font-medium ${wiResult.scenario.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {fmt(wiResult.scenario.profit)}
                            </td>
                            <td className={`p-2 text-right text-xs ${wiResult.delta.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {wiResult.delta.profit > 0 ? "+" : ""}{fmt(wiResult.delta.profit)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Verdict */}
                    <div className={`p-4 rounded-lg text-center ${wiResult.scenario.profit >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                      {wiResult.delta.profit > 0 ? (
                        <p className="text-sm text-emerald-700 flex items-center justify-center gap-1">
                          <TrendingUp className="h-4 w-4" /> Scenario improves profit by {fmt(wiResult.delta.profit)}
                        </p>
                      ) : wiResult.delta.profit < 0 ? (
                        <p className="text-sm text-red-700 flex items-center justify-center gap-1">
                          <TrendingDown className="h-4 w-4" /> Scenario reduces profit by {fmt(Math.abs(wiResult.delta.profit))}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No change in profit</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <Sliders className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Adjust sliders dan klik "Run What-If Analysis"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
