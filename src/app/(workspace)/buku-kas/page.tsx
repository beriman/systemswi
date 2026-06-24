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

type KasEntry = {
  entryId: string;
  date: string;
  type: string;
  category: string;
  description: string;
  debit: number;
  credit: number;
  saldo: number;
  reference: string;
  inputBy: string;
  inputDate: string;
  rowNumber?: number;
};

type SaldoData = {
  saldo: number;
  totalDebit: number;
  totalCredit: number;
  entryCount: number;
  lastEntryDate: string | null;
};

type RekapData = {
  totals: { debit: number; credit: number; net: number; count: number };
  byCategory: Record<string, { debit: number; credit: number; net: number; count: number }>;
  periodSummary: { period: string; debit: number; credit: number; net: number; count: number }[];
};

type SummaryData = {
  totalDebit: number;
  totalCredit: number;
  saldoAkhir: number;
  count: number;
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
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return id;
  }
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function typeVariant(type: string): "default" | "destructive" | "outline" {
  return type === "Debit" ? "default" : type === "Kredit" ? "destructive" : "outline";
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

export default function BukuKasPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [saldoData, setSaldoData] = useState<SaldoData | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [allEntries, setAllEntries] = useState<KasEntry[]>([]);
  const [last10Entries, setLast10Entries] = useState<KasEntry[]>([]);
  const [rekapData, setRekapData] = useState<RekapData | null>(null);

  // Form state
  const [formDate, setFormDate] = useState(todayStr());
  const [formType, setFormType] = useState("Debit");
  const [formCategory, setFormCategory] = useState("Sales");
  const [formDebit, setFormDebit] = useState("");
  const [formCredit, setFormCredit] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formReference, setFormReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Rekap filter
  const [rekapPeriod, setRekapPeriod] = useState("monthly");
  const [rekapMonth, setRekapMonth] = useState(currentMonth());

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [saldoRes, listRes, rekapRes] = await Promise.all([
        fetch("/api/buku-kas/saldo", { cache: "no-store" }),
        fetch("/api/buku-kas?limit=100", { cache: "no-store" }),
        fetch(`/api/buku-kas/rekap?period=monthly&month=${currentMonth()}`, { cache: "no-store" }),
      ]);

      if (saldoRes.ok) {
        const j = await saldoRes.json();
        setSaldoData({
          saldo: j.saldo || 0,
          totalDebit: j.totalDebit || 0,
          totalCredit: j.totalCredit || 0,
          entryCount: j.entryCount || 0,
          lastEntryDate: j.lastEntryDate || null,
        });
      }
      if (listRes.ok) {
        const j = await listRes.json();
        const entries = j.data || [];
        setAllEntries(entries);
        setLast10Entries(entries.slice(-10).reverse());
      }
      if (rekapRes.ok) {
        const j = await rekapRes.json();
        setRekapData(j);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  async function loadRekap() {
    try {
      const res = await fetch(`/api/buku-kas/rekap?period=${rekapPeriod}&month=${rekapMonth}`, { cache: "no-store" });
      if (res.ok) {
        const j = await res.json();
        setRekapData(j);
      }
    } catch (err) {
      setError(String(err));
    }
  }

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (activeTab === "rekap") {
      loadRekap();
    }
  }, [rekapPeriod, rekapMonth, activeTab]);

  // Submit entry
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formDate || !formType) {
      setError("Tanggal dan Type wajib diisi");
      return;
    }
    const dAmt = Number(formDebit) || 0;
    const cAmt = Number(formCredit) || 0;
    if (dAmt === 0 && cAmt === 0) {
      setError("Debit atau Credit harus lebih dari 0");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSubmitSuccess(null);
    try {
      const res = await fetch("/api/buku-kas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formDate,
          type: formType,
          category: formCategory,
          debit: dAmt,
          credit: cAmt,
          description: formDescription,
          reference: formReference,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal simpan entry");
      setSubmitSuccess(`Entry ${json.data?.entryId || ""} berhasil disimpan`);
      setFormDebit("");
      setFormCredit("");
      setFormDescription("");
      setFormReference("");
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
    setSubmitSuccess(null);
    try {
      const res = await fetch("/api/buku-kas/seed", { method: "POST" });
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

  // Current month stats
  const monthEntries = allEntries.filter((e) => e.date.startsWith(currentMonth()));
  const monthDebit = monthEntries.reduce((s, e) => s + e.debit, 0);
  const monthCredit = monthEntries.reduce((s, e) => s + e.credit, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">📒 Buku Kas</h2>
          <p className="text-muted-foreground">
            Cash book SWI: pencatatan debit, kredit, dan saldo berjalan.
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
          <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
          <TabsTrigger value="input">➕ Input</TabsTrigger>
          <TabsTrigger value="table">📋 Buku Kas</TabsTrigger>
          <TabsTrigger value="rekap">📈 Rekap</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Dashboard ── */}
        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Saldo Saat Ini"
              value={loading ? "..." : formatRp(saldoData?.saldo || 0)}
              note={`${saldoData?.entryCount || 0} entries`}
              accent="text-blue-600"
            />
            <KpiCard
              title="Total Debit Bulan Ini"
              value={loading ? "..." : formatRp(monthDebit)}
              note={`${monthEntries.length} transaksi`}
              accent="text-green-600"
            />
            <KpiCard
              title="Total Kredit Bulan Ini"
              value={loading ? "..." : formatRp(monthCredit)}
              note="pengeluaran bulan ini"
              accent="text-red-600"
            />
            <KpiCard
              title="Net Bulan Ini"
              value={loading ? "..." : formatRp(monthDebit - monthCredit)}
              note={`per ${currentMonth()}`}
              accent={monthDebit - monthCredit >= 0 ? "text-green-600" : "text-red-600"}
            />
          </div>

          {/* Last 10 transactions */}
          <Card>
            <CardHeader>
              <CardTitle>10 Transaksi Terakhir</CardTitle>
              <CardDescription>Transaksi terbaru di buku kas</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : last10Entries.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Kredit</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {last10Entries.map((e) => (
                      <TableRow key={e.entryId}>
                        <TableCell className="text-sm">{formatDate(e.date)}</TableCell>
                        <TableCell>
                          <Badge variant={typeVariant(e.type)}>{e.type}</Badge>
                        </TableCell>
                        <TableCell>{e.category}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {e.description}
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {e.debit > 0 ? formatRp(e.debit) : "-"}
                        </TableCell>
                        <TableCell className="text-right text-red-600 font-medium">
                          {e.credit > 0 ? formatRp(e.credit) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatRp(e.saldo)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Input Transaksi ── */}
        <TabsContent value="input" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>➕ Input Transaksi Baru</CardTitle>
              <CardDescription>Catat transaksi debit atau kredit</CardDescription>
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
                      <SelectItem value="Debit">Debit (Masuk)</SelectItem>
                      <SelectItem value="Kredit">Keluar (Keluar)</SelectItem>
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
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Purchase">Purchase</SelectItem>
                      <SelectItem value="Operating">Operating</SelectItem>
                      <SelectItem value="Salary">Salary</SelectItem>
                      <SelectItem value="Transport">Transport</SelectItem>
                      <SelectItem value="Lain-lain">Lain-lain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="f-debit">Debit (Rp)</Label>
                  <Input
                    id="f-debit"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="0"
                    value={formDebit}
                    onChange={(e) => setFormDebit(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="f-credit">Kredit (Rp)</Label>
                  <Input
                    id="f-credit"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="0"
                    value={formCredit}
                    onChange={(e) => setFormCredit(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="f-reference">Reference</Label>
                  <Input
                    id="f-reference"
                    placeholder="INV-001, PO-001, dll"
                    value={formReference}
                    onChange={(e) => setFormReference(e.target.value)}
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
                      setFormDebit("");
                      setFormCredit("");
                      setFormDescription("");
                      setFormReference("");
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

        {/* ── Tab 3: Buku Kas Table ── */}
        <TabsContent value="table" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>📋 Buku Kas — Running Balance</CardTitle>
              <CardDescription>Semua transaksi dengan saldo berjalan</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : allEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada transaksi. Klik "Seed Data" untuk mengisi data sample.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Keterangan</TableHead>
                        <TableHead>Ref</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Kredit</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allEntries.map((e, i) => (
                        <TableRow key={e.entryId}>
                          <TableCell className="text-sm text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="text-sm">{formatDate(e.date)}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {e.entryId.slice(0, 12)}...
                          </TableCell>
                          <TableCell>
                            <Badge variant={typeVariant(e.type)}>{e.type}</Badge>
                          </TableCell>
                          <TableCell>{e.category}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {e.description}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{e.reference}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            {e.debit > 0 ? formatRp(e.debit) : "-"}
                          </TableCell>
                          <TableCell className="text-right text-red-600 font-medium">
                            {e.credit > 0 ? formatRp(e.credit) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-bold">{formatRp(e.saldo)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 4: Rekap ── */}
        <TabsContent value="rekap" className="space-y-4 mt-4">
          {/* Filter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Filter Rekap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Periode</Label>
                  <Select value={rekapPeriod} onValueChange={setRekapPeriod}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Bulanan</SelectItem>
                      <SelectItem value="weekly">Mingguan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Bulan</Label>
                  <Input
                    type="month"
                    value={rekapMonth}
                    onChange={(e) => setRekapMonth(e.target.value)}
                    className="w-40"
                  />
                </div>
                <Button onClick={loadRekap} variant="outline">
                  🔄 Load
                </Button>
              </div>
            </CardContent>
          </Card>

          {rekapData && (
            <>
              {/* Period Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Rekap {rekapPeriod === "monthly" ? "Bulanan" : "Mingguan"}</CardTitle>
                  <CardDescription>
                    Total: Debit {formatRp(rekapData.totals.debit)} | Kredit {formatRp(rekapData.totals.credit)} | Net {formatRp(rekapData.totals.net)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Periode</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Kredit</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rekapData.periodSummary.map((p) => (
                        <TableRow key={p.period}>
                          <TableCell className="font-medium">{p.period}</TableCell>
                          <TableCell className="text-right text-green-600">{formatRp(p.debit)}</TableCell>
                          <TableCell className="text-right text-red-600">{formatRp(p.credit)}</TableCell>
                          <TableCell className={`text-right font-medium ${p.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatRp(p.net)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">{p.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* By Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Breakdown per Kategori</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Kredit</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(rekapData.byCategory)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([cat, v]) => (
                          <TableRow key={cat}>
                            <TableCell className="font-medium">{cat}</TableCell>
                            <TableCell className="text-right text-green-600">{formatRp(v.debit)}</TableCell>
                            <TableCell className="text-right text-red-600">{formatRp(v.credit)}</TableCell>
                            <TableCell className={`text-right font-medium ${v.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatRp(v.net)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">{v.count}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
