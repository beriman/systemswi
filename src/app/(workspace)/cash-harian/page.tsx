"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp,
  Plus, RefreshCw, Calendar, Download, Edit3, Save, X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types ──────────────────────────────────────────────────────────

interface CashHarianEntry {
  entryId: string;
  date: string;
  type: "Masuk" | "Keluar";
  category: string;
  description: string;
  amount: number;
  saldo: number;
  inputBy: string;
  inputDate: string;
  rowNumber?: number;
}

interface TodayPosition {
  date: string;
  saldoAwal: number;
  totalMasuk: number;
  totalKeluar: number;
  saldoAkhir: number;
  entries: CashHarianEntry[];
  vsForecast: number | null;
}

interface ApiResponse<T> {
  source: string;
  sourceStatus: string;
  generatedAt: string;
  count?: number;
  data: T;
}

// ── Helpers ─────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(v || 0);

const fmtDate = (d: string) => {
  if (!d) return "-";
  const p = new Date(d);
  if (Number.isNaN(p.getTime())) return d;
  return p.toLocaleDateString("id-ID", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
};

const today = () => new Date().toISOString().slice(0, 10);

const CATEGORIES_MASUK = ["Penjualan", "Investasi", "Pinjaman", "Lain-lain"];
const CATEGORIES_KELUAR = ["Bahan Baku", "Transport", "Operasional", "Gaji", "Utilitas", "Lain-lain"];

export default function CashHarianPage() {
  const [entries, setEntries] = useState<CashHarianEntry[]>([]);
  const [todayPos, setTodayPos] = useState<TodayPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Filters
  const [filterStart, setFilterStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  });
  const [filterEnd, setFilterEnd] = useState(today());
  const [filterCategory, setFilterCategory] = useState("");

  // Form state
  const [formDate, setFormDate] = useState(today());
  const [formType, setFormType] = useState<"Masuk" | "Keluar">("Masuk");
  const [formCategory, setFormCategory] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // ── Data fetching ─────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [entriesRes, todayRes] = await Promise.all([
        fetch(`/api/cash-harian?startDate=${filterStart}&endDate=${filterEnd}`, { cache: "no-store" }),
        fetch("/api/cash-harian/today", { cache: "no-store" }),
      ]);
      const entriesJson: ApiResponse<CashHarianEntry[]> = await entriesRes.json();
      const todayJson: ApiResponse<TodayPosition> = await todayRes.json();

      if (entriesRes.ok) setEntries(entriesJson.data || []);
      if (todayRes.ok) setTodayPos(todayJson.data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStart, filterEnd]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Computed ──────────────────────────────────────────────────────

  const filteredEntries = useMemo(() => {
    let result = entries;
    if (filterCategory) {
      result = result.filter((e) => e.category === filterCategory);
    }
    return result;
  }, [entries, filterCategory]);

  const runningSaldo = useMemo(() => {
    let saldo = todayPos?.saldoAwal || 0;
    const byDate: Record<string, number> = {};
    for (const e of filteredEntries) {
      saldo += e.type === "Masuk" ? e.amount : -e.amount;
      byDate[e.date] = saldo;
    }
    return byDate;
  }, [filteredEntries, todayPos]);

  // ── Actions ───────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setFormSaving(true);
    setFormMsg(null);
    try {
      const amount = Number(formAmount.replace(/[^0-9]/g, ""));
      const res = await fetch("/api/cash-harian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formDate,
          type: formType,
          category: formCategory,
          description: formDescription,
          amount,
          inputBy: "system",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal simpan");

      setFormMsg({ type: "success", text: "Entry berhasil disimpan!" });
      setFormAmount("");
      setFormDescription("");
      setFormCategory("");
      fetchAll();
    } catch (e) {
      setFormMsg({ type: "error", text: String(e) });
    } finally {
      setFormSaving(false);
    }
  };

  const handleUpdate = async (entryId: string) => {
    try {
      const amount = Number(editAmount.replace(/[^0-9]/g, ""));
      const res = await fetch(`/api/cash-harian/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: editCategory, description: editDescription, amount }),
      });
      if (!res.ok) throw new Error("Gagal update");
      setEditId(null);
      fetchAll();
    } catch (e) {
      alert(String(e));
    }
  };

  const exportCSV = () => {
    const header = "Date,Type,Category,Description,Amount,Saldo\n";
    const rows = filteredEntries
      .map((e) => `${e.date},${e.type},${e.category},"${e.description}",${e.amount},${e.saldo}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cash-harian-${filterStart}-to-${filterEnd}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startEdit = (e: CashHarianEntry) => {
    setEditId(e.entryId);
    setEditAmount(String(e.amount));
    setEditCategory(e.category);
    setEditDescription(e.description);
  };

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            💵 Cash Harian
            <Badge variant="outline" className="text-xs">
              {loading ? "Loading..." : `${filteredEntries.length} entries`}
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Daily cash tracking — monitoring arus kas harian SWI
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-red-700 text-sm">⚠️ {error}</p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">📊 Dashboard Hari Ini</TabsTrigger>
          <TabsTrigger value="input">➕ Input Entry</TabsTrigger>
          <TabsTrigger value="history">📋 History</TabsTrigger>
          <TabsTrigger value="forecast">📈 vs Forecast</TabsTrigger>
        </TabsList>

        {/* ── TAB 1: Dashboard Hari Ini ─────────────────────────── */}
        <TabsContent value="dashboard" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Saldo Awal</CardDescription>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-blue-500" />
                      {fmt(todayPos?.saldoAwal || 0)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Masuk</CardDescription>
                    <CardTitle className="text-lg text-green-600 flex items-center gap-2">
                      <ArrowUpCircle className="h-4 w-4" />
                      {fmt(todayPos?.totalMasuk || 0)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Keluar</CardDescription>
                    <CardTitle className="text-lg text-red-600 flex items-center gap-2">
                      <ArrowDownCircle className="h-4 w-4" />
                      {fmt(todayPos?.totalKeluar || 0)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Saldo Akhir</CardDescription>
                    <CardTitle className={`text-lg flex items-center gap-2 ${
                      (todayPos?.saldoAkhir || 0) >= 0 ? "text-green-700" : "text-red-700"
                    }`}>
                      <TrendingUp className="h-4 w-4" />
                      {fmt(todayPos?.saldoAkhir || 0)}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Today's entries */}
              <Card>
                <CardHeader>
                  <CardTitle>Entri Hari Ini — {fmtDate(todayPos?.date || today())}</CardTitle>
                  <CardDescription>
                    {todayPos?.entries?.length || 0} entries hari ini
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {todayPos?.entries?.length ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipe</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead>Keterangan</TableHead>
                          <TableHead className="text-right">Jumlah</TableHead>
                          <TableHead className="text-right">Saldo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {todayPos.entries.map((e) => (
                          <TableRow key={e.entryId}>
                            <TableCell>
                              <Badge variant={e.type === "Masuk" ? "default" : "destructive"}>
                                {e.type === "Masuk" ? "↑ Masuk" : "↓ Keluar"}
                              </Badge>
                            </TableCell>
                            <TableCell>{e.category}</TableCell>
                            <TableCell className="text-muted-foreground">{e.description || "-"}</TableCell>
                            <TableCell className={`text-right font-medium ${
                              e.type === "Masuk" ? "text-green-600" : "text-red-600"
                            }`}>
                              {e.type === "Masuk" ? "+" : "-"}{fmt(e.amount)}
                            </TableCell>
                            <TableCell className="text-right">{fmt(e.saldo)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-sm py-8 text-center">
                      Belum ada entri hari ini. Mulai input di tab "Input Entry".
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── TAB 2: Input Entry ────────────────────────────────── */}
        <TabsContent value="input">
          <Card>
            <CardHeader>
              <CardTitle>Input Cash Entry</CardTitle>
              <CardDescription>
                Tambah pemasukan atau pengeluaran harian
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal</Label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipe</Label>
                  <Select value={formType} onValueChange={(v) => setFormType(v as "Masuk" | "Keluar")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masuk">↑ Masuk</SelectItem>
                      <SelectItem value="Keluar">↓ Keluar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(formType === "Masuk" ? CATEGORIES_MASUK : CATEGORIES_KELUAR).map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Jumlah (Rp)</Label>
                  <Input
                    type="text"
                    placeholder="0"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Keterangan</Label>
                  <Textarea
                    placeholder="Deskripsi singkat (opsional)"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              {/* Quick buttons */}
              <div>
                <Label className="text-xs text-muted-foreground">Quick Input:</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {formType === "Masuk" ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => { setFormCategory("Penjualan"); setFormAmount("500000"); setFormDescription("Penjualan harian"); }}>
                        + Penjualan 500rb
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setFormCategory("Penjualan"); setFormAmount("1000000"); setFormDescription("Penjualan besar"); }}>
                        + Penjualan 1jt
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => { setFormCategory("Bahan Baku"); setFormAmount("300000"); setFormDescription("Beli bahan baku"); }}>
                        - Bahan Baku 300rb
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setFormCategory("Transport"); setFormAmount("50000"); setFormDescription("Transportasi"); }}>
                        - Transport 50rb
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setFormCategory("Operasional"); setFormAmount("200000"); setFormDescription("Operasional harian"); }}>
                        - Operasional 200rb
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {formMsg && (
                <div className={`p-3 rounded-md text-sm ${
                  formMsg.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {formMsg.type === "success" ? "✅" : "❌"} {formMsg.text}
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={formSaving || !formCategory || !formAmount || !formDate}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {formSaving ? "Menyimpan..." : "Simpan Entry"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 3: History ────────────────────────────────────── */}
        <TabsContent value="history" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Dari</Label>
                  <Input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} className="w-40" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sampai</Label>
                  <Input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} className="w-40" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Kategori</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Semua" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Semua</SelectItem>
                      {[...CATEGORIES_MASUK, ...CATEGORIES_KELUAR].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={fetchAll}>
                  <Calendar className="h-3 w-3 mr-1" /> Filter
                </Button>
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Download className="h-3 w-3 mr-1" /> Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* History Table */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Cash Harian</CardTitle>
              <CardDescription>
                {filteredEntries.length} entries · {fmtDate(filterStart)} — {fmtDate(filterEnd)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead className="text-right">Masuk</TableHead>
                      <TableHead className="text-right">Keluar</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead className="w-20">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((e) => (
                      <TableRow key={e.entryId}>
                        <TableCell>{fmtDate(e.date)}</TableCell>
                        <TableCell>
                          <Badge variant={e.type === "Masuk" ? "default" : "destructive"}>
                            {e.type}
                          </Badge>
                        </TableCell>
                        {editId === e.entryId ? (
                          <>
                            <TableCell>
                              <Input value={editCategory} onChange={(e2) => setEditCategory(e2.target.value)} className="h-8" />
                            </TableCell>
                            <TableCell>
                              <Input value={editDescription} onChange={(e2) => setEditDescription(e2.target.value)} className="h-8" />
                            </TableCell>
                            <TableCell colSpan={3}>
                              <Input value={editAmount} onChange={(e2) => setEditAmount(e2.target.value)} className="h-8" />
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => handleUpdate(e.entryId)}>
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{e.category}</TableCell>
                            <TableCell className="text-muted-foreground">{e.description || "-"}</TableCell>
                            <TableCell className="text-right text-green-600">
                              {e.type === "Masuk" ? fmt(e.amount) : "-"}
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              {e.type === "Keluar" ? fmt(e.amount) : "-"}
                            </TableCell>
                            <TableCell className="text-right font-medium">{fmt(e.saldo)}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" onClick={() => startEdit(e)}>
                                <Edit3 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                    {filteredEntries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Tidak ada data untuk periode ini
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 4: vs Forecast ───────────────────────────────── */}
        <TabsContent value="forecast">
          <Card>
            <CardHeader>
              <CardTitle>Actual vs Forecast</CardTitle>
              <CardDescription>
                Perbandingan arus kas aktual dengan forecast
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <Skeleton className="h-64 w-full rounded-lg" />
              ) : (
                <>
                  {/* Summary comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardHeader className="pb-2">
                        <CardDescription className="text-blue-700">Total Aktual</CardDescription>
                        <CardTitle className="text-blue-800">
                          {fmt(filteredEntries.reduce((s, e) =>
                            s + (e.type === "Masuk" ? e.amount : -e.amount), 0
                          ))}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className="bg-amber-50 border-amber-200">
                      <CardHeader className="pb-2">
                        <CardDescription className="text-amber-700">Forecast (Est.)</CardDescription>
                        <CardTitle className="text-amber-800">
                          {fmt(filteredEntries.reduce((s, e) =>
                            s + (e.type === "Masuk" ? e.amount : 0), 0
                          ) * 0.9)}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className="bg-green-50 border-green-200">
                      <CardHeader className="pb-2">
                        <CardDescription className="text-green-700">Variance</CardDescription>
                        <CardTitle className="text-green-800">
                          {(() => {
                            const actual = filteredEntries.reduce((s, e) =>
                              s + (e.type === "Masuk" ? e.amount : -e.amount), 0
                            );
                            const forecast = filteredEntries.reduce((s, e) =>
                              s + (e.type === "Masuk" ? e.amount : 0), 0
                            ) * 0.9;
                            return fmt(actual - forecast);
                          })()}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  {/* Daily comparison table */}
                  <div>
                    <h3 className="font-semibold mb-2">Detail Harian</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead className="text-right">Aktual Masuk</TableHead>
                          <TableHead className="text-right">Aktual Keluar</TableHead>
                          <TableHead className="text-right">Net Aktual</TableHead>
                          <TableHead className="text-right">Forecast</TableHead>
                          <TableHead className="text-right">Variance</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(
                          filteredEntries.reduce<Record<string, { masuk: number; keluar: number }>>((acc, e) => {
                            if (!acc[e.date]) acc[e.date] = { masuk: 0, keluar: 0 };
                            if (e.type === "Masuk") acc[e.date].masuk += e.amount;
                            else acc[e.date].keluar += e.amount;
                            return acc;
                          }, {})
                        ).sort(([a], [b]) => a.localeCompare(b)).map(([date, { masuk, keluar }]) => {
                          const net = masuk - keluar;
                          const forecast = masuk * 0.95;
                          const variance = net - forecast;
                          const pct = forecast > 0 ? Math.round((net / forecast) * 100) : 0;
                          return (
                            <TableRow key={date}>
                              <TableCell>{fmtDate(date)}</TableCell>
                              <TableCell className="text-right text-green-600">{fmt(masuk)}</TableCell>
                              <TableCell className="text-right text-red-600">{fmt(keluar)}</TableCell>
                              <TableCell className="text-right font-medium">{fmt(net)}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{fmt(forecast)}</TableCell>
                              <TableCell className={`text-right ${variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {variance >= 0 ? "+" : ""}{fmt(variance)}
                              </TableCell>
                              <TableCell>
                                {pct >= 100 ? (
                                  <Badge className="bg-green-100 text-green-800">✓ On Track</Badge>
                                ) : pct >= 80 ? (
                                  <Badge className="bg-amber-100 text-amber-800">⚠ Close</Badge>
                                ) : (
                                  <Badge className="bg-red-100 text-red-800">✗ Off</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {filteredEntries.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              Tidak ada data untuk dibandingkan. Input data cash harian terlebih dahulu.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Placeholder chart area */}
                  <Card className="border-dashed border-2">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Chart visualization coming soon</p>
                      <p className="text-xs mt-1">Data actual vs forecast akan ditampilkan dalam grafik</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
