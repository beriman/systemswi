"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle, Package, DollarSign, ShoppingCart, CheckCircle2,
  Clock, FileText, Truck, RefreshCw, Plus, X
} from "lucide-react";

/* ── Types ── */

type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  qty: number;
  minimumQty: number;
  reorderQty: number;
  unitCost: number;
  supplier: string;
  location: string;
  status: "ok" | "low" | "critical" | "empty";
  needsReorder: boolean;
};

type ReorderAlert = {
  id: string;
  date: string;
  itemId: string;
  itemName: string;
  currentQty: number;
  minQty: number;
  reorderQty: number;
  supplier: string;
  unitCost: number;
  totalCost: number;
  status: "Pending PO" | "PO Created" | "Completed";
  poNumber: string;
};

type ReorderSummary = {
  totalItems: number;
  belowMinimum: number;
  totalReorderValue: number;
  pendingAlerts: number;
  poCreated: number;
  completed: number;
};

type PurchaseOrder = {
  id: string;
  date: string;
  supplierName: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  total: number;
  status: string;
};

type PendingPoSummary = {
  totalPending: number;
  totalPendingValue: number;
  draft: number;
  ordered: number;
  partial: number;
  completed: number;
};

/* ── Helpers ── */

const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);

const fmtNum = (value: number) =>
  new Intl.NumberFormat("id-ID").format(value || 0);

const statusColor: Record<string, string> = {
  ok: "bg-green-100 text-green-700 border-green-200",
  low: "bg-yellow-100 text-yellow-700 border-yellow-200",
  critical: "bg-orange-100 text-orange-700 border-orange-200",
  empty: "bg-red-100 text-red-700 border-red-200",
  "Pending PO": "bg-yellow-100 text-yellow-700",
  "PO Created": "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-700",
  ordered: "bg-blue-100 text-blue-700",
  partial: "bg-orange-100 text-orange-700",
  received: "bg-green-100 text-green-700",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={statusColor[status] || "bg-gray-100 text-gray-700"}>
      {status}
    </Badge>
  );
}

/* ── Main Component ── */

