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

type BukuKasEntry = {
  entryId: string;
  date: string;
  type: string;
  category: string;
  description: string;
  debit: number;
  credit: number;
  saldo: number;
  rowNumber: number;
};

type SaldoData = {
  current: number;
  totalDebit: number;
  totalCredit: number;
  entryCount: number;
  lastEntryDate: string | null;
};

type RekapData = {
  summary: { totalDebit: number; totalCredit: number; netCash: number; entryCount: number };
  byCategory: Record<string, { debit: number; credit: number; net: number; count: number }>;
  byPeriod: Record<string, { debit: number; credit: number; net: number; count: number }>;
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
      day: "numeric", month: "short", year: "numeric",
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

const CATEGORIES = ["Sales", "Purchase", "Operating", "Salary", "Transport"];

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
  const [allEntries, setAllEntries] = useState<BukuKasEntry[]>([]);
  const [saldoData, setSaldoData] = useState<SaldoData | null>(null);
  const [rekapData, setRekapData] = useState<RekapData | null>(null);
  const [last10, setLast10] = useState<BukuKasEntry[]>([]);

  // Form state
  const [formDate, setFormDate] = useState(todayStr());
  const [formType, setFormType] = useState("Debit");
  const [formCategory, setFormCategory] = useState("Sales");
  const [formAmount, setFormAmount] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formReference, setFormReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Filter
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Rekap filter
  const [rekapMonth, setRekapMonth] = useState(currentMonth());

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, saldoRes, rekapRes, last10Res] = await Promise.all([
        fetch("/api/buku-kas", { cache: "no-store" }),
        fetch("/api/buku-kas/saldo", { cache: "no-store" }),
        fetch(`/api/buku-kas/rekap?month=${rekapMonth}`, { cache: "no-store" }),
        fetch("/api/buku-kas?limit=10", { cache: "no-store" }),
      ]);

      if (listRes.ok) {
        const j = await listRes.json();
        setAllEntries(j.data || []);
      }
      if (saldoRes.ok) {
        const j = await saldoRes.json();
        setSaldoData(j.saldo || null);
      }
      if (rekapRes.ok) {
        const j = await rekapRes.json();
        setRekapData(j);
      }
      if (last10Res.ok) {
        const j = await last10Res.json();
        setLast10(j.data || []);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [rekapMonth]);

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
      const res = await fetch("/api/buku-kas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formDate,
          type: formType,
          category: formCategory,
          amount: amt,
          description: formDescription,
          reference: formReference,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal simpan entry");
      setSubmitSuccess(`Entry ${json.data?.entryId || ""} berhasil disimpan`);
      setFormAmount("");
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

  // Filtered entries
  const filteredEntries = allEntries.filter((e) => {
    if (filterType && e.type !== filterType) return false;
    if (filterCategory && e.category !== filterCategory) return false;
    return true;
  });

  // Monthly summary
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
            Cash book SWI: pencatatan debit, kredit, dan running balance.
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
              value={loading ? "..." : formatRp(saldoData?.current || 0)}
              note={`${saldoData?.entryCount || 0} entries`}
              accent="text-blue-600"
            />
            <KpiCard
              title="Total Masuk (Bulan Ini)"
              value={loading ? "..." : formatRp(monthDebit)}
              note={`Debit ${currentMonth()}`}
              accent="text-green-600"
            />
            <KpiCard
              title="Total Keluar (Bulan Ini)"
              value={loading ? "..." : formatRp(monthCredit)}
              note={`Kredit ${currentMonth()}`}
              accent="text-red-600"
            />
            <KpiCard
              title="Net Cash (Bulan Ini)"
              value={loading ? "..." : formatRp(monthDebit - monthCredit)}
              note="Debit - Kredit"
              accent="text-purple-600"
            />
          </div>

          {/* Last 10 transactions */}
          <Card>
            <CardHeader>
              <CardTitle>10 Transaksi Terakhir</CardTitle>
              <CardDescription>Transaksi terbaru dari buku kas</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : last10.length === 0 ? (
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
                    {last10.map((e) => (
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
              <CardDescription>Catat transaksi debit atau kredit buku kas</CardDescription>
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
                      <SelectItem value="Kredit">Kredit (Keluar)</SelectItem>
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
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
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
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="f-ref">Reference (Opsional)</Label>
                  <Input
                    id="f-ref"
                    placeholder="No. invoice, PO, dll"
                    value={formReference}
                    onChange={(e) => setFormReference(e.target.value)}
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
              <CardTitle>📋 Buku Kas (Running Balance)</CardTitle>
              <CardDescription>Semua transaksi dengan saldo berjalan</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Semua" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Semua</SelectItem>
                      <SelectItem value="Debit">Debit</SelectItem>
                      <SelectItem value="Kredit">Kredit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Kategori</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Semua" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Semua</SelectItem>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : filteredEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada transaksi ditemukan.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Keterangan</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Kredit</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.map((e) => (
                        <TableRow key={e.entryId}>
                          <TableCell className="text-sm">{formatDate(e.date)}</TableCell>
                          <TableCell className="text-sm max-w-[250px] truncate">
                            {e.description}
                          </TableCell>
                          <TableCell>
                            <Badge variant={typeVariant(e.type)}>{e.type}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{e.category}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            {e.debit > 0 ? formatRp(e.debit) : "-"}
                          </TableCell>
                          <TableCell className="text-right text-red-600 font-medium">
                            {e.credit > 0 ? formatRp(e.credit) : "-"}
                          </TableCell>
                          <TableCell className={`text-right font-bold ${e.saldo < 0 ? "text-red-600" : ""}`}>
                            {formatRp(e.saldo)}
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

        {/* ── Tab 4: Rekap ── */}
        <TabsContent value="rekap" className="space-y-4 mt-4">
          <div className="flex items-end gap-3 mb-4">
            <div className="space-y-1">
              <Label className="text-xs">Bulan</Label>
              <Input
                type="month"
                value={rekapMonth}
                onChange={(e) => setRekapMonth(e.target.value)}
                className="w-44"
              />
            </div>
            <Button onClick={loadAll} disabled={loading}>
              {loading ? "Memuat..." : "🔄 Load"}
            </Button>
          </div>

          {rekapData && (
            <>
              {/* Summary */}
              <div className="grid gap-3 sm:grid-cols-3">
                <KpiCard
                  title="Total Debit"
                  value={formatRp(rekapData.summary.totalDebit)}
                  accent="text-green-600"
                />
                <KpiCard
                  title="Total Kredit"
                  value={formatRp(rekapData.summary.totalCredit)}
                  accent="text-red-600"
                />
                <KpiCard
                  title="Net Cash"
                  value={formatRp(rekapData.summary.netCash)}
                  accent="text-purple-600"
                />
              </div>

              {/* By Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Rekap per Kategori</CardTitle>
                  <CardDescription>Debit & kredit per kategori</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(rekapData.byCategory).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Tidak ada data untuk periode ini.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kategori</TableHead>
                          <TableHead className="text-right">Jumlah</TableHead>
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Kredit</TableHead>
                          <TableHead className="text-right">Net</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(rekapData.byCategory)
                          .sort((a, b) => Math.abs(b[1].net) - Math.abs(a[1].net))
                          .map(([cat, data]) => (
                            <TableRow key={cat}>
                              <TableCell className="font-medium">{cat}</TableCell>
                              <TableCell className="text-right text-sm">{data.count} trx</TableCell>
                              <TableCell className="text-right text-green-600">{formatRp(data.debit)}</TableCell>
                              <TableCell className="text-right text-red-600">{formatRp(data.credit)}</TableCell>
                              <TableCell className={`text-right font-bold ${data.net < 0 ? "text-red-600" : ""}`}>
                                {formatRp(data.net)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* By Period */}
              <Card>
                <CardHeader>
                  <CardTitle>Rekap per Periode</CardTitle>
                  <CardDescription>Ringkasan bulanan</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(rekapData.byPeriod).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Tidak ada data untuk periode ini.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Periode</TableHead>
                          <TableHead className="text-right">Jumlah</TableHead>
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Kredit</TableHead>
                          <TableHead className="text-right">Net</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(rekapData.byPeriod)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([period, data]) => (
                            <TableRow key={period}>
                              <TableCell className="font-medium">{period}</TableCell>
                              <TableCell className="text-right text-sm">{data.count} trx</TableCell>
                              <TableCell className="text-right text-green-600">{formatRp(data.debit)}</TableCell>
                              <TableCell className="text-right text-red-600">{formatRp(data.credit)}</TableCell>
                              <TableCell className={`text-right font-bold ${data.net < 0 ? "text-red-600" : ""}`}>
                                {formatRp(data.net)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
