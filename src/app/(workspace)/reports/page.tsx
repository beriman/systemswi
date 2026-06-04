"use client";

import { useState, useEffect } from "react";
import { RoleGate } from "@/components/auth/role-gate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">📊 Reports & Financial</h2>
        <p className="text-muted-foreground">Data real-time dari Google Sheets</p>
      </div>

      <RoleGate feature="dashboard">
        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rekap">Rekap Rekening</TabsTrigger>
            <TabsTrigger value="equity">Equity</TabsTrigger>
            <TabsTrigger value="sukuk">Sukuk</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Saldo Bank</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-8 w-32" /> : (
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(data?.totalSaldoAkhir || 0)}</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Modal Terkumpul</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-8 w-32" /> : (
                    <div className="text-2xl font-bold">{formatCurrency(data?.totalSudahSetor || 0)}</div>
                  )}
                  <p className="text-xs text-muted-foreground">{data?.totalSetoranPercent?.toFixed(1) || 0}% dari target</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Pemegang Saham</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-8 w-16" /> : (
                    <div className="text-2xl font-bold">{data?.shareholders?.length || 3}</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Sukuk</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-8 w-24" /> : (
                    <div className="text-2xl font-bold">{data?.sukukInfo?.status || "Perencanaan"}</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rekap" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Rekap Rekening Koran</CardTitle>
                <CardDescription>Data 8 bulan terakhir dari Google Sheets</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : data?.rekapData?.length > 0 ? (
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.rekapData.map((row: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{row.bulan}</TableCell>
                            <TableCell>{row.akun}</TableCell>
                            <TableCell className="text-xs">{row.periode}</TableCell>
                            <TableCell className="text-right text-xs">{row.saldoAwal}</TableCell>
                            <TableCell className="text-right text-green-600 text-xs">{row.totalMasuk}</TableCell>
                            <TableCell className="text-right text-red-600 text-xs">{row.totalKeluar}</TableCell>
                            <TableCell className="text-right font-medium text-xs">{row.saldoAkhir}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Tidak ada data rekap rekening</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pemegang Saham</CardTitle>
                <CardDescription>
                  Modal Dasar: Rp 1.000.000.000 | Ditempatkan: {formatCurrency(data?.totalModalDitempatkan || 250000000)} | Terkumpul: {formatCurrency(data?.totalSudahSetor || 40095000)} ({data?.totalSetoranPercent?.toFixed(1) || 16}%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-3">
                    {data?.shareholders?.map((sh: any, i: number) => (
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
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(sh.progress, 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sukuk" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Info Sukuk</CardTitle>
                <CardDescription>Status: {data?.sukukInfo?.status || "Perencanaan"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-3 border rounded">
                    <div className="text-xs text-muted-foreground">Nilai Sukuk</div>
                    <div className="font-bold">{data?.sukukInfo?.nilai || "Rp 1.000.000.000"}</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="text-xs text-muted-foreground">Akad</div>
                    <div className="font-bold">{data?.sukukInfo?.akad || "Musyarakah"}</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="text-xs text-muted-foreground">Nisbah</div>
                    <div className="font-bold">{data?.sukukInfo?.nisbah || "50:50"}</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="text-xs text-muted-foreground">Yield</div>
                    <div className="font-bold">{data?.sukukInfo?.yield || "8-12% p.a."}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </RoleGate>
    </div>
  );
}
