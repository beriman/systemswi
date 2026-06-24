"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types ──────────────────────────────────────────────────────────

interface BEPCalculation {
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
  profit: number;
  createdAt: string;
}

interface BEPSummary {
  totalFixedCosts: number;
  totalCurrentSales: number;
  totalProfit: number;
  brandsAtBEP: number;
  brandsAboveBEP: number;
  brandsBelowBEP: number;
  brandSummaries: BrandBEPSummary[];
  totalRevenue?: number;
  totalContribution?: number;
  overallMarginOfSafety?: number;
  avgContributionMargin?: number;
}

interface BrandBEPSummary {
  brand: string;
  product: string;
  fixedCost: number;
  contributionMargin: number;
  bepUnits: number;
  bepRevenue: number;
  currentSales: number;
  marginOfSafety: number;
  profit: number;
  status: "profit" | "breakeven" | "loss";
}

interface WhatIfScenario {
  id: string;
  name: string;
  fixedCost: number;
  variableCostPerUnit: number;
  sellingPricePerUnit: number;
  projectedSales: number;
  contributionMargin: number;
  bepUnits: number;
  bepRevenue: number;
  marginOfSafety: number;
  profit: number;
}

// ── Helpers ────────────────────────────────────────────────────────

function fmtIDR(n: number): string {
  if (!Number.isFinite(n)) return "Rp —";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function fmtNum(n: number): string {
  return new Intl.NumberFormat("id-ID").format(Math.round(n));
}

function fmtPct(n: number): string {
  return `${n >= 0 ? "" : ""}${n.toFixed(1)}%`;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "profit") return <Badge className="bg-emerald-100 text-emerald-800">✅ Profit</Badge>;
  if (status === "breakeven") return <Badge className="bg-amber-100 text-amber-800">⚖️ Break-Even</Badge>;
  return <Badge className="bg-red-100 text-red-800">📉 Loss</Badge>;
}

function ProfitBadge({ value }: { value: number }) {
  if (value > 0) return <span className="text-emerald-600 font-semibold">{fmtIDR(value)}</span>;
  if (value === 0) return <span className="text-amber-600 font-semibold">{fmtIDR(0)}</span>;
  return <span className="text-red-600 font-semibold">{fmtIDR(value)}</span>;
}

// ── Slider component ───────────────────────────────────────────────

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix = "",
  suffix = "",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-sm font-mono text-muted-foreground">
          {prefix}{fmtNum(value)}{suffix}
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
        <span>{prefix}{fmtNum(min)}{suffix}</span>
        <span>{prefix}{fmtNum(max)}{suffix}</span>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────

