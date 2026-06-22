"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Types ──────────────────────────────────────────────────────────

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

// ── Helpers ─────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function getAchievementColor(pct: number): string {
  if (pct >= 100) return "bg-green-500";
  if (pct >= 75) return "bg-blue-500";
  if (pct >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

function getAchievementBadge(pct: number): string {
  if (pct >= 100) return "bg-green-100 text-green-700";
  if (pct >= 75) return "bg-blue-100 text-blue-700";
  if (pct >= 50) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

// ── Main Page Component ────────────────────────────────────────────

export default function SalesTargetPage() {
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [actuals, setActuals] = useState<SalesActual[]>([]);
  const [achievement, setAchievement] = useState<AchievementSummary | null>(null);
  const [trend, setTrend] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"dashboard" | "targets" | "actuals" | "trend">("dashboard");
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [showActualForm, setShowActualForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  // Form states
  const [targetForm, setTargetForm] = useState({
    brandId: "brand-larc-en-scent",
    year: 2026,
    month: 1,
    targetAmount: 5000000,
    notes: "",
  });

  const [actualForm, setActualForm] = useState({
    date: new Date().toISOString().split("T")[0],
    brandId: "brand-larc-en-scent",
    productSku: "",
    qtySold: 1,
    unitPrice: 0,
    channel: "Direct",
    notes: "",
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    try {
      setLoading(true);
      const [targetsRes, actualsRes, achievementRes, trendRes] = await Promise.all([
        fetch("/api/sales/targets?year=2026"),
        fetch("/api/sales/actuals?year=2026"),
        fetch("/api/sales/achievement?year=2026"),
        fetch("/api/sales/trend?year=2026"),
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
        setAchievement(await achievementRes.json());
      }
      if (trendRes.ok) {
        setTrend(await trendRes.json());
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTarget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormMessage(null);

    try {
      const brandNames: Record<string, string> = {
        "brand-larc-en-scent": "L'Arc~en~Scent",
        "brand-pixel-potion": "Pixel Potion",
        "brand-nuscentza": "Nuscentza",
      };

      const res = await fetch("/api/sales/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: targetForm.brandId,
          brandName: brandNames[targetForm.brandId] || targetForm.brandId,
          year: targetForm.year,
          month: targetForm.month,
          targetAmount: targetForm.targetAmount,
          notes: targetForm.notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setFormMessage(`✅ Target berhasil dibuat: ${json.target?.targetId || "OK"}`);
      setShowTargetForm(false);
      fetchAllData();
    } catch (err) {
      setFormMessage(`❌ Gagal: ${String(err).replace(/^Error:\s*/, "")}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateActual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormMessage(null);

    try {
      const brandNames: Record<string, string> = {
        "brand-larc-en-scent": "L'Arc~en~Scent",
        "brand-pixel-potion": "Pixel Potion",
        "brand-nuscentza": "Nuscentza",
      };

      const res = await fetch("/api/sales/actuals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: actualForm.date,
          brandId: actualForm.brandId,
          brandName: brandNames[actualForm.brandId] || actualForm.brandId,
          productSku: actualForm.productSku,
          qtySold: actualForm.qtySold,
          unitPrice: actualForm.unitPrice,
          channel: actualForm.channel,
          notes: actualForm.notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setFormMessage(`✅ Actual sale berhasil: ${json.actual?.actualId || "OK"}`);
      setShowActualForm(false);
      fetchAllData();
    } catch (err) {
      setFormMessage(`❌ Gagal: ${String(err).replace(/^Error:\s*/, "")}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSeed() {
    setSubmitting(true);
    setFormMessage(null);
    try {
      const res = await fetch("/api/sales/seed", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setFormMessage(`🌱 ${json.message}`);
      fetchAllData();
    } catch (err) {
      setFormMessage(`❌ Gagal seed: ${String(err).replace(/^Error:\s*/, "")}`);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Computed data ─────────────────────────────────────────────────

  const dashboardData = achievement?.brands || [];
  const grandTotal = achievement?.grandTotal || { target: 0, actual: 0, achievementPct: 0 };

  // Group targets by brand for the targets tab
  const targetsByBrand = targets.reduce<Record<string, SalesTarget[]>>((acc, t) => {
    if (!acc[t.brandId]) acc[t.brandId] = [];
    acc[t.brandId].push(t);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">🎯 Sales Target vs Actual</h2>
          <p className="text-muted-foreground">
            Tracking target dan aktual penjualan per brand — Tahun {new Date().getFullYear()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeed}
            disabled={submitting}
          >
            🌱 Seed Data
          </Button>
        </div>
      </div>

      {/* Form Message */}
      {formMessage && (
        <div className={`px-4 py-3 rounded-lg text-sm ${formMessage.startsWith("✅") || formMessage.startsWith("🌱") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {formMessage}
          <button onClick={() => setFormMessage(null)} className="ml-3 text-xs underline">Tutup</button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
          <TabsTrigger value="targets">🎯 Targets</TabsTrigger>
          <TabsTrigger value="actuals">💵 Input Actual</TabsTrigger>
          <TabsTrigger value="trend">📈 Trend Analysis</TabsTrigger>
        </TabsList>

        {/* ── Dashboard Tab ─────────────────────────────────────── */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* Grand total cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Target</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(grandTotal.target)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Actual</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(grandTotal.actual)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Overall Achievement</CardDescription>
                <CardTitle className="text-2xl">{grandTotal.achievementPct}%</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Per-brand progress */}
          <Card>
            <CardHeader>
              <CardTitle>Achievement per Brand</CardTitle>
              <CardDescription>Progress target vs actual penjualan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {dashboardData.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Belum ada data. Klik "🌱 Seed Data" untuk mengisi data contoh.
                </p>
              )}
              {dashboardData.map((brand) => (
                <div key={brand.brandId} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{brand.brandName}</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">
                        {formatCurrency(brand.totalActual)} / {formatCurrency(brand.totalTarget)}
                      </span>
                      <Badge className={getAchievementBadge(brand.achievementPct)}>
                        {brand.achievementPct}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${getAchievementColor(brand.achievementPct)}`}
                      style={{ width: `${Math.min(brand.achievementPct, 100)}%` }}
                    />
                  </div>
                  {/* Monthly breakdown */}
                  <div className="grid grid-cols-6 gap-2 mt-2">
                    {brand.months.map((m) => (
                      <div key={m.month} className="text-center text-xs">
                        <div className="text-muted-foreground">{m.monthName}</div>
                        <div className={`font-medium ${m.achievementPct >= 100 ? "text-green-600" : m.achievementPct >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                          {m.achievementPct}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Targets Tab ──────────────────────────────────────── */}
        <TabsContent value="targets" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Daftar Target Sales</h3>
            <Button
              size="sm"
              onClick={() => setShowTargetForm(!showTargetForm)}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              + {showTargetForm ? "Tutup" : "Tambah Target"}
            </Button>
          </div>

          {/* Add Target Form */}
          {showTargetForm && (
            <Card>
              <CardHeader>
                <CardTitle>🎯 Tambah/Edit Target</CardTitle>
                <CardDescription>Buat target baru atau update target yang sudah ada</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTarget} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="targetBrand">Brand</Label>
                      <select
                        id="targetBrand"
                        value={targetForm.brandId}
                        onChange={(e) => setTargetForm({ ...targetForm, brandId: e.target.value })}
                        className="w-full border rounded-md px-3 py-2 text-sm"
                      >
                        <option value="brand-larc-en-scent">L'Arc~en~Scent</option>
                        <option value="brand-pixel-potion">Pixel Potion</option>
                        <option value="brand-nuscentza">Nuscentza</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="targetYear">Tahun</Label>
                      <Input
                        id="targetYear"
                        type="number"
                        value={targetForm.year}
                        onChange={(e) => setTargetForm({ ...targetForm, year: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="targetMonth">Bulan</Label>
                      <select
                        id="targetMonth"
                        value={targetForm.month}
                        onChange={(e) => setTargetForm({ ...targetForm, month: Number(e.target.value) })}
                        className="w-full border rounded-md px-3 py-2 text-sm"
                      >
                        {MONTH_NAMES.slice(1).map((name, i) => (
                          <option key={i + 1} value={i + 1}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="targetAmount">Target Amount (Rp)</Label>
                      <Input
                        id="targetAmount"
                        type="number"
                        value={targetForm.targetAmount}
                        onChange={(e) => setTargetForm({ ...targetForm, targetAmount: Number(e.target.value) })}
                        placeholder="5000000"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="targetNotes">Notes</Label>
                      <Input
                        id="targetNotes"
                        value={targetForm.notes}
                        onChange={(e) => setTargetForm({ ...targetForm, notes: e.target.value })}
                        placeholder="Catatan opsional"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={submitting} className="bg-blue-600 text-white hover:bg-blue-700">
                    {submitting ? "Menyimpan..." : "Simpan Target"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Targets Table */}
          <Card>
            <CardContent className="p-0">
              {targets.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Belum ada target. Klik "Tambah Target" atau "Seed Data".
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Brand</TableHead>
                      <TableHead>Bulan</TableHead>
                      <TableHead className="text-right">Target</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead className="text-right">Achievement</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {targets.map((t) => (
                      <TableRow key={t.targetId}>
                        <TableCell className="font-medium">{t.brandName}</TableCell>
                        <TableCell>{MONTH_NAMES[t.month]} {t.year}</TableCell>
                        <TableCell className="text-right">{formatCurrency(t.targetAmount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(t.actualAmount)}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={getAchievementBadge(t.achievementPct)}>
                            {t.achievementPct}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{t.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Actuals Tab ──────────────────────────────────────── */}
        <TabsContent value="actuals" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Input Actual Sales</h3>
            <Button
              size="sm"
              onClick={() => setShowActualForm(!showActualForm)}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              + {showActualForm ? "Tutup" : "Input Actual Sale"}
            </Button>
          </div>

          {/* Add Actual Form */}
          {showActualForm && (
            <Card>
              <CardHeader>
                <CardTitle>💵 Input Actual Sale</CardTitle>
                <CardDescription>Catat transaksi penjualan aktual</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateActual} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="actualDate">Tanggal</Label>
                      <Input
                        id="actualDate"
                        type="date"
                        value={actualForm.date}
                        onChange={(e) => setActualForm({ ...actualForm, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="actualBrand">Brand</Label>
                      <select
                        id="actualBrand"
                        value={actualForm.brandId}
                        onChange={(e) => setActualForm({ ...actualForm, brandId: e.target.value })}
                        className="w-full border rounded-md px-3 py-2 text-sm"
                      >
                        <option value="brand-larc-en-scent">L'Arc~en~Scent</option>
                        <option value="brand-pixel-potion">Pixel Potion</option>
                        <option value="brand-nuscentza">Nuscentza</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="actualSku">Product / SKU</Label>
                      <Input
                        id="actualSku"
                        value={actualForm.productSku}
                        onChange={(e) => setActualForm({ ...actualForm, productSku: e.target.value })}
                        placeholder="LARC-EDP-001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="actualQty">Qty Sold</Label>
                      <Input
                        id="actualQty"
                        type="number"
                        value={actualForm.qtySold}
                        onChange={(e) => setActualForm({ ...actualForm, qtySold: Number(e.target.value) })}
                        min={1}
                      />
                    </div>
                    <div>
                      <Label htmlFor="actualPrice">Unit Price (Rp)</Label>
                      <Input
                        id="actualPrice"
                        type="number"
                        value={actualForm.unitPrice}
                        onChange={(e) => setActualForm({ ...actualForm, unitPrice: Number(e.target.value) })}
                        placeholder="350000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="actualChannel">Channel</Label>
                      <select
                        id="actualChannel"
                        value={actualForm.channel}
                        onChange={(e) => setActualForm({ ...actualForm, channel: e.target.value })}
                        className="w-full border rounded-md px-3 py-2 text-sm"
                      >
                        <option value="Direct">Direct</option>
                        <option value="Shopee">Shopee</option>
                        <option value="Tokopedia">Tokopedia</option>
                        <option value="TikTok">TikTok</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Lazada">Lazada</option>
                        <option value="Event">Event</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="actualNotes">Notes</Label>
                      <Input
                        id="actualNotes"
                        value={actualForm.notes}
                        onChange={(e) => setActualForm({ ...actualForm, notes: e.target.value })}
                        placeholder="Catatan opsional"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button type="submit" disabled={submitting} className="bg-green-600 text-white hover:bg-green-700">
                      {submitting ? "Menyimpan..." : "Simpan Actual Sale"}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Total: {formatCurrency(actualForm.qtySold * actualForm.unitPrice)}
                    </span>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Recent Actuals Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Actual Sales</CardTitle>
              <CardDescription>{actuals.length} transaksi tercatat</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {actuals.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Belum ada actual sales. Klik "Input Actual Sale" atau "Seed Data".
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Channel</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actuals.slice(0, 30).map((a) => (
                      <TableRow key={a.actualId}>
                        <TableCell>{formatDate(a.date)}</TableCell>
                        <TableCell className="font-medium">{a.brandName}</TableCell>
                        <TableCell className="text-sm">{a.productSku}</TableCell>
                        <TableCell className="text-right">{a.qtySold}</TableCell>
                        <TableCell className="text-right">{formatCurrency(a.unitPrice)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(a.totalRevenue)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{a.channel}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Trend Analysis Tab ───────────────────────────────── */}
        <TabsContent value="trend" className="space-y-4">
          <h3 className="text-lg font-semibold">Trend Analysis — Target vs Actual per Bulan</h3>

          {trend?.brandTrends?.length === 0 && (
            <Card>
              <CardContent className="py-8">
                <p className="text-muted-foreground text-sm text-center">
                  Belum ada data trend. Klik "🌱 Seed Data" untuk mengisi data contoh.
                </p>
              </CardContent>
            </Card>
          )}

          {trend?.brandTrends?.map((brand) => (
            <Card key={brand.brandId}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{brand.brandName}</CardTitle>
                    <CardDescription>
                      Total: {formatCurrency(brand.totalActual)} / {formatCurrency(brand.totalTarget)}
                      {" — "}
                      <Badge className={getAchievementBadge(brand.overallAchievementPct)}>
                        {brand.overallAchievementPct}%
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Monthly trend table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bulan</TableHead>
                      <TableHead className="text-right">Target</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead className="text-right">Achievement</TableHead>
                      <TableHead className="text-right">MoM Growth</TableHead>
                      <TableHead>Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brand.monthly.map((m) => (
                      <TableRow key={m.month}>
                        <TableCell className="font-medium">{m.monthName}</TableCell>
                        <TableCell className="text-right">{formatCurrency(m.target)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(m.actual)}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={getAchievementBadge(m.achievementPct)}>
                            {m.achievementPct}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {m.momGrowthPct !== null ? (
                            <span className={m.momGrowthPct >= 0 ? "text-green-600" : "text-red-600"}>
                              {m.momGrowthPct >= 0 ? "+" : ""}{m.momGrowthPct}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getAchievementColor(m.achievementPct)}`}
                              style={{ width: `${Math.min(m.achievementPct, 100)}%` }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}

          {/* Brand comparison summary */}
          {trend?.brandTrends && trend.brandTrends.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>📊 Brand Comparison</CardTitle>
                <CardDescription>Perbandingan achievement antar brand</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Brand</TableHead>
                      <TableHead className="text-right">Total Target</TableHead>
                      <TableHead className="text-right">Total Actual</TableHead>
                      <TableHead className="text-right">Achievement</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trend.brandTrends.map((brand) => (
                      <TableRow key={brand.brandId}>
                        <TableCell className="font-medium">{brand.brandName}</TableCell>
                        <TableCell className="text-right">{formatCurrency(brand.totalTarget)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(brand.totalActual)}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={getAchievementBadge(brand.overallAchievementPct)}>
                            {brand.overallAchievementPct}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {brand.overallAchievementPct >= 100 ? "✅ On Track" :
                           brand.overallAchievementPct >= 75 ? "🟡 Near Target" :
                           brand.overallAchievementPct >= 50 ? "🟠 Behind" : "🔴 Off Track"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
