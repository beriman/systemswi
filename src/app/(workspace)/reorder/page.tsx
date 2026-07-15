"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Package, AlertTriangle, ShoppingCart, ClipboardList, RefreshCw,
  Plus, CheckCircle, Truck, TrendingDown, DollarSign,
  Eye, Send, X
} from "lucide-react";
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

/* ── Types ── */

type ReorderAlert = {
  alertId: string;
  date: string;
  itemId: string;
  itemName: string;
  currentQty: number;
  minimumQty: number;
  reorderQty: number;
  supplier: string;
  unitCost: number;
  totalCost: number;
  status: "New" | "PO Created" | "Received" | "Cancelled";
  poNumber: string;
  rowNumber: number;
};

type PurchaseOrder = {
  id: string;
  date: string;
  supplierId: string;
  supplierName: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  total: number;
  status: "draft" | "ordered" | "partial" | "received" | "cancelled";
  expectedDate: string;
  proofUrl: string;
  notes: string;
  rowNumber: number;
};

type GoodsReceipt = {
  receiptId: string;
  date: string;
  poNumber: string;
  itemId: string;
  itemName: string;
  qtyReceived: number;
  unitCost: number;
  totalCost: number;
  condition: "Good" | "Damaged" | "Partial";
  notes: string;
  rowNumber: number;
};

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
  status: string;
  lastMovementAt: string;
  notes: string;
  rowNumber: number;
};

