"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── Types ── */

type CashEntry = {
  entryId: string;
  date: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  saldo: number;
  inputBy: string;
  inputDate: string;
};

type TodaySummary = {
  saldoAwal: number;
  todayMasuk: number;
  todayKeluar: number;
  saldoAkhir: number;
  netChange: number;
  entryCount: number;
};

type PeriodSummary = {
  totalMasuk: number;
  totalKeluar: number;
  netCash: number;
  dayCount: number;
};

type DailyBreakdown = {
  date: string;
  masuk: number;
  keluar: number;
  net: number;
  categories: Record<string, number>;
};

/* ── Helpers ── */

function formatRp(n: number): string {
  if (n === 0) return "Rp 0";
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("id-ID");
  return n < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

function formatDate(id: string): string {
  if (!id) return "-";
  try {
    return new Date(id + "T00:00:00").toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return id;
  }
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function typeVariant(type: string): "default" | "destructive" | "outline" {
  return type === "Masuk" ? "default" : type === "Keluar" ? "destructive" : "outline";
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

export default function CashHarianPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [allEntries, setAllEntries] = useState<CashEntry[]>([]);
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
  const [periodSummary, setPeriodSummary] = useState<PeriodSummary | null>(null);
  const [dailyBreakdown, setDailyBreakdown] = useState<DailyBreakdown[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Record<string, { masuk: number; keluar: number; total: number }>>({});

  // Form state
  const [formDate, setFormDate] = useState(todayStr());
  const [formType, setFormType] = useState("Masuk");
  const [formCategory, setFormCategory] = useState("Penjualan");
  const [formAmount, setFormAmount] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // History filter
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterType, setFilterType] = useState("");

  // Forecast comparison
  const [forecastMonth, setForecastMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, todayRes, summaryRes] = await Promise.all([
        fetch("/api/cash-harian", { cache: "no-store" }),
        fetch("/api/cash-harian/today", { cache: "no-store" }),
        fetch(`/api/cash-harian/summary?startDate=${forecastMonth}-01&endDate=${forecastMonth}-31`, { cache: "no-store" }),
      ]);

      if (listRes.ok) {
        const j = await listRes.json();
        setAllEntries(j.data || []);
      }
      if (todayRes.ok) {
        const j = await todayRes.json();
        setTodaySummary(j.summary || null);
      }
      if (summaryRes.ok) {
        const j = await summaryRes.json();
        setPeriodSummary(j.summary || null);
        setDailyBreakdown(j.dailyBreakdown || []);
        setCategoryBreakdown(j.categories || {});
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [forecastMonth]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Submit entry
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formDate || !formType || !formAmount) {
      setError("Date, Type, dan Amount wajib diisi");
      return;
    }
    const amt = Number(formAmount);
    if (amt <= 0) {
      setError("Amount harus lebih dari 0");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSubmitSuccess(null);
    try {
      const res = await fetch("/api/cash-harian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formDate,
          type: formType,
          category: formCategory,
          amount: amt,
          description: formDescription,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal simpan entry");
      setSubmitSuccess(`Entry ${json.data?.entryId || ""} berhasil disimpan`);
      setFormAmount("");
      setFormDescription("");
      await loadAll();
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  // Seed handler
  async function handleSeed() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cash-harian/seed-data", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal seed data");
      setSubmitSuccess(`Seed: ${json.seeded || 0} entries ditambahkan (${json.skipped || 0} sudah ada)`);
      await loadAll();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  // Filtered history
  const filteredHistory = allEntries.filter((e) => {
    if (filterStartDate && e.date < filterStartDate) return false;
    if (filterEndDate && e.date > filterEndDate) return false;
    if (filterType && e.type !== filterType) return false;
    return true;
  });

  // Monthly forecast data (sample budget targets)
  const forecastTargets: Record<string, number> = {
    "Penjualan": 80000000,
    "Bahan Baku": 15000000,
    "Operasional": 5000000,
    "Transport": 3000000,
    "Gaji": 10000000,
    "Utilitas": 2000000,
    "Investasi": 8000000,
    "Lain-lain": 2000000,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">💵 Cash Harian</h2>
          <p className="text-muted-foreground">
            Pencatatan kas harian SWI: masuk, keluar, saldo, dan analisis.
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

      {submitSuccess && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
          <CardContent className="py-4 text-green-700 dark:text-green-300 text-sm">{submitSuccess}</CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="dashboard">📊 Hari Ini</TabsTrigger>
          <TabsTrigger value="input">➕ Input Entry</TabsTrigger>
          <TabsTrigger value="history">📋 History</TabsTrigger>
          <TabsTrigger value="forecast">📈 vs Forecast</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Dashboard Hari Ini ── */}
        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Saldo Awal Hari Ini"
              value={loading ? "..." : formatRp(todaySummary?.saldoAwal || 0)}
              note="posisio pembukaan"
              accent="text-blue-600"
            />
            <KpiCard
              title="Total Masuk"
              value={loading ? "..." : formatRp(todaySummary?.todayMasuk || 0)}
              note={`${todaySummary?.entryCount || 0} entries`}
              accent="text-green-600"
            />
            <KpiCard
              title="Total Keluar"
              value={loading ? "..." : formatRp(todaySummary?.todayKeluar || 0)}
              note="pengeluaran hari ini"
              accent="text-red-600"
            />
            <KpiCard
              title="Saldo Akhir"
              value={loading ? "..." : formatRp(todaySummary?.saldoAkhir || 0)}
              note={`net: ${formatRp(todaySummary?.netChange || 0)}`}
              accent="text-purple-600"
            />
          </div>

          {/* Today's entries */}
          <Card>
            <CardHeader>
              <CardTitle>Entry Hari Ini</CardTitle>
              <CardDescription>Daftar transaksi kas hari ini</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : allEntries.filter((e) => e.date === todayStr()).length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada entry untuk hari ini.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allEntries
                      .filter((e) => e.date === todayStr())
                      .map((e) => (
                        <TableRow key={e.entryId}>
                          <TableCell className="text-sm">{e.inputDate.slice(11, 19) || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={typeVariant(e.type)}>{e.type}</Badge>
                          </TableCell>
                          <TableCell>{e.category}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {e.description}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${e.type === "Masuk" ? "text-green-600" : "text-red-600"}`}>
                            {e.type === "Masuk" ? "+" : "-"}{formatRp(e.amount)}
                          </TableCell>
                          <TableCell className="text-right">{formatRp(e.saldo)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Input Entry ── */}
        <TabsContent value="input" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>➕ Input Entry Baru</CardTitle>
              <CardDescription>Catat transaksi kas masuk atau keluar</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="f-date">Tanggal</Label>
                  <Input
                    id="f-date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="f-type">Type</Label>
                  <Select value={formType} onValueChange={setFormType}>
                    <SelectTrigger id="f-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masuk">Masuk</SelectItem>
                      <SelectItem value="Keluar">Keluar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="f-category">Kategori</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger id="f-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Penjualan">Penjualan</SelectItem>
                      <SelectItem value="Bahan Baku">Bahan Baku</SelectItem>
                      <SelectItem value="Operasional">Operasional</SelectItem>
                      <SelectItem value="Transport">Transport</SelectItem>
                      <SelectItem value="Gaji">Gaji</SelectItem>
                      <SelectItem value="Utilitas">Utilitas</SelectItem>
                      <SelectItem value="Investasi">Investasi</SelectItem>
                      <SelectItem value="Lain-lain">Lain-lain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="f-amount">Amount (Rp)</Label>
                  <Input
                    id="f-amount"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="0"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="f-desc">Keterangan</Label>
                  <Textarea
                    id="f-desc"
                    placeholder="Deskripsi transaksi..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormDate(todayStr());
                      setFormAmount("");
                      setFormDescription("");
                    }}
                  >
                    Reset
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Menyimpan..." : "💾 Simpan Entry"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: History ── */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>📋 History Cash Harian</CardTitle>
              <CardDescription>Semua transaksi kas — filter dan export</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="space-y-1">
                  <Label className="text-xs">Dari</Label>
                  <Input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sampai</Label>
                  <Input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Semua" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Semua</SelectItem>
                      <SelectItem value="Masuk">Masuk</SelectItem>
                      <SelectItem value="Keluar">Keluar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFilterStartDate("");
                      setFilterEndDate("");
                      setFilterType("");
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const rows = filteredHistory.map((e) => ({
                        Date: e.date,
                        Type: e.type,
                        Category: e.category,
                        Description: e.description,
                        Amount: e.amount,
                        Saldo: e.saldo,
                      }));
                      const header = "Date,Type,Category,Description,Amount,Saldo";
                      const csv = [
                        header,
                        ...rows.map((r) =>
                          [r.Date, r.Type, r.Category, `"${r.Description}"`, r.Amount, r.Saldo].join(",")
                        ),
                      ].join("\n");
                      const blob = new Blob([csv], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `cash-harian-${todayStr()}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    📥 Export CSV
                  </Button>
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : filteredHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada data sesuai filter.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Masuk</TableHead>
                        <TableHead>Keluar</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Keterangan</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map((e) => (
                        <TableRow key={e.entryId}>
                          <TableCell className="text-sm">{formatDate(e.date)}</TableCell>
                          <TableCell>
                            <Badge variant={typeVariant(e.type)}>{e.type}</Badge>
                          </TableCell>
                          <TableCell className="text-green-600 font-medium">
                            {e.type === "Masuk" ? formatRp(e.amount) : "-"}
                          </TableCell>
                          <TableCell className="text-red-600 font-medium">
                            {e.type === "Keluar" ? formatRp(e.amount) : "-"}
                          </TableCell>
                          <TableCell>{e.category}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {e.description}
                          </TableCell>
                          <TableCell className="text-right">{formatRp(e.saldo)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 4: vs Forecast ── */}
        <TabsContent value="forecast" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>📈 Actual vs Forecast</CardTitle>
              <CardDescription>Perbandingan realisasi kas vs target bulanan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <Label className="text-sm">Bulan:</Label>
                <Input
                  type="month"
                  value={forecastMonth}
                  onChange={(e) => setForecastMonth(e.target.value)}
                  className="w-48"
                />
              </div>

              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-right">Actual Masuk</TableHead>
                        <TableHead className="text-right">Actual Keluar</TableHead>
                        <TableHead className="text-right">Target</TableHead>
                        <TableHead className="text-right">Variance</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(forecastTargets).map(([cat, target]) => {
                        const actual = categoryBreakdown[cat] || { masuk: 0, keluar: 0 };
                        const actualTotal = actual.masuk - actual.keluar;
                        const variance = target > 0 ? ((actualTotal - target) / target) * 100 : 0;
                        const isPositive = variance >= 0;
                        return (
                          <TableRow key={cat}>
                            <TableCell className="font-medium">{cat}</TableCell>
                            <TableCell className="text-right text-green-600">{formatRp(actual.masuk)}</TableCell>
                            <TableCell className="text-right text-red-600">{formatRp(actual.keluar)}</TableCell>
                            <TableCell className="text-right">{formatRp(target)}</TableCell>
                            <TableCell
                              className={`text-right font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
                            >
                              {isPositive ? "+" : ""}{variance.toFixed(1)}%
                            </TableCell>
                            <TableCell>
                              <Badge variant={isPositive ? "default" : "destructive"}>
                                {isPositive ? "✅ On Track" : "⚠️ Below Target"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {/* Total row */}
                      <TableRow className="font-bold border-t-2">
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatRp(periodSummary?.totalMasuk || 0)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatRp(periodSummary?.totalKeluar || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatRp(Object.values(forecastTargets).reduce((a, b) => a + b, 0))}
                        </TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell>-</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>📅 Daily Breakdown</CardTitle>
              <CardDescription>Ringkasan kas harian per tanggal</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : dailyBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada data untuk periode ini.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead className="text-right">Masuk</TableHead>
                        <TableHead className="text-right">Keluar</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyBreakdown.map((d) => (
                        <TableRow key={d.date}>
                          <TableCell>{formatDate(d.date)}</TableCell>
                          <TableCell className="text-right text-green-600">{formatRp(d.masuk)}</TableCell>
                          <TableCell className="text-right text-red-600">{formatRp(d.keluar)}</TableCell>
                          <TableCell
                            className={`text-right font-medium ${d.net >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatRp(d.net)}
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
      </Tabs>
    </div>
  );
}
