"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RoleGate } from "@/components/auth/role-gate";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DashboardData {
  bankAccounts: any[];
  totalSaldoAkhir: number;
  shareholders: any[];
  totalModalDitempatkan: number;
  totalSudahSetor: number;
  totalSetoranPercent: number;
  sukukInfo: any;
  sukukInvestors: any[];
  totalUnitTerjual: number;
  rekapData: any[];
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
                          <span className="font-bold text-red-600">{formatCurrency(sh.kewajiban - sh.sudahSetor)}</span>
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
