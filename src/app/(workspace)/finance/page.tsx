"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RoleGate } from "@/components/auth/role-gate";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DashboardData {
  bankAccounts: any[];
  totalSaldoAkhir: number;
  shareholders: any[];
  totalModalDasar: number;
  totalModalDitempatkan: number;
  totalSudahSetor: number;
  totalSisaKewajiban: number;
  totalJumlahSaham: number;
  totalSetoranPercent: number;
  sharePrice: number;
  shareholderNotes: string[];
  shareholderDataSource: string;
  sukukInfo: any;
  sukukInvestors: any[];
  totalUnitTerjual: number;
  rekapData: any[];
}

interface FinanceTransaction {
  id: string;
  tanggal: string;
  deskripsi: string;
  debit: number;
  kredit: number;
  kodeAkun: string;
  referensi: string;
  catatan: string;
  divisi: string;
}

interface FinanceReconciliation {
  sourceStatus?: string;
  warning?: string;
  generatedAt?: string;
  summary: {
    status: string;
    bankDelta: number;
    cashNet: number;
    bukuNet: number;
    diffCashVsBank: number;
    diffCashVsBuku: number;
    cashRows: number;
    bukuKasRows: number;
  };
  issues: string[];
  nextActions: string[];
}

interface FinanceCashflowProjection {
  sourceStatus?: string;
  warning?: string;
  generatedAt?: string;
  summary: {
    openingCash: number;
    averageMonthlyInflow: number;
    averageMonthlyOutflow: number;
    averageMonthlyNet: number;
    projectedClosingCash3Months: number;
    runwayMonths: number | null;
    historicalMonths: number;
  };
  projection: Array<{
    month: string;
    label: string;
    projectedInflow: number;
    projectedOutflow: number;
    projectedNet: number;
    projectedClosingCash: number;
    confidence: string;
    note: string;
  }>;
  issues: string[];
  nextActions: string[];
}