type ReorderSummary = {
  totalAlerts: number;
  newAlerts: number;
  poCreated: number;
  totalItemsBelowMin: number;
  totalReorderValue: number;
  pendingPOs: number;
  completedReceipts: number;
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
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const fmtNum = (value: number) =>
  new Intl.NumberFormat("id-ID").format(value || 0);

const alertStatusClass: Record<string, string> = {
  New: "bg-blue-100 text-blue-700",
  "PO Created": "bg-purple-100 text-purple-700",
  Received: "bg-green-100 text-green-700",
  Cancelled: "bg-gray-100 text-gray-700",
};

const poStatusClass: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  ordered: "bg-blue-100 text-blue-700",
  partial: "bg-yellow-100 text-yellow-700",
  received: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const stockStatusClass: Record<string, string> = {
  ok: "bg-green-100 text-green-700",
  low: "bg-yellow-100 text-yellow-700",
  critical: "bg-orange-100 text-orange-700",
  empty: "bg-red-100 text-red-700",
};

const conditionClass: Record<string, string> = {
  Good: "bg-green-100 text-green-700",
  Damaged: "bg-red-100 text-red-700",
  Partial: "bg-yellow-100 text-yellow-700",
};

function stockStatusBadge(status: string) {
  return (
    <Badge className={stockStatusClass[status] || "bg-gray-100 text-gray-700"}>
      {status}
    </Badge>
  );
}

function alertStatusBadge(status: string) {
  return (
    <Badge className={alertStatusClass[status] || "bg-gray-100 text-gray-700"}>
      {status}
    </Badge>
  );
}

function poStatusBadge(status: string) {
  return (
    <Badge className={poStatusClass[status] || "bg-gray-100 text-gray-700"}>
      {status}
    </Badge>
  );
}

function conditionBadge(condition: string) {
  return (
    <Badge className={conditionClass[condition] || "bg-gray-100 text-gray-700"}>
      {condition}
    </Badge>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/* ── Main Component ── */

export default function ReorderPage() {
  const [reorderData, setReorderData] = useState<ReorderData | null>(null);
  const [pendingPOs, setPendingPOs] = useState<PendingPOData | null>(null);
  const [allPOs, setAllPOs] = useState<PurchaseOrder[]>([]);
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [activeTab, setActiveTab] = useState("dashboard");

  // Modals
  const [showGeneratePO, setShowGeneratePO] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<ReorderAlert | null>(null);
  const [showReceiveItems, setShowReceiveItems] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [showCreatePO, setShowCreatePO] = useState(false);

  // Forms
  const [poForm, setPoForm] = useState({
    supplierId: "",
    supplierName: "",
    itemId: "",
    itemName: "",
    quantity: 0,
    unit: "unit",
    unitCost: 0,
    expectedDate: today(),
    notes: "",
  });

  const [receiveForm, setReceiveForm] = useState({
    poNumber: "",
    itemId: "",
    itemName: "",
    qtyReceived: 0,
    unitCost: 0,
    condition: "Good" as "Good" | "Damaged" | "Partial",
    notes: "",
  });

  /* ── Data Loading ── */

  async function loadReorderData() {
    try {
      const res = await fetch("/api/reorder", { cache: "no-store" });
      const json = await res.json();
      if (res.ok || json.alerts) {
        setReorderData({
          source: json.source || "",
          alerts: json.alerts || [],
          summary: json.summary || {
            totalAlerts: 0, newAlerts: 0, poCreated: 0,
            totalItemsBelowMin: 0, totalReorderValue: 0,
            pendingPOs: 0, completedReceipts: 0,
          },
          itemsBelowMin: json.itemsBelowMin || [],
        });
      }
    } catch (error) {
      console.error("Failed to load reorder data:", error);
    }
  }

  async function loadPendingPOs() {
    try {
      const res = await fetch("/api/reorder/pending-po", { cache: "no-store" });
      const json = await res.json();
      if (res.ok || json.pendingPOs) {
        setPendingPOs(json);
        setAllPOs(json.pendingPOs || []);
      }
    } catch (error) {
      console.error("Failed to load pending POs:", error);
    }
  }

  async function loadReceipts() {
    try {
      const res = await fetch("/api/reorder/receipt", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setReceipts(json.receipts || []);
      }
    } catch {
      // GET may not be supported, that's ok
    }
  }

  async function loadInventory() {
    try {
      const res = await fetch("/api/inventory", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setInventory(json.items || []);
      }
    } catch (error) {
      console.error("Failed to load inventory:", error);
    }
  }

  async function loadAll() {
    setLoading(true);
    await Promise.all([
      loadReorderData(),
      loadPendingPOs(),
      loadReceipts(),
      loadInventory(),
    ]);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial dashboard load; existing pattern in this page.
    loadAll().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial dashboard load only; load helpers are intentionally not memoized in this legacy page.
  }, []);

  /* ── Actions ── */

  async function handleGenerateAlerts() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-alerts" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal generate alerts");
      setMessageType("success");
      setMessage(`✅ ${json.alertsGenerated} alert baru di-generate dari Inventory_Master`);
      await loadReorderData();
    } catch (error) {
      setMessageType("error");
      setMessage(`❌ ${String(error)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleGeneratePO(alertId: string) {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-po", alertId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal generate PO");
      setMessageType("success");
      const governanceNote = json.governance?.approvalRequired
        ? ` — ditahan sebagai draft GCG (${(json.governance.flags || []).join(", ")})`
        : "";
      setMessage(`✅ PO ${json.po.id} dibuat untuk ${json.po.itemName} — ${rupiah(json.po.total)}${governanceNote}`);
      setShowGeneratePO(false);
      setSelectedAlert(null);
      await Promise.all([loadReorderData(), loadPendingPOs()]);
    } catch (error) {
      setMessageType("error");
      setMessage(`❌ ${String(error)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreatePO(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-po",
          supplierId: poForm.supplierId,
          supplierName: poForm.supplierName,
          itemId: poForm.itemId,
          itemName: poForm.itemName,
          quantity: poForm.quantity,
          unit: poForm.unit,
          unitCost: poForm.unitCost,
          total: poForm.quantity * poForm.unitCost,
          expectedDate: poForm.expectedDate,
          notes: poForm.notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat PO");
      setMessageType("success");
      setMessage(`✅ PO ${json.po?.id || "baru"} berhasil dibuat`);
      setShowCreatePO(false);
      setPoForm({
        supplierId: "", supplierName: "", itemId: "", itemName: "",
        quantity: 0, unit: "unit", unitCost: 0, expectedDate: today(), notes: "",
      });
      await loadPendingPOs();
      setActiveTab("purchase-orders");
    } catch (error) {
      setMessageType("error");
      setMessage(`❌ ${String(error)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleReceiveItems(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/reorder/receipt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poNumber: receiveForm.poNumber,
          itemId: receiveForm.itemId,
          itemName: receiveForm.itemName,
          qtyReceived: receiveForm.qtyReceived,
          unitCost: receiveForm.unitCost,
          condition: receiveForm.condition,
          notes: receiveForm.notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal konfirmasi receipt");
      setMessageType("success");
      setMessage(
        `✅ Receipt ${json.receipt.receiptId} tercatat — ${receiveForm.qtyReceived} ${receiveForm.itemName} (${receiveForm.condition})${json.inventoryUpdated ? ", inventory diupdate" : ""}`
      );
      setShowReceiveItems(false);
      setSelectedPO(null);
      await Promise.all([loadReorderData(), loadPendingPOs(), loadReceipts(), loadInventory()]);
    } catch (error) {
      setMessageType("error");
      setMessage(`❌ ${String(error)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleSeed() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/reorder/seed", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal seed data");
      setMessageType("success");
      setMessage(`✅ Seed berhasil: ${json.details?.join(", ") || "data created"}`);
      await loadAll();
    } catch (error) {
      setMessageType("error");
      setMessage(`❌ ${String(error)}`);
    } finally {
      setSaving(false);
    }
  }

  /* ── Derived Data ── */

  const summary = reorderData?.summary;
  const alerts = reorderData?.alerts || [];
  const itemsBelowMin = reorderData?.itemsBelowMin || [];

  const criticalItems = useMemo(
    () => inventory.filter((i) => i.qty <= i.minimumQty * 0.5 && i.minimumQty > 0),
    [inventory]
  );
  const lowItems = useMemo(
    () => inventory.filter(
      (i) => i.qty > i.minimumQty * 0.5 && i.qty <= i.minimumQty && i.minimumQty > 0
    ),
    [inventory]
  );
  const okItems = useMemo(
    () => inventory.filter((i) => i.qty > i.minimumQty),
    [inventory]
  );

  /* ── Render ── */

  return (
    <div className="space-y-6">
      {/* Generate PO Modal */}
      {showGeneratePO && selectedAlert && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Generate PO</CardTitle>
                <CardDescription>
                  Buat Purchase Order dari alert {selectedAlert.alertId}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setShowGeneratePO(false); setSelectedAlert(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Item:</span>{" "}
                  <span className="font-medium">{selectedAlert.itemName}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Current Qty:</span>{" "}
                  <span className="font-medium">{fmtNum(selectedAlert.currentQty)}</span>
                  {" · "}
                  <span className="text-muted-foreground">Min:</span>{" "}
                  <span className="font-medium">{fmtNum(selectedAlert.minimumQty)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Reorder Qty:</span>{" "}
                  <span className="font-medium">{fmtNum(selectedAlert.reorderQty)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Supplier:</span>{" "}
                  <span className="font-medium">{selectedAlert.supplier}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Est. Total:</span>{" "}
                  <span className="font-bold text-green-700">{rupiah(selectedAlert.reorderQty * selectedAlert.unitCost)}</span>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setShowGeneratePO(false); setSelectedAlert(null); }}>
                  Batal
                </Button>
                <Button
                  onClick={() => handleGeneratePO(selectedAlert.alertId)}
                  disabled={saving}
                >
                  {saving ? "Membuat PO..." : "📋 Generate PO"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Receive Items Modal */}
      {showReceiveItems && selectedPO && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Terima Barang</CardTitle>
                <CardDescription>
                  Konfirmasi penerimaan barang untuk PO {selectedPO.id}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setShowReceiveItems(false); setSelectedPO(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReceiveItems} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">PO Number</Label>
                    <Input value={selectedPO.id} disabled />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Item</Label>
                    <Input value={selectedPO.itemName} disabled />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Qty Diterima *</Label>
                    <Input
                      type="number"
                      min={0}
                      max={selectedPO.quantity}
                      value={receiveForm.qtyReceived || ""}
                      onChange={(e) => setReceiveForm((f) => ({ ...f, qtyReceived: Number(e.target.value) }))}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Order: {fmtNum(selectedPO.quantity)} {selectedPO.unit}
                    </p>
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Kondisi *</Label>
                    <select
                      value={receiveForm.condition}
                      onChange={(e) => setReceiveForm((f) => ({ ...f, condition: e.target.value as "Good" | "Damaged" | "Partial" }))}
                      className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                    >
                      <option value="Good">✅ Good</option>
                      <option value="Partial">⚠️ Partial</option>
                      <option value="Damaged">❌ Damaged</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Unit Cost (Rp)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={receiveForm.unitCost || selectedPO.unitCost}
                      onChange={(e) => setReceiveForm((f) => ({ ...f, unitCost: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Total</Label>
                    <Input value={rupiah((receiveForm.qtyReceived || 0) * (receiveForm.unitCost || selectedPO.unitCost))} disabled />
                  </div>
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">Catatan</Label>
                  <Textarea
                    rows={2}
                    value={receiveForm.notes}
                    onChange={(e) => setReceiveForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Kondisi barang, dll..."
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => { setShowReceiveItems(false); setSelectedPO(null); }}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Menyimpan..." : "📦 Konfirmasi Receipt"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create PO Modal */}
      {showCreatePO && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Buat PO Baru</CardTitle>
                <CardDescription>Manual purchase order</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowCreatePO(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePO} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Supplier ID</Label>
                    <Input
                      value={poForm.supplierId}
                      onChange={(e) => setPoForm((f) => ({ ...f, supplierId: e.target.value }))}
                      placeholder="SUP-001"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Supplier Name</Label>
                    <Input
                      value={poForm.supplierName}
                      onChange={(e) => setPoForm((f) => ({ ...f, supplierName: e.target.value }))}
                      placeholder="PT ..."
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Item ID</Label>
                    <Input
                      value={poForm.itemId}
                      onChange={(e) => setPoForm((f) => ({ ...f, itemId: e.target.value }))}
                      placeholder="RM-001"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Item Name</Label>
                    <Input
                      value={poForm.itemName}
                      onChange={(e) => setPoForm((f) => ({ ...f, itemName: e.target.value }))}
                      placeholder="Alcohol 96%"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={poForm.quantity || ""}
                      onChange={(e) => setPoForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Unit</Label>
                    <Input
                      value={poForm.unit}
                      onChange={(e) => setPoForm((f) => ({ ...f, unit: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Unit Cost (Rp)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={poForm.unitCost || ""}
                      onChange={(e) => setPoForm((f) => ({ ...f, unitCost: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">Expected Date</Label>
                  <Input
                    type="date"
                    value={poForm.expectedDate}
                    onChange={(e) => setPoForm((f) => ({ ...f, expectedDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">Notes</Label>
                  <Textarea
                    rows={2}
                    value={poForm.notes}
                    onChange={(e) => setPoForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowCreatePO(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Membuat..." : "📋 Buat PO"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Auto-Reorder System
          </h2>
          <p className="text-muted-foreground">
            Sistem otomatis reorder bahan baku & packaging — alert, PO, receipt, inventory status.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleSeed} disabled={saving} variant="secondary" size="sm">
            🌱 Seed Data
          </Button>
          <Button onClick={handleGenerateAlerts} disabled={saving} variant="default" size="sm">
            <AlertTriangle className="h-4 w-4 mr-1" /> Generate Alerts
          </Button>
          <Button onClick={loadAll} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <Card className={
          messageType === "success" ? "border-green-200 bg-green-50" :
          messageType === "error" ? "border-red-200 bg-red-50" :
          "border-blue-200 bg-blue-50"
        }>
          <CardContent className="py-3 text-sm">{message}</CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Items Below Minimum
            </CardDescription>
            <CardTitle className="text-2xl text-orange-600">
              {loading ? <Skeleton className="h-8 w-16" /> : fmtNum(summary?.totalItemsBelowMin || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {fmtNum(criticalItems.length)} critical, {fmtNum(lowItems.length)} low stock
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Reorder Value
            </CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {loading ? <Skeleton className="h-8 w-24" /> : rupiah(summary?.totalReorderValue || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">total nilai perlu di-reorder</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <ShoppingCart className="h-3 w-3" /> Pending PO
            </CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {loading ? <Skeleton className="h-8 w-16" /> : fmtNum(summary?.pendingPOs || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {rupiah(pendingPOs?.totalValue || 0)} nilai pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <ClipboardList className="h-3 w-3" /> Reorder Alerts
            </CardDescription>
            <CardTitle className="text-2xl">
              {loading ? <Skeleton className="h-8 w-16" /> : fmtNum(summary?.totalAlerts || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {fmtNum(summary?.newAlerts || 0)} new, {fmtNum(summary?.poCreated || 0)} PO created
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
          <TabsTrigger value="alerts">🔔 Reorder Alerts ({alerts.length})</TabsTrigger>
          <TabsTrigger value="purchase-orders">🧾 Purchase Orders ({allPOs.length})</TabsTrigger>
          <TabsTrigger value="inventory">📦 Inventory Status ({inventory.length})</TabsTrigger>
        </TabsList>

        {/* ── Tab: Dashboard ── */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Items Below Minimum */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingDown className="h-5 w-5 text-orange-500" />
                  Items Below Minimum
                </CardTitle>
                <CardDescription>Perlu segera di-reorder</CardDescription>
              </CardHeader>
              <CardContent>
                {itemsBelowMin.length === 0 ? (
                  <EmptyState
                    icon="✅"
                    title="Semua stok aman"
                    description="Tidak ada item di bawah minimum qty"
                  />
                ) : (
                  <div className="space-y-2">
                    {itemsBelowMin.slice(0, 8).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-md border bg-card"
                      >
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.sku} · {item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-600">
                            {fmtNum(item.qty)} / {fmtNum(item.minimumQty)}
                          </p>
                          <p className="text-xs text-muted-foreground">{item.unit}</p>
                        </div>
                      </div>
                    ))}
                    {itemsBelowMin.length > 8 && (
                      <p className="text-xs text-muted-foreground text-center pt-1">
                        +{itemsBelowMin.length - 8} item lainnya
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Recent Alerts
                </CardTitle>
                <CardDescription>Alert terbaru dari sistem</CardDescription>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <EmptyState
                    icon="✅"
                    title="Tidak ada alert"
                    description="Generate alerts dari Inventory_Master"
                  />
                ) : (
                  <div className="space-y-2">
                    {alerts.slice(0, 8).map((alert) => (
                      <div
                        key={alert.alertId}
                        className="flex items-center justify-between p-2 rounded-md border bg-card"
                      >
                        <div>
                          <p className="text-sm font-medium">{alert.itemName}</p>
                          <p className="text-xs text-muted-foreground">{alert.alertId}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {alertStatusBadge(alert.status)}
                          {alert.status === "New" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setSelectedAlert(alert); setShowGeneratePO(true); }}
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleGenerateAlerts} disabled={saving} variant="default">
                  <AlertTriangle className="h-4 w-4 mr-1" /> Generate Alerts dari Inventory
                </Button>
                <Button onClick={() => setShowCreatePO(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-1" /> Buat PO Manual
                </Button>
                <Button onClick={() => { setActiveTab("alerts"); }} variant="outline">
                  <Eye className="h-4 w-4 mr-1" /> Lihat Semua Alerts
                </Button>
                <Button onClick={() => { setActiveTab("purchase-orders"); }} variant="outline">
                  <ShoppingCart className="h-4 w-4 mr-1" /> Lihat Purchase Orders
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Reorder Alerts ── */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Reorder Alerts
                </CardTitle>
                <CardDescription>
                  {fmtNum(alerts.length)} alerts — {fmtNum(alerts.filter((a) => a.status === "New").length)} new
                </CardDescription>
              </div>
              <Button onClick={handleGenerateAlerts} disabled={saving} size="sm">
                <AlertTriangle className="h-4 w-4 mr-1" /> Generate Alerts
              </Button>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <EmptyState
                  icon="🔔"
                  title="Belum ada reorder alerts"
                  description="Klik 'Generate Alerts' untuk scan Inventory_Master dan buat alert otomatis untuk item di bawah minimum."
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Alert ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Current</TableHead>
                        <TableHead className="text-right">Min</TableHead>
                        <TableHead className="text-right">Reorder Qty</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead className="text-right">Est. Cost</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>PO Number</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alerts.map((alert) => (
                        <TableRow key={alert.alertId}>
                          <TableCell className="font-mono text-xs">{alert.alertId}</TableCell>
                          <TableCell>{alert.date}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{alert.itemName}</p>
                              <p className="text-xs text-muted-foreground">{alert.itemId}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">{fmtNum(alert.currentQty)}</TableCell>
                          <TableCell className="text-right font-mono">{fmtNum(alert.minimumQty)}</TableCell>
                          <TableCell className="text-right font-mono">{fmtNum(alert.reorderQty)}</TableCell>
                          <TableCell className="text-sm">{alert.supplier}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{rupiah(alert.totalCost)}</TableCell>
                          <TableCell>{alertStatusBadge(alert.status)}</TableCell>
                          <TableCell className="font-mono text-xs">{alert.poNumber || "—"}</TableCell>
                          <TableCell className="text-right">
                            {alert.status === "New" && (
                              <Button
                                size="sm"
                                onClick={() => { setSelectedAlert(alert); setShowGeneratePO(true); }}
                              >
                                Generate PO
                              </Button>
                            )}
                            {alert.status === "PO Created" && (
                              <Badge className="bg-purple-100 text-purple-700">PO: {alert.poNumber}</Badge>
                            )}
                            {alert.status === "Received" && (
                              <CheckCircle className="h-4 w-4 text-green-600 inline" />
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
        <TabsContent value="purchase-orders" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Purchase Orders
                </CardTitle>
                <CardDescription>
                  {fmtNum(allPOs.length)} pending PO — {rupiah(pendingPOs?.totalValue || 0)} total value
                </CardDescription>
              </div>
              <Button onClick={() => setShowCreatePO(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Buat PO
              </Button>
            </CardHeader>
            <CardContent>
              {allPOs.length === 0 ? (
                <EmptyState
                  icon="🧾"
                  title="Belum ada Purchase Orders"
                  description="Buat PO manual atau generate dari reorder alerts."
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PO ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Cost</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expected</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allPOs.map((po) => (
                        <TableRow key={po.id}>
                          <TableCell className="font-mono text-xs">{po.id}</TableCell>
                          <TableCell>{po.date}</TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{po.supplierName}</p>
                              <p className="text-xs text-muted-foreground">{po.supplierId}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{po.itemName}</p>
                              <p className="text-xs text-muted-foreground">{po.itemId}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">{fmtNum(po.quantity)} {po.unit}</TableCell>
                          <TableCell className="text-right font-mono">{rupiah(po.unitCost)}</TableCell>
                          <TableCell className="text-right font-mono font-medium">{rupiah(po.total)}</TableCell>
                          <TableCell>{poStatusBadge(po.status)}</TableCell>
                          <TableCell>{po.expectedDate || "—"}</TableCell>
                          <TableCell className="text-right">
                            {["ordered", "partial", "draft"].includes(po.status) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedPO(po);
                                  setReceiveForm({
                                    poNumber: po.id,
                                    itemId: po.itemId,
                                    itemName: po.itemName,
                                    qtyReceived: po.quantity,
                                    unitCost: po.unitCost,
                                    condition: "Good",
                                    notes: "",
                                  });
                                  setShowReceiveItems(true);
                                }}
                              >
                                <Truck className="h-3 w-3 mr-1" /> Receive
                              </Button>
                            )}
                            {po.status === "received" && (
                              <CheckCircle className="h-4 w-4 text-green-600 inline" />
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

          {/* Receipts History */}
          {receipts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClipboardList className="h-5 w-5" />
                  Goods Receipts ({receipts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>PO Number</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receipts.map((r) => (
                        <TableRow key={r.receiptId}>
                          <TableCell className="font-mono text-xs">{r.receiptId}</TableCell>
                          <TableCell>{r.date}</TableCell>
                          <TableCell className="font-mono text-xs">{r.poNumber}</TableCell>
                          <TableCell>{r.itemName}</TableCell>
                          <TableCell className="text-right font-mono">{fmtNum(r.qtyReceived)}</TableCell>
                          <TableCell className="text-right font-mono">{rupiah(r.totalCost)}</TableCell>
                          <TableCell>{conditionBadge(r.condition)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{r.notes || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab: Inventory Status ── */}
        <TabsContent value="inventory" className="space-y-4">
          {/* Summary */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardDescription>✅ OK</CardDescription>
                <CardTitle className="text-2xl text-green-700">{fmtNum(okItems.length)}</CardTitle>
              </CardHeader>
              <CardContent><p className="text-xs text-muted-foreground">di atas minimum</p></CardContent>
            </Card>
            <Card className="border-yellow-200">
              <CardHeader className="pb-2">
                <CardDescription>⚠️ Low</CardDescription>
                <CardTitle className="text-2xl text-yellow-700">{fmtNum(lowItems.length)}</CardTitle>
              </CardHeader>
              <CardContent><p className="text-xs text-muted-foreground">di bawah minimum</p></CardContent>
            </Card>
            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardDescription>🔴 Critical</CardDescription>
                <CardTitle className="text-2xl text-red-700">{fmtNum(criticalItems.length)}</CardTitle>
              </CardHeader>
              <CardContent><p className="text-xs text-muted-foreground">&lt; 50% minimum</p></CardContent>
            </Card>
          </div>

          {/* Full Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Full Inventory Status
              </CardTitle>
              <CardDescription>{fmtNum(inventory.length)} items dari Inventory_Master</CardDescription>
            </CardHeader>
            <CardContent>
              {inventory.length === 0 ? (
                <EmptyState
                  icon="📦"
                  title="Belum ada inventory data"
                  description="Data inventory akan muncul dari Google Sheets Inventory_Master."
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Min</TableHead>
                        <TableHead className="text-right">Reorder Qty</TableHead>
                        <TableHead className="text-right">Unit Cost</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventory.map((item) => {
                        const s = item.qty <= 0 ? "empty"
                          : item.qty <= item.minimumQty * 0.5 ? "critical"
                          : item.qty <= item.minimumQty ? "low"
                          : "ok";
                        return (
                          <TableRow
                            key={item.id}
                            className={
                              s === "empty" ? "bg-red-50" :
                              s === "critical" ? "bg-orange-50" :
                              s === "low" ? "bg-yellow-50" : ""
                            }
                          >
                            <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                            <TableCell className="font-medium text-sm">{item.name}</TableCell>
                            <TableCell className="text-sm">{item.category}</TableCell>
                            <TableCell className={`text-right font-mono ${s !== "ok" ? "font-bold text-red-600" : ""}`}>
                              {fmtNum(item.qty)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-muted-foreground">
                              {fmtNum(item.minimumQty)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {fmtNum(item.reorderQty)}
                            </TableCell>
                            <TableCell className="text-right font-mono">{rupiah(item.unitCost)}</TableCell>
                            <TableCell className="text-sm">{item.supplier}</TableCell>
                            <TableCell className="text-sm">{item.location}</TableCell>
                            <TableCell>{stockStatusBadge(s)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}