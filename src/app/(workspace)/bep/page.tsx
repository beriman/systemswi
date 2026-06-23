"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calculator, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  RefreshCw, Plus, Sliders, BarChart3, DollarSign, Package, Target,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";

// ── Types ──────────────────────────────────────────────────────────

interface BEPCalculation {
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
  createdAt: string;
  updatedAt: string;
}

interface BEPSummaryBrand {
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
}

interface SummaryData {
  brands: BEPSummaryBrand[];
  totalFixedCosts: number;
  totalProfitLoss: number;
  profitableCount: number;
  lossCount: number;
}

interface WhatIfScenario {
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

function StatusBadge({ status }: { status: string }) {
  if (status === "profit") return <Badge className="bg-emerald-600">Untung</Badge>;
  if (status === "loss") return <Badge className="bg-red-500">Rugi</Badge>;
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
  const [calculations, setCalculations] = useState<BEPCalculation[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
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
  const [calcSaved, setCalcSaved] = useState<BEPCalculation | null>(null);
  const [calcSaving, setCalcSaving] = useState(false);

  // What-if state
  const [wiFixedCost, setWiFixedCost] = useState("150000000");
  const [wiVariableCost, setWiVariableCost] = useState("45000");
  const [wiSellingPrice, setWiSellingPrice] = useState("120000");
  const [wiCurrentSales, setWiCurrentSales] = useState("2500");
  const [wiPriceAdj, setWiPriceAdj] = useState(0);
  const [wiVolumeAdj, setWiVolumeAdj] = useState(0);
  const [wiCostAdj, setWiCostAdj] = useState(0);
  const [wiResult, setWiResult] = useState<{ base: BEPCalculation; scenario: WhatIfScenario } | null>(null);
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

      if (bepRes.ok) setCalculations(bepData.calculations || []);
      if (summaryRes.ok) setSummary(summaryData);

      setStatus(`Source: Google Sheets | ${bepData.calculations?.length || 0} calculations, ${summaryData?.brands?.length || 0} brands`);
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Live Calculator ───────────────────────────────────────────────

  const liveCalc = useMemo(() => {
    const fc = Number(calcFixedCost) || 0;
    const vc = Number(calcVariableCost) || 0;
    const sp = Number(calcSellingPrice) || 0;
    const cs = Number(calcCurrentSales) || 0;
    if (fc <= 0 || sp <= vc) return null;
    const cm = sp - vc;
    const bepU = Math.ceil(fc / cm);
    const bepR = bepU * sp;
    const mos = cs > 0 ? Math.round(((cs - bepU) / cs) * 100 * 100) / 100 : 0;
    const profitLoss = cs * cm - fc;
    return { contributionMargin: cm, bepUnits: bepU, bepRevenue: bepR, marginOfSafety: mos, profitLoss };
  }, [calcFixedCost, calcVariableCost, calcSellingPrice, calcCurrentSales]);

  // ── What-if live preview ─────────────────────────────────────────

  const whatIfPreview = useMemo(() => {
    const fc = Number(wiFixedCost) || 0;
    const vc = Number(wiVariableCost) || 0;
    const sp = Number(wiSellingPrice) || 0;
    const cs = Number(wiCurrentSales) || 0;
    if (fc <= 0 || sp <= 0) return null;

    const base = calcBEP(fc, vc, sp, cs);

    const priceMult = 1 + wiPriceAdj / 100;
    const volMult = 1 + wiVolumeAdj / 100;
    const costMult = 1 + wiCostAdj / 100;

    const scenario = calcBEP(
      fc * costMult,
      vc * costMult,
      sp * priceMult,
      cs * volMult,
    );

    return { base, scenario };
  }, [wiFixedCost, wiVariableCost, wiSellingPrice, wiCurrentSales, wiPriceAdj, wiVolumeAdj, wiCostAdj]);

  // ── Handlers ─────────────────────────────────────────────────────

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    if (!calcBrand || !calcProduct || !calcFixedCost || !calcVariableCost || !calcSellingPrice) return;
    setCalcSaving(true);
    setCalcSaved(null);
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghitung BEP");
      setCalcSaved(data.calculation);
      setStatus(`BEP tersimpan: ${data.calculation.brand} — ${data.calculation.product}`);
      // Reset form
      setCalcBrand("");
      setCalcProduct("");
      setCalcFixedCost("");
      setCalcVariableCost("");
      setCalcSellingPrice("");
      setCalcCurrentSales("");
      await loadData();
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
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
          brand: "WhatIf",
          product: "Scenario",
          fixedCost: Number(wiFixedCost) || 0,
          variableCostPerUnit: Number(wiVariableCost) || 0,
          sellingPricePerUnit: Number(wiSellingPrice) || 0,
          currentSales: Number(wiCurrentSales) || 0,
          priceChange: wiPriceAdj,
          volumeChange: wiVolumeAdj,
          costChange: wiCostAdj,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal what-if");

      // Build base from input values
      const fc = Number(wiFixedCost) || 0;
      const vc = Number(wiVariableCost) || 0;
      const sp = Number(wiSellingPrice) || 0;
      const cs = Number(wiCurrentSales) || 0;
      const base = {
        calculationId: "live-base",
        brand: "WhatIf",
        product: "Base",
        fixedCost: fc,
        variableCostPerUnit: vc,
        sellingPricePerUnit: sp,
        currentSales: cs,
        ...calcBEP(fc, vc, sp, cs),
        createdAt: "",
        updatedAt: "",
      };
      setWiResult({ base, scenario: data.scenario });
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
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
              {loading ? "Loading..." : `${calculations.length} calculations`}
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
                    <CardTitle className="text-2xl">{summary?.brands?.length || 0}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{calculations.length} products analyzed</p>
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
                      {summary && summary.totalProfitLoss >= 0
                        ? <TrendingUp className="h-3 w-3 text-emerald-500" />
                        : <TrendingDown className="h-3 w-3 text-red-500" />}
                      Total Profit/Loss
                    </CardDescription>
                    <CardTitle className={`text-2xl ${(summary?.totalProfitLoss || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {fmt(summary?.totalProfitLoss || 0)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-1">
                      <Target className="h-3 w-3" /> Profitability
                    </CardDescription>
                    <CardTitle className="text-2xl">
                      {summary?.profitableCount || 0}/{summary?.brands?.length || 0}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 text-xs">
                      <span className="text-emerald-600">{summary?.profitableCount || 0} profitable</span>
                      <span className="text-red-600">{summary?.lossCount || 0} loss</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Brand Cards */}
              <h2 className="text-lg font-semibold">BEP Summary per Brand</h2>
              {summary?.brands?.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="text-4xl mb-4">📐</div>
                    <h3 className="text-lg font-semibold mb-2">Belum Ada Data BEP</h3>
                    <p className="text-sm text-muted-foreground">Mulai hitung BEP di tab Calculator.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {(summary?.brands || []).map((b) => (
                    <Card
                      key={b.brand}
                      className={`hover:shadow-md transition-shadow ${b.status === "profit" ? "border-l-4 border-l-emerald-500" : b.status === "loss" ? "border-l-4 border-l-red-500" : "border-l-4 border-l-yellow-500"}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">🏷️ {b.brand}</CardTitle>
                            <CardDescription>{b.product}</CardDescription>
                          </div>
                          <StatusBadge status={b.status} />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Fixed Costs:</span>
                            <div className="font-medium">{fmt(b.fixedCost)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Profit/Loss:</span>
                            <div className={`font-medium ${b.profitLoss >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {fmt(b.profitLoss)}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">BEP (units):</span>
                            <div className="font-medium">{fmtNum(Math.ceil(b.bepUnits))}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Current Sales:</span>
                            <div className="font-medium">{fmtNum(b.currentSales)}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-muted-foreground">Margin of Safety</span>
                          <MoSBadge mos={b.marginOfSafety} />
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${b.marginOfSafety >= 30 ? "bg-emerald-500" : b.marginOfSafety >= 15 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${Math.min(Math.max(b.marginOfSafety, 0), 100)}%` }}
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
                      <Input placeholder="e.g. MABRUK" value={calcBrand} onChange={(e) => setCalcBrand(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Product *</Label>
                      <Input placeholder="e.g. Classic 100ml" value={calcProduct} onChange={(e) => setCalcProduct(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Fixed Cost (Rp) *</Label>
                      <Input type="number" placeholder="150000000" value={calcFixedCost} onChange={(e) => setCalcFixedCost(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Variable Cost/Unit (Rp) *</Label>
                      <Input type="number" placeholder="45000" value={calcVariableCost} onChange={(e) => setCalcVariableCost(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Selling Price/Unit (Rp) *</Label>
                      <Input type="number" placeholder="120000" value={calcSellingPrice} onChange={(e) => setCalcSellingPrice(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Current Sales (units)</Label>
                      <Input type="number" placeholder="2500" value={calcCurrentSales} onChange={(e) => setCalcCurrentSales(e.target.value)} />
                    </div>
                  </div>
                  <Button type="submit" disabled={calcSaving || !calcBrand || !calcProduct || !calcFixedCost || !calcVariableCost || !calcSellingPrice} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    {calcSaving ? "Menyimpan..." : "Hitung & Simpan BEP"}
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
                        <p className="text-lg font-bold text-purple-700">{fmtNum(liveCalc.bepUnits)}</p>
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
                    <div className={`p-4 rounded-lg text-center ${liveCalc.profitLoss >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                      <p className="text-xs text-muted-foreground mb-1">Projected Profit/Loss</p>
                      <p className={`text-2xl font-bold ${liveCalc.profitLoss >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {fmt(liveCalc.profitLoss)}
                      </p>
                      {liveCalc.profitLoss >= 0 ? (
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

                {calcSaved && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-700 font-medium">✅ Tersimpan:</p>
                    <p className="text-sm text-green-800">
                      {calcSaved.brand} — {calcSaved.product}: BEP {fmtNum(Math.ceil(calcSaved.bepUnits))} units ({fmt(calcSaved.bepRevenue)})
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
          ) : calculations.length === 0 ? (
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
                      <TableHead className="text-right">Fixed Cost</TableHead>
                      <TableHead className="text-right">Var Cost/Unit</TableHead>
                      <TableHead className="text-right">Sell Price/Unit</TableHead>
                      <TableHead className="text-right">CM</TableHead>
                      <TableHead className="text-right">BEP (units)</TableHead>
                      <TableHead className="text-right">BEP (revenue)</TableHead>
                      <TableHead className="text-right">Current Sales</TableHead>
                      <TableHead className="text-right">MoS</TableHead>
                      <TableHead className="text-right">Profit/Loss</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculations.map((item) => (
                      <TableRow key={item.calculationId}>
                        <TableCell className="font-medium">{item.brand}</TableCell>
                        <TableCell>{item.product}</TableCell>
                        <TableCell className="text-right">{fmt(item.fixedCost)}</TableCell>
                        <TableCell className="text-right">{fmt(item.variableCostPerUnit)}</TableCell>
                        <TableCell className="text-right">{fmt(item.sellingPricePerUnit)}</TableCell>
                        <TableCell className="text-right font-medium text-blue-600">{fmt(item.contributionMargin)}</TableCell>
                        <TableCell className="text-right font-medium text-purple-600">{fmtNum(Math.ceil(item.bepUnits))}</TableCell>
                        <TableCell className="text-right">{fmt(item.bepRevenue)}</TableCell>
                        <TableCell className="text-right">{fmtNum(item.currentSales)}</TableCell>
                        <TableCell className="text-right"><MoSBadge mos={item.marginOfSafety} /></TableCell>
                        <TableCell className={`text-right font-medium ${item.profitLoss >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {fmt(item.profitLoss)}
                        </TableCell>
                        <TableCell>
                          {item.profitLoss > 0
                            ? <Badge className="bg-emerald-600">Untung</Badge>
                            : item.profitLoss < 0
                              ? <Badge className="bg-red-500">Rugi</Badge>
                              : <Badge variant="outline">BEP</Badge>}
                        </TableCell>
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
                      <Label>Cost Adjustment</Label>
                      <span className={wiCostAdj > 0 ? "text-red-600" : wiCostAdj < 0 ? "text-emerald-600" : ""}>
                        {wiCostAdj > 0 ? "+" : ""}{wiCostAdj}%
                      </span>
                    </div>
                    <Slider min={-30} max={50} step={1} value={[wiCostAdj]} onValueChange={([v]) => setWiCostAdj(v)} />
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
                <CardDescription>Perbandingan base vs scenario (real-time)</CardDescription>
              </CardHeader>
              <CardContent>
                {whatIfPreview ? (
                  <div className="space-y-4">
                    {/* Scenario adjusted values */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 mb-1">New Selling Price</p>
                        <p className="text-lg font-bold text-blue-700">
                          {fmt(Number(wiSellingPrice) * (1 + wiPriceAdj / 100))}
                        </p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <p className="text-xs text-orange-600 mb-1">New Variable Cost</p>
                        <p className="text-lg font-bold text-orange-700">
                          {fmt(Number(wiVariableCost) * (1 + wiCostAdj / 100))}
                        </p>
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
                            <td className="p-2 text-right">{fmtNum(whatIfPreview.base.bepUnits)}</td>
                            <td className="p-2 text-right font-medium">{fmtNum(whatIfPreview.scenario.bepUnits)}</td>
                            <td className={`p-2 text-right text-xs ${whatIfPreview.scenario.bepUnits - whatIfPreview.base.bepUnits <= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {whatIfPreview.scenario.bepUnits - whatIfPreview.base.bepUnits > 0 ? "+" : ""}{fmtNum(whatIfPreview.scenario.bepUnits - whatIfPreview.base.bepUnits)}
                            </td>
                          </tr>
                          <tr className="border-t">
                            <td className="p-2 text-muted-foreground">BEP (revenue)</td>
                            <td className="p-2 text-right">{fmt(whatIfPreview.base.bepRevenue)}</td>
                            <td className="p-2 text-right font-medium">{fmt(whatIfPreview.scenario.bepRevenue)}</td>
                            <td className={`p-2 text-right text-xs ${whatIfPreview.scenario.bepRevenue - whatIfPreview.base.bepRevenue <= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {whatIfPreview.scenario.bepRevenue - whatIfPreview.base.bepRevenue > 0 ? "+" : ""}{fmt(whatIfPreview.scenario.bepRevenue - whatIfPreview.base.bepRevenue)}
                            </td>
                          </tr>
                          <tr className="border-t">
                            <td className="p-2 text-muted-foreground">Margin of Safety</td>
                            <td className="p-2 text-right">{fmtPct(whatIfPreview.base.marginOfSafety)}</td>
                            <td className="p-2 text-right font-medium">{fmtPct(whatIfPreview.scenario.marginOfSafety)}</td>
                            <td className={`p-2 text-right text-xs ${whatIfPreview.scenario.marginOfSafety - whatIfPreview.base.marginOfSafety >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {whatIfPreview.scenario.marginOfSafety - whatIfPreview.base.marginOfSafety > 0 ? "+" : ""}{fmtPct(whatIfPreview.scenario.marginOfSafety - whatIfPreview.base.marginOfSafety)}
                            </td>
                          </tr>
                          <tr className="border-t">
                            <td className="p-2 text-muted-foreground">Profit/Loss</td>
                            <td className="p-2 text-right">{fmt(whatIfPreview.base.profitLoss)}</td>
                            <td className={`p-2 text-right font-medium ${whatIfPreview.scenario.profitLoss >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {fmt(whatIfPreview.scenario.profitLoss)}
                            </td>
                            <td className={`p-2 text-right text-xs ${whatIfPreview.scenario.profitLoss - whatIfPreview.base.profitLoss >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {whatIfPreview.scenario.profitLoss - whatIfPreview.base.profitLoss > 0 ? "+" : ""}{fmt(whatIfPreview.scenario.profitLoss - whatIfPreview.base.profitLoss)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Verdict */}
                    <div className={`p-4 rounded-lg text-center ${whatIfPreview.scenario.profitLoss >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                      {whatIfPreview.scenario.profitLoss > whatIfPreview.base.profitLoss ? (
                        <p className="text-sm text-emerald-700 flex items-center justify-center gap-1">
                          <TrendingUp className="h-4 w-4" /> Scenario improves profit by {fmt(whatIfPreview.scenario.profitLoss - whatIfPreview.base.profitLoss)}
                        </p>
                      ) : whatIfPreview.scenario.profitLoss < whatIfPreview.base.profitLoss ? (
                        <p className="text-sm text-red-700 flex items-center justify-center gap-1">
                          <TrendingDown className="h-4 w-4" /> Scenario reduces profit by {fmt(Math.abs(whatIfPreview.scenario.profitLoss - whatIfPreview.base.profitLoss))}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No change in profit</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <Sliders className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Adjust sliders untuk melihat real-time what-if analysis</p>
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

// ── Pure BEP calculation (client-side) ─────────────────────────────

function calcBEP(
  fixedCost: number,
  variableCostPerUnit: number,
  sellingPricePerUnit: number,
  currentSales: number = 0,
) {
  const contributionMargin = sellingPricePerUnit - variableCostPerUnit;
  const bepUnits = contributionMargin > 0 ? Math.ceil(fixedCost / contributionMargin) : 0;
  const bepRevenue = bepUnits * sellingPricePerUnit;
  const marginOfSafety =
    currentSales > 0
      ? Math.round(((currentSales - bepUnits) / currentSales) * 100 * 100) / 100
      : 0;
  const profitLoss = currentSales * contributionMargin - fixedCost;
  return { contributionMargin, bepUnits, bepRevenue, marginOfSafety, profitLoss };
}
