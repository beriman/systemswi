"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Types ──
interface BukuKasEntry {
  entryId: string;
  id: string;
  date: string;
  type: "D" | "K";
  category: string;
  amount: number;
  debit: number;
  credit: number;
  description: string;
  reference: string;
  saldo: number;
  rowNumber: number;
}

interface SaldoData {
  saldo: number;
  currentMonth: string;
  totalDebit: number;
  totalKredit: number;
  monthDebit: number;
  monthKredit: number;
  entryCount: number;
}

interface RekapData {
  totalDebit: number;
  totalKredit: number;
  netChange: number;
  byCategory: Record<string, { debit: number; kredit: number; net: number }>;
  monthlySummary: Array<{ period: string; debit: number; kredit: number; net: number }>;
}

const CATEGORIES = ["Sales", "Purchase", "Operating", "Salary", "Transport"];

const CATEGORY_EMOJI: Record<string, string> = {
  Sales: "💰",
  Purchase: "🛒",
  Operating: "⚙️",
  Salary: "👤",
  Transport: "🚚",
};

// ── Helpers ──
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

function getMonthName(period: string): string {
  const [year, month] = period.split("-");
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

// ── Main Component ──
export default function BukuKasPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [entries, setEntries] = useState<BukuKasEntry[]>([]);
  const [saldoData, setSaldoData] = useState<SaldoData | null>(null);
  const [rekapData, setRekapData] = useState<RekapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formType, setFormType] = useState<"D" | "K">("D");
  const [formCategory, setFormCategory] = useState("Sales");
  const [formAmount, setFormAmount] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formReference, setFormReference] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Table filters
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Reap filters
  const [rekapYear, setRekapYear] = useState(String(new Date().getFullYear()));

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [entriesRes, saldoRes] = await Promise.all([
        fetch("/api/buku-kas"),
        fetch("/api/buku-kas/saldo"),
      ]);

      const entriesJson = await entriesRes.json();
      const saldoJson = await saldoRes.json();

      if (entriesJson.entries) {
        const mapped = entriesJson.entries.map((e: any) => ({
          ...e,
          id: e.entryId,
          amount: e.debit || e.credit || 0,
        }));
        setEntries(mapped);
      }
      if (saldoJson.saldo !== undefined) {
        setSaldoData(saldoJson);
      }
    } catch (err) {
      setError("Gagal memuat data buku kas");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRekap = async () => {
    try {
      const res = await fetch(`/api/buku-kas/rekap?period=monthly&year=${rekapYear}`);
      const json = await res.json();
      if (json.totalDebit !== undefined || json.entryCount !== undefined) {
        setRekapData(json);
      }
    } catch (err) {
      console.error("Failed to fetch rekap:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === "rekap") {
      fetchRekap();
    }
  }, [activeTab, rekapYear]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormMessage(null);

    try {
      const res = await fetch("/api/buku-kas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formDate,
          type: formType,
          category: formCategory,
          amount: Number(formAmount),
          description: formDescription,
          reference: formReference,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        setFormMessage({ type: "success", text: "✅ Transaksi berhasil ditambahkan!" });
        // Reset form
        setFormAmount("");
        setFormDescription("");
        setFormReference("");
        // Refresh data
        await fetchData();
      } else {
        setFormMessage({ type: "error", text: `❌ ${json.error || "Gagal menambahkan transaksi"}` });
      }
    } catch {
      setFormMessage({ type: "error", text: "❌ Gagal menghubungi server" });
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredEntries = entries.filter((e) => {
    if (filterDateFrom && e.date < filterDateFrom) return false;
    if (filterDateTo && e.date > filterDateTo) return false;
    if (filterCategory && e.category.toLowerCase() !== filterCategory.toLowerCase()) return false;
    return true;
  });

  const last10 = entries.slice(-10).reverse();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">📒 Buku Kas</h1>
        <p className="text-muted-foreground">Pencatatan transaksi kas harian dengan saldo berjalan otomatis</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
          <TabsTrigger value="input">➕ Input Transaksi</TabsTrigger>
          <TabsTrigger value="table">📋 Buku Kas</TabsTrigger>
          <TabsTrigger value="rekap">📈 Rekap</TabsTrigger>
        </TabsList>

        {/* ─── Tab 1: Dashboard ─── */}
        <TabsContent value="dashboard" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-red-500">{error}</p>
                <Button onClick={fetchData} className="mt-2">Coba Lagi</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Saldo Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Saldo Saat Ini</p>
                    <p className={`text-2xl font-bold ${(saldoData?.saldo || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(saldoData?.saldo || 0)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Total Masuk Bulan Ini</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(saldoData?.monthDebit || 0)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Total Keluar Bulan Ini</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(saldoData?.monthKredit || 0)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Total Transaksi</p>
                    <p className="text-2xl font-bold">{saldoData?.entryCount || 0}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Last 10 Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>10 Transaksi Terakhir</CardTitle>
                </CardHeader>
                <CardContent>
                  {last10.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Belum ada transaksi</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Keterangan</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Kredit</TableHead>
                          <TableHead className="text-right">Saldo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {last10.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{formatDate(entry.date)}</TableCell>
                            <TableCell>
                              <div>
                                <span className="font-medium">{entry.description}</span>
                                {entry.reference && (
                                  <span className="text-xs text-muted-foreground ml-2">#{entry.reference}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {CATEGORY_EMOJI[entry.category] || "📁"} {entry.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-green-600 font-medium">
                              {entry.type === "D" ? formatCurrency(entry.amount) : "-"}
                            </TableCell>
                            <TableCell className="text-right text-red-600 font-medium">
                              {entry.type === "K" ? formatCurrency(entry.amount) : "-"}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {formatCurrency(entry.saldo)}
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

        {/* ─── Tab 2: Input Transaksi ─── */}
        <TabsContent value="input">
          <Card>
            <CardHeader>
              <CardTitle>Input Transaksi Baru</CardTitle>
              <CardDescription>Tambahkan transaksi kas baru</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Tanggal</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Tipe</Label>
                    <div className="flex gap-4 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="type"
                          value="D"
                          checked={formType === "D"}
                          onChange={() => setFormType("D")}
                          className="w-4 h-4"
                        />
                        <span className="text-green-600 font-medium">💰 Debit (Masuk)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="type"
                          value="K"
                          checked={formType === "K"}
                          onChange={() => setFormType("K")}
                          className="w-4 h-4"
                        />
                        <span className="text-red-600 font-medium">💸 Kredit (Keluar)</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Kategori</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFormCategory(cat)}
                          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                            formCategory === cat
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background hover:bg-accent border-border"
                          }`}
                        >
                          {CATEGORY_EMOJI[cat]} {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="amount">Jumlah (Rp)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="0"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Keterangan</Label>
                  <Input
                    id="description"
                    placeholder="Deskripsi transaksi..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="reference">Referensi (opsional)</Label>
                  <Input
                    id="reference"
                    placeholder="No. invoice, no. PO, dll."
                    value={formReference}
                    onChange={(e) => setFormReference(e.target.value)}
                  />
                </div>

                {formMessage && (
                  <div className={`p-3 rounded-md text-sm ${
                    formMessage.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {formMessage.text}
                  </div>
                )}

                <Button type="submit" disabled={formSubmitting} className="w-full">
                  {formSubmitting ? "Menyimpan..." : "💾 Simpan Transaksi"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab 3: Buku Kas Table ─── */}
        <TabsContent value="table" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <Label className="text-xs">Dari Tanggal</Label>
                  <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Sampai Tanggal</Label>
                  <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Kategori</Label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Semua</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <Button
                  variant="outline"
                  onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); setFilterCategory(""); }}
                >
                  Reset Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Running Balance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Buku Kas — Saldo Berjalan</CardTitle>
              <CardDescription>
                {filteredEntries.length} transaksi
                {filterDateFrom && ` dari ${filterDateFrom}`}
                {filterDateTo && ` s/d ${filterDateTo}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredEntries.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {loading ? "Memuat data..." : "Tidak ada transaksi sesuai filter"}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Keterangan</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Kredit</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="whitespace-nowrap">{formatDate(entry.date)}</TableCell>
                          <TableCell>
                            <div>
                              <span>{entry.description}</span>
                              {entry.reference && (
                                <span className="text-xs text-muted-foreground ml-2">#{entry.reference}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {CATEGORY_EMOJI[entry.category] || "📁"} {entry.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            {entry.type === "D" ? formatCurrency(entry.amount) : "-"}
                          </TableCell>
                          <TableCell className="text-right text-red-600 font-medium">
                            {entry.type === "K" ? formatCurrency(entry.amount) : "-"}
                          </TableCell>
                          <TableCell className={`text-right font-bold ${entry.saldo >= 0 ? "" : "text-red-600"}`}>
                            {formatCurrency(entry.saldo)}
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

        {/* ─── Tab 4: Rekap ─── */}
        <TabsContent value="rekap" className="space-y-4">
          <div className="flex items-center gap-4">
            <Label>Tahun:</Label>
            <select
              value={rekapYear}
              onChange={(e) => setRekapYear(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm w-32"
            >
              {["2024", "2025", "2026", "2027"].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {rekapData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Total Debit ({rekapYear})</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(rekapData.totalDebit)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Total Kredit ({rekapYear})</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(rekapData.totalKredit)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Net Change ({rekapYear})</p>
                    <p className={`text-2xl font-bold ${rekapData.netChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(rekapData.netChange)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Rekap Bulanan</CardTitle>
                </CardHeader>
                <CardContent>
                  {rekapData.monthlySummary.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Tidak ada data untuk tahun {rekapYear}</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bulan</TableHead>
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Kredit</TableHead>
                          <TableHead className="text-right">Net</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rekapData.monthlySummary.map((m) => (
                          <TableRow key={m.period}>
                            <TableCell className="font-medium">{getMonthName(m.period)}</TableCell>
                            <TableCell className="text-right text-green-600">{formatCurrency(m.debit)}</TableCell>
                            <TableCell className="text-right text-red-600">{formatCurrency(m.kredit)}</TableCell>
                            <TableCell className={`text-right font-bold ${m.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(m.net)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* By Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Rekap per Kategori</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Kredit</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(rekapData.byCategory)
                        .filter(([, v]) => v.debit > 0 || v.kredit > 0)
                        .map(([cat, data]) => (
                          <TableRow key={cat}>
                            <TableCell>{CATEGORY_EMOJI[cat] || "📁"} {cat}</TableCell>
                            <TableCell className="text-right text-green-600">{formatCurrency(data.debit)}</TableCell>
                            <TableCell className="text-right text-red-600">{formatCurrency(data.kredit)}</TableCell>
                            <TableCell className={`text-right font-bold ${data.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(data.net)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Memuat data rekap...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
