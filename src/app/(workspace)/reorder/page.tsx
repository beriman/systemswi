"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Using native select to avoid @radix-ui/react-select dependency
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle, Package, ShoppingCart, ClipboardCheck, RefreshCw,
  Plus, CheckCircle, XCircle, Clock, Eye, Truck, DollarSign,
} from "lucide-react";

/* ── Types ── */

type ReorderAlert = {
  alertId: string; date: string; itemId: string; itemName: string;
  currentQty: number; minimumQty: number; reorderQty: number;
  supplier: string; unitCost: number; totalCost: number;
  status: "New" | "PO Created" | "Received" | "Cancelled";
  poNumber: string;
};

type PurchaseOrder = {
  id: string; date: string; supplierId: string; supplierName: string;
  itemId: string; itemName: string; quantity: number; unit: string;
  unitCost: number; total: number;
  status: "draft" | "ordered" | "partial" | "received" | "cancelled";
  expectedDate: string; notes: string;
};

type GoodsReceipt = {
  receiptId: string; date: string; poNumber: string;
  itemId: string; itemName: string; qtyReceived: number;
  unitCost: number; totalCost: number;
  condition: "Good" | "Damaged" | "Partial"; notes: string;
};

type InventoryItem = {
  id: string; sku: string; name: string; category: string;
  unit: string; qty: number; minimumQty: number; reorderQty: number;
  unitCost: number; supplier: string; location: string;
  status: "ok" | "low" | "critical" | "empty";
};

type ReorderSummary = {
  totalAlerts: number; newAlerts: number; poCreated: number;
  totalItemsBelowMin: number; totalReorderValue: number;
  pendingPOs: number; completedReceipts: number;
};

type ReorderData = {
  source: string;
  alerts: ReorderAlert[];
  summary: ReorderSummary;
  itemsBelowMin: InventoryItem[];
};

type PendingPOData = {
  source: string;
  pendingPOs: PurchaseOrder[];
  totalPending: number;
  totalValue: number;
};

/* ── Helpers ── */

const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);

const fmtNum = (value: number) =>
  new Intl.NumberFormat("id-ID").format(value || 0);

