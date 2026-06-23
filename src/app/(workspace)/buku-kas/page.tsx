"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGate } from "@/components/auth/role-gate";

// ── Types ──
interface BukuKasEntry {
  id: string;
  tanggal: string;
  kodeAkun: string;
  kategori: string;
  deskripsi: string;
  debit: number;
  kredit: number;
  referensi: string;
  divisi: string;
  saldo: number;
}

interface BukuKasSummary {
  totalEntries: number;
  totalDebit: number;
  totalKredit: number;
  currentSaldo: number;
}

interface SaldoData {
  saldo: number;
  totalDebit: number;
  totalKredit: number;
  totalEntries: number;
  currentMonth: {
    month: string;
    debit: number;
    kredit: number;
    net: number;
  };
}

interface RekapData {
  summary: {
    totalDebit: number;
    totalKredit: number;
    net: number;
    totalEntries: number;
  };
  byCategory: Record<string, { debit: number; kredit: number; count: number }>;
  byMonth: Record<string, { debit: number; kredit: number; count: number }>;
  byDivisi: Record<string, { debit: number; kredit: number; count: number }>;
}

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
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

const CATEGORIES = ["Sales", "Purchase", "Operating", "Salary", "Transport"];
const DIVISI = ["Holding", "Produksi", "Store", "Event", "Ecommerse", "Digital"];

