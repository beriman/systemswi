"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
}

// ── Helpers ────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatRp(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function formatRpFull(n: number): string {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

const BRANDS = [
  { id: "brand-larc-en-scent", name: "L'Arc~en~Scent" },
  { id: "brand-pixel-potion", name: "Pixel Potion" },
  { id: "brand-nuscentza", name: "Nuscentza" },
];

const CHANNELS = ["Direct", "Shopee", "Tokopedia", "TikTok", "Instagram", "Event", "Lazada"];

// ── Progress Bar ──────────────────────────────────────────────────

function ProgressBar({ pct, color }: { pct: number; color?: string }) {
  const clamped = Math.min(Math.max(pct, 0), 120);
  const barColor = color || (pct >= 100 ? "bg-emerald-500" : pct >= 75 ? "bg-blue-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500");
  return (
    <div className="w-full h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
        style={{ width: `${Math.min(clamped, 100)}%` }}
      />
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`rounded-2xl p-5 ring-1 ${color}`}>
      <p className="text-sm opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs opacity-50">{sub}</p>}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────

export default function SalesTargetPage() {
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [actuals, setActuals] = useState<SalesActual[]>([]);
  const [achievement, setAchievement] = useState<AchievementSummary | null>(null);
  const [trend, setTrend] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [year, setYear] = useState(2026);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form states
  const [targetForm, setTargetForm] = useState({
    brandId: "", brandName: "", year: 2026, month: 1, targetAmount: "", notes: "",
  });
  const [actualForm, setActualForm] = useState({
    date: todayStr(), brandId: "", brandName: "", productSku: "", qtySold: "", unitPrice: "", channel: "Direct", notes: "",
  });

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // ── Fetch all data ──────────────────────────────────────────────
  async function loadData() {
    setLoading(true);
    setMessage("");
    try {
      const [targetsRes, actualsRes, achievementRes, trendRes] = await Promise.all([
        fetch(`/api/sales/targets?year=${year}`, { cache: "no-store" }),
        fetch(`/api/sales/actuals?year=${year}`, { cache: "no-store" }),
        fetch(`/api/sales/achievement?year=${year}`, { cache: "no-store" }),
        fetch(`/api/sales/trend?year=${year}`, { cache: "no-store" }),
      ]);

      const targetsJson = await targetsRes.json();
      const actualsJson = await actualsRes.json();
      const achievementJson = await achievementRes.json();
      const trendJson = await trendRes.json();

      setTargets(targetsJson.targets || []);
      setActuals(actualsJson.actuals || []);
      setAchievement(achievementJson);
      setTrend(trendJson.brandTrends || []);
    } catch (error) {
      setMessage(`❌ Gagal memuat data: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [refreshKey, year]);

  // ── Create target ───────────────────────────────────────────────
  async function handleCreateTarget(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch("/api/sales/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: targetForm.brandId,
          brandName: targetForm.brandName || BRANDS.find((b) => b.id === targetForm.brandId)?.name || "",
          year: targetForm.year,
          month: targetForm.month,
          targetAmount: Number(targetForm.targetAmount),
          notes: targetForm.notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat target");
      setMessage("✅ Target berhasil dibuat!");
      setTargetForm({ brandId: "", brandName: "", year: 2026, month: 1, targetAmount: "", notes: "" });
      refresh();
    } catch (err) {
      setMessage(`❌ ${String(err)}`);
    }
  }

  // ── Create actual ───────────────────────────────────────────────
  async function handleCreateActual(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch("/api/sales/actuals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: actualForm.date,
          brandId: actualForm.brandId,
          brandName: actualForm.brandName || BRANDS.find((b) => b.id === actualForm.brandId)?.name || "",
          productSku: actualForm.productSku,
          qtySold: Number(actualForm.qtySold),
          unitPrice: Number(actualForm.unitPrice),
          channel: actualForm.channel,
          notes: actualForm.notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat actual sale");
      setMessage("✅ Actual sale berhasil ditambahkan!");
      setActualForm({ date: todayStr(), brandId: "", brandName: "", productSku: "", qtySold: "", unitPrice: "", channel: "Direct", notes: "" });
      refresh();
    } catch (err) {
      setMessage(`❌ ${String(err)}`);
    }
  }

  // ── Seed data ───────────────────────────────────────────────────
  async function handleSeed() {
    setMessage("");
    try {
      const res = await fetch("/api/sales/seed", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal seed data");
      setMessage(`✅ ${json.message}`);
      refresh();
    } catch (err) {
      setMessage(`❌ ${String(err)}`);
    }
  }

  // ── Computed stats ──────────────────────────────────────────────
  const totalTarget = targets.reduce((s, t) => s + t.targetAmount, 0);
  const totalActual = actuals.reduce((s, a) => s + a.totalRevenue, 0);
  const overallAchievement = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100 * 100) / 100 : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">🎯 Sales Target vs Actual</h1>
          <p className="text-sm text-white/40 mt-1">Tracking target dan aktual penjualan per brand</p>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <Label className="text-xs text-white/40">Tahun</Label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="mt-1 rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white/80 ring-1 ring-white/10 border-none outline-none"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y} className="bg-gray-900">{y}</option>
              ))}
            </select>
          </div>
          <Button onClick={handleSeed} variant="outline" className="mt-6 border-white/10 text-white/60 hover:text-white hover:bg-white/[0.06]">
            🌱 Seed Data
          </Button>
        </div>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ring-1 ${message.startsWith("✅") ? "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20" : "bg-red-500/10 text-red-300 ring-red-400/20"}`}>
          {message}
        </div>
      )}

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="bg-white/[0.04] ring-1 ring-white/10 rounded-xl p-1">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">📊 Dashboard</TabsTrigger>
          <TabsTrigger value="targets" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">🎯 Targets</TabsTrigger>
          <TabsTrigger value="actuals" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">💰 Input Actual</TabsTrigger>
          <TabsTrigger value="trend" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">📈 Trend</TabsTrigger>
        </TabsList>

        {/* ── Dashboard Tab ─────────────────────────────────────── */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Target" value={formatRp(totalTarget)} color="bg-blue-500/10 ring-blue-400/20 text-blue-300" />
            <StatCard label="Total Actual" value={formatRp(totalActual)} color="bg-emerald-500/10 ring-emerald-400/20 text-emerald-300" />
            <StatCard label="Achievement" value={`${overallAchievement}%`} sub={overallAchievement >= 100 ? "✅ Target tercapai!" : "⚠️ Belum tercapai"} color="bg-purple-500/10 ring-purple-400/20 text-purple-300" />
            <StatCard label="Transaksi" value={`${actuals.length}`} sub={`${targets.length} target entries`} color="bg-amber-500/10 ring-amber-400/20 text-amber-300" />
          </div>

          {/* Per-Brand Achievement */}
          <Card className="bg-white/[0.03] ring-1 ring-white/[0.08] border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white">🏆 Achievement per Brand</CardTitle>
              <CardDescription className="text-xs text-white/35">Progress target vs actual per brand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {achievement?.brands && achievement.brands.length > 0 ? (
                achievement.brands.map((b) => (
                  <div key={b.brandId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{b.brandName}</span>
                      <div className="flex items-center gap-3 text-xs text-white/50">
                        <span>Target: <strong className="text-white/70">{formatRpFull(b.totalTarget)}</strong></span>
                        <span>Actual: <strong className="text-white/70">{formatRpFull(b.totalActual)}</strong></span>
                        <span className={`font-bold ${b.achievementPct >= 100 ? "text-emerald-400" : b.achievementPct >= 50 ? "text-amber-400" : "text-red-400"}`}>
                          {b.achievementPct}%
                        </span>
                      </div>
                    </div>
                    <ProgressBar pct={b.achievementPct} />
                    {/* Monthly breakdown */}
                    <div className="grid grid-cols-6 gap-2 mt-2">
                      {b.months.map((m) => (
                        <div key={m.month} className="text-center">
                          <p className="text-[10px] text-white/30">{m.monthName}</p>
                          <p className={`text-xs font-medium ${m.achievementPct >= 100 ? "text-emerald-400" : m.achievementPct >= 50 ? "text-amber-400" : "text-red-400"}`}>
                            {m.achievementPct}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/25 text-sm">
                  {loading ? "Memuat data..." : "Belum ada data. Klik \"Seed Data\" untuk mengisi data contoh."}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grand Total */}
          {achievement?.grandTotal && achievement.grandTotal.target > 0 && (
            <div className="rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 ring-1 ring-white/10">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-white/50">Grand Total Achievement {achievement.year}</p>
                  <p className="text-3xl font-bold text-white mt-1">{achievement.grandTotal.achievementPct}%</p>
                </div>
                <div className="flex gap-6 text-sm">
                  <div>
                    <p className="text-white/40">Target</p>
                    <p className="text-lg font-semibold text-blue-300">{formatRpFull(achievement.grandTotal.target)}</p>
                  </div>
                  <div>
                    <p className="text-white/40">Actual</p>
                    <p className="text-lg font-semibold text-emerald-300">{formatRpFull(achievement.grandTotal.actual)}</p>
                  </div>
                  <div>
                    <p className="text-white/40">Selisih</p>
                    <p className={`text-lg font-semibold ${achievement.grandTotal.actual >= achievement.grandTotal.target ? "text-emerald-300" : "text-red-300"}`}>
                      {formatRpFull(achievement.grandTotal.actual - achievement.grandTotal.target)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <ProgressBar pct={achievement.grandTotal.achievementPct} />
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Targets Tab ──────────────────────────────────────── */}
        <TabsContent value="targets" className="space-y-6">
          {/* Add Target Form */}
          <Card className="bg-white/[0.03] ring-1 ring-white/[0.08] border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white">➕ Tambah / Edit Target</CardTitle>
              <CardDescription className="text-xs text-white/35">Buat target penjualan per brand per bulan</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTarget} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-white/50">Brand *</Label>
                    <select
                      value={targetForm.brandId}
                      onChange={(e) => {
                        const brand = BRANDS.find((b) => b.id === e.target.value);
                        setTargetForm((f) => ({ ...f, brandId: e.target.value, brandName: brand?.name || "" }));
                      }}
                      required
                      className="mt-1 w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white/80 ring-1 ring-white/10 border-none outline-none"
                    >
                      <option value="" className="bg-gray-900">— Pilih Brand —</option>
                      {BRANDS.map((b) => (
                        <option key={b.id} value={b.id} className="bg-gray-900">{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-white/50">Tahun *</Label>
                    <Input
                      type="number"
                      value={targetForm.year}
                      onChange={(e) => setTargetForm((f) => ({ ...f, year: Number(e.target.value) }))}
                      required
                      className="bg-white/[0.06] border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-white/50">Bulan *</Label>
                    <select
                      value={targetForm.month}
                      onChange={(e) => setTargetForm((f) => ({ ...f, month: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white/80 ring-1 ring-white/10 border-none outline-none"
                    >
                      {MONTH_NAMES.slice(1).map((m, i) => (
                        <option key={i} value={i + 1} className="bg-gray-900">{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-white/50">Target Amount (Rp) *</Label>
                    <Input
                      type="number"
                      value={targetForm.targetAmount}
                      onChange={(e) => setTargetForm((f) => ({ ...f, targetAmount: e.target.value }))}
                      required
                      placeholder="5000000"
                      className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/25"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-white/50">Notes</Label>
                    <Input
                      value={targetForm.notes}
                      onChange={(e) => setTargetForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Catatan opsional"
                      className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/25"
                    />
                  </div>
                </div>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Simpan Target
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Targets Table */}
          <Card className="bg-white/[0.03] ring-1 ring-white/[0.08] border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white">📋 Daftar Target</CardTitle>
              <CardDescription className="text-xs text-white/35">{targets.length} target entries</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />)}
                </div>
              ) : targets.length === 0 ? (
                <div className="text-center py-8 text-white/25 text-sm">Belum ada target. Tambah target di atas.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-white/40 border-b border-white/[0.06]">
                        <th className="text-left py-2 px-3">Brand</th>
                        <th className="text-left py-2 px-3">Bulan</th>
                        <th className="text-right py-2 px-3">Target</th>
                        <th className="text-right py-2 px-3">Actual</th>
                        <th className="text-right py-2 px-3">Achievement</th>
                        <th className="text-left py-2 px-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {targets.map((t) => (
                        <tr key={t.targetId} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 text-white font-medium">{t.brandName}</td>
                          <td className="py-2.5 px-3 text-white/60">{MONTH_NAMES[t.month]} {t.year}</td>
                          <td className="py-2.5 px-3 text-right text-white/70">{formatRpFull(t.targetAmount)}</td>
                          <td className="py-2.5 px-3 text-right text-white/70">{formatRpFull(t.actualAmount)}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className={`font-semibold ${t.achievementPct >= 100 ? "text-emerald-400" : t.achievementPct >= 50 ? "text-amber-400" : "text-red-400"}`}>
                              {t.achievementPct}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-white/40 text-xs max-w-[200px] truncate">{t.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Input Actual Sales Tab ───────────────────────────── */}
        <TabsContent value="actuals" className="space-y-6">
          {/* Add Actual Form */}
          <Card className="bg-white/[0.03] ring-1 ring-white/[0.08] border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white">💰 Input Actual Sales</CardTitle>
              <CardDescription className="text-xs text-white/35">Catat transaksi penjualan aktual</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateActual} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-white/50">Tanggal *</Label>
                    <Input
                      type="date"
                      value={actualForm.date}
                      onChange={(e) => setActualForm((f) => ({ ...f, date: e.target.value }))}
                      required
                      className="bg-white/[0.06] border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-white/50">Brand *</Label>
                    <select
                      value={actualForm.brandId}
                      onChange={(e) => {
                        const brand = BRANDS.find((b) => b.id === e.target.value);
                        setActualForm((f) => ({ ...f, brandId: e.target.value, brandName: brand?.name || "" }));
                      }}
                      required
                      className="mt-1 w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white/80 ring-1 ring-white/10 border-none outline-none"
                    >
                      <option value="" className="bg-gray-900">— Pilih Brand —</option>
                      {BRANDS.map((b) => (
                        <option key={b.id} value={b.id} className="bg-gray-900">{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-white/50">Product / SKU *</Label>
                    <Input
                      value={actualForm.productSku}
                      onChange={(e) => setActualForm((f) => ({ ...f, productSku: e.target.value }))}
                      required
                      placeholder="Nama produk / SKU"
                      className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/25"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-white/50">Qty Sold *</Label>
                    <Input
                      type="number"
                      value={actualForm.qtySold}
                      onChange={(e) => setActualForm((f) => ({ ...f, qtySold: e.target.value }))}
                      required
                      placeholder="10"
                      className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/25"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-white/50">Unit Price (Rp) *</Label>
                    <Input
                      type="number"
                      value={actualForm.unitPrice}
                      onChange={(e) => setActualForm((f) => ({ ...f, unitPrice: e.target.value }))}
                      required
                      placeholder="150000"
                      className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/25"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-white/50">Channel</Label>
                    <select
                      value={actualForm.channel}
                      onChange={(e) => setActualForm((f) => ({ ...f, channel: e.target.value }))}
                      className="mt-1 w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white/80 ring-1 ring-white/10 border-none outline-none"
                    >
                      {CHANNELS.map((c) => (
                        <option key={c} value={c} className="bg-gray-900">{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-white/50">Total Revenue</Label>
                    <Input
                      value={actualForm.qtySold && actualForm.unitPrice ? formatRpFull(Number(actualForm.qtySold) * Number(actualForm.unitPrice)) : ""}
                      readOnly
                      placeholder="Auto-calculated"
                      className="bg-white/[0.03] border-white/10 text-white/50"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-white/50">Notes</Label>
                  <Input
                    value={actualForm.notes}
                    onChange={(e) => setActualForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Catatan opsional"
                    className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/25"
                  />
                </div>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Simpan Actual Sale
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Actuals */}
          <Card className="bg-white/[0.03] ring-1 ring-white/[0.08] border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white">📋 Transaksi Terbaru</CardTitle>
              <CardDescription className="text-xs text-white/35">{actuals.length} transaksi</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />)}
                </div>
              ) : actuals.length === 0 ? (
                <div className="text-center py-8 text-white/25 text-sm">Belum ada transaksi. Input actual sale di atas.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-white/40 border-b border-white/[0.06]">
                        <th className="text-left py-2 px-3">Tanggal</th>
                        <th className="text-left py-2 px-3">Brand</th>
                        <th className="text-left py-2 px-3">Product / SKU</th>
                        <th className="text-right py-2 px-3">Qty</th>
                        <th className="text-right py-2 px-3">Unit Price</th>
                        <th className="text-right py-2 px-3">Total</th>
                        <th className="text-left py-2 px-3">Channel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actuals.slice(0, 20).map((a) => (
                        <tr key={a.actualId} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 text-white/60">{a.date}</td>
                          <td className="py-2.5 px-3 text-white font-medium">{a.brandName}</td>
                          <td className="py-2.5 px-3 text-white/70">{a.productSku}</td>
                          <td className="py-2.5 px-3 text-right text-white/60">{a.qtySold}</td>
                          <td className="py-2.5 px-3 text-right text-white/60">{formatRpFull(a.unitPrice)}</td>
                          <td className="py-2.5 px-3 text-right text-white font-medium">{formatRpFull(a.totalRevenue)}</td>
                          <td className="py-2.5 px-3">
                            <span className="inline-block rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-white/60">{a.channel}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Trend Analysis Tab ──────────────────────────────── */}
        <TabsContent value="trend" className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-xl bg-white/[0.03] animate-pulse" />)}
            </div>
          ) : trend.length === 0 ? (
            <div className="text-center py-12 text-white/25 text-sm">Belum ada data trend. Klik &quot;Seed Data&quot; untuk mengisi data contoh.</div>
          ) : (
            <>
              {trend.map((brand) => (
                <Card key={brand.brandId} className="bg-white/[0.03] ring-1 ring-white/[0.08] border-0">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-semibold text-white">📈 {brand.brandName}</CardTitle>
                        <CardDescription className="text-xs text-white/35">
                          Target: {formatRpFull(brand.totalTarget)} | Actual: {formatRpFull(brand.totalActual)} | Achievement: {brand.overallAchievementPct}%
                        </CardDescription>
                      </div>
                      <span className={`text-lg font-bold ${brand.overallAchievementPct >= 100 ? "text-emerald-400" : brand.overallAchievementPct >= 50 ? "text-amber-400" : "text-red-400"}`}>
                        {brand.overallAchievementPct}%
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Monthly trend table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-white/40 border-b border-white/[0.06]">
                            <th className="text-left py-2 px-2">Bulan</th>
                            <th className="text-right py-2 px-2">Target</th>
                            <th className="text-right py-2 px-2">Actual</th>
                            <th className="text-right py-2 px-2">Achievement</th>
                            <th className="text-right py-2 px-2">MoM Growth</th>
                            <th className="py-2 px-2 min-w-[120px]">Progress</th>
                          </tr>
                        </thead>
                        <tbody>
                          {brand.monthly.map((m) => (
                            <tr key={m.month} className="border-b border-white/[0.03]">
                              <td className="py-2 px-2 text-white/70 font-medium">{m.monthName}</td>
                              <td className="py-2 px-2 text-right text-white/50">{formatRpFull(m.target)}</td>
                              <td className="py-2 px-2 text-right text-white/50">{formatRpFull(m.actual)}</td>
                              <td className="py-2 px-2 text-right">
                                <span className={`font-semibold ${m.achievementPct >= 100 ? "text-emerald-400" : m.achievementPct >= 50 ? "text-amber-400" : m.achievementPct > 0 ? "text-red-400" : "text-white/30"}`}>
                                  {m.achievementPct}%
                                </span>
                              </td>
                              <td className="py-2 px-2 text-right">
                                {m.momGrowthPct !== null ? (
                                  <span className={m.momGrowthPct >= 0 ? "text-emerald-400" : "text-red-400"}>
                                    {m.momGrowthPct >= 0 ? "+" : ""}{m.momGrowthPct}%
                                  </span>
                                ) : (
                                  <span className="text-white/20">—</span>
                                )}
                              </td>
                              <td className="py-2 px-2">
                                <ProgressBar pct={m.achievementPct} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Visual bar chart */}
                    <div className="mt-4 flex items-end gap-2 h-32">
                      {brand.monthly.map((m) => {
                        const maxVal = Math.max(...brand.monthly.map((x) => Math.max(x.target, x.actual)), 1);
                        const targetH = (m.target / maxVal) * 100;
                        const actualH = (m.actual / maxVal) * 100;
                        return (
                          <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                            <div className="flex gap-0.5 items-end h-24 w-full justify-center">
                              <div
                                className="w-3 rounded-t bg-blue-500/40"
                                style={{ height: `${targetH}%` }}
                                title={`Target: ${formatRpFull(m.target)}`}
                              />
                              <div
                                className={`w-3 rounded-t ${m.achievementPct >= 100 ? "bg-emerald-500" : "bg-amber-500"}`}
                                style={{ height: `${actualH}%` }}
                                title={`Actual: ${formatRpFull(m.actual)}`}
                              />
                            </div>
                            <span className="text-[10px] text-white/30">{m.monthName}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-white/40">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500/40" /> Target</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" /> Actual</span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Brand Comparison */}
              <Card className="bg-white/[0.03] ring-1 ring-white/[0.08] border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white">🏆 Brand Comparison</CardTitle>
                  <CardDescription className="text-xs text-white/35">Perbandingan achievement antar brand</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trend.map((brand) => (
                      <div key={brand.brandId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">{brand.brandName}</span>
                          <span className={`text-sm font-bold ${brand.overallAchievementPct >= 100 ? "text-emerald-400" : "text-amber-400"}`}>
                            {brand.overallAchievementPct}%
                          </span>
                        </div>
                        <ProgressBar pct={brand.overallAchievementPct} />
                        <div className="flex gap-4 text-xs text-white/40">
                          <span>Target: {formatRpFull(brand.totalTarget)}</span>
                          <span>Actual: {formatRpFull(brand.totalActual)}</span>
                          <span>Selisih: <span className={brand.totalActual >= brand.totalTarget ? "text-emerald-400" : "text-red-400"}>{formatRpFull(brand.totalActual - brand.totalTarget)}</span></span>
                        </div>
                      </div>
                    ))}
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
