"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type BillingLineItem = {
  type: "tenant" | "sponsor";
  id: string;
  eventId: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: string;
  contractDate: string;
  notes: string;
};

type BillingSummary = {
  totalOutstanding: number;
  tenantOutstanding: number;
  sponsorOutstanding: number;
  unpaidTenantCount: number;
  unpaidSponsorCount: number;
  totalUnpaidItems: number;
  totalTenantRevenue: number;
  totalSponsorRevenue: number;
  collectedTenant: number;
  collectionRate: number;
};

type BillingData = {
  source: string;
  sourceStatus: string;
  generatedAt: string;
  summary: BillingSummary;
  lineItems: BillingLineItem[];
  byStatus: Record<string, number>;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

function getStatusBadge(status: string) {
  const meta: Record<string, { label: string; cls: string }> = {
    prospect: { label: "Prospect", cls: "bg-slate-100 text-slate-700" },
    "follow-up": { label: "Follow-Up", cls: "bg-amber-100 text-amber-700" },
    "invoice-sent": { label: "Invoice Sent", cls: "bg-blue-100 text-blue-700" },
    partial: { label: "Partial", cls: "bg-orange-100 text-orange-700" },
    paid: { label: "Lunas", cls: "bg-green-100 text-green-700" },
    cancelled: { label: "Batal", cls: "bg-red-100 text-red-700" },
  };
  return meta[status] || { label: status, cls: "bg-gray-100 text-gray-700" };
}

function getTypeIcon(type: string) {
  return type === "tenant" ? "🏪" : "🤝";
}

function getTypeLabel(type: string) {
  return type === "tenant" ? "Tenant" : "Sponsor";
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  async function loadBilling() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/billing", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat data billing");
      setData(json);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBilling();
  }, []);

  const filteredItems = useMemo(() => {
    if (!data?.lineItems) return [];
    if (filterStatus === "all") return data.lineItems;
    return data.lineItems.filter((item) => item.status === filterStatus);
  }, [data, filterStatus]);

  const tenantItems = useMemo(() => filteredItems.filter((i) => i.type === "tenant"), [filteredItems]);
  const sponsorItems = useMemo(() => filteredItems.filter((i) => i.type === "sponsor"), [filteredItems]);

  function getInvoiceLink(item: BillingLineItem) {
    const params = new URLSearchParams({
      type: item.type === "tenant" ? "invoice" : "sponsor_invoice",
      name: item.name,
      email: item.email,
      description: item.description,
      amount: String(item.outstandingAmount),
      ref: item.id,
    });
    return `/invoice?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Billing & Piutang</h2>
          <p className="text-muted-foreground">
            Tagihan outstanding dari tenant & sponsor event Fragrantions.
          </p>
        </div>
        <Button onClick={loadBilling} variant="outline" size="sm" disabled={loading}>
          {loading ? "⏳ Refresh..." : "🔄 Refresh"}
        </Button>
      </div>

      {data?.sourceStatus === "degraded" && (
        <Card className="border-amber-200 bg-amber-50 text-amber-950">
          <CardContent className="pt-6">
            <div className="font-semibold">⚠️ Google Workspace perlu re-auth</div>
            <p className="text-sm">Billing center menampilkan empty read-only fallback. Data tidak lengkap sampai OAuth di-refresh.</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 text-red-950">
          <CardContent className="pt-6">
            <div className="font-semibold">❌ Error</div>
            <p className="text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-32" /> : (
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(data?.summary.totalOutstanding || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {data?.summary.totalUnpaidItems || 0} item belum lunas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Piutang Tenant</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-32" /> : (
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(data?.summary.tenantOutstanding || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {data?.summary.unpaidTenantCount || 0} tenant belum lunas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Piutang Sponsor</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-32" /> : (
              <div className="text-2xl font-bold text-amber-600">
                {formatCurrency(data?.summary.sponsorOutstanding || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {data?.summary.unpaidSponsorCount || 0} sponsor belum lunas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Collection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-32" /> : (
              <div className="text-2xl font-bold text-green-600">
                {data?.summary.collectionRate || 100}%
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(data?.summary.collectedTenant || 0)} terkumpul dari {formatCurrency(data?.summary.totalTenantRevenue || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      {data?.byStatus && (
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className={filterStatus === "all" ? "bg-primary text-primary-foreground" : "cursor-pointer"} onClick={() => setFilterStatus("all")}>
            Semua ({data.summary.totalUnpaidItems})
          </Badge>
          {Object.entries(data.byStatus).map(([status, count]) => {
            const meta = getStatusBadge(status);
            return (
              <Badge
                key={status}
                variant="outline"
                className={filterStatus === status ? "bg-primary text-primary-foreground" : "cursor-pointer"}
                onClick={() => setFilterStatus(status)}
              >
                {meta.label} ({count})
              </Badge>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Semua ({filteredItems.length})</TabsTrigger>
          <TabsTrigger value="tenant">Tenant ({tenantItems.length})</TabsTrigger>
          <TabsTrigger value="sponsor">Sponsor ({sponsorItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <BillingTable items={filteredItems} getInvoiceLink={getInvoiceLink} loading={loading} />
        </TabsContent>
        <TabsContent value="tenant">
          <BillingTable items={tenantItems} getInvoiceLink={getInvoiceLink} loading={loading} />
        </TabsContent>
        <TabsContent value="sponsor">
          <BillingTable items={sponsorItems} getInvoiceLink={getInvoiceLink} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BillingTable({
  items,
  getInvoiceLink,
  loading,
}: {
  items: BillingLineItem[];
  getInvoiceLink: (item: BillingLineItem) => string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="pt-8 pb-8 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <p className="font-medium">Tidak ada tagihan outstanding</p>
          <p className="text-sm text-muted-foreground mt-1">
            Semua tenant dan sponsor sudah lunas, atau belum ada data di commercial pipeline.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Dibayar</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const statusMeta = getStatusBadge(item.status);
              return (
                <TableRow key={item.id}>
                  <TableCell>{getTypeIcon(item.type)}</TableCell>
                  <TableCell>
                    <div className="font-medium">{item.name || "TBA"}</div>
                    <div className="text-xs text-muted-foreground">{item.contact} · {item.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{item.description}</div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusMeta.cls}`}>
                      {statusMeta.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.totalAmount)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(item.paidAmount)}</TableCell>
                  <TableCell className="text-right font-bold text-red-600">{formatCurrency(item.outstandingAmount)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {item.status !== "paid" && item.status !== "cancelled" && (
                        <>
                          <Link href={getInvoiceLink(item)}>
                            <Button size="sm" variant="outline" title="Buat Invoice">
                              📄
                            </Button>
                          </Link>
                          {item.phone && (
                            <a
                              href={`https://wa.me/${item.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                `Halo ${item.contact}, mengingatkan pembayaran ${formatCurrency(item.outstandingAmount)} untuk ${item.description}. Mohon konfirmasi. Terima kasih!`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="outline" title="WhatsApp Follow-up">
                                💬
                              </Button>
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
