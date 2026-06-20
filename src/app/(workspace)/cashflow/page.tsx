"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp, TrendingDown, AlertTriangle, DollarSign,
  Plus, RefreshCw, Calendar
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CashflowForecast = {
  month: string;
  label: string;
  pemasukan: number;
  pengeluaran: number;
  net: number;
  transaksi: number;
};

type CashflowProjection = {
  month: string;
  label: string;
  projectedInflow: number;
  projectedOutflow: number;
  projectedNet: number;
  projectedClosingCash: number;
  confidence: string;
  note: string;
};

type CashflowData = {
  source: string;
  sourceStatus: string;
  summary: {
    openingCash: number;
    averageMonthlyInflow: number;
    averageMonthlyOutflow: number;
    averageMonthlyNet: number;
    projectedClosingCash3Months: number;
    runwayMonths: number | null;
    historicalMonths: number;
  };
  actualMonths: CashflowForecast[];
  projection: CashflowProjection[];
  issues: string[];
  nextActions: string[];
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);

export default function CashflowPage() {
  const [data, setData] = useState<CashflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCashflow = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/finance/cashflow", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal load cashflow");
      setData(json);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCashflow(); }, [loadCashflow]);

  const stats = useMemo(() => {
    if (!data?.summary) return null;
    const s = data.summary;
    return {
      openingCash: s.openingCash,
      avgInflow: s.averageMonthlyInflow,
      avgOutflow: s.averageMonthlyOutflow,
      avgNet: s.averageMonthlyNet,
      projectedClosing: s.projectedClosingCash3Months,
      runway: s.runwayMonths,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Cashflow
          </h2>
          <p className="text-muted-foreground">
            Forecast vs Actual cashflow tracking — source of truth Google Sheets
          </p>
        </div>
        <Button variant="outline" onClick={loadCashflow} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Issues */}
      {data?.issues && data.issues.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              {data.issues.map((issue, i) => <p key={i}>{issue}</p>)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Saldo Bank Awal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatRupiah(stats.openingCash)}</div>
              <div className="text-xs text-muted-foreground">Rekening Koran</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" /> Rata-rata Pemasukan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatRupiah(stats.avgInflow)}</div>
              <div className="text-xs text-muted-foreground">per bulan</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-red-600" /> Rata-rata Pengeluaran
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatRupiah(stats.avgOutflow)}</div>
              <div className="text-xs text-muted-foreground">per bulan</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Runway
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.runway !== null ? `${stats.runway} bulan` : "N/A"}
              </div>
              <div className="text-xs text-muted-foreground">estimasi berdasarkan rata-rata outflow</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="comparison">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="comparison">Forecast vs Actual</TabsTrigger>
          <TabsTrigger value="projection">Proyeksi 3 Bulan</TabsTrigger>
          <TabsTrigger value="history">Histori</TabsTrigger>
        </TabsList>

        {/* Forecast vs Actual */}
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Forecast vs Actual</CardTitle>
              <CardDescription>Perbandingan forecast dan actual cashflow per bulan</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : !data?.actualMonths.length ? (
                <div className="text-center py-8 text-muted-foreground">Belum ada data histori cashflow.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bulan</TableHead>
                      <TableHead className="text-right">Pemasukan</TableHead>
                      <TableHead className="text-right">Pengeluaran</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                      <TableHead className="text-right">Transaksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.actualMonths.map((m) => (
                      <TableRow key={m.month}>
                        <TableCell className="font-medium">{m.label}</TableCell>
                        <TableCell className="text-right text-green-600">{formatRupiah(m.pemasukan)}</TableCell>
                        <TableCell className="text-right text-red-600">{formatRupiah(m.pengeluaran)}</TableCell>
                        <TableCell className={`text-right font-medium ${m.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatRupiah(m.net)}
                        </TableCell>
                        <TableCell className="text-right">{m.transaksi}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projection */}
        <TabsContent value="projection">
          <Card>
            <CardHeader>
              <CardTitle>Proyeksi 3 Bulan ke Depan</CardTitle>
              <CardDescription>
                Proyeksi berbasis rata-rata historis — perlu review manual sebelum dipakai keputusan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : !data?.projection.length ? (
                <div className="text-center py-8 text-muted-foreground">Belum ada proyeksi tersedia.</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {data.projection.map((p) => (
                      <Card key={p.month} className={p.projectedNet >= 0 ? "border-green-200" : "border-red-200"}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{p.label}</CardTitle>
                          <Badge variant={p.confidence === "medium" ? "default" : "secondary"} className="w-fit">
                            {p.confidence === "medium" ? "Confidence: Medium" : "Confidence: Low"}
                          </Badge>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Inflow:</span>
                            <span className="text-green-600">{formatRupiah(p.projectedInflow)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Outflow:</span>
                            <span className="text-red-600">{formatRupiah(p.projectedOutflow)}</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span>Closing Cash:</span>
                            <span className={p.projectedClosingCash >= 0 ? "text-green-600" : "text-red-600"}>
                              {formatRupiah(p.projectedClosingCash)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="py-3 text-sm text-blue-800">
                      <strong>Catatan:</strong> {data.projection[0]?.note || "Proyeksi berbasis data historis dan perlu verifikasi manual."}
                    </CardContent>
                  </Card>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Next Actions</CardTitle>
              <CardDescription>Item yang perlu ditindaklanjuti berdasarkan analisis cashflow</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.nextActions && data.nextActions.length > 0 ? (
                <div className="space-y-3">
                  {data.nextActions.map((action, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-sm">{action}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Tidak ada action items.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