export default function ReorderPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [reorderData, setReorderData] = useState<{
    items: InventoryItem[];
    alerts: ReorderAlert[];
    summary: ReorderSummary;
  } | null>(null);
  const [pendingPoData, setPendingPoData] = useState<{
    purchaseOrders: PurchaseOrder[];
    allPOs: PurchaseOrder[];
    summary: PendingPoSummary;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [generatingPo, setGeneratingPo] = useState<string | null>(null);
  const [receivingPo, setReceivingPo] = useState<string | null>(null);
  const [showReceiveForm, setShowReceiveForm] = useState<string | null>(null);
  const [receiveQty, setReceiveQty] = useState("");
  const [receiveCondition, setReceiveCondition] = useState("Good");
  const [receiveNotes, setReceiveNotes] = useState("");
  const [inventoryFilter, setInventoryFilter] = useState<"all" | "ok" | "low" | "critical" | "empty">("all");

  const showMessage = useCallback((msg: string, type: "success" | "error") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => { setMessage(""); setMessageType(""); }, 5000);
  }, []);

  const loadReorderData = useCallback(async () => {
    try {
      const res = await fetch("/api/reorder", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal load reorder data");
      setReorderData(json);
    } catch (error) {
      showMessage(`❌ ${String(error)}`, "error");
    }
  }, [showMessage]);

  const loadPendingPo = useCallback(async () => {
    try {
      const res = await fetch("/api/reorder/pending-po", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal load pending PO");
      setPendingPoData(json);
    } catch (error) {
      showMessage(`❌ ${String(error)}`, "error");
    }
  }, [showMessage]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadReorderData(), loadPendingPo()]);
    setLoading(false);
  }, [loadReorderData, loadPendingPo]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Filtered inventory items
  const filteredItems = useMemo(() => {
    const items = reorderData?.items || [];
    if (inventoryFilter === "all") return items;
    return items.filter((item) => item.status === inventoryFilter);
  }, [reorderData?.items, inventoryFilter]);

  // Generate PO handler
  const handleGeneratePo = async (alertId: string) => {
    setGeneratingPo(alertId);
    setSaving(true);
    try {
      const res = await fetch("/api/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal generate PO");
      showMessage(`✅ PO ${json.poNumber} dibuat untuk ${json.itemName}`, "success");
      await loadAll();
    } catch (error) {
      showMessage(`❌ ${String(error)}`, "error");
    } finally {
      setGeneratingPo(null);
      setSaving(false);
    }
  };

  // Receive items handler
  const handleReceive = async (poNumber: string) => {
    if (!receiveQty || Number(receiveQty) <= 0) {
      showMessage("❌ Qty harus lebih dari 0", "error");
      return;
    }
    setReceivingPo(poNumber);
    setSaving(true);
    try {
      const res = await fetch("/api/reorder/receipt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poNumber,
          qtyReceived: Number(receiveQty),
          condition: receiveCondition,
          notes: receiveNotes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal konfirmasi receipt");
      showMessage(
        `✅ Receipt ${json.receiptId}: ${json.qtyReceived} unit diterima. Inventory updated: ${json.inventoryUpdated ? "Ya" : "Tidak"}`,
        "success"
      );
      setShowReceiveForm(null);
      setReceiveQty("");
      setReceiveCondition("Good");
      setReceiveNotes("");
      await loadAll();
    } catch (error) {
      showMessage(`❌ ${String(error)}`, "error");
    } finally {
      setReceivingPo(null);
      setSaving(false);
    }
  };

  const summary = reorderData?.summary;
  const alerts = reorderData?.alerts || [];
  const poSummary = pendingPoData?.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Auto-Reorder System
          </h2>
          <p className="text-muted-foreground">
            Monitoring stok minimum, auto-generate PO, dan konfirmasi penerimaan barang.
          </p>
        </div>
        <Button onClick={loadAll} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Message */}
      {message && (
        <Card className={messageType === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardContent className="py-3 text-sm">{message}</CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Items di Bawah Minimum
            </CardDescription>
            <CardTitle className="text-2xl text-orange-600">
              {loading ? <Skeleton className="h-8 w-16" /> : fmtNum(summary?.belowMinimum || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">dari {summary?.totalItems || 0} total SKU</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Total Reorder Value
            </CardDescription>
            <CardTitle className="text-2xl">
              {loading ? <Skeleton className="h-8 w-24" /> : rupiah(summary?.totalReorderValue || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">nilai reorder yang pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Pending PO
            </CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {loading ? <Skeleton className="h-8 w-16" /> : fmtNum(poSummary?.totalPending || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{rupiah(poSummary?.totalPendingValue || 0)} nilai pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Completed
            </CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {loading ? <Skeleton className="h-8 w-16" /> : fmtNum(summary?.completed || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">alert selesai diproses</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
          <TabsTrigger value="alerts">🔔 Reorder Alerts ({alerts.filter((a) => a.status !== "Completed").length})</TabsTrigger>
          <TabsTrigger value="po">📋 Purchase Orders</TabsTrigger>
          <TabsTrigger value="inventory">📦 Inventory Status</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Dashboard ── */}
        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Items Perlu Reorder Hari Ini
              </CardTitle>
              <CardDescription>
                Item dengan stok di bawah minimum yang perlu segera di-reorder
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : alerts.filter((a) => a.status === "Pending PO").length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 className="h-12 w-12 text-green-400" />}
                  title="Semua Stok Aman"
                  description="Tidak ada item yang perlu reorder saat ini."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Current Qty</TableHead>
                      <TableHead>Min Qty</TableHead>
                      <TableHead>Reorder Qty</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.filter((a) => a.status === "Pending PO").map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-medium">{alert.itemName}</TableCell>
                        <TableCell className="text-orange-600 font-semibold">{fmtNum(alert.currentQty)}</TableCell>
                        <TableCell>{fmtNum(alert.minQty)}</TableCell>
                        <TableCell>{fmtNum(alert.reorderQty)}</TableCell>
                        <TableCell>{alert.supplier}</TableCell>
                        <TableCell>{rupiah(alert.totalCost)}</TableCell>
                        <TableCell><StatusBadge status={alert.status} /></TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            disabled={generatingPo === alert.id || saving}
                            onClick={() => handleGeneratePo(alert.id)}
                          >
                            {generatingPo === alert.id ? "Generating..." : "🛒 Generate PO"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Quick PO Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                PO Perlu Diproses
              </CardTitle>
              <CardDescription>
                Purchase orders yang sudah dibuat dan menunggu pengiriman/penerimaan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : !pendingPoData?.purchaseOrders.length ? (
                <EmptyState
                  icon={<FileText className="h-12 w-12 text-gray-300" />}
                  title="Tidak Ada PO Pending"
                  description="Belum ada purchase order yang perlu diproses."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPoData.purchaseOrders.slice(0, 10).map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-mono text-sm">{po.id}</TableCell>
                        <TableCell>{po.date}</TableCell>
                        <TableCell>{po.supplierName}</TableCell>
                        <TableCell>{po.itemName}</TableCell>
                        <TableCell>{fmtNum(po.quantity)} {po.unit}</TableCell>
                        <TableCell>{rupiah(po.total)}</TableCell>
                        <TableCell><StatusBadge status={po.status} /></TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowReceiveForm(showReceiveForm === po.id ? null : po.id)}
                          >
                            <Truck className="h-3 w-3 mr-1" /> Receive
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Receive Form */}
              {showReceiveForm && (
                <Card className="mt-4 border-blue-200 bg-blue-50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base">Konfirmasi Penerimaan: {showReceiveForm}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setShowReceiveForm(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleReceive(showReceiveForm); }}
                      className="space-y-3"
                    >
                      <div className="grid gap-3 md:grid-cols-3">
                        <div>
                          <Label className="mb-1 block text-xs">Qty Diterima</Label>
                          <Input
                            type="number"
                            min={1}
                            value={receiveQty}
                            onChange={(e) => setReceiveQty(e.target.value)}
                            placeholder="Jumlah diterima"
                            required
                          />
                        </div>
                        <div>
                          <Label className="mb-1 block text-xs">Kondisi</Label>
                          <select
                            value={receiveCondition}
                            onChange={(e) => setReceiveCondition(e.target.value)}
                            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                          >
                            <option value="Good">Good</option>
                            <option value="Damaged">Damaged</option>
                          </select>
                        </div>
                        <div>
                          <Label className="mb-1 block text-xs">Catatan</Label>
                          <Input
                            value={receiveNotes}
                            onChange={(e) => setReceiveNotes(e.target.value)}
                            placeholder="Catatan penerimaan"
                          />
                        </div>
                      </div>
                      <Button type="submit" disabled={receivingPo === showReceiveForm || saving}>
                        {receivingPo === showReceiveForm ? "Memproses..." : "✅ Konfirmasi Receipt"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Reorder Alerts ── */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Semua Reorder Alerts
              </CardTitle>
              <CardDescription>
                Daftar semua alert reorder yang pernah di-generate
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : alerts.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 className="h-12 w-12 text-green-400" />}
                  title="Tidak Ada Alert"
                  description="Belum ada reorder alert. Semua stok dalam kondisi aman."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alert ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Current</TableHead>
                      <TableHead>Min</TableHead>
                      <TableHead>Reorder Qty</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>PO Number</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.slice().reverse().map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-mono text-xs">{alert.id}</TableCell>
                        <TableCell>{alert.date}</TableCell>
                        <TableCell className="font-medium">{alert.itemName}</TableCell>
                        <TableCell className={alert.currentQty <= alert.minQty ? "text-orange-600 font-semibold" : ""}>
                          {fmtNum(alert.currentQty)}
                        </TableCell>
                        <TableCell>{fmtNum(alert.minQty)}</TableCell>
                        <TableCell>{fmtNum(alert.reorderQty)}</TableCell>
                        <TableCell>{alert.supplier}</TableCell>
                        <TableCell>{rupiah(alert.totalCost)}</TableCell>
                        <TableCell><StatusBadge status={alert.status} /></TableCell>
                        <TableCell className="font-mono text-xs">{alert.poNumber || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Purchase Orders ── */}
        <TabsContent value="po" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Purchase Orders
              </CardTitle>
              <CardDescription>
                Semua purchase orders — draft, ordered, partial, received
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : !pendingPoData?.allPOs.length ? (
                <EmptyState
                  icon={<FileText className="h-12 w-12 text-gray-300" />}
                  title="Belum Ada PO"
                  description="Belum ada purchase order yang dibuat."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPoData.allPOs.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-mono text-sm font-medium">{po.id}</TableCell>
                        <TableCell>{po.date}</TableCell>
                        <TableCell>{po.supplierName}</TableCell>
                        <TableCell>{po.itemName}</TableCell>
                        <TableCell>{fmtNum(po.quantity)} {po.unit}</TableCell>
                        <TableCell>{rupiah(po.unitCost)}</TableCell>
                        <TableCell>{rupiah(po.total)}</TableCell>
                        <TableCell><StatusBadge status={po.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 4: Inventory Status ── */}
        <TabsContent value="inventory" className="space-y-4">
          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2">
            {(["all", "ok", "low", "critical", "empty"] as const).map((filter) => {
              const count = filter === "all"
                ? (reorderData?.items.length || 0)
                : (reorderData?.items.filter((i) => i.status === filter).length || 0);
              return (
                <Button
                  key={filter}
                  variant={inventoryFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInventoryFilter(filter)}
                >
                  {filter === "all" ? "Semua" : filter.toUpperCase()} ({count})
                </Button>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Status
                {inventoryFilter !== "all" && (
                  <Badge variant="outline" className={statusColor[inventoryFilter]}>
                    Filter: {inventoryFilter.toUpperCase()}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Status stok semua item dengan color coding
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : filteredItems.length === 0 ? (
                <EmptyState
                  icon={<Package className="h-12 w-12 text-gray-300" />}
                  title="Tidak Ada Item"
                  description="Tidak ada item dengan filter yang dipilih."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Min</TableHead>
                      <TableHead>Reorder Qty</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className={
                          item.status === "critical" || item.status === "empty" ? "text-red-600 font-bold" :
                          item.status === "low" ? "text-yellow-600 font-semibold" : ""
                        }>
                          {fmtNum(item.qty)} {item.unit}
                        </TableCell>
                        <TableCell>{fmtNum(item.minimumQty)}</TableCell>
                        <TableCell>{fmtNum(item.reorderQty)}</TableCell>
                        <TableCell>{rupiah(item.unitCost)}</TableCell>
                        <TableCell>{item.supplier}</TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell><StatusBadge status={item.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