function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function FinancePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [reconciliation, setReconciliation] = useState<FinanceReconciliation | null>(null);
  const [cashflowProjection, setCashflowProjection] = useState<FinanceCashflowProjection | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [uploadedProofUrl, setUploadedProofUrl] = useState("");
  const [proofUploadMessage, setProofUploadMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  async function fetchTransactions() {
    const res = await fetch("/api/finance/transactions", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch finance transactions");
    const json = await res.json();
    setTransactions(json.transactions || []);
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashboardRes, reconciliationRes, cashflowRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/finance/reconciliation", { cache: "no-store" }),
          fetch("/api/finance/cashflow", { cache: "no-store" }),
          fetchTransactions(),
        ]);
        if (!dashboardRes.ok) throw new Error("Failed to fetch dashboard");
        const json = await dashboardRes.json();
        setData(json);
        if (reconciliationRes.ok) {
          setReconciliation(await reconciliationRes.json());
        }
        if (cashflowRes.ok) {
          setCashflowProjection(await cashflowRes.json());
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleProofUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadingProof(true);
    setProofUploadMessage(null);
    const formData = new FormData(event.currentTarget);

    try {
      const res = await fetch("/api/finance/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.details || "Gagal upload bukti");
      const proofUrl = json.file?.proofUrl || "";
      setUploadedProofUrl(proofUrl);
      setProofUploadMessage(`✅ Bukti tersimpan di Google Drive: ${json.file?.name || "file"}`);
    } catch (err) {
      setProofUploadMessage(`❌ ${String(err).replace(/^Error:\s*/, "")}`);
    } finally {
      setUploadingProof(false);
    }
  }

  async function handleTransactionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormMessage(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      tanggal: String(form.get("tanggal") || ""),
      jenis: String(form.get("jenis") || "pemasukan"),
      divisi: String(form.get("divisi") || "Holding"),
      kodeAkun: String(form.get("kodeAkun") || ""),
      kategori: String(form.get("kategori") || ""),
      deskripsi: String(form.get("deskripsi") || ""),
      jumlah: Number(form.get("jumlah") || 0),
      sumber: String(form.get("sumber") || "bank"),
      referensi: String(form.get("referensi") || ""),
      proofUrl: String(form.get("proofUrl") || uploadedProofUrl || ""),
      catatan: String(form.get("catatan") || ""),
    };

    try {
      const res = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.details || "Gagal menyimpan transaksi");
      setFormMessage(`✅ Transaksi tersimpan ke ${json.syncedSheets?.join(" + ") || "Google Sheets"}.`);
      event.currentTarget.reset();
      setUploadedProofUrl("");
      await fetchTransactions();
    } catch (err) {
      setFormMessage(`❌ ${String(err).replace(/^Error:\s*/, "")}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">💰 Finance & Equity</h2>
        <p className="text-muted-foreground">
          Data real-time dari Google Sheets — PT Sensasi Wangi Indonesia
        </p>
      </div>

      <RoleGate feature="dashboard:overview">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
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
        ) : data ? (
          <>
            {/* Transaction Input */}
            <Card className="border-emerald-200 bg-emerald-50/40">
              <CardHeader>
                <CardTitle>Input Transaksi + Bukti</CardTitle>
                <CardDescription>
                  Simpan pemasukan/pengeluaran ke Google Sheets Cash_Harian + Buku_Kas. Proof URL dapat diisi dengan link Drive/nota untuk traceability.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <form onSubmit={handleProofUpload} className="rounded-lg border border-dashed bg-background/80 p-4 space-y-3">
                  <div>
                    <h3 className="font-medium">Upload Bukti ke Google Drive Finance</h3>
                    <p className="text-xs text-muted-foreground">
                      PDF/gambar/CSV/XLS/XLSX maksimal 10MB. Setelah upload, URL otomatis dipakai sebagai Proof URL transaksi berikutnya dan dicatat ke SWI Memory Log.
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="proof-file">File Bukti</Label>
                      <Input id="proof-file" name="file" type="file" accept="image/*,.pdf,.csv,.xls,.xlsx" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="proof-referensi">Referensi</Label>
                      <Input id="proof-referensi" name="referensi" placeholder="INV/mutasi/nota" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="proof-deskripsi">Deskripsi</Label>
                      <Input id="proof-deskripsi" name="deskripsi" placeholder="Bukti transaksi" />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" variant="outline" disabled={uploadingProof}>{uploadingProof ? "Mengupload..." : "Upload Bukti"}</Button>
                    {proofUploadMessage && <p className="text-sm text-muted-foreground">{proofUploadMessage}</p>}
                    {uploadedProofUrl && (
                      <a className="text-sm text-emerald-700 underline" href={uploadedProofUrl} target="_blank" rel="noreferrer">
                        Buka proof URL
                      </a>
                    )}
                  </div>
                </form>

                <form onSubmit={handleTransactionSubmit} className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="tanggal">Tanggal</Label>
                    <Input id="tanggal" name="tanggal" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jenis">Jenis</Label>
                    <select id="jenis" name="jenis" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                      <option value="pemasukan">Pemasukan</option>
                      <option value="pengeluaran">Pengeluaran</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="divisi">Divisi</Label>
                    <select id="divisi" name="divisi" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                      <option>Holding</option>
                      <option>Produksi</option>
                      <option>Store</option>
                      <option>Event</option>
                      <option>Ecommerse</option>
                      <option>Digital</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jumlah">Jumlah (Rp)</Label>
                    <Input id="jumlah" name="jumlah" type="number" min="1" step="1" placeholder="250000" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kodeAkun">Kode Akun</Label>
                    <Input id="kodeAkun" name="kodeAkun" placeholder="401 / 501" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kategori">Kategori</Label>
                    <Input id="kategori" name="kategori" placeholder="Penjualan / Operasional" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sumber">Sumber</Label>
                    <Input id="sumber" name="sumber" placeholder="bank / cash / qris" defaultValue="bank" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referensi">Referensi</Label>
                    <Input id="referensi" name="referensi" placeholder="INV-2026-001 / mutasi" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="deskripsi">Deskripsi</Label>
                    <Input id="deskripsi" name="deskripsi" placeholder="Contoh: DP tenant Fragrantions" required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="proofUrl">Proof URL</Label>
                    <Input
                      id="proofUrl"
                      name="proofUrl"
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={uploadedProofUrl}
                      onChange={(event) => setUploadedProofUrl(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-4">
                    <Label htmlFor="catatan">Catatan Audit</Label>
                    <Textarea id="catatan" name="catatan" placeholder="Catatan approval, PIC, atau konteks transaksi" />
                  </div>
                  <div className="md:col-span-4 flex items-center gap-3">
                    <Button type="submit" disabled={submitting}>{submitting ? "Menyimpan..." : "Simpan Transaksi"}</Button>
                    {formMessage && <p className="text-sm text-muted-foreground">{formMessage}</p>}
                  </div>
                </form>

                <div className="rounded-md border bg-background overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Divisi</TableHead>
                        <TableHead className="text-right">Masuk</TableHead>
                        <TableHead className="text-right">Keluar</TableHead>
                        <TableHead>Proof/Ref</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Belum ada transaksi terbaru dari Cash_Harian.</TableCell></TableRow>
                      ) : transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>{tx.tanggal}</TableCell>
                          <TableCell className="max-w-[280px] truncate">{tx.deskripsi}</TableCell>
                          <TableCell>{tx.divisi}</TableCell>
                          <TableCell className="text-right text-green-700">{tx.debit ? formatCurrency(tx.debit) : "-"}</TableCell>
                          <TableCell className="text-right text-red-700">{tx.kredit ? formatCurrency(tx.kredit) : "-"}</TableCell>
                          <TableCell className="max-w-[240px] truncate text-xs">{tx.referensi || tx.catatan || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Bank Reconciliation */}
            <Card className="border-blue-200 bg-blue-50/40">
              <CardHeader>
                <CardTitle>Rekonsiliasi Bank Mingguan</CardTitle>
                <CardDescription>
                  Membandingkan Rekening_Koran, Cash_Harian, dan Buku_Kas. Selisih wajib dicek dengan PDF mutasi sebelum QA saldo kas ditandai selesai.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {reconciliation ? (
                  <>
                    {reconciliation.sourceStatus === "degraded" && (
                      <div className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                        ⚠️ {reconciliation.warning || "Google Workspace OAuth degraded; rekonsiliasi live belum bisa dihitung."}
                      </div>
                    )}
                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="rounded-lg border bg-background p-3">
                        <div className="text-xs text-muted-foreground">Status</div>
                        <div className={`text-lg font-bold ${reconciliation.summary.status === "reconciled" ? "text-green-700" : "text-orange-700"}`}>
                          {reconciliation.summary.status === "reconciled" ? "Reconciled" : "Needs Review"}
                        </div>
                      </div>
                      <div className="rounded-lg border bg-background p-3">
                        <div className="text-xs text-muted-foreground">Delta Bank</div>
                        <div className="text-lg font-bold">{formatCurrency(reconciliation.summary.bankDelta)}</div>
                      </div>
                      <div className="rounded-lg border bg-background p-3">
                        <div className="text-xs text-muted-foreground">Net Cash_Harian</div>
                        <div className="text-lg font-bold">{formatCurrency(reconciliation.summary.cashNet)}</div>
                      </div>
                      <div className="rounded-lg border bg-background p-3">
                        <div className="text-xs text-muted-foreground">Selisih Cash vs Bank</div>
                        <div className="text-lg font-bold text-orange-700">{formatCurrency(reconciliation.summary.diffCashVsBank)}</div>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border bg-background p-3 text-sm">
                        <div className="font-medium">Temuan</div>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                          {reconciliation.issues.map((issue, index) => <li key={index}>{issue}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-lg border bg-background p-3 text-sm">
                        <div className="font-medium">Next action</div>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                          {reconciliation.nextActions.map((action, index) => <li key={index}>{action}</li>)}
                        </ul>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Memuat rekonsiliasi bank...</div>
                )}
              </CardContent>
            </Card>

            {/* Cashflow Projection */}
            <Card className="border-purple-200 bg-purple-50/40">
              <CardHeader>
                <CardTitle>Proyeksi Cashflow 3 Bulan</CardTitle>
                <CardDescription>
                  Draft proyeksi berbasis Cash_Harian + saldo Rekening_Koran. Angka ini bukan pengganti review mutasi bank dan forecast operator.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cashflowProjection ? (
                  <>
                    {cashflowProjection.sourceStatus === "degraded" && (
                      <div className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                        ⚠️ {cashflowProjection.warning || "Google Workspace OAuth degraded; proyeksi live belum bisa dihitung."}
                      </div>
                    )}
                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="rounded-lg border bg-background p-3">
                        <div className="text-xs text-muted-foreground">Saldo awal bank</div>
                        <div className="text-lg font-bold">{formatCurrency(cashflowProjection.summary.openingCash)}</div>
                      </div>
                      <div className="rounded-lg border bg-background p-3">
                        <div className="text-xs text-muted-foreground">Rata-rata masuk/bulan</div>
                        <div className="text-lg font-bold text-green-700">{formatCurrency(cashflowProjection.summary.averageMonthlyInflow)}</div>
                      </div>
                      <div className="rounded-lg border bg-background p-3">
                        <div className="text-xs text-muted-foreground">Rata-rata keluar/bulan</div>
                        <div className="text-lg font-bold text-red-700">{formatCurrency(cashflowProjection.summary.averageMonthlyOutflow)}</div>
                      </div>
                      <div className="rounded-lg border bg-background p-3">
                        <div className="text-xs text-muted-foreground">Runway estimasi</div>
                        <div className="text-lg font-bold">
                          {cashflowProjection.summary.runwayMonths === null ? "TBA" : `${cashflowProjection.summary.runwayMonths} bulan`}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-md border bg-background overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Bulan</TableHead>
                            <TableHead className="text-right">Masuk</TableHead>
                            <TableHead className="text-right">Keluar</TableHead>
                            <TableHead className="text-right">Net</TableHead>
                            <TableHead className="text-right">Saldo akhir</TableHead>
                            <TableHead>Confidence</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cashflowProjection.projection.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Proyeksi belum tersedia sampai Google OAuth live kembali.</TableCell></TableRow>
                          ) : cashflowProjection.projection.map((month) => (
                            <TableRow key={month.month}>
                              <TableCell className="font-medium">{month.label}</TableCell>
                              <TableCell className="text-right text-green-700">{formatCurrency(month.projectedInflow)}</TableCell>
                              <TableCell className="text-right text-red-700">{formatCurrency(month.projectedOutflow)}</TableCell>
                              <TableCell className={`text-right font-medium ${month.projectedNet >= 0 ? "text-green-700" : "text-red-700"}`}>{formatCurrency(month.projectedNet)}</TableCell>
                              <TableCell className="text-right font-bold">{formatCurrency(month.projectedClosingCash)}</TableCell>
                              <TableCell><span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700">{month.confidence}</span></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border bg-background p-3 text-sm">
                        <div className="font-medium">Catatan risiko</div>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                          {cashflowProjection.issues.map((issue, index) => <li key={index}>{issue}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-lg border bg-background p-3 text-sm">
                        <div className="font-medium">Next action</div>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                          {cashflowProjection.nextActions.map((action, index) => <li key={index}>{action}</li>)}
                        </ul>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Memuat proyeksi cashflow...</div>
                )}
              </CardContent>
            </Card>

            {/* Bank Accounts */}
            <Card>
              <CardHeader>
                <CardTitle>Saldo Rekening Bank</CardTitle>
                <CardDescription>Data dari Rekening Koran — Google Sheets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {data.bankAccounts.map((acc, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">{acc.bank} — {acc.nama}</div>
                      <div className="text-xs text-muted-foreground font-mono">{acc.noRek}</div>
                      <div className="text-2xl font-bold mt-2">{acc.saldoAkhir}</div>
                      <div className="text-xs text-muted-foreground">Saldo Awal: {acc.saldoAwal}</div>
                    </div>
                  ))}
                  <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
                    <div className="text-sm font-medium text-primary">Total Saldo</div>
                    <div className="text-2xl font-bold mt-2">{formatCurrency(data.totalSaldoAkhir)}</div>
                    <div className="text-xs text-muted-foreground">{data.bankAccounts.length} rekening aktif</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Founder Equity & Debt Monitor */}
            <Card>
              <CardHeader>
                <CardTitle>👑 Founder Equity & Debt Monitor</CardTitle>
                <CardDescription>
                  Berdasarkan Akta Pendirian PT Sensasi Wangi Indonesia — Modal Dasar: {formatCurrency(data.totalModalDasar || 1000000000)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Summary Bar */}
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <div className="text-xs text-muted-foreground">Modal Dasar (Authorized)</div>
                    <div className="text-xl font-bold">{formatCurrency(data.totalModalDasar || 1000000000)}</div>
                    <div className="text-xs text-muted-foreground">10.000 saham × {formatCurrency(data.sharePrice || 100000)}</div>
                  </div>
                  <div className="p-4 border rounded-lg bg-green-50">
                    <div className="text-xs text-muted-foreground">Modal Ditempatkan (Issued)</div>
                    <div className="text-xl font-bold">{formatCurrency(data.totalModalDitempatkan)}</div>
                    <div className="text-xs text-muted-foreground">{data.totalJumlahSaham.toLocaleString("id-ID")} saham × {formatCurrency(data.sharePrice || 100000)}</div>
                  </div>
                  <div className="p-4 border rounded-lg bg-purple-50">
                    <div className="text-xs text-muted-foreground">Sudah Disetor (Paid-up)</div>
                    <div className="text-xl font-bold">{formatCurrency(data.totalSudahSetor)}</div>
                    <div className="text-xs text-muted-foreground">{data.totalSetoranPercent.toFixed(1)}% dari modal ditempatkan</div>
                  </div>
                  <div className="p-4 border rounded-lg bg-red-50">
                    <div className="text-xs text-muted-foreground">Sisa Kewajiban</div>
                    <div className="text-xl font-bold text-red-700">{formatCurrency(data.totalSisaKewajiban)}</div>
                    <div className="text-xs text-muted-foreground">Belum disetor oleh pemegang saham</div>
                  </div>
                </div>

                {/* Progress: Setoran vs Ditempatkan */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress Setoran</span>
                    <span className="font-medium">{data.totalSetoranPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(data.totalSetoranPercent, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Rp 0</span>
                    <span>Target: {formatCurrency(data.totalModalDitempatkan)}</span>
                  </div>
                </div>

                {/* Founder Details Table */}
                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Founder</TableHead>
                        <TableHead className="text-right">Saham</TableHead>
                        <TableHead className="text-right">Kewajiban</TableHead>
                        <TableHead className="text-right">Disetor</TableHead>
                        <TableHead className="text-right">Hutang (Sisa)</TableHead>
                        <TableHead className="text-right">Progress</TableHead>
                        <TableHead>% Kepemilikan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.shareholders.map((sh, i) => {
                        const sisa = sh.sisaKewajiban ?? Math.max(sh.kewajiban - sh.sudahSetor, 0);
                        const progress = sh.progress;
                        return (
                          <TableRow key={i}>
                            <TableCell>
                              <div className="font-medium">{sh.nama}</div>
                              <div className="text-xs text-muted-foreground">{sh.jumlahSaham} saham</div>
                            </TableCell>
                            <TableCell className="text-right">{sh.jumlahSaham}</TableCell>
                            <TableCell className="text-right">{formatCurrency(sh.kewajiban)}</TableCell>
                            <TableCell className="text-right text-green-600 font-medium">{formatCurrency(sh.sudahSetor)}</TableCell>
                            <TableCell className="text-right text-red-600 font-bold">{formatCurrency(sisa)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-2">
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${progress >= 100 ? "bg-green-500" : progress >= 50 ? "bg-blue-500" : "bg-yellow-500"}`}
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium">{progress.toFixed(1)}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">{sh.persen}</TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-muted font-bold">
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-right">{data.totalJumlahSaham.toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-right">{formatCurrency(data.totalModalDitempatkan)}</TableCell>
                        <TableCell className="text-right text-green-600">{formatCurrency(data.totalSudahSetor)}</TableCell>
                        <TableCell className="text-right text-red-600">{formatCurrency(data.totalSisaKewajiban)}</TableCell>
                        <TableCell className="text-right">{data.totalSetoranPercent.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">100%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Breakdown Catatan */}
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                  <p className="font-medium text-yellow-800 mb-1">📝 Catatan Perhitungan</p>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    {data.shareholderNotes?.length ? (
                      data.shareholderNotes.map((note, index) => <li key={index}>• {note.replace(/^\d+\.\s*/, "")}</li>)
                    ) : (
                      <>
                        <li>• Gaji Beriman & Wapiq Rp 500.000/bulan dibayarkan dengan mengurangi hutang saham</li>
                        <li>• Malsiaf tidak memperoleh gaji</li>
                      </>
                    )}
                    <li>• Sumber data: {data.shareholderDataSource || "Google Sheets PemegangSaham"}</li>
                    <li>• Saldo bank tidak sama dengan setoran modal; setoran gaji dicatat sebagai pengurangan hutang saham, bukan transaksi bank.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Shareholders / Equity */}
            <Card>
              <CardHeader>
                <CardTitle>Pemegang Saham & Modal</CardTitle>
                <CardDescription>
                  Modal Dasar: Rp 1.000.000.000 | Modal Ditempatkan: {formatCurrency(data.totalModalDitempatkan)} | Terkumpul: {formatCurrency(data.totalSudahSetor)} ({data.totalSetoranPercent.toFixed(1)}%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {data.shareholders.map((sh, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{sh.nama}</h4>
                          <span className="text-xs text-muted-foreground">{sh.persen} • {sh.jumlahSaham} saham</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${sh.progress >= 100 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {sh.progress.toFixed(1)}%
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Kewajiban:</span>
                          <span>{formatCurrency(sh.kewajiban)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Disetor:</span>
                          <span className="text-green-600">{formatCurrency(sh.sudahSetor)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1">
                          <span className="font-medium">Sisa:</span>
                          <span className="font-bold text-red-600">{formatCurrency(sh.sisaKewajiban ?? Math.max(sh.kewajiban - sh.sudahSetor, 0))}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${Math.min(sh.progress, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sukuk */}
            <Card>
              <CardHeader>
                <CardTitle>Info Sukuk</CardTitle>
                <CardDescription>
                  {data.sukukInfo?.akad || "Musyarakah"} • Status: {data.sukukInfo?.status || "Perencanaan"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-3 border rounded">
                    <div className="text-xs text-muted-foreground">Nilai Sukuk</div>
                    <div className="font-bold">{data.sukukInfo?.nilai || "Rp 1.000.000.000"}</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="text-xs text-muted-foreground">Nisbah</div>
                    <div className="font-bold">{data.sukukInfo?.nisbah || "50:50"}</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="text-xs text-muted-foreground">Yield Estimasi</div>
                    <div className="font-bold">{data.sukukInfo?.yield || "8-12% p.a."}</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="text-xs text-muted-foreground">Unit Terjual</div>
                    <div className="font-bold">{data.totalUnitTerjual} / 1,000</div>
                  </div>
                </div>

                {data.sukukInvestors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Investor Sukuk</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No</TableHead>
                          <TableHead>Nama</TableHead>
                          <TableHead>Jenis</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Nominal</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.sukukInvestors.map((inv, i) => (
                          <TableRow key={i}>
                            <TableCell>{inv.no}</TableCell>
                            <TableCell>{inv.nama}</TableCell>
                            <TableCell>{inv.jenis}</TableCell>
                            <TableCell>{inv.unit}</TableCell>
                            <TableCell>{formatCurrency(inv.nominal)}</TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-1 rounded ${inv.status === "Aktif" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                                {inv.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rekap Rekening 8 Bulan */}
            {data.rekapData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Rekap Rekening Koran</CardTitle>
                  <CardDescription>8 bulan terakhir — dari Google Sheets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bulan</TableHead>
                          <TableHead>Akun</TableHead>
                          <TableHead>Periode</TableHead>
                          <TableHead className="text-right">Saldo Awal</TableHead>
                          <TableHead className="text-right">Masuk</TableHead>
                          <TableHead className="text-right">Keluar</TableHead>
                          <TableHead className="text-right">Saldo Akhir</TableHead>
                          <TableHead>Txns</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.rekapData.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{row.bulan}</TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-1 rounded ${row.akun === "Holding" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                                {row.akun}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs">{row.periode}</TableCell>
                            <TableCell className="text-right text-xs">{row.saldoAwal}</TableCell>
                            <TableCell className="text-right text-green-600 text-xs">{row.totalMasuk}</TableCell>
                            <TableCell className="text-right text-red-600 text-xs">{row.totalKeluar}</TableCell>
                            <TableCell className="text-right font-medium text-xs">{row.saldoAkhir}</TableCell>
                            <TableCell className="text-xs">{row.jTxns}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </RoleGate>
    </div>
  );
}
