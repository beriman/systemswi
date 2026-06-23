"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types ──

interface SalesTarget {
  targetId: string;
  brandId: string;
  brandName: string;
  year: number;
  month: number;
  targetAmount: number;
  actualAmount: number;
  achievementPct: number;
  notes: string;
  createdDate: string;
  updatedDate: string;
}

interface SalesActual {
  actualId: string;
  date: string;
  brandId: string;
  brandName: string;
  productSku: string;
  qtySold: number;
  unitPrice: number;
  totalRevenue: number;
  channel: string;
  notes: string;
}

interface AchievementSummary {
  year: number;
  brands: {
    brandId: string;
    brandName: string;
    totalTarget: number;
    totalActual: number;
    achievementPct: number;
    months: {
      month: number;
      monthName: string;
      target: number;
      actual: number;
      achievementPct: number;
    }[];
  }[];
  grandTotal: { target: number; actual: number; achievementPct: number };
}

interface TrendData {
  brandTrends: {
    brandId: string;
    brandName: string;
    monthly: {
      month: number;
      monthName: string;
      target: number;
      actual: number;
      achievementPct: number;
      momGrowthPct: number | null;
    }[];
    totalTarget: number;
    totalActual: number;
    overallAchievementPct: number;
  }[];
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

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function getAchievementColor(pct: number): string {
  if (pct >= 100) return "bg-emerald-500";
  if (pct >= 80) return "bg-yellow-500";
  if (pct >= 50) return "bg-orange-500";
  return "bg-red-500";
}

function getAchievementBadge(pct: number): { label: string; className: string } {
  if (pct >= 100) return { label: "TERCAPAI", className: "bg-emerald-100 text-emerald-700" };
  if (pct >= 80) return { label: "DEKAT", className: "bg-yellow-100 text-yellow-700" };
  if (pct >= 50) return { label: "PERLU PERHATIAN", className: "bg-orange-100 text-orange-700" };
  return { label: "BAWAH TARGET", className: "bg-red-100 text-red-700" };
}

// ── Main Page ──

export default function SalesTargetPage() {
  const [tab, setTab] = useState("dashboard");
  const [year, setYear] = useState(2026);

  // Data states
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [actuals, setActuals] = useState<SalesActual[]>([]);
  const [achievement, setAchievement] = useState<AchievementSummary | null>(null);
  const [trend, setTrend] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Target form
  const [targetBrandId, setTargetBrandId] = useState("");
  const [targetBrandName, setTargetBrandName] = useState("");
  const [targetYear, setTargetYear] = useState("2026");
  const [targetMonth, setTargetMonth] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetNotes, setTargetNotes] = useState("");
  const [targetSubmitting, setTargetSubmitting] = useState(false);
  const [targetMessage, setTargetMessage] = useState<string | null>(null);

  // Actual form
  const [actualDate, setActualDate] = useState("");
  const [actualBrandId, setActualBrandId] = useState("");
  const [actualBrandName, setActualBrandName] = useState("");
  const [actualSku, setActualSku] = useState("");
  const [actualQty, setActualQty] = useState("");
  const [actualPrice, setActualPrice] = useState("");
  const [actualChannel, setActualChannel] = useState("Direct");
  const [actualNotes, setActualNotes] = useState("");
  const [actualSubmitting, setActualSubmitting] = useState(false);
  const [actualMessage, setActualMessage] = useState<string | null>(null);