const statusBadge = (status: string) => {
  const map: Record<string, { variant: string; icon: React.ReactNode }> = {
    "New": { variant: "warning", icon: <Clock className="w-3 h-3" /> },
    "PO Created": { variant: "default", icon: <ShoppingCart className="w-3 h-3" /> },
    "Received": { variant: "success", icon: <CheckCircle className="w-3 h-3" /> },
    "Cancelled": { variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
    "draft": { variant: "secondary", icon: <Clock className="w-3 h-3" /> },
    "ordered": { variant: "default", icon: <ShoppingCart className="w-3 h-3" /> },
    "partial": { variant: "warning", icon: <Package className="w-3 h-3" /> },
    "received": { variant: "success", icon: <CheckCircle className="w-3 h-3" /> },
    "ok": { variant: "success", icon: <CheckCircle className="w-3 h-3" /> },
    "low": { variant: "warning", icon: <AlertTriangle className="w-3 h-3" /> },
    "critical": { variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
    "empty": { variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
  };
  const cfg = map[status] || { variant: "outline", icon: null };
  return (
    <Badge variant={cfg.variant as any} className="gap-1">
      {cfg.icon} {status}
    </Badge>
  );
};

const stockColor = (status: string) => {
  if (status === "ok") return "bg-green-50";
  if (status === "low") return "bg-yellow-50";
  if (status === "critical" || status === "empty") return "bg-red-50";
  return "";
};

/* ── Main Page ── */

export default function ReorderPage() {
  const [reorderData, setReorderData] = useState<ReorderData | null>(null);
  const [pendingPOData, setPendingPOData] = useState<PendingPOData | null>(null);
  const [allPOs, setAllPOs] = useState<PurchaseOrder[]>([]);
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [allInventory, setAllInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [seedResult, setSeedResult] = useState("");

  // Receipt form
  const [receiptForm, setReceiptForm] = useState({
    poNumber: "",
    itemId: "",
    itemName: "",
    qtyReceived: "",
    unitCost: "",
    condition: "Good",
    notes: "",
  });

  // PO form
  const [poForm, setPoForm] = useState({
    supplierId: "",
    itemId: "",
    itemName: "",
    quantity: "",
    unitCost: "",
    unit: "unit",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [reorderRes, pendingRes, invRes, poRes, receiptRes] = await Promise.all([
        fetch("/api/reorder"),
        fetch("/api/reorder/pending-po"),
        fetch("/api/inventory"),
        fetch("/api/procurement"),
        fetch("/api/reorder/receipt").catch(() => null),
      ]);

      const reorderJson = await reorderRes.json();
      const pendingJson = await pendingRes.json();
      const invJson = await invRes.json();
      const poJson = await poRes.json();

      setReorderData(reorderJson);
      setPendingPOData(pendingJson);
      setAllInventory(invJson.items || []);
      setAllPOs(poJson.purchaseOrders || []);
      setReceipts(poJson.receipts || []);
    } catch (e: any) {
      setError(e.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerateAlerts = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-alerts" }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchData();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGeneratePO = async (alertId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-po", alertId }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchData();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/reorder/receipt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...receiptForm,
          qtyReceived: Number(receiptForm.qtyReceived),
          unitCost: Number(receiptForm.unitCost) || 0,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setReceiptForm({ poNumber: "", itemId: "", itemName: "", qtyReceived: "", unitCost: "", condition: "Good", notes: "" });
        await fetchData();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSeed = async () => {
    setActionLoading(true);
    setSeedResult("");
    try {
      const res = await fetch("/api/reorder/seed", { method: "POST" });
      const json = await res.json();
      setSeedResult(json.success ? `✅ ${json.message} — ${JSON.stringify(json.counts)}` : `❌ ${json.error}`);
      if (json.success) await fetchData();
    } catch (e: any) {
      setSeedResult(`❌ ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  const summary = reorderData?.summary;
  const alerts = reorderData?.alerts || [];
  const pendingPOs = pendingPOData?.pendingPOs || [];
  const itemsBelowMin = allInventory.filter((i) => i.status !== "ok");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            📦 Auto-Reorder System
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitoring stok, generate PO otomatis, dan konfirmasi penerimaan barang
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSeed} disabled={actionLoading}>
            🌱 Seed Data
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerateAlerts} disabled={actionLoading}>
            <RefreshCw className="w-4 h-4 mr-1" /> Generate Alerts
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {seedResult && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
          {seedResult}
        </div>
      )}

      {/* ── Dashboard Tabs ── */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
          <TabsTrigger value="alerts">🔔 Reorder Alerts</TabsTrigger>
          <TabsTrigger value="orders">🛒 Purchase Orders</TabsTrigger>
          <TabsTrigger value="inventory">📦 Inventory Status</TabsTrigger>
        </TabsList>

        {/* ── Tab: Dashboard ── */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Items Below Minimum
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {summary?.totalItemsBelowMin ?? allInventory.filter((i) => i.status !== "ok").length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">perlu reorder</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-yellow-500" /> Reorder Alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {summary?.totalAlerts ?? alerts.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary?.newAlerts ?? alerts.filter((a) => a.status === "New").length} baru
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-blue-500" /> Pending PO
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {summary?.pendingPOs ?? pendingPOs.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {rupiah(pendingPOData?.totalValue || 0)} total value
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" /> Total Reorder Value
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {rupiah(summary?.totalReorderValue || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">estimasi biaya reorder</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={handleGenerateAlerts} disabled={actionLoading} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Scan & Generate Alerts
              </Button>
              <Button variant="outline" onClick={handleSeed} disabled={actionLoading} className="gap-2">
                🌱 Seed Sample Data
              </Button>
              <Button variant="outline" onClick={fetchData} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Refresh Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Reorder Alerts ── */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" /> Reorder Alerts
              </CardTitle>
              <CardDescription>
                Item dengan stok di bawah minimum yang perlu di-reorder
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Tidak ada reorder alert</p>
                  <p className="text-sm mt-1">Klik &quot;Generate Alerts&quot; untuk scan Inventory_Master</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Alert ID</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Current Qty</TableHead>
                        <TableHead>Min Qty</TableHead>
                        <TableHead>Reorder Qty</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alerts.map((alert) => (
                        <TableRow key={alert.alertId}>
                          <TableCell className="font-mono text-xs">{alert.alertId}</TableCell>
                          <TableCell>
                            <div className="font-medium">{alert.itemName}</div>
                            <div className="text-xs text-muted-foreground">{alert.itemId}</div>
                          </TableCell>
                          <TableCell className="text-red-600 font-bold">{fmtNum(alert.currentQty)}</TableCell>
                          <TableCell>{fmtNum(alert.minimumQty)}</TableCell>
                          <TableCell className="font-bold">{fmtNum(alert.reorderQty)}</TableCell>
                          <TableCell className="text-sm">{alert.supplier}</TableCell>
                          <TableCell>{rupiah(alert.totalCost)}</TableCell>
                          <TableCell>{statusBadge(alert.status)}</TableCell>
                          <TableCell>
                            {alert.status === "New" ? (
                              <Button
                                size="sm"
                                onClick={() => handleGeneratePO(alert.alertId)}
                                disabled={actionLoading}
                                className="gap-1"
                              >
                                <ShoppingCart className="w-3 h-3" /> Create PO
                              </Button>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                {alert.poNumber || "—"}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Purchase Orders ── */}
        <TabsContent value="orders" className="space-y-4">
          {/* Receive Items Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-500" /> Receive Items
              </CardTitle>
              <CardDescription>
                Konfirmasi penerimaan barang dari supplier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>PO Number</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={receiptForm.poNumber}
                    onChange={(e) => {
                      const v = e.target.value;
                      setReceiptForm((f) => ({ ...f, poNumber: v }));
                      const po = allPOs.find((p) => p.id === v);
                      if (po) {
                        setReceiptForm((f) => ({
                          ...f,
                          poNumber: v,
                          itemId: po.itemId,
                          itemName: po.itemName,
                          unitCost: String(po.unitCost),
                        }));
                      }
                    }}
                  >
                    <option value="">Pilih PO...</option>
                    {allPOs.filter((p) => p.status !== "received" && p.status !== "cancelled").map((po) => (
                      <option key={po.id} value={po.id}>
                        {po.id} — {po.itemName} ({po.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Qty Received</Label>
                  <Input
                    type="number"
                    value={receiptForm.qtyReceived}
                    onChange={(e) => setReceiptForm((f) => ({ ...f, qtyReceived: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Unit Cost</Label>
                  <Input
                    type="number"
                    value={receiptForm.unitCost}
                    onChange={(e) => setReceiptForm((f) => ({ ...f, unitCost: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Condition</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={receiptForm.condition}
                    onChange={(e) => setReceiptForm((f) => ({ ...f, condition: e.target.value }))}
                  >
                    <option value="Good">✅ Good</option>
                    <option value="Partial">⚠️ Partial</option>
                    <option value="Damaged">❌ Damaged</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Label>Notes</Label>
                  <Input
                    value={receiptForm.notes}
                    onChange={(e) => setReceiptForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Catatan penerimaan..."
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleConfirmReceipt} disabled={actionLoading} className="gap-2 w-full">
                    <CheckCircle className="w-4 h-4" /> Confirm Receipt
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* All POs */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders</CardTitle>
              <CardDescription>Semua purchase order dan statusnya</CardDescription>
            </CardHeader>
            <CardContent>
              {allPOs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Belum ada purchase order</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PO ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allPOs.map((po) => (
                        <TableRow key={po.id}>
                          <TableCell className="font-mono text-xs">{po.id}</TableCell>
                          <TableCell>{po.date}</TableCell>
                          <TableCell>{po.supplierName}</TableCell>
                          <TableCell>{po.itemName}</TableCell>
                          <TableCell>{fmtNum(po.quantity)} {po.unit}</TableCell>
                          <TableCell>{rupiah(po.total)}</TableCell>
                          <TableCell>{statusBadge(po.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Receipts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-green-500" /> Recent Goods Receipts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {receipts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Belum ada goods receipt</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt ID</TableHead>
                        <TableHead>PO Number</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receipts.slice(0, 10).map((r) => (
                        <TableRow key={r.receiptId}>
                          <TableCell className="font-mono text-xs">{r.receiptId}</TableCell>
                          <TableCell className="font-mono text-xs">{r.poNumber}</TableCell>
                          <TableCell>{r.itemName}</TableCell>
                          <TableCell>{fmtNum(r.qtyReceived)}</TableCell>
                          <TableCell>{statusBadge(r.condition)}</TableCell>
                          <TableCell>{r.date}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Inventory Status ── */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
              <CardDescription>
                Semua item inventory dengan color-coded status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allInventory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Tidak ada data inventory</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Min Qty</TableHead>
                        <TableHead>Reorder Qty</TableHead>
                        <TableHead>Unit Cost</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allInventory.slice(0, 50).map((item) => (
                        <TableRow key={item.id} className={stockColor(item.status)}>
                          <TableCell className="text-xs font-mono">{item.id}</TableCell>
                          <TableCell className="text-xs">{item.sku}</TableCell>
                          <TableCell className="font-medium text-sm">{item.name}</TableCell>
                          <TableCell className="text-xs">{item.category}</TableCell>
                          <TableCell className="font-bold">{fmtNum(item.qty)}</TableCell>
                          <TableCell>{fmtNum(item.minimumQty)}</TableCell>
                          <TableCell>{fmtNum(item.reorderQty)}</TableCell>
                          <TableCell>{rupiah(item.unitCost)}</TableCell>
                          <TableCell className="text-xs">{item.supplier}</TableCell>
                          <TableCell className="text-xs">{item.location}</TableCell>
                          <TableCell>{statusBadge(item.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {allInventory.length > 50 && (
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Menampilkan 50 dari {allInventory.length} item
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
