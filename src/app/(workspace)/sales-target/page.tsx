"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// ── Types ──────────────────────────────────────────────────────────

type Target = {
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
};

type Actual = {
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
};

type AchievementBrand = {
  brandId: string;
  brandName: string;
  totalTarget: number;
  totalActual: number;
  achievementPct: number;
  months: { month: number; target: number; actual: number; achievementPct: number }[];
};

type AchievementData = {
  year: number;
  brands: AchievementBrand[];
  grandTotal: { target: number; actual: number; achievementPct: number };
};

type TrendBrand = {
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
};

// ── Helpers ────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v || 0);

const fmtNum = (v: number) => new Intl.NumberFormat("id-ID").format(v || 0);

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function ProgressBar({ pct, size = "md" }: { pct: number; size?: "sm" | "md" }) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  const color =
    pct >= 100 ? "bg-emerald-500" :
    pct >= 75 ? "bg-blue-500" :
    pct >= 50 ? "bg-yellow-500" : "bg-red-500";
  const h = size === "sm" ? "h-1.5" : "h-3";
  return (
    <div className={`w-full bg-gray-200 rounded-full ${h}`}>
      <div className={`${color} ${h} rounded-full transition-all`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────

export default function SalesTargetPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [actuals, setActuals] = useState<Actual[]>([]);
  const [achievement, setAchievement] = useState<AchievementData | null>(null);
  const [trends, setTrends] = useState<TrendBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"dashboard" | "targets" | "actuals" | "trend">("dashboard");
  const [status, setStatus] = useState("Memuat...");
  const [year] = useState(2026);

  // Target form
  const [targetForm, setTargetForm] = useState({
    brandId: "", brandName: "", year: "2026", month: "1",
    targetAmount: "", notes: "",
  });

  // Actual form
  const [actualForm, setActualForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    brandId: "", brandName: "", productSku: "",
    qtySold: "1", unitPrice: "", channel: "Direct", notes: "",
  });

  // Brand options
  const brandOptions = [
    { id: "brand-larc-en-scent", name: "L'Arc~en~Scent" },
    { id: "brand-pixel-potion", name: "Pixel Potion" },
    { id: "brand-nuscentza", name: "Nuscentza" },
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, aRes, achRes, trRes] = await Promise.all([
        fetch(`/api/sales/targets?year=${year}`, { cache: "no-store" }),
        fetch(`/api/sales/actuals?year=${year}`, { cache: "no-store" }),
        fetch(`/api/sales/achievement?year=${year}`, { cache: "no-store" }),
        fetch(`/api/sales/trend?year=${year}`, { cache: "no-store" }),
      ]);
      const [tData, aData, achData, trData] = await Promise.all([
        tRes.json(), aRes.json(), achRes.json(), trRes.json(),
      ]);
      setTargets(tData.targets || []);
      setActuals(aData.actuals || []);
      setAchievement(achData);
      setTrends(trData.brandTrends || []);
      setStatus(`${(tData.targets || []).length} targets, ${(aData.actuals || []).length} actuals, ${year}`);
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleCreateTarget(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Menyimpan target...");
    try {
      const res = await fetch("/api/sales/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: targetForm.brandId,
          brandName: targetForm.brandName,
          year: Number(targetForm.year),
          month: Number(targetForm.month),
          targetAmount: Number(targetForm.targetAmount),
          notes: targetForm.notes,
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan target");
      setTargetForm({ brandId: "", brandName: "", year: "2026", month: "1", targetAmount: "", notes: "" });
      await loadData();
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handleCreateActual(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Mencatat penjualan...");
    try {
      const res = await fetch("/api/sales/actuals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: actualForm.date,
          brandId: actualForm.brandId,
          brandName: actualForm.brandName,
          productSku: actualForm.productSku,
          qtySold: Number(actualForm.qtySold),
          unitPrice: Number(actualForm.unitPrice),
          channel: actualForm.channel,
          notes: actualForm.notes,
        }),
      });
      if (!res.ok) throw new Error("Gagal mencatat penjualan");
      setActualForm({
        date: new Date().toISOString().slice(0, 10),
        brandId: "", brandName: "", productSku: "",
        qtySold: "1", unitPrice: "", channel: "Direct", notes: "",
      });
      await loadData();
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Sales Analytics</p>
          <h1 className="text-3xl font-bold">🎯 Sales Target vs Actual</h1>
          <p className="text-muted-foreground">
            Tracking target dan aktual penjualan per brand — L&apos;Arc~en~Scent, Pixel Potion, Nuscentza
          </p>
        </div>
        <Button onClick={loadData} disabled={loading}>{loading ? "Memuat..." : "Refresh"}</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {([
          { key: "dashboard", label: "📊 Dashboard" },
          { key: "targets", label: "🎯 Targets" },
          { key: "actuals", label: "💰 Input Actual Sales" },
          { key: "trend", label: "📈 Trend Analysis" },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">{status}</p>

      {/* ═══ TAB: Dashboard ═══ */}
      {tab === "dashboard" && (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardDescription>Total Target</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {achievement ? fmt(achievement.grandTotal.target) : "—"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Total Actual</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {achievement ? fmt(achievement.grandTotal.actual) : "—"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Overall Achievement</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {achievement ? `${achievement.grandTotal.achievementPct}%` : "—"}
                </div>
                {achievement && <ProgressBar pct={achievement.grandTotal.achievementPct} size="sm" />}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Brands Tracked</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{achievement?.brands.length || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Per-brand achievement */}
          <h2 className="text-lg font-semibold">Achievement per Brand</h2>
          {!achievement || achievement.brands.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold mb-2">Belum Ada Data</h3>
                <p className="text-sm text-muted-foreground">Tambahkan target untuk mulai tracking achievement.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {achievement.brands.map((brand) => (
                <Card key={brand.brandId} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{brand.brandName}</CardTitle>
                        <CardDescription>{brand.brandId}</CardDescription>
                      </div>
                      <Badge className={
                        brand.achievementPct >= 100 ? "bg-emerald-600" :
                        brand.achievementPct >= 75 ? "bg-blue-600" :
                        brand.achievementPct >= 50 ? "bg-yellow-600" : "bg-red-500"
                      }>
                        {brand.achievementPct}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Target:</span>{" "}
                        <span className="font-medium">{fmt(brand.totalTarget)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Actual:</span>{" "}
                        <span className="font-medium text-emerald-600">{fmt(brand.totalActual)}</span>
                      </div>
                    </div>
                    <ProgressBar pct={brand.achievementPct} />
                    <div className="text-xs text-muted-foreground">
                      {brand.months.filter((m) => m.target > 0).length} bulan tercatat
                    </div>
                    {/* Monthly breakdown */}
                    <div className="space-y-1">
                      {brand.months.filter((m) => m.target > 0).map((m) => (
                        <div key={m.month} className="flex items-center gap-2 text-xs">
                          <span className="w-8">{MONTH_NAMES[m.month]}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${m.achievementPct >= 100 ? "bg-emerald-500" : m.achievementPct >= 50 ? "bg-blue-500" : "bg-red-400"}`}
                              style={{ width: `${Math.min(m.achievementPct, 100)}%` }}
                            />
                          </div>
                          <span className="w-10 text-right">{m.achievementPct}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: Targets ═══ */}
      {tab === "targets" && (
        <div className="space-y-6">
          {/* Add target form */}
          <Card>
            <CardHeader>
              <CardTitle>Tambah / Edit Target</CardTitle>
              <CardDescription>Set target penjualan per brand per bulan</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4 max-w-2xl" onSubmit={handleCreateTarget}>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="grid gap-1">
                    <Label>Brand *</Label>
                    <select className="rounded-md border bg-background px-3 py-2 text-sm" value={targetForm.brandId}
                      onChange={(e) => {
                        const brand = brandOptions.find((b) => b.id === e.target.value);
                        setTargetForm({ ...targetForm, brandId: e.target.value, brandName: brand?.name || "" });
                      }} required>
                      <option value="">Pilih Brand</option>
                      {brandOptions.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-1">
                    <Label>Tahun</Label>
                    <Input type="number" value={targetForm.year} onChange={(e) => setTargetForm({ ...targetForm, year: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="grid gap-1">
                    <Label>Bulan</Label>
                    <select className="rounded-md border bg-background px-3 py-2 text-sm" value={targetForm.month}
                      onChange={(e) => setTargetForm({ ...targetForm, month: e.target.value })}>
                      {MONTH_NAMES.slice(1).map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-1">
                    <Label>Target Amount (Rp) *</Label>
                    <Input type="number" placeholder="5000000" value={targetForm.targetAmount}
                      onChange={(e) => setTargetForm({ ...targetForm, targetAmount: e.target.value })} required />
                  </div>
                </div>
                <div className="grid gap-1">
                  <Label>Notes</Label>
                  <input className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Optional notes"
                    value={targetForm.notes} onChange={(e) => setTargetForm({ ...targetForm, notes: e.target.value })} />
                </div>
                <Button type="submit">Simpan Target</Button>
              </form>
            </CardContent>
          </Card>

          {/* Targets table */}
          <h2 className="text-lg font-semibold">Daftar Target</h2>
          {targets.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada target.</CardContent></Card>
          ) : (
            <div className="rounded-md border overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left">
                  <tr>
                    <th className="p-3">Brand</th>
                    <th className="p-3">Month</th>
                    <th className="p-3 text-right">Target</th>
                    <th className="p-3 text-right">Actual</th>
                    <th className="p-3 text-right">Achievement %</th>
                    <th className="p-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {targets.map((t) => (
                    <tr key={`${t.targetId}_${t.month}`} className="border-t hover:bg-muted/30">
                      <td className="p-3 font-medium">{t.brandName}</td>
                      <td className="p-3">{MONTH_NAMES[t.month]} {t.year}</td>
                      <td className="p-3 text-right">{fmt(t.targetAmount)}</td>
                      <td className="p-3 text-right">{fmt(t.actualAmount)}</td>
                      <td className="p-3 text-right">
                        <Badge className={
                          t.achievementPct >= 100 ? "bg-emerald-600" :
                          t.achievementPct >= 75 ? "bg-blue-600" :
                          t.achievementPct >= 50 ? "bg-yellow-600" : "bg-red-500"
                        }>
                          {t.achievementPct}%
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{t.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: Input Actual Sales ═══ */}
      {tab === "actuals" && (
        <div className="space-y-6">
          {/* Add actual form */}
          <Card>
            <CardHeader>
              <CardTitle>Catat Penjualan Aktual</CardTitle>
              <CardDescription>Input transaksi penjualan harian</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4 max-w-2xl" onSubmit={handleCreateActual}>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="grid gap-1">
                    <Label>Tanggal *</Label>
                    <Input type="date" value={actualForm.date}
                      onChange={(e) => setActualForm({ ...actualForm, date: e.target.value })} required />
                  </div>
                  <div className="grid gap-1">
                    <Label>Brand *</Label>
                    <select className="rounded-md border bg-background px-3 py-2 text-sm" value={actualForm.brandId}
                      onChange={(e) => {
                        const brand = brandOptions.find((b) => b.id === e.target.value);
                        setActualForm({ ...actualForm, brandId: e.target.value, brandName: brand?.name || "" });
                      }} required>
                      <option value="">Pilih Brand</option>
                      {brandOptions.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid gap-1">
                  <Label>Product / SKU</Label>
                  <Input placeholder="L'Arc~en~Scent EDP 30ml" value={actualForm.productSku}
                    onChange={(e) => setActualForm({ ...actualForm, productSku: e.target.value })} />
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="grid gap-1">
                    <Label>Qty *</Label>
                    <Input type="number" min="1" value={actualForm.qtySold}
                      onChange={(e) => setActualForm({ ...actualForm, qtySold: e.target.value })} required />
                  </div>
                  <div className="grid gap-1">
                    <Label>Unit Price (Rp) *</Label>
                    <Input type="number" placeholder="150000" value={actualForm.unitPrice}
                      onChange={(e) => setActualForm({ ...actualForm, unitPrice: e.target.value })} required />
                  </div>
                  <div className="grid gap-1">
                    <Label>Channel</Label>
                    <select className="rounded-md border bg-background px-3 py-2 text-sm" value={actualForm.channel}
                      onChange={(e) => setActualForm({ ...actualForm, channel: e.target.value })}>
                      <option value="Direct">Direct</option>
                      <option value="Instagram">Instagram</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Shopee">Shopee</option>
                      <option value="Tokopedia">Tokopedia</option>
                      <option value="Event">Event</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-1">
                  <Label>Notes</Label>
                  <input className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Optional notes"
                    value={actualForm.notes} onChange={(e) => setActualForm({ ...actualForm, notes: e.target.value })} />
                </div>
                {actualForm.qtySold && actualForm.unitPrice && (
                  <div className="text-sm text-muted-foreground">
                    Total: <span className="font-bold">{fmt(Number(actualForm.qtySold) * Number(actualForm.unitPrice))}</span>
                  </div>
                )}
                <Button type="submit">Catat Penjualan</Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent actuals */}
          <h2 className="text-lg font-semibold">Recent Actual Sales</h2>
          {actuals.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada transaksi.</CardContent></Card>
          ) : (
            <div className="rounded-md border overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Brand</th>
                    <th className="p-3">Product/SKU</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3">Channel</th>
                  </tr>
                </thead>
                <tbody>
                  {actuals.slice(0, 50).map((a) => (
                    <tr key={a.actualId} className="border-t hover:bg-muted/30">
                      <td className="p-3">{a.date}</td>
                      <td className="p-3 font-medium">{a.brandName}</td>
                      <td className="p-3 text-xs">{a.productSku}</td>
                      <td className="p-3 text-right">{fmtNum(a.qtySold)}</td>
                      <td className="p-3 text-right">{fmt(a.unitPrice)}</td>
                      <td className="p-3 text-right font-medium">{fmt(a.totalRevenue)}</td>
                      <td className="p-3">{a.channel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: Trend Analysis ═══ */}
      {tab === "trend" && (
        <div className="space-y-6">
          {trends.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              <p>Belum ada data trend.</p>
            </CardContent></Card>
          ) : (
            <>
              {/* Brand comparison */}
              <h2 className="text-lg font-semibold">Per Brand — MoM Trend</h2>
              {trends.map((brand) => (
                <Card key={brand.brandId}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{brand.brandName}</CardTitle>
                        <CardDescription>
                          Total: {fmt(brand.totalActual)} / {fmt(brand.totalTarget)} ({brand.overallAchievementPct}%)
                        </CardDescription>
                      </div>
                      <Badge className={
                        brand.overallAchievementPct >= 100 ? "bg-emerald-600" :
                        brand.overallAchievementPct >= 75 ? "bg-blue-600" :
                        brand.overallAchievementPct >= 50 ? "bg-yellow-600" : "bg-red-500"
                      }>
                        {brand.overallAchievementPct}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Monthly table */}
                    <div className="rounded-md border overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/60 text-left">
                          <tr>
                            <th className="p-2">Month</th>
                            <th className="p-2 text-right">Target</th>
                            <th className="p-2 text-right">Actual</th>
                            <th className="p-2 text-right">Achievement</th>
                            <th className="p-2 text-right">MoM Growth</th>
                            <th className="p-2 w-32">Progress</th>
                          </tr>
                        </thead>
                        <tbody>
                          {brand.monthly.filter((m) => m.target > 0 || m.actual > 0).map((m) => (
                            <tr key={m.month} className="border-t">
                              <td className="p-2 font-medium">{m.monthName}</td>
                              <td className="p-2 text-right">{fmt(m.target)}</td>
                              <td className="p-2 text-right">{fmt(m.actual)}</td>
                              <td className="p-2 text-right">
                                <Badge className={
                                  m.achievementPct >= 100 ? "bg-emerald-600" :
                                  m.achievementPct >= 75 ? "bg-blue-600" :
                                  m.achievementPct >= 50 ? "bg-yellow-600" : "bg-red-500"
                                }>
                                  {m.achievementPct}%
                                </Badge>
                              </td>
                              <td className="p-2 text-right text-xs">
                                {m.momGrowthPct !== null ? (
                                  <span className={m.momGrowthPct >= 0 ? "text-emerald-600" : "text-red-500"}>
                                    {m.momGrowthPct >= 0 ? "+" : ""}{m.momGrowthPct}%
                                  </span>
                                ) : "—"}
                              </td>
                              <td className="p-2"><ProgressBar pct={m.achievementPct} size="sm" /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Brand comparison summary */}
              <h2 className="text-lg font-semibold">Brand Comparison</h2>
              <div className="rounded-md border overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-left">
                    <tr>
                      <th className="p-3">Brand</th>
                      <th className="p-3 text-right">Total Target</th>
                      <th className="p-3 text-right">Total Actual</th>
                      <th className="p-3 text-right">Achievement %</th>
                      <th className="p-3">Visual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.map((brand) => (
                      <tr key={brand.brandId} className="border-t">
                        <td className="p-3 font-medium">{brand.brandName}</td>
                        <td className="p-3 text-right">{fmt(brand.totalTarget)}</td>
                        <td className="p-3 text-right font-medium text-emerald-600">{fmt(brand.totalActual)}</td>
                        <td className="p-3 text-right">
                          <Badge className={
                            brand.overallAchievementPct >= 100 ? "bg-emerald-600" :
                            brand.overallAchievementPct >= 75 ? "bg-blue-600" :
                            brand.overallAchievementPct >= 50 ? "bg-yellow-600" : "bg-red-500"
                          }>
                            {brand.overallAchievementPct}%
                          </Badge>
                        </td>
                        <td className="p-3 w-40"><ProgressBar pct={brand.overallAchievementPct} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