  // Seed state
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  // Brand options
  const brandOptions = [
    { id: "brand-larc-en-scent", name: "L'Arc~en~Scent" },
    { id: "brand-pixel-potion", name: "Pixel Potion" },
    { id: "brand-nuscentza", name: "Nuscentza" },
  ];

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);

      const [targetsRes, actualsRes, achievementRes, trendRes] = await Promise.all([
        fetch(`/api/sales/targets?year=${year}`),
        fetch(`/api/sales/actuals?year=${year}`),
        fetch(`/api/sales/achievement?year=${year}`),
        fetch(`/api/sales/trend?year=${year}`),
      ]);

      if (targetsRes.ok) {
        const json = await targetsRes.json();
        setTargets(json.targets || []);
      }
      if (actualsRes.ok) {
        const json = await actualsRes.json();
        setActuals(json.actuals || []);
      }
      if (achievementRes.ok) {
        const json = await achievementRes.json();
        setAchievement(json);
      }
      if (trendRes.ok) {
        const json = await trendRes.json();
        setTrend(json);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [year]);

  // ── Target form handler ──
  async function handleTargetSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTargetSubmitting(true);
    setTargetMessage(null);

    if (!targetBrandId || !targetMonth || !targetAmount) {
      setTargetMessage("Brand, bulan, dan target amount wajib diisi.");
      setTargetSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/sales/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: targetBrandId,
          brandName: targetBrandName || targetBrandId,
          year: Number(targetYear),
          month: Number(targetMonth),
          targetAmount: Number(targetAmount),
          notes: targetNotes,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTargetMessage("Target berhasil disimpan!");
      setTargetAmount("");
      setTargetNotes("");
      fetchAll();
    } catch (err) {
      setTargetMessage(`Gagal: ${err}`);
    } finally {
      setTargetSubmitting(false);
    }
  }

  // ── Actual form handler ──
  async function handleActualSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActualSubmitting(true);
    setActualMessage(null);

    if (!actualDate || !actualBrandId || !actualSku || !actualQty || !actualPrice) {
      setActualMessage("Semua field wajib diisi.");
      setActualSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/sales/actuals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: actualDate,
          brandId: actualBrandId,
          brandName: actualBrandName || actualBrandId,
          productSku: actualSku,
          qtySold: Number(actualQty),
          unitPrice: Number(actualPrice),
          channel: actualChannel,
          notes: actualNotes,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setActualMessage("Actual sale berhasil disimpan!");
      setActualSku("");
      setActualQty("");
      setActualPrice("");
      setActualNotes("");
      fetchAll();
    } catch (err) {
      setActualMessage(`Gagal: ${err}`);
    } finally {
      setActualSubmitting(false);
    }
  }

  // ── Seed handler ──
  async function handleSeed() {
    setSeedLoading(true);
    setSeedMessage(null);
    try {
      const res = await fetch("/api/sales/seed?force=true", { method: "POST" });
      const json = await res.json();
      setSeedMessage(json.message || JSON.stringify(json));
      fetchAll();
    } catch (err) {
      setSeedMessage(`Gagal: ${err}`);
    } finally {
      setSeedLoading(false);
    }
  }

  // ── Dashboard calculations ──
  const dashboardData = achievement?.brands || [];
  const grandTotal = achievement?.grandTotal || { target: 0, actual: 0, achievementPct: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🎯 Sales Target vs Actual</h1>
          <p className="text-muted-foreground">Tracking target dan aktual penjualan per brand</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Tahun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2027">2027</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAll} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-red-600 text-sm">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="targets">Targets</TabsTrigger>
          <TabsTrigger value="actuals">Input Actual</TabsTrigger>
          <TabsTrigger value="trend">Trend Analysis</TabsTrigger>
        </TabsList>

        {/* ═══ DASHBOARD TAB ═══ */}
        <TabsContent value="dashboard" className="space-y-4 mt-4">
          {/* Grand total cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Target</CardDescription>
                <CardTitle className="text-2xl">{formatShortRp(grandTotal.target)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Actual</CardDescription>
                <CardTitle className="text-2xl">{formatShortRp(grandTotal.actual)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Overall Achievement</CardDescription>
                <CardTitle className="text-2xl">
                  {grandTotal.achievementPct.toFixed(1)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${getAchievementColor(grandTotal.achievementPct)}`}
                    style={{ width: `${Math.min(grandTotal.achievementPct, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Per-brand achievement */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-6 w-40 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : dashboardData.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <p className="text-muted-foreground text-lg mb-2">Belum ada data target</p>
                <p className="text-muted-foreground text-sm mb-4">
                  Seed data untuk memulai atau buat target di tab Targets
                </p>
                <Button onClick={handleSeed} disabled={seedLoading}>
                  {seedLoading ? "Seeding..." : "🌱 Seed Sample Data"}
                </Button>
                {seedMessage && (
                  <p className="text-sm mt-2 text-muted-foreground">{seedMessage}</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {dashboardData.map((brand) => {
                const badge = getAchievementBadge(brand.achievementPct);
                return (
                  <Card key={brand.brandId}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{brand.brandName}</CardTitle>
                          <CardDescription>
                            {brand.totalActual > 0 ? "Target vs Actual" : "Belum ada actual sales"}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <Badge className={badge.className}>{badge.label}</Badge>
                          <p className="text-2xl font-bold mt-1">{brand.achievementPct.toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                        <div
                          className={`h-4 rounded-full transition-all ${getAchievementColor(brand.achievementPct)}`}
                          style={{ width: `${Math.min(brand.achievementPct, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground mb-4">
                        <span>Target: {formatRp(brand.totalTarget)}</span>
                        <span>Actual: {formatRp(brand.totalActual)}</span>
                      </div>
                      {/* Monthly breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                        {brand.months.map((m) => (
                          <div
                            key={m.month}
                            className="text-center p-2 rounded-md bg-muted/50"
                          >
                            <p className="text-xs text-muted-foreground">{m.monthName}</p>
                            <p className="text-sm font-semibold">{m.achievementPct.toFixed(0)}%</p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div
                                className={`h-1.5 rounded-full ${getAchievementColor(m.achievementPct)}`}
                                style={{ width: `${Math.min(m.achievementPct, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══ TARGETS TAB ═══ */}
        <TabsContent value="targets" className="space-y-4 mt-4">
          {/* Add target form */}
          <Card>
            <CardHeader>
              <CardTitle>Tambah / Edit Target</CardTitle>
              <CardDescription>
                Buat target penjualan per brand per bulan. Jika target sudah ada, akan di-update.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTargetSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Select
                    value={targetBrandId}
                    onValueChange={(v) => {
                      setTargetBrandId(v);
                      const brand = brandOptions.find((b) => b.id === v);
                      setTargetBrandName(brand?.name || "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brandOptions.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tahun</Label>
                  <Input
                    type="number"
                    value={targetYear}
                    onChange={(e) => setTargetYear(e.target.value)}
                    min={2024}
                    max={2030}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bulan</Label>
                  <Select value={targetMonth} onValueChange={setTargetMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih bulan" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTH_NAMES.slice(1).map((name, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Amount (Rp)</Label>
                  <Input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="5000000"
                    min={0}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Notes</Label>
                  <Input
                    value={targetNotes}
                    onChange={(e) => setTargetNotes(e.target.value)}
                    placeholder="Catatan (opsional)"
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={targetSubmitting} className="w-full">
                    {targetSubmitting ? "Menyimpan..." : "Simpan Target"}
                  </Button>
                </div>
              </form>
              {targetMessage && (
                <p className={`text-sm mt-3 ${targetMessage.includes("berhasil") ? "text-emerald-600" : "text-red-600"}`}>
                  {targetMessage}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Targets table */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Target</CardTitle>
              <CardDescription>
                {targets.length} target ditemukan untuk tahun {year}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : targets.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada target untuk tahun {year}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Brand</TableHead>
                        <TableHead>Bulan</TableHead>
                        <TableHead className="text-right">Target</TableHead>
                        <TableHead className="text-right">Actual</TableHead>
                        <TableHead className="text-right">Achievement</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {targets.map((t) => {
                        const badge = getAchievementBadge(t.achievementPct);
                        return (
                          <TableRow key={t.targetId}>
                            <TableCell className="font-medium">{t.brandName}</TableCell>
                            <TableCell>
                              {MONTH_NAMES[t.month]} {t.year}
                            </TableCell>
                            <TableCell className="text-right">{formatRp(t.targetAmount)}</TableCell>
                            <TableCell className="text-right">{formatRp(t.actualAmount)}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {t.achievementPct.toFixed(1)}%
                            </TableCell>
                            <TableCell>
                              <Badge className={badge.className}>{badge.label}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ ACTUALS TAB ═══ */}
        <TabsContent value="actuals" className="space-y-4 mt-4">
          {/* Input actual form */}
          <Card>
            <CardHeader>
              <CardTitle>Input Actual Sales</CardTitle>
              <CardDescription>Catat transaksi penjualan aktual</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleActualSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal</Label>
                  <Input
                    type="date"
                    value={actualDate}
                    onChange={(e) => setActualDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Select
                    value={actualBrandId}
                    onValueChange={(v) => {
                      setActualBrandId(v);
                      const brand = brandOptions.find((b) => b.id === v);
                      setActualBrandName(brand?.name || "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brandOptions.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Product / SKU</Label>
                  <Input
                    value={actualSku}
                    onChange={(e) => setActualSku(e.target.value)}
                    placeholder="LARC-EDP-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qty Sold</Label>
                  <Input
                    type="number"
                    value={actualQty}
                    onChange={(e) => setActualQty(e.target.value)}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit Price (Rp)</Label>
                  <Input
                    type="number"
                    value={actualPrice}
                    onChange={(e) => setActualPrice(e.target.value)}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Channel</Label>
                  <Select value={actualChannel} onValueChange={setActualChannel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Direct", "Shopee", "Tokopedia", "TikTok", "Instagram", "Lazada", "Event"].map((ch) => (
                        <SelectItem key={ch} value={ch}>
                          {ch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Notes</Label>
                  <Input
                    value={actualNotes}
                    onChange={(e) => setActualNotes(e.target.value)}
                    placeholder="Catatan (opsional)"
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={actualSubmitting} className="w-full">
                    {actualSubmitting ? "Menyimpan..." : "Simpan Actual Sale"}
                  </Button>
                </div>
              </form>
              {actualMessage && (
                <p className={`text-sm mt-3 ${actualMessage.includes("berhasil") ? "text-emerald-600" : "text-red-600"}`}>
                  {actualMessage}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent actuals */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Actual Sales</CardTitle>
              <CardDescription>{actuals.length} transaksi ditemukan</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : actuals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada actual sales untuk tahun {year}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Channel</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {actuals.slice(0, 50).map((a) => (
                        <TableRow key={a.actualId}>
                          <TableCell>{a.date}</TableCell>
                          <TableCell className="font-medium">{a.brandName}</TableCell>
                          <TableCell className="text-sm">{a.productSku}</TableCell>
                          <TableCell className="text-right">{a.qtySold}</TableCell>
                          <TableCell className="text-right">{formatRp(a.unitPrice)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatRp(a.totalRevenue)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{a.channel}</Badge>
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

        {/* ═══ TREND ANALYSIS TAB ═══ */}
        <TabsContent value="trend" className="space-y-4 mt-4">
          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-40 mb-4" />
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ) : !trend?.brandTrends || trend.brandTrends.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <p className="text-muted-foreground text-lg mb-2">Belum ada data trend</p>
                <p className="text-muted-foreground text-sm mb-4">
                  Seed data atau input target & actual sales terlebih dahulu
                </p>
                <Button onClick={handleSeed} disabled={seedLoading}>
                  {seedLoading ? "Seeding..." : "🌱 Seed Sample Data"}
                </Button>
                {seedMessage && (
                  <p className="text-sm mt-2 text-muted-foreground">{seedMessage}</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Brand comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {trend.brandTrends.map((bt) => (
                  <Card key={bt.brandId}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{bt.brandName}</CardTitle>
                      <CardDescription>
                        Achievement: {bt.overallAchievementPct.toFixed(1)}%
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                        <div
                          className={`h-3 rounded-full ${getAchievementColor(bt.overallAchievementPct)}`}
                          style={{ width: `${Math.min(bt.overallAchievementPct, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Target: {formatShortRp(bt.totalTarget)}</span>
                        <span>Actual: {formatShortRp(bt.totalActual)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Monthly trend table */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trend — Target vs Actual</CardTitle>
                  <CardDescription>
                    Perbandingan target vs actual per bulan untuk semua brand
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bulan</TableHead>
                          {trend.brandTrends.map((bt) => (
                            <TableHead key={bt.brandId} colSpan={3} className="text-center border-l">
                              {bt.brandName}
                            </TableHead>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableHead></TableHead>
                          {trend.brandTrends.map((bt) => (
                            <TableHead key={`${bt.brandId}-t`} className="text-right text-xs">
                              Target
                            </TableHead>
                          ))}
                          {trend.brandTrends.map((bt) => (
                            <TableHead key={`${bt.brandId}-a`} className="text-right text-xs">
                              Actual
                            </TableHead>
                          ))}
                          {trend.brandTrends.map((bt) => (
                            <TableHead key={`${bt.brandId}-ach`} className="text-right text-xs border-l">
                              Ach%
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                          <TableRow key={month}>
                            <TableCell className="font-medium">
                              {MONTH_NAMES[month]}
                            </TableCell>
                            {trend.brandTrends.map((bt) => {
                              const m = bt.monthly.find((x) => x.month === month);
                              return (
                                <TableCell key={`${bt.brandId}-t-${month}`} className="text-right text-sm">
                                  {m ? formatShortRp(m.target) : "—"}
                                </TableCell>
                              );
                            })}
                            {trend.brandTrends.map((bt) => {
                              const m = bt.monthly.find((x) => x.month === month);
                              return (
                                <TableCell key={`${bt.brandId}-a-${month}`} className="text-right text-sm">
                                  {m ? formatShortRp(m.actual) : "—"}
                                </TableCell>
                              );
                            })}
                            {trend.brandTrends.map((bt) => {
                              const m = bt.monthly.find((x) => x.month === month);
                              return (
                                <TableCell
                                  key={`${bt.brandId}-ach-${month}`}
                                  className={`text-right text-sm font-semibold border-l ${
                                    m && m.achievementPct >= 100
                                      ? "text-emerald-600"
                                      : m && m.achievementPct >= 80
                                      ? "text-yellow-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {m && (m.target > 0 || m.actual > 0)
                                    ? `${m.achievementPct.toFixed(0)}%`
                                    : "—"}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* MoM Growth */}
              <Card>
                <CardHeader>
                  <CardTitle>Month-over-Month Growth</CardTitle>
                  <CardDescription>
                    Pertumbuhan actual sales per brand per bulan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Brand</TableHead>
                          {Array.from({ length: 6 }, (_, i) => i + 1).map((m) => (
                            <TableHead key={m} className="text-right">
                              {MONTH_NAMES[m]}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trend.brandTrends.map((bt) => (
                          <TableRow key={bt.brandId}>
                            <TableCell className="font-medium">{bt.brandName}</TableCell>
                            {bt.monthly.slice(0, 6).map((m) => (
                              <TableCell
                                key={m.month}
                                className={`text-right ${
                                  m.momGrowthPct === null
                                    ? "text-muted-foreground"
                                    : m.momGrowthPct >= 0
                                    ? "text-emerald-600"
                                    : "text-red-600"
                                }`}
                              >
                                {m.momGrowthPct !== null ? `${m.momGrowthPct > 0 ? "+" : ""}${m.momGrowthPct.toFixed(1)}%` : "—"}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
