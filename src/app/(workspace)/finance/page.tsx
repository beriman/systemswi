"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleGate } from "@/components/auth/role-gate";
import { Skeleton } from "@/components/ui/skeleton";

interface BankData {
  headers: string[];
  rows: string[][];
  totalMonths: number;
}

interface DashboardData {
  investors: number;
  sukuk: number;
  pemasukan: number;
  pengeluaran: number;
  netCashflow: number;
  bankData: BankData | null;
}

function formatCurrency(amount: number): string {
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
          Monitoring kesehatan keuangan PT Sensasi Wangi Indonesia
        </p>
      </div>

      <RoleGate feature="dashboard:overview">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center text-destructive">
              <p>Gagal memuat data: {error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Pastikan Google Sheets terhubung dan API route aktif.
              </p>
            </CardContent>
          </Card>
        ) : data ? (
          <>
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    Total Pemasukan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(data.pemasukan)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    Total Pengeluaran
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(data.pengeluaran)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    Net Cashflow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${data.netCashflow >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(data.netCashflow)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    Investor Aktif
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.investors}</div>
                </CardContent>
              </Card>
            </div>

            {/* Bank Data from Google Sheets */}
            {data.bankData && (
              <Card>
                <CardHeader>
                  <CardTitle>Rekap Rekening (dari Google Sheets)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          {data.bankData.headers.map((h, i) => (
                            <th key={i} className="text-left p-2 font-medium">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.bankData.rows.slice(0, 10).map((row, i) => (
                          <tr key={i} className="border-b hover:bg-muted/50">
                            {row.map((cell, j) => (
                              <td key={j} className="p-2">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Equity Section */}
            <Card>
              <CardHeader>
                <CardTitle>Founder Equity & Debt Monitor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { name: "Beriman Juliano", share: 34, role: "CEO", commited: 340000000, paid: 50000000 },
                    { name: "Wapiq Rizya", share: 33, role: "COO", commited: 330000000, paid: 30000000 },
                    { name: "Muhamad Malsiaf", share: 33, role: "CFO", commited: 330000000, paid: 30000000 },
                  ].map((founder) => {
                    const debt = founder.commited - founder.paid;
                    const progress = (founder.paid / founder.commited) * 100;
                    return (
                      <div key={founder.name} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{founder.name}</h4>
                            <span className="text-xs text-muted-foreground">
                              {founder.role} • {founder.share}%
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${debt > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                            {debt > 0 ? "Belum Lunas" : "Lunas"}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Komitmen:</span>
                            <span>{formatCurrency(founder.commited)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Disetor:</span>
                            <span className="text-green-600">{formatCurrency(founder.paid)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="font-medium">Hutang:</span>
                            <span className="font-bold text-red-600">{formatCurrency(debt)}</span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          <p className="text-xs text-right mt-1 text-muted-foreground">{progress.toFixed(1)}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </RoleGate>
    </div>
  );
}
