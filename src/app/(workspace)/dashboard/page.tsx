"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleGate } from "@/components/auth/role-gate";
import { Skeleton } from "@/components/ui/skeleton";

function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardPage() {
  const { accessibleFeatures } = usePermissions();
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
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground">
          Welcome to System SWI Dashboard — Data dari Google Sheets
        </p>
      </div>

      {/* KPI Cards */}
      <RoleGate feature="dashboard:overview">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Saldo Bank</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-32" /> : (
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data?.totalSaldoAkhir || 0)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {data?.bankAccounts?.length || 0} rekening aktif
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Modal Terkumpul</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-32" /> : (
                <div className="text-2xl font-bold">
                  {formatCurrency(data?.totalSudahSetor || 0)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                dari {formatCurrency(data?.totalModalDitempatkan || 250000000)} ({data?.totalSetoranPercent?.toFixed(1) || 0}%)
              </p>
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
              <p className="text-xs text-muted-foreground mt-1">
                2,500 saham ditempatkan
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Sukuk</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-32" /> : (
                <div className="text-2xl font-bold">
                  {data?.sukukInfo?.status || "Perencanaan"}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {data?.sukukInfo?.nilai || "Rp 1M"} • {data?.sukukInfo?.akad || "Musyarakah"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bank Accounts Detail */}
        {data?.bankAccounts?.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.bankAccounts.map((acc: any, i: number) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{acc.bank} — {acc.nama}</CardTitle>
                  <CardDescription className="font-mono text-xs">{acc.noRek}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{acc.saldoAkhir}</div>
                  <p className="text-xs text-muted-foreground">Saldo Awal: {acc.saldoAwal}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/finance" className="block">
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-lg">💰 Finance Detail</CardTitle>
                <CardDescription>Lihat detail keuangan lengkap</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/sheets" className="block">
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-lg">📋 Google Sheets</CardTitle>
                <CardDescription>Buka data spreadsheet langsung</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/reports" className="block">
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-lg">📈 Reports</CardTitle>
                <CardDescription>Laporan pajak, BPJS, legal</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </RoleGate>

      {/* Debug Info */}
      <div className="text-xs text-muted-foreground">
        Accessible features: {accessibleFeatures.join(", ") || "none"}
      </div>
    </div>
  );
}