// ── Stat Card ──
function StatCard({ title, value, sub, color }: { title: string; value: string; sub?: string; color?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color || ""}`}>{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Main Page ──
export default function BukuKasPage() {
  const [entries, setEntries] = useState<BukuKasEntry[]>([]);
  const [summary, setSummary] = useState<BukuKasSummary | null>(null);
  const [saldoSaldo, setSaldoSaldo] = useState<SaldoData | null>(null);
  const [rekap, setRekap] = useState<RekapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDivisi, setFilterDivisi] = useState("");

  async function fetchEntries() {
    const params = new URLSearchParams();
    if (filterCategory) params.set("category", filterCategory);
    if (filterDivisi) params.set("divisi", filterDivisi);
    const res = await fetch(`/api/buku-kas?${params}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Gagal fetch entries");
    const json = await res.json();
    setEntries(json.entries || []);
    setSummary(json.summary || null);
  }

  async function fetchSaldo() {
    const res = await fetch("/api/buku-kas/saldo", { cache: "no-store" });
    if (!res.ok) throw new Error("Gagal fetch saldo");
    const json = await res.json();
    setSaldoSaldo(json);
  }

  async function fetchRekap() {
    const res = await fetch("/api/buku-kas/rekap", { cache: "no-store" });
    if (!res.ok) throw new Error("Gagal fetch rekap");
    const json = await res.json();
    setRekap(json);
  }

  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true);
        await Promise.all([fetchEntries(), fetchSaldo(), fetchRekap()]);
        setError(null);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [filterCategory, filterDivisi]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormMessage(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      tanggal: String(form.get("tanggal") || ""),
      type: String(form.get("type") || "debit"),
      kodeAkun: String(form.get("kodeAkun") || ""),
      kategori: String(form.get("kategori") || "Operating"),
      deskripsi: String(form.get("deskripsi") || ""),
      amount: Number(form.get("amount") || 0),
      referensi: String(form.get("referensi") || ""),
      divisi: String(form.get("divisi") || "Holding"),
    };

    try {
      const res = await fetch("/api/buku-kas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.details || "Gagal menyimpan");
      setFormMessage("✅ Transaksi tersimpan ke Buku Kas.");
      event.currentTarget.reset();
      await Promise.all([fetchEntries(), fetchSaldo(), fetchRekap()]);
    } catch (err) {
      setFormMessage(`❌ ${String(err).replace(/^Error:\s*/, "")}`);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Last 10 entries for dashboard ──
  const lastTen = [...entries].reverse().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">📒 Buku Kas</h2>
        <p className="text-muted-foreground">
          Cash book PT Sensasi Wangi Indonesia — real-time dari Google Sheets
        </p>
      </div>

      <RoleGate feature="dashboard:overview">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
                <CardContent><Skeleton className="h-8 w-32" /></CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center text-destructive">
              <p>Gagal memuat data: {error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Pastikan Google Sheets terhubung dan environment variables sudah di-set.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="dashboard" className="space-y-4">
            <TabsList>
              <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
              <TabsTrigger value="input">➕ Input Transaksi</TabsTrigger>
              <TabsTrigger value="ledger">📒 Buku Kas</TabsTrigger>
              <TabsTrigger value="rekap">📈 Rekap</TabsTrigger>
            </TabsList>

            {/* ── TAB: Dashboard ── */}
            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <StatCard
                  title="Saldo Saat Ini"
                  value={formatCurrency(saldoSaldo?.saldo ?? 0)}
                  sub={`${saldoSaldo?.totalEntries ?? 0} transaksi`}
                  color="text-blue-700"
                />
                <StatCard
                  title="Total Masuk (Bulan Ini)"
                  value={formatCurrency(saldoSaldo?.currentMonth?.debit ?? 0)}
                  sub={saldoSaldo?.currentMonth?.month || "-"}
                  color="text-green-700"
                />
                <StatCard
                  title="Total Keluar (Bulan Ini)"
                  value={formatCurrency(saldoSaldo?.currentMonth?.kredit ?? 0)}
                  sub={saldoSaldo?.currentMonth?.month || "-"}
                  color="text-red-700"
                />
                <StatCard
                  title="Net Bulan Ini"
                  value={formatCurrency(saldoSaldo?.currentMonth?.net ?? 0)}
                  sub="Debit - Kredit"
                  color={(saldoSaldo?.currentMonth?.net ?? 0) >= 0 ? "text-green-700" : "text-red-700"}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>10 Transaksi Terakhir</CardTitle>
                  <CardDescription>Transaksi terbaru di Buku Kas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Deskripsi</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Kredit</TableHead>
                          <TableHead className="text-right">Saldo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lastTen.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              Belum ada transaksi di Buku Kas.
                            </TableCell>
                          </TableRow>
                        ) : (
                          lastTen.map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell>{formatDate(tx.tanggal)}</TableCell>
                              <TableCell className="max-w-[280px] truncate">{tx.deskripsi}</TableCell>
                              <TableCell>{tx.kategori}</TableCell>
                              <TableCell className="text-right text-green-700">
                                {tx.debit ? formatCurrency(tx.debit) : "-"}
                              </TableCell>
                              <TableCell className="text-right text-red-700">
                                {tx.kredit ? formatCurrency(tx.kredit) : "-"}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(tx.saldo)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── TAB: Input Transaksi ── */}
            <TabsContent value="input">
              <Card className="border-emerald-200 bg-emerald-50/30">
                <CardHeader>
                  <CardTitle>Input Transaksi Baru</CardTitle>
                  <CardDescription>
                    Tambah transaksi debit/kredit ke Buku Kas — tersimpan otomatis ke Google Sheets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="bk-tanggal">Tanggal</Label>
                      <Input
                        id="bk-tanggal"
                        name="tanggal"
                        type="date"
                        defaultValue={new Date().toISOString().slice(0, 10)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bk-type">Tipe</Label>
                      <select
                        id="bk-type"
                        name="type"
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      >
                        <option value="debit">Debit (Masuk)</option>
                        <option value="credit">Credit (Keluar)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bk-kategori">Kategori</Label>
                      <select
                        id="bk-kategori"
                        name="kategori"
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        defaultValue="Operating"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bk-amount">Jumlah (Rp)</Label>
                      <Input id="bk-amount" name="amount" type="number" min="1" step="1" placeholder="100000" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bk-deskripsi">Deskripsi</Label>
                      <Input id="bk-deskripsi" name="deskripsi" placeholder="Contoh: Penjualan parfum Wangi Mawar" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bk-divisi">Divisi</Label>
                      <select
                        id="bk-divisi"
                        name="divisi"
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        defaultValue="Holding"
                      >
                        {DIVISI.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bk-kodeAkun">Kode Akun</Label>
                      <Input id="bk-kodeAkun" name="kodeAkun" placeholder="401 / 501" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bk-referensi">Referensi</Label>
                      <Input id="bk-referensi" name="referensi" placeholder="INV-2026-001" />
                    </div>
                    <div className="md:col-span-4 flex items-center gap-3">
                      <Button type="submit" disabled={submitting}>
                        {submitting ? "Menyimpan..." : "Simpan Transaksi"}
                      </Button>
                      {formMessage && (
                        <p className={`text-sm ${formMessage.startsWith("✅") ? "text-green-700" : "text-red-700"}`}>
                          {formMessage}
                        </p>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── TAB: Buku Kas Table (Ledger) ── */}
            <TabsContent value="ledger" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Buku Kas — Running Balance</CardTitle>
                  <CardDescription>Semua transaksi dengan saldo berjalan</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Kategori</Label>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="h-9 rounded-md border bg-background px-3 text-sm"
                      >
                        <option value="">Semua</option>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Divisi</Label>
                      <select
                        value={filterDivisi}
                        onChange={(e) => setFilterDivisi(e.target.value)}
                        className="h-9 rounded-md border bg-background px-3 text-sm"
                      >
                        <option value="">Semua</option>
                        {DIVISI.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="rounded-md border overflow-auto max-h-[600px]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Deskripsi</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead>Divisi</TableHead>
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Kredit</TableHead>
                          <TableHead className="text-right">Saldo</TableHead>
                          <TableHead>Ref</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entries.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground">
                              Belum ada transaksi di Buku Kas.
                            </TableCell>
                          </TableRow>
                        ) : (
                          entries.map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell>{formatDate(tx.tanggal)}</TableCell>
                              <TableCell className="max-w-[250px] truncate">{tx.deskripsi}</TableCell>
                              <TableCell>
                                <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs">
                                  {tx.kategori}
                                </span>
                              </TableCell>
                              <TableCell>{tx.divisi}</TableCell>
                              <TableCell className="text-right text-green-700">
                                {tx.debit ? formatCurrency(tx.debit) : "-"}
                              </TableCell>
                              <TableCell className="text-right text-red-700">
                                {tx.kredit ? formatCurrency(tx.kredit) : "-"}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(tx.saldo)}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                                {tx.referensi || "-"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── TAB: Rekap ── */}
            <TabsContent value="rekap" className="space-y-4">
              {rekap ? (
                <>
                  {/* Monthly Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Rekap Bulanan</CardTitle>
                      <CardDescription>Ringkasan debit/kredit per bulan</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border overflow-auto max-h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Bulan</TableHead>
                              <TableHead className="text-right">Debit</TableHead>
                              <TableHead className="text-right">Kredit</TableHead>
                              <TableHead className="text-right">Net</TableHead>
                              <TableHead className="text-right">Jumlah Tx</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(rekap.byMonth).length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                  Belum ada data bulanan.
                                </TableCell>
                              </TableRow>
                            ) : (
                              Object.entries(rekap.byMonth)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([month, data]) => (
                                  <TableRow key={month}>
                                    <TableCell className="font-medium">{month}</TableCell>
                                    <TableCell className="text-right text-green-700">
                                      {formatCurrency(data.debit)}
                                    </TableCell>
                                    <TableCell className="text-right text-red-700">
                                      {formatCurrency(data.kredit)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      {formatCurrency(data.debit - data.kredit)}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                      {data.count}
                                    </TableCell>
                                  </TableRow>
                                ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* By Category */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Per Kategori</CardTitle>
                        <CardDescription>Debit & kredit per kategori</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border overflow-auto">
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
                              {Object.entries(rekap.byCategory).length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    Belum ada data.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                Object.entries(rekap.byCategory).map(([cat, data]) => (
                                  <TableRow key={cat}>
                                    <TableCell className="font-medium">{cat}</TableCell>
                                    <TableCell className="text-right text-green-700">
                                      {formatCurrency(data.debit)}
                                    </TableCell>
                                    <TableCell className="text-right text-red-700">
                                      {formatCurrency(data.kredit)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {formatCurrency(data.debit - data.kredit)}
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>

                    {/* By Divisi */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Per Divisi</CardTitle>
                        <CardDescription>Debit & kredit per divisi</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Divisi</TableHead>
                                <TableHead className="text-right">Debit</TableHead>
                                <TableHead className="text-right">Kredit</TableHead>
                                <TableHead className="text-right">Net</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.entries(rekap.byDivisi).length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    Belum ada data.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                Object.entries(rekap.byDivisi).map(([div, data]) => (
                                  <TableRow key={div}>
                                    <TableCell className="font-medium">{div}</TableCell>
                                    <TableCell className="text-right text-green-700">
                                      {formatCurrency(data.debit)}
                                    </TableCell>
                                    <TableCell className="text-right text-red-700">
                                      {formatCurrency(data.kredit)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {formatCurrency(data.debit - data.kredit)}
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Memuat rekap...
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </RoleGate>
    </div>
  );
}
