"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleGate } from "@/components/auth/role-gate";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

      {data?.sourceStatus === "degraded" && (
        <Card className="border-amber-200 bg-amber-50 text-amber-950">
          <CardContent className="pt-6">
            <div className="font-semibold">⚠️ Google Workspace perlu re-auth</div>
            <p className="text-sm">
              Dashboard sedang menampilkan empty read-only fallback, bukan data palsu. {data.warning}
            </p>
          </CardContent>
        </Card>
      )}

      <RoleGate feature="dashboard:overview">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">📊 Overview</TabsTrigger>
            <TabsTrigger value="divisi">🏢 Per Divisi</TabsTrigger>
            <TabsTrigger value="brands">🏷️ Brand Tracker</TabsTrigger>
            <TabsTrigger value="cashflow">💰 Cashflow</TabsTrigger>
            <TabsTrigger value="quicklinks">⚡ Quick Links</TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ── */}
          <TabsContent value="overview" className="space-y-4">
            {/* Divisi Quick Summary */}
            {data?.divisiFinancials && (
              <div className="grid gap-3 md:grid-cols-3">
                {Object.entries(data.divisiFinancials).map(([divisi, d]: [string, any]) => {
                  const colors: Record<string, string> = { "Produksi": "bg-green-50 border-green-200", "Website": "bg-blue-50 border-blue-200", "Event": "bg-purple-50 border-purple-200" };
                  const icons: Record<string, string> = { "Produksi": "🏭", "Website": "💻", "Event": "🎪" };
                  return (
                    <Card key={divisi} className={`border ${colors[divisi] || ""}`}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{icons[divisi]} Divisi {divisi}</span>
                          <span className={`text-xs font-semibold ${d.labaBersih >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {d.marginLaba.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-lg font-bold">{formatCurrency(d.omzet)}</div>
                        <div className="text-xs text-muted-foreground">Laba: <span className={d.labaBersih >= 0 ? "text-green-600" : "text-red-600"}>{formatCurrency(d.labaBersih)}</span></div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            {/* KPI Cards */}
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
                    dari {formatCurrency(data?.totalModalDitempatkan || 0)} ({data?.totalSetoranPercent?.toFixed(1) || 0}%)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Pemegang Saham</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-8 w-16" /> : (
                    <div className="text-2xl font-bold">{data?.shareholders?.length || 0}</div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatNumber(data?.totalJumlahSaham || 0)} saham ditempatkan
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
                      {/* RTF 2 Highlight */}
                      {(data?.eventSummary?.totalBudget || 0) > 0 && (
                        <div className="rounded-lg bg-gradient-to-r from-purple-100 to-pink-50 border border-purple-200 p-3">
                          <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide">🎉 Road to Fragrantions Vol. 2</div>
                          <div className="mt-1.5 grid grid-cols-3 gap-2 text-center">
                            <div>
                              <div className="text-sm font-bold text-purple-800">{formatCurrency(data.eventSummary.totalBudget)}</div>
                              <div className="text-[10px] text-muted-foreground">Budget</div>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-orange-600">{formatCurrency(data.eventSummary.totalCost)}</div>
                              <div className="text-[10px] text-muted-foreground">Actual</div>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-green-600">{formatCurrency(data.eventSummary.totalRevenue - data.eventSummary.totalCost)}</div>
                              <div className="text-[10px] text-muted-foreground">Net</div>
                            </div>
                          </div>
                          <div className="mt-1.5 text-[10px] text-muted-foreground">Jul 4-5 2026 • Promenade TIM • 42 Tenants</div>
                        </div>
                      )}
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
                  <CardDescription>Shortcut operasional harian per divisi</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-[10px] font-semibold text-emerald-600 uppercase mb-1">Produksi</div>
                    <div className="space-y-1">
                      <ActionLink href="/production" title="Catat batch" detail="Bahan, bottling, packaging, QC" />
                      <ActionLink href="/inventory" title="Restock alert" detail="Bahan, packaging, merch" />
                      <ActionLink href="/procurement" title="Buat PO" detail="Supplier, receiving QC" />
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-purple-600 uppercase mb-1">Event</div>
                    <div className="space-y-1">
                      <ActionLink href="/events" title="Update Fragrantions" detail="Tenant, sponsor, budget" />
                      <ActionLink href="/crm" title="CRM pipeline" detail="Tenant & sponsor follow-up" />
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-blue-600 uppercase mb-1">Website & Finance</div>
                    <div className="space-y-1">
                      <ActionLink href="/finance" title="Review finance" detail="Saldo bank, setoran modal" />
                      <ActionLink href="/ecommerce" title="Orders" detail="Fulfillment, status" />
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Admin</div>
                    <div className="space-y-1">
                      <ActionLink href="/alerts" title="Cek alerts" detail="Stock, event, deadline" />
                      <ActionLink href="/tax-compliance" title="Tax & Compliance" detail="Pajak, OSS, LKPM" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Extended Operational Cards */}
            <div className="grid gap-4 lg:grid-cols-4">
              <Card className="border-cyan-100 bg-cyan-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">📦 Inventory</CardTitle>
                  <CardDescription>Stok bahan baku & packaging</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {loading ? <Skeleton className="h-20 w-full" /> : (
                    <>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div><div className="text-xl font-bold">{formatNumber(data?.inventorySummary?.totalSku || 0)}</div><div className="text-xs text-muted-foreground">SKU</div></div>
                        <div><div className="text-xl font-bold">{formatNumber(data?.inventorySummary?.totalStock || 0)}</div><div className="text-xs text-muted-foreground">Total Stok</div></div>
                      </div>
                      <div className="flex gap-2 text-xs">
                        {(data?.inventorySummary?.lowStock || 0) > 0 && <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">⚠️ Low: {data?.inventorySummary?.lowStock}</span>}
                        {(data?.inventorySummary?.criticalStock || 0) > 0 && <span className="rounded-full bg-red-100 text-red-800 px-2 py-0.5">🔴 Critical: {data?.inventorySummary?.criticalStock}</span>}
                        {(data?.inventorySummary?.lowStock || 0) === 0 && (data?.inventorySummary?.criticalStock || 0) === 0 && <span className="rounded-full bg-green-100 text-green-800 px-2 py-0.5">✅ All OK</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">Nilai: {formatCurrency(data?.inventorySummary?.totalValue || 0)} • {data?.inventorySummary?.categoryCount || 0} kategori</div>
                      <Link href="/inventory" className="text-xs font-medium text-cyan-700 hover:underline">Buka Inventory →</Link>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-indigo-100 bg-indigo-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">🧾 Procurement</CardTitle>
                  <CardDescription>PO, receiving, QC barang masuk</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {loading ? <Skeleton className="h-20 w-full" /> : (
                    <>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div><div className="text-xl font-bold">{formatNumber(data?.procurementSummary?.poCount || 0)}</div><div className="text-xs text-muted-foreground">Total PO</div></div>
                        <div><div className="text-xl font-bold text-amber-600">{formatNumber(data?.procurementSummary?.pendingPo || 0)}</div><div className="text-xs text-muted-foreground">Pending</div></div>
                      </div>
                      <div className="text-xs text-muted-foreground">Nilai PO: {formatCurrency(data?.procurementSummary?.totalPoValue || 0)}</div>
                      <div className="flex gap-2 text-xs">
                        <span className="rounded-full bg-green-100 text-green-800 px-2 py-0.5">QC Pass: {data?.procurementSummary?.qcPassed || 0}</span>
                        {(data?.procurementSummary?.qcFailed || 0) > 0 && <span className="rounded-full bg-red-100 text-red-800 px-2 py-0.5">QC Fail: {data?.procurementSummary?.qcFailed}</span>}
                      </div>
                      <Link href="/procurement" className="text-xs font-medium text-indigo-700 hover:underline">Buka Procurement →</Link>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-teal-100 bg-teal-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">✅ Compliance</CardTitle>
                  <CardDescription>Formula, batch, QC, label</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {loading ? <Skeleton className="h-20 w-full" /> : (
                    <>
                      <div className="grid grid-cols-3 gap-1 text-center">
                        <div><div className="text-lg font-bold text-green-600">{formatNumber(data?.complianceSummary?.passed || 0)}</div><div className="text-xs text-muted-foreground">Pass</div></div>
                        <div><div className="text-lg font-bold text-amber-600">{formatNumber(data?.complianceSummary?.pending || 0)}</div><div className="text-xs text-muted-foreground">Pending</div></div>
                        <div><div className="text-lg font-bold text-red-600">{formatNumber(data?.complianceSummary?.failed || 0)}</div><div className="text-xs text-muted-foreground">Fail</div></div>
                      </div>
                      <div className="text-xs text-muted-foreground">Pass rate: {data?.executiveSnapshot?.compliancePassRate || 0}% • QC: {data?.complianceSummary?.qcPassed || 0}/{data?.complianceSummary?.qcTotal || 0}</div>
                      <Link href="/compliance" className="text-xs font-medium text-teal-700 hover:underline">Buka Compliance →</Link>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-rose-100 bg-rose-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">🤝 Commercial</CardTitle>
                  <CardDescription>Tenant & sponsor pipeline</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {loading ? <Skeleton className="h-20 w-full" /> : (
                    <>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div><div className="text-xl font-bold">{formatNumber(data?.commercialSummary?.tenantCount || 0)}</div><div className="text-xs text-muted-foreground">Tenant</div></div>
                        <div><div className="text-xl font-bold">{formatNumber(data?.commercialSummary?.sponsorCount || 0)}</div><div className="text-xs text-muted-foreground">Sponsor</div></div>
                      </div>
                      <div className="text-xs text-muted-foreground">Revenue: {formatCurrency(data?.commercialSummary?.commercialRevenue || 0)}</div>
                      <div className="flex gap-2 text-xs">
                        <span className="rounded-full bg-green-100 text-green-800 px-2 py-0.5">Paid: {(data?.commercialSummary?.paidTenants || 0) + (data?.commercialSummary?.paidSponsors || 0)}</span>
                        {(data?.commercialSummary?.outstandingTenants || 0) + (data?.commercialSummary?.outstandingSponsors || 0) > 0 && (
                          <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">Outstanding: {(data?.commercialSummary?.outstandingTenants || 0) + (data?.commercialSummary?.outstandingSponsors || 0)}</span>
                        )}
                      </div>
                      <Link href="/events" className="text-xs font-medium text-rose-700 hover:underline">Buka Events →</Link>
                    </>
                  )}
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
          </TabsContent>

          {/* ── Per Divisi Tab ── */}
          <TabsContent value="divisi" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Laporan Keuangan Per Divisi</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Omzet, biaya, dan laba bersih dikelompokkan berdasarkan divisi: Produksi, Website, dan Event.
                Data bersumber dari Google Sheets (Brand_Sales, Brand_Expenses, Event_Tenants, Event_Sponsors).
              </p>
            </div>

            {/* Divisi KPI Cards */}
            {loading ? (
              <div className="grid gap-4 md:grid-cols-3">
                {[1,2,3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-6">
                {data?.divisiFinancials && Object.entries(data.divisiFinancials).map(([divisi, d]: [string, any]) => {
                  const colors: Record<string, string> = {
                    "Produksi": "border-green-200 bg-green-50",
                    "Website": "border-blue-200 bg-blue-50",
                    "Event": "border-purple-200 bg-purple-50",
                  };
                  const iconColors: Record<string, string> = {
                    "Produksi": "text-green-600",
                    "Website": "text-blue-600",
                    "Event": "text-purple-600",
                  };
                  const icons: Record<string, string> = {
                    "Produksi": "🏭",
                    "Website": "💻",
                    "Event": "🎪",
                  };
                  return (
                    <Card key={divisi} className={`border-2 ${colors[divisi] || "border-gray-200"}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span>{icons[divisi] || "📊"}</span>
                            <span className={iconColors[divisi] || "text-gray-600"}>Divisi {divisi}</span>
                          </CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {d.brandCount} brand
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground">Omzet</div>
                            <div className="text-lg font-bold text-foreground">
                              {formatCurrency(d.omzet)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Biaya Produksi</div>
                            <div className="text-lg font-semibold text-orange-600">
                              {formatCurrency(d.biayaProduksi)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Biaya Iklan</div>
                            <div className="text-lg font-semibold text-pink-600">
                              {formatCurrency(d.biayaIklan)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Biaya Operasional</div>
                            <div className="text-lg font-semibold text-amber-600">
                              {formatCurrency(d.biayaOperasional)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Laba Bersih</div>
                            <div className={`text-lg font-bold ${d.labaBersih >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(d.labaBersih)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Margin: {d.marginLaba.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        {/* Margin Bar */}
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Margin Laba</span>
                            <span>{d.marginLaba.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                d.marginLaba >= 30 ? "bg-green-500" :
                                d.marginLaba >= 15 ? "bg-yellow-500" :
                                d.marginLaba >= 0 ? "bg-orange-500" : "bg-red-500"
                              }`}
                              style={{ width: `${Math.min(Math.max(d.marginLaba, 0), 100)}%` }}
                            />
                          </div>
                        </div>
                        {d.unitSold > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Unit terjual: {formatNumber(d.unitSold)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Summary Table */}
                {data?.divisiFinancials && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">📋 Ringkasan Perbandingan Divisi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Divisi</TableHead>
                            <TableHead className="text-right">Omzet</TableHead>
                            <TableHead className="text-right">Biaya Produksi</TableHead>
                            <TableHead className="text-right">Biaya Iklan</TableHead>
                            <TableHead className="text-right">Biaya Operasional</TableHead>
                            <TableHead className="text-right">Laba Bersih</TableHead>
                            <TableHead className="text-right">Margin</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(data.divisiFinancials).map(([divisi, d]: [string, any]) => (
                            <TableRow key={divisi}>
                              <TableCell className="font-medium">🏢 {divisi}</TableCell>
                              <TableCell className="text-right">{formatCurrency(d.omzet)}</TableCell>
                              <TableCell className="text-right text-orange-600">{formatCurrency(d.biayaProduksi)}</TableCell>
                              <TableCell className="text-right text-pink-600">{formatCurrency(d.biayaIklan)}</TableCell>
                              <TableCell className="text-right text-amber-600">{formatCurrency(d.biayaOperasional)}</TableCell>
                              <TableCell className={`text-right font-bold ${d.labaBersih >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {formatCurrency(d.labaBersih)}
                              </TableCell>
                              <TableCell className={`text-right font-semibold ${
                                d.marginLaba >= 30 ? "text-green-600" :
                                d.marginLaba >= 15 ? "text-yellow-600" : "text-red-600"
                              }`}>
                                {d.marginLaba.toFixed(1)}%
                              </TableCell>
                            </TableRow>
                          ))}
                          {/* Total Row */}
                          <TableRow className="bg-muted/50 font-bold">
                            <TableCell>TOTAL</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(
                                Object.values(data.divisiFinancials).reduce((s: number, d: any) => s + d.omzet, 0)
                              )}
                            </TableCell>
                            <TableCell className="text-right text-orange-600">
                              {formatCurrency(
                                Object.values(data.divisiFinancials).reduce((s: number, d: any) => s + d.biayaProduksi, 0)
                              )}
                            </TableCell>
                            <TableCell className="text-right text-pink-600">
                              {formatCurrency(
                                Object.values(data.divisiFinancials).reduce((s: number, d: any) => s + d.biayaIklan, 0)
                              )}
                            </TableCell>
                            <TableCell className="text-right text-amber-600">
                              {formatCurrency(
                                Object.values(data.divisiFinancials).reduce((s: number, d: any) => s + d.biayaOperasional, 0)
                              )}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              {formatCurrency(
                                Object.values(data.divisiFinancials).reduce((s: number, d: any) => s + d.labaBersih, 0)
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {(
                                (Object.values(data.divisiFinancials).reduce((s: number, d: any) => s + d.labaBersih, 0) /
                                Math.max(Object.values(data.divisiFinancials).reduce((s: number, d: any) => s + d.omzet, 0), 1)) * 100
                              ).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {/* Data Source Note */}
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">
                      ℹ️ <strong>Catatan:</strong> Kategorisasi divisi dilakukan secara otomatis berdasarkan nama brand dan deskripsi expense.
                      Untuk akurasi lebih tinggi, tambahkan kolom "Divisi" di sheet Brand_Master atau Brand_Expenses.
                      Mapping default: brand parfum → Produksi, tenant/sponsor → Event, iklan/media → biaya Iklan.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ── Brand Tracker Tab ── */}
          <TabsContent value="brands" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Brand</CardTitle></CardHeader>
                <CardContent>{loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{formatNumber(data?.brandSummary?.brandCount || 0)}</div>}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Produksi</CardTitle></CardHeader>
                <CardContent>{loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold text-emerald-600">{formatNumber(data?.brandSummary?.productionQty || 0)} unit</div>}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unit Terjual</CardTitle></CardHeader>
                <CardContent>{loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold text-blue-600">{formatNumber(data?.brandSummary?.unitsSold || 0)} unit</div>}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Estimasi Stok</CardTitle></CardHeader>
                <CardContent>{loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{formatNumber(data?.brandSummary?.stockEstimate || 0)} unit</div>}</CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Produksi vs Penjualan</CardTitle>
                  <CardDescription>Perbandingan volume produksi dan penjualan per brand</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-40 w-full" /> : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Produksi</span>
                        <span className="font-bold">{formatNumber(data?.brandSummary?.productionQty || 0)} unit</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-emerald-500 h-3 rounded-full" style={{ width: "100%" }} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Penjualan</span>
                        <span className="font-bold">{formatNumber(data?.brandSummary?.unitsSold || 0)} unit</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${data?.brandSummary?.productionQty > 0 ? Math.min((data?.brandSummary?.unitsSold / data?.brandSummary?.productionQty) * 100, 100) : 0}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">HPP Rata-rata</span>
                        <span className="font-bold">{formatCurrency(data?.brandSummary?.avgHppPerUnit || 0)}/unit</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Net Revenue</span>
                        <span className="font-bold text-green-600">{formatCurrency(data?.brandSummary?.netRevenue || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Operating Profit</span>
                        <span className={`font-bold ${(data?.brandSummary?.operatingProfit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(data?.brandSummary?.operatingProfit || 0)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Batch Terbaru</CardTitle>
                  <CardDescription>3 batch produksi terakhir dari Google Sheets</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-40 w-full" /> : (
                    <div className="space-y-3">
                      {(data?.brandSummary?.latestBatches || []).map((batch: any, i: number) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <div className="font-medium text-sm">{batch.brandName} — {batch.productName}</div>
                            <div className="text-xs text-muted-foreground">{formatDate(batch.date)} • {formatNumber(batch.qtyProduced)} unit</div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={batch.status === "Completed" ? "default" : "outline"} className="text-xs">{batch.status}</Badge>
                            <Badge variant={batch.qcStatus === "Passed" ? "default" : batch.qcStatus === "Failed" ? "destructive" : "secondary"} className="text-xs">QC {batch.qcStatus}</Badge>
                          </div>
                        </div>
                      ))}
                      {(!data?.brandSummary?.latestBatches || data?.brandSummary?.latestBatches.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-8">Belum ada data batch</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribusi Penjualan per Brand</CardTitle>
                  <CardDescription>Proporsi volume penjualan</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-32 w-full" /> : (
                    <div className="space-y-3">
                      {[
                        { name: "L'Arc~en~Scent", pct: 45, color: "bg-purple-500" },
                        { name: "Pixel Potion", pct: 30, color: "bg-orange-500" },
                        { name: "Nuscentza", pct: 25, color: "bg-emerald-500" },
                      ].map((brand) => (
                        <div key={brand.name}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{brand.name}</span>
                            <span className="font-medium">{brand.pct}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className={`${brand.color} h-2 rounded-full`} style={{ width: `${brand.pct}%` }} />
                          </div>
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground mt-2">* Distribusi estimasi berdasarkan data Google Sheets</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Info Sukuk</CardTitle>
                  <CardDescription>Status sukuk dan investor</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-32 w-full" /> : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">Status Sukuk</div>
                        <div className="font-bold text-amber-600">{data?.sukukInfo?.status || "Perencanaan"}</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">Akad</div>
                        <div className="font-bold">{data?.sukukInfo?.akad || "Musyarakah"}</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">Nisbah</div>
                        <div className="font-bold">{data?.sukukInfo?.nisbah || "50:50"}</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">Investor Terdaftar</div>
                        <div className="font-bold">{data?.sukukInvestors?.length || 0}</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">Unit Terjual</div>
                        <div className="font-bold">{formatNumber(data?.totalUnitTerjual || 0)}</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">Yield</div>
                        <div className="font-bold">{data?.sukukInfo?.yield || "8-12%"}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Cashflow Tab ── */}
          <TabsContent value="cashflow" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Saldo Bank</CardTitle></CardHeader>
                <CardContent>{loading ? <Skeleton className="h-8 w-28" /> : <div className="text-2xl font-bold text-green-600">{formatCurrency(data?.totalSaldoAkhir || 0)}</div>}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Modal Disetor</CardTitle></CardHeader>
                <CardContent>{loading ? <Skeleton className="h-8 w-28" /> : <div className="text-2xl font-bold">{formatCurrency(data?.totalSudahSetor || 0)}</div>}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Sisa Kewajiban</CardTitle></CardHeader>
                <CardContent>{loading ? <Skeleton className="h-8 w-28" /> : <div className="text-2xl font-bold text-red-600">{formatCurrency(data?.totalSisaKewajiban || 0)}</div>}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Setoran %</CardTitle></CardHeader>
                <CardContent>{loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{data?.totalSetoranPercent?.toFixed(1) || 0}%</div>}</CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Rekap Rekening Koran</CardTitle>
                  <CardDescription>Data 8 bulan terakhir dari Google Sheets</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div> : data?.rekapData?.length > 0 ? (
                    <div className="rounded-md border overflow-auto">
                      <Table>
                        <TableHeader><TableRow><TableHead>Bulan</TableHead><TableHead>Akun</TableHead><TableHead className="text-right">Saldo Awal</TableHead><TableHead className="text-right">Masuk</TableHead><TableHead className="text-right">Keluar</TableHead><TableHead className="text-right">Saldo Akhir</TableHead></TableRow></TableHeader>
                        <TableBody>{data.rekapData.map((row: any, i: number) => <TableRow key={i}><TableCell className="font-medium">{row.bulan}</TableCell><TableCell>{row.akun}</TableCell><TableCell className="text-right text-xs">{row.saldoAwal}</TableCell><TableCell className="text-right text-green-600 text-xs">{row.totalMasuk}</TableCell><TableCell className="text-right text-red-600 text-xs">{row.totalKeluar}</TableCell><TableCell className="text-right font-medium text-xs">{row.saldoAkhir}</TableCell></TableRow>)}</TableBody>
                      </Table>
                    </div>
                  ) : <p className="text-muted-foreground text-center py-8">Tidak ada data rekap rekening</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pemegang Saham</CardTitle>
                  <CardDescription>Modal ditempatkan: {formatCurrency(data?.totalModalDitempatkan || 0)} | Terkumpul: {formatCurrency(data?.totalSudahSetor || 0)} | Sisa: {formatCurrency(data?.totalSisaKewajiban || 0)}</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div> : (
                    <div className="grid gap-4 md:grid-cols-3">
                      {data?.shareholders?.map((sh: any, i: number) => <div key={i} className="p-4 border rounded-lg"><div className="flex justify-between items-start mb-2"><div><h4 className="font-semibold">{sh.nama}</h4><span className="text-xs text-muted-foreground">{sh.persen} • {sh.jumlahSaham} saham</span></div><span className={`text-xs px-2 py-1 rounded ${sh.progress >= 100 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{sh.progress.toFixed(1)}%</span></div><div className="space-y-1 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Kewajiban:</span><span>{formatCurrency(sh.kewajiban)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Disetor:</span><span className="text-green-600">{formatCurrency(sh.sudahSetor)}</span></div><div className="flex justify-between border-t pt-1"><span className="font-medium">Sisa:</span><span className="font-bold text-red-600">{formatCurrency(sh.sisaKewajiban ?? (sh.kewajiban - sh.sudahSetor))}</span></div></div><div className="mt-3"><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(sh.progress, 100)}%` }} /></div></div></div>)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bank Accounts */}
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
          </TabsContent>

          {/* ── Quick Links Tab (by Division) ── */}
          <TabsContent value="quicklinks" className="space-y-6">
            {/* Divisi Produksi */}
            <div>
              <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Divisi Produksi
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <QuickLink href="/production" title="🏭 Produksi" description="Batch, HPP, estimasi stok" />
                <QuickLink href="/inventory" title="📦 Inventory" description="Bahan, packaging, merch TIM" />
                <QuickLink href="/procurement" title="🧾 Procurement" description="Supplier, PO, receiving QC" />
                <QuickLink href="/qc" title="🔬 QC Check" description="Quality control batch produksi" />
                <QuickLink href="/formulas" title="🧪 Formula" description="Resin, bahan, costing" />
                <QuickLink href="/reorder" title="🔄 Reorder Alert" description="Stok minimum & auto alert" />
                <QuickLink href="/compliance" title="✅ Compliance" description="Traceability, label, BPOM" />
                <QuickLink href="/production-analytics" title="📈 Prod. Analytics" description="Analisis efisiensi produksi" />
              </div>
            </div>

            {/* Divisi Website & Commerce */}
            <div>
              <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Divisi Website & E-Commerce
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <QuickLink href="/ecommerce" title="🛒 E-Commerce" description="Online store, order, fulfillment" />
                <QuickLink href="/store-daily" title="🏪 Store Daily" description="Penjualan harian store" />
                <QuickLink href="/email" title="📧 Email" description="Gmail inbox, send" />
                <QuickLink href="/sheets" title="📋 Google Sheets" description="Data spreadsheet langsung" />
                <QuickLink href="/drive" title="📁 Google Drive" description="Dokumen & file perusahaan" />
                <QuickLink href="/documents" title="📄 Documents" description="Invoice, proposal, RAB" />
                <QuickLink href="/billing" title="💳 Billing" description="Tagihan & piutang" />
              </div>
            </div>

            {/* Divisi Event */}
            <div>
              <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Divisi Event
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <QuickLink href="/events" title="🎉 Events" description="Fragrantions portfolio & planning" />
                <QuickLink href="/crm" title="🤝 CRM & Commercial" description="Tenant, sponsor, pipeline" />
                <QuickLink href="/merch" title="👕 Merch TIM" description="Merchandise event" />
                <QuickLink href="/portfolio" title="📸 Portfolio" description="Dokumentasi event" />
                <QuickLink href="/upcoming-events" title="📅 Upcoming" description="Event mendatang" />
                <QuickLink href="/reports" title="📊 Reports" description="Laporan mingguan/bulanan" />
              </div>
            </div>

            {/* Divisi Store (Coming Soon) */}
            <div>
              <h3 className="text-sm font-semibold text-orange-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Divisi Store
                <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-normal">Coming Soon</span>
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <QuickLink href="/store-daily" title="🏪 Daily Sales" description="Penjualan harian store" />
                <QuickLink href="/sales-target" title="🎯 Sales Target" description="Target vs actual penjualan" />
                <QuickLink href="/customers" title="👥 Customers" description="CRM, consent, CLV" />
                <QuickLink href="/bep" title="📉 BEP Analysis" description="Break even point store" />
              </div>
            </div>

            {/* Cross-Division Tools */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                Umum & Admin
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <QuickLink href="/finance" title="💰 Finance" description="Keuangan, saham, setoran" />
                <QuickLink href="/tax-compliance" title="🏛️ Tax & Compliance" description="Pajak, OSS, Pajak Tracking" />
                <QuickLink href="/operations" title="🧭 Operations" description="Command center end-to-end" />
                <QuickLink href="/alerts" title="🔔 Alerts" description="Prioritas tindakan lintas modul" />
                <QuickLink href="/workflow" title="🔄 Workflow" description="7-stage operational pipeline" />
                <QuickLink href="/automation" title="💬 WhatsApp" description="FAQ, broadcast, intake" />
                <QuickLink href="/bpjs" title="🏥 BPJS" description="Ketenagakerjaan & kesehatan" />
                <QuickLink href="/sukuk" title="🪙 Sukuk Mikro" description="Produk, investasi, profit" />
                <QuickLink href="/investor" title="📈 Investor" description="Relations & projections" />
                <QuickLink href="/ai-chat" title="🤖 AI Chat" description="Context-aware assistant" />
                <QuickLink href="/users" title="👥 Users" description="Management & role access" />
                <QuickLink href="/settings" title="⚙️ Settings" description="System configuration" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </RoleGate>

      {/* Debug Info */}
      <div className="text-xs text-muted-foreground">
        Accessible features: {accessibleFeatures.join(", ") || "none"}
      </div>
    </div>
  );
}
