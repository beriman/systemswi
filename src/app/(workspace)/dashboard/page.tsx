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

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value || 0);
}

function formatDate(date: string): string {
  if (!date || date === "TBA") return "TBA";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function ActionLink({ href, title, detail }: { href: string; title: string; detail: string }) {
  return (
    <Link href={href} className="block rounded-lg border bg-white/70 p-3 transition-colors hover:border-primary/50 hover:bg-white">
      <div className="font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{detail}</div>
    </Link>
  );
}

function QuickLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="block">
      <Card className="hover:border-primary/50 transition-colors">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
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
        <h2 className="text-2xl font-bold">Executive Overview</h2>
        <p className="text-muted-foreground">
          Ringkasan CEO: finance, event Fragrantions, produksi brand, dan next action dari Google Sheets.
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
                {data?.sukukInfo?.nilai || "Rp 1 Juta"} • {data?.sukukInfo?.akad || "Musyarakah"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Operational Snapshot */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-purple-100 bg-purple-50/50">
            <CardHeader>
              <CardTitle className="text-lg">🎉 Events / Fragrantions</CardTitle>
              <CardDescription>Portfolio dan pipeline event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? <Skeleton className="h-24 w-full" /> : (
                <>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-2xl font-bold">{formatNumber(data?.eventSummary?.totalEvents || 0)}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{formatNumber(data?.eventSummary?.upcoming || 0)}</div>
                      <div className="text-xs text-muted-foreground">Upcoming</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{formatNumber(data?.eventSummary?.completed || 0)}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(data?.eventSummary?.latestEvents || []).slice(0, 2).map((event: any) => (
                      <div key={event.id || event.name} className="rounded-lg bg-white/70 p-2 text-sm">
                        <div className="font-medium">{event.name}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(event.startDate)} • {event.venue || "Venue TBA"}</div>
                      </div>
                    ))}
                  </div>
                  <Link href="/events" className="text-sm font-medium text-purple-700 hover:underline">Buka Events →</Link>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-emerald-100 bg-emerald-50/50">
            <CardHeader>
              <CardTitle className="text-lg">🏭 Produksi</CardTitle>
              <CardDescription>Batch, HPP, QC, dan estimasi stok</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? <Skeleton className="h-24 w-full" /> : (
                <>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-2xl font-bold">{formatNumber(data?.brandSummary?.productionQty || 0)}</div>
                      <div className="text-xs text-muted-foreground">Qty</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">{formatNumber(data?.brandSummary?.activeBatches || 0)}</div>
                      <div className="text-xs text-muted-foreground">Batch</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{formatNumber(data?.brandSummary?.stockEstimate || 0)}</div>
                      <div className="text-xs text-muted-foreground">Stock</div>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">HPP rata-rata: </span>
                    <span className="font-semibold">{formatCurrency(data?.brandSummary?.avgHppPerUnit || 0)}</span>
                  </div>
                  <div className="space-y-2">
                    {(data?.brandSummary?.latestBatches || []).slice(0, 2).map((batch: any) => (
                      <div key={`${batch.sku}-${batch.productName}`} className="rounded-lg bg-white/70 p-2 text-sm">
                        <div className="font-medium">{batch.brandName} — {batch.sku || batch.productName}</div>
                        <div className="text-xs text-muted-foreground">{formatNumber(batch.qtyProduced)} unit • {batch.status} • QC {batch.qcStatus}</div>
                      </div>
                    ))}
                  </div>
                  <Link href="/production" className="text-sm font-medium text-emerald-700 hover:underline">Buka Produksi →</Link>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-orange-100 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="text-lg">⚡ Next Actions</CardTitle>
              <CardDescription>Shortcut operasional harian</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ActionLink href="/finance" title="Review finance" detail="Saldo bank dan setoran modal" />
              <ActionLink href="/events" title="Update Fragrantions" detail="Tenant, sponsor, budget, timeline" />
              <ActionLink href="/production" title="Catat batch produksi" detail="Bahan, bottling, packaging, QC" />
              <ActionLink href="/brands" title="Analisa brand" detail="Selling, COGS, expense, profit" />
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <QuickLink href="/finance" title="💰 Finance Detail" description="Keuangan, saham, setoran modal" />
          <QuickLink href="/events" title="🎉 Events" description="Fragrantions portfolio & planning" />
          <QuickLink href="/production" title="🏭 Produksi" description="Batch, HPP, QC, dan stock" />
          <QuickLink href="/inventory" title="📦 Inventory" description="Bahan, packaging, movement, alert" />
          <QuickLink href="/sheets" title="📋 Google Sheets" description="Buka data spreadsheet langsung" />
        </div>
      </RoleGate>

      {/* Debug Info */}
      <div className="text-xs text-muted-foreground">
        Accessible features: {accessibleFeatures.join(", ") || "none"}
      </div>
    </div>
  );
}