export default function BEPPage() {
  const [data, setData] = useState<BEPCalculation[]>([]);
  const [summary, setSummary] = useState<BEPSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceStatus, setSourceStatus] = useState<string>("live");

  // Calculator form state
  const [calcBrand, setCalcBrand] = useState("");
  const [calcProduct, setCalcProduct] = useState("");
  const [calcFixedCost, setCalcFixedCost] = useState("");
  const [calcVariableCost, setCalcVariableCost] = useState("");
  const [calcSellingPrice, setCalcSellingPrice] = useState("");
  const [calcCurrentSales, setCalcCurrentSales] = useState("");
  const [calcResult, setCalcResult] = useState<BEPCalculation | null>(null);
  const [calcSaving, setCalcSaving] = useState(false);

  // What-if state
  const [wiFixedCost, setWiFixedCost] = useState(15000000);
  const [wiVariableCost, setWiVariableCost] = useState(35000);
  const [wiSellingPrice, setWiSellingPrice] = useState(85000);
  const [wiProjectedSales, setWiProjectedSales] = useState(400);
  const [wiResult, setWiResult] = useState<WhatIfScenario | null>(null);
  const [wiHistory, setWiHistory] = useState<WhatIfScenario[]>([]);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/bep/summary");
      const json = await res.json();
      setSourceStatus(json.sourceStatus || "live");
      if (json.data) setData(json.data);
      if (json.summary) setSummary(json.summary);
      setError(null);
    } catch (e) {
      setError("Failed to load BEP data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-calculate for calculator tab
  useEffect(() => {
    const fc = Number(calcFixedCost) || 0;
    const vc = Number(calcVariableCost) || 0;
    const sp = Number(calcSellingPrice) || 0;
    const cs = Number(calcCurrentSales) || 0;

    if (fc > 0 && sp > vc) {
      const cm = sp - vc;
      const bepU = Math.ceil(fc / cm);
      const bepR = bepU * sp;
      const mos = cs > 0 ? Math.round(((cs - bepU) / cs) * 100 * 100) / 100 : 0;
      const profit = cs * cm - fc;
      setCalcResult({
        id: "preview",
        brand: calcBrand || "Preview",
        product: calcProduct || "Preview",
        fixedCost: fc,
        variableCostPerUnit: vc,
        sellingPricePerUnit: sp,
        contributionMargin: cm,
        bepUnits: bepU,
        bepRevenue: bepR,
        currentSales: cs,
        marginOfSafety: mos,
        profit,
        createdAt: new Date().toISOString(),
      });
    } else {
      setCalcResult(null);
    }
  }, [calcFixedCost, calcVariableCost, calcSellingPrice, calcCurrentSales, calcBrand, calcProduct]);

  // What-if real-time calculation
  useEffect(() => {
    if (wiSellingPrice > wiVariableCost) {
      const cm = wiSellingPrice - wiVariableCost;
      const bepU = Math.ceil(wiFixedCost / cm);
      const bepR = bepU * wiSellingPrice;
      const mos = wiProjectedSales > 0 ? Math.round(((wiProjectedSales - bepU) / wiProjectedSales) * 100 * 100) / 100 : 0;
      const profit = wiProjectedSales * cm - wiFixedCost;
      setWiResult({
        id: "live-whatif",
        name: "Live Scenario",
        fixedCost: wiFixedCost,
        variableCostPerUnit: wiVariableCost,
        sellingPricePerUnit: wiSellingPrice,
        projectedSales: wiProjectedSales,
        contributionMargin: cm,
        bepUnits: bepU,
        bepRevenue: bepR,
        marginOfSafety: mos,
        profit,
      });
    } else {
      setWiResult(null);
    }
  }, [wiFixedCost, wiVariableCost, wiSellingPrice, wiProjectedSales]);

  // Save BEP calculation
  const handleSaveCalc = async () => {
    if (!calcResult) return;
    setCalcSaving(true);
    try {
      const res = await fetch("/api/bep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: calcBrand || "Unnamed Brand",
          product: calcProduct || "Unnamed Product",
          fixedCost: Number(calcFixedCost),
          variableCostPerUnit: Number(calcVariableCost),
          sellingPricePerUnit: Number(calcSellingPrice),
          currentSales: Number(calcCurrentSales) || 0,
        }),
      });
      if (res.ok) {
        setCalcBrand("");
        setCalcProduct("");
        setCalcFixedCost("");
        setCalcVariableCost("");
        setCalcSellingPrice("");
        setCalcCurrentSales("");
        setCalcResult(null);
        fetchData();
      }
    } catch {
      // silent
    } finally {
      setCalcSaving(false);
    }
  };

  // Save what-if scenario
  const handleSaveWhatIf = async () => {
    if (!wiResult) return;
    try {
      const res = await fetch("/api/bep/what-if", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Scenario ${wiHistory.length + 1}`,
          fixedCost: wiFixedCost,
          variableCostPerUnit: wiVariableCost,
          sellingPricePerUnit: wiSellingPrice,
          projectedSales: wiProjectedSales,
        }),
      });
      if (res.ok) {
        setWiHistory((prev) => [...prev, { ...wiResult, id: `whatif-${Date.now()}`, name: `Scenario ${prev.length + 1}` }]);
      }
    } catch {
      // silent
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">📐 Break-Even Analysis</h2>
        <p className="text-muted-foreground">
          Analisis BEP untuk decision-making: kalkulasi titik impas, margin of safety, dan profit per brand.
        </p>
      </div>

      {sourceStatus === "degraded" && (
        <Card className="border-amber-200 bg-amber-50 text-amber-950">
          <CardContent className="pt-6">
            <div className="font-semibold">⚠️ Google Workspace perlu re-auth</div>
            <p className="text-sm">Data BEP mungkin tidak lengkap. Re-authenticate Google Workspace untuk data live.</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">📊 Overview</TabsTrigger>
          <TabsTrigger value="calculator">🧮 Calculator</TabsTrigger>
          <TabsTrigger value="brands">🏷️ Brand Analysis</TabsTrigger>
          <TabsTrigger value="whatif">🔮 What-If</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ──────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Fixed Costs</CardDescription>
                    <CardTitle className="text-2xl">{fmtIDR(summary?.totalFixedCosts || 0)}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Current Sales</CardDescription>
                    <CardTitle className="text-2xl">{fmtNum(summary?.totalCurrentSales || 0)} unit</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Profit/Loss</CardDescription>
                    <CardTitle className={`text-2xl ${(summary?.totalProfit || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {fmtIDR(summary?.totalProfit || 0)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Overall Margin of Safety</CardDescription>
                    <CardTitle className="text-2xl">
                      {fmtPct(summary?.overallMarginOfSafety || 0)}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Brand Summary Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(summary?.brandSummaries || []).map((brand) => (
                  <Card key={brand.brand} className={brand.status === "profit" ? "border-emerald-200" : brand.status === "loss" ? "border-red-200" : "border-amber-200"}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{brand.brand}</CardTitle>
                          <CardDescription>{brand.product}</CardDescription>
                        </div>
                        <StatusBadge status={brand.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">BEP</span>
                        <span className="font-medium">{fmtNum(brand.bepUnits)} unit</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">BEP Revenue</span>
                        <span className="font-medium">{fmtIDR(brand.bepRevenue)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current Sales</span>
                        <span className="font-medium">{fmtNum(brand.currentSales)} unit</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Margin of Safety</span>
                        <span className="font-medium">{fmtPct(brand.marginOfSafety)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Profit/Loss</span>
                        <ProfitBadge value={brand.profit} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Status Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Status Summary</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-600">{summary?.brandsAboveBEP || 0}</div>
                    <div className="text-sm text-muted-foreground">Above BEP</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-amber-600">{summary?.brandsAtBEP || 0}</div>
                    <div className="text-sm text-muted-foreground">At BEP</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{summary?.brandsBelowBEP || 0}</div>
                    <div className="text-sm text-muted-foreground">Below BEP</div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── Calculator Tab ─────────────────────────────────────── */}
        <TabsContent value="calculator" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle>BEP Calculator</CardTitle>
                <CardDescription>Masukkan data untuk menghitung break-even point</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Brand</Label>
                    <Input placeholder="Sensasi Wangi" value={calcBrand} onChange={(e) => setCalcBrand(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <Input placeholder="Eau de Parfum 50ml" value={calcProduct} onChange={(e) => setCalcProduct(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Fixed Cost (Rp)</Label>
                  <Input type="number" placeholder="15000000" value={calcFixedCost} onChange={(e) => setCalcFixedCost(e.target.value)} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Variable Cost / Unit (Rp)</Label>
                    <Input type="number" placeholder="35000" value={calcVariableCost} onChange={(e) => setCalcVariableCost(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Selling Price / Unit (Rp)</Label>
                    <Input type="number" placeholder="85000" value={calcSellingPrice} onChange={(e) => setCalcSellingPrice(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Current Sales (units, optional)</Label>
                  <Input type="number" placeholder="400" value={calcCurrentSales} onChange={(e) => setCalcCurrentSales(e.target.value)} />
                </div>
                <Button onClick={handleSaveCalc} disabled={!calcResult || calcSaving} className="w-full">
                  {calcSaving ? "Saving..." : "💾 Save Calculation"}
                </Button>
              </CardContent>
            </Card>

            {/* Result */}
            <Card>
              <CardHeader>
                <CardTitle>Hasil Kalkulasi</CardTitle>
                <CardDescription>Break-even analysis result</CardDescription>
              </CardHeader>
              <CardContent>
                {calcResult ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-muted p-3">
                        <div className="text-xs text-muted-foreground">Contribution Margin</div>
                        <div className="text-xl font-bold">{fmtIDR(calcResult.contributionMargin)}</div>
                      </div>
                      <div className="rounded-lg bg-muted p-3">
                        <div className="text-xs text-muted-foreground">BEP (Units)</div>
                        <div className="text-xl font-bold">{fmtNum(calcResult.bepUnits)} unit</div>
                      </div>
                      <div className="rounded-lg bg-muted p-3">
                        <div className="text-xs text-muted-foreground">BEP (Revenue)</div>
                        <div className="text-xl font-bold">{fmtIDR(calcResult.bepRevenue)}</div>
                      </div>
                      <div className="rounded-lg bg-muted p-3">
                        <div className="text-xs text-muted-foreground">Margin of Safety</div>
                        <div className="text-xl font-bold">{fmtPct(calcResult.marginOfSafety)}</div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-4 text-center">
                      <div className="text-sm text-muted-foreground">Profit/Loss</div>
                      <div className={`text-3xl font-bold ${calcResult.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {fmtIDR(calcResult.profit)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Formula: CM = SP - VC = {fmtIDR(calcResult.sellingPricePerUnit)} - {fmtIDR(calcResult.variableCostPerUnit)} = <strong>{fmtIDR(calcResult.contributionMargin)}</strong></div>
                      <div>BEP Units = FC / CM = {fmtIDR(calcResult.fixedCost)} / {fmtIDR(calcResult.contributionMargin)} = <strong>{fmtNum(calcResult.bepUnits)} unit</strong></div>
                      <div>BEP Revenue = BEP × SP = {fmtNum(calcResult.bepUnits)} × {fmtIDR(calcResult.sellingPricePerUnit)} = <strong>{fmtIDR(calcResult.bepRevenue)}</strong></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-muted-foreground">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🧮</div>
                      <div>Masukkan data di form untuk melihat hasil kalkulasi</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Brand Analysis Tab ─────────────────────────────────── */}
        <TabsContent value="brands" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Break-Even Analysis</CardTitle>
              <CardDescription>Detailed BEP comparison across all brands</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : data.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="text-4xl mb-2">📊</div>
                  <div>No BEP data available. Add calculations using the Calculator tab.</div>
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
                        <TableHead className="text-right">BEP (Units)</TableHead>
                        <TableHead className="text-right">BEP (Revenue)</TableHead>
                        <TableHead className="text-right">Current Sales</TableHead>
                        <TableHead className="text-right">MoS</TableHead>
                        <TableHead className="text-right">Profit/Loss</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.brand}</TableCell>
                          <TableCell>{row.product}</TableCell>
                          <TableCell className="text-right">{fmtIDR(row.fixedCost)}</TableCell>
                          <TableCell className="text-right">{fmtIDR(row.variableCostPerUnit)}</TableCell>
                          <TableCell className="text-right">{fmtIDR(row.sellingPricePerUnit)}</TableCell>
                          <TableCell className="text-right font-medium">{fmtIDR(row.contributionMargin)}</TableCell>
                          <TableCell className="text-right font-bold">{fmtNum(row.bepUnits)}</TableCell>
                          <TableCell className="text-right">{fmtIDR(row.bepRevenue)}</TableCell>
                          <TableCell className="text-right">{fmtNum(row.currentSales)}</TableCell>
                          <TableCell className="text-right">{fmtPct(row.marginOfSafety)}</TableCell>
                          <TableCell className="text-right"><ProfitBadge value={row.profit} /></TableCell>
                          <TableCell>
                            <StatusBadge status={row.profit > 0 ? "profit" : row.profit === 0 ? "breakeven" : "loss"} />
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

        {/* ── What-If Tab ────────────────────────────────────────── */}
        <TabsContent value="whatif" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Sliders */}
            <Card>
              <CardHeader>
                <CardTitle>What-If Scenario</CardTitle>
                <CardDescription>Adjust parameters to see real-time BEP changes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <SliderInput
                  label="Fixed Cost"
                  value={wiFixedCost}
                  onChange={setWiFixedCost}
                  min={0}
                  max={50000000}
                  step={500000}
                  prefix="Rp "
                />
                <SliderInput
                  label="Variable Cost / Unit"
                  value={wiVariableCost}
                  onChange={setWiVariableCost}
                  min={0}
                  max={100000}
                  step={1000}
                  prefix="Rp "
                />
                <SliderInput
                  label="Selling Price / Unit"
                  value={wiSellingPrice}
                  onChange={setWiSellingPrice}
                  min={10000}
                  max={200000}
                  step={1000}
                  prefix="Rp "
                />
                <SliderInput
                  label="Projected Sales (Units)"
                  value={wiProjectedSales}
                  onChange={setWiProjectedSales}
                  min={0}
                  max={1000}
                  step={10}
                  suffix=" unit"
                />
                <Button onClick={handleSaveWhatIf} disabled={!wiResult} className="w-full">
                  💾 Save Scenario
                </Button>
              </CardContent>
            </Card>

            {/* What-If Result */}
            <Card>
              <CardHeader>
                <CardTitle>Scenario Result</CardTitle>
                <CardDescription>Real-time BEP recalculation</CardDescription>
              </CardHeader>
              <CardContent>
                {wiResult ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-muted p-3">
                        <div className="text-xs text-muted-foreground">Contribution Margin</div>
                        <div className="text-xl font-bold">{fmtIDR(wiResult.contributionMargin)}</div>
                      </div>
                      <div className="rounded-lg bg-muted p-3">
                        <div className="text-xs text-muted-foreground">BEP (Units)</div>
                        <div className="text-xl font-bold">{fmtNum(wiResult.bepUnits)} unit</div>
                      </div>
                      <div className="rounded-lg bg-muted p-3">
                        <div className="text-xs text-muted-foreground">BEP (Revenue)</div>
                        <div className="text-xl font-bold">{fmtIDR(wiResult.bepRevenue)}</div>
                      </div>
                      <div className="rounded-lg bg-muted p-3">
                        <div className="text-xs text-muted-foreground">Margin of Safety</div>
                        <div className="text-xl font-bold">{fmtPct(wiResult.marginOfSafety)}</div>
                      </div>
                    </div>
                    <div className={`rounded-lg p-4 text-center ${wiResult.profit >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                      <div className="text-sm text-muted-foreground">Projected Profit/Loss</div>
                      <div className={`text-3xl font-bold ${wiResult.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {fmtIDR(wiResult.profit)}
                      </div>
                    </div>
                    {wiResult.projectedSales > 0 && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Break-even at <strong>{fmtNum(wiResult.bepUnits)} unit</strong> dari proyeksi <strong>{fmtNum(wiResult.projectedSales)} unit</strong></div>
                        <div>Setiap unit tambahan di atas BEP menambah profit <strong>{fmtIDR(wiResult.contributionMargin)}</strong></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-muted-foreground">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🔮</div>
                      <div>Selling price harus lebih besar dari variable cost</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Saved Scenarios */}
          {wiHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Saved Scenarios</CardTitle>
                <CardDescription>Previously saved what-if scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Scenario</TableHead>
                        <TableHead className="text-right">Fixed Cost</TableHead>
                        <TableHead className="text-right">Var Cost</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Sales</TableHead>
                        <TableHead className="text-right">BEP</TableHead>
                        <TableHead className="text-right">MoS</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wiHistory.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="text-right">{fmtIDR(s.fixedCost)}</TableCell>
                          <TableCell className="text-right">{fmtIDR(s.variableCostPerUnit)}</TableCell>
                          <TableCell className="text-right">{fmtIDR(s.sellingPricePerUnit)}</TableCell>
                          <TableCell className="text-right">{fmtNum(s.projectedSales)}</TableCell>
                          <TableCell className="text-right font-bold">{fmtNum(s.bepUnits)}</TableCell>
                          <TableCell className="text-right">{fmtPct(s.marginOfSafety)}</TableCell>
                          <TableCell className="text-right"><ProfitBadge value={s.profit} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
