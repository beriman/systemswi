"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
import { X, Pencil, Trash2, Plus, ArrowDownCircle, ArrowUpCircle, RefreshCw, AlertTriangle, Package, DollarSign, Warehouse } from "lucide-react";

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
  lastMovementAt: string;
  notes: string;
};

type Movement = {
  id: string;
  timestamp: string;
  date: string;
  itemId: string;
  sku: string;
  type: string;
  quantity: number;
  reference: string;
  proofUrl: string;
  pic: string;
  notes: string;
};

type InventoryResponse = {
  source: string;
  sourceStatus?: "live" | "degraded" | "blocked";
  warning?: string;
  items: InventoryItem[];
  movements: Movement[];
  summary: {
    totalItems: number;
    totalValue: number;
    alertCount: number;
    lowStockCount: number;
    criticalCount: number;
    alerts: InventoryItem[];
    merchandise?: {
      totalItems: number;
      totalValue: number;
      alertCount: number;
      reorderPlan: Array<{
        id: string; sku: string; name: string; vendor: string; location: string;
        qty: number; unit: string; minimumQty: number; reorderQty: number;
        status: string; notes: string;
      }>;
    };
  };
};

/* ── Helpers ── */

const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);

const fmtNum = (value: number) =>
  new Intl.NumberFormat("id-ID").format(value || 0);

const statusClass: Record<string, string> = {
  ok: "bg-green-100 text-green-700",
  low: "bg-yellow-100 text-yellow-700",
  critical: "bg-orange-100 text-orange-700",
  empty: "bg-red-100 text-red-700",
};

function stockStatusBadge(status: string) {
  return <Badge className={statusClass[status] || "bg-gray-100 text-gray-700"}>{status}</Badge>;
}

function isMerchandiseItem(item: InventoryItem) {
  const haystack = `${item.category} ${item.sku} ${item.name} ${item.location} ${item.notes}`.toLowerCase();
  return haystack.includes("merch") || haystack.includes("tim") || haystack.includes("apparel") || haystack.includes("retail");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const CATEGORIES = ["raw_material", "packaging", "finished_good", "merchandise", "retail_merch", "other"];
const CATEGORY_LABELS: Record<string, string> = {
  raw_material: "Bahan Baku",
  packaging: "Packaging",
  finished_good: "Barang Jadi",
  merchandise: "Merchandise",
  retail_merch: "Retail Merch",
  other: "Lainnya",
};

/* ── Main Component ── */

export default function InventoryPage() {
  const [data, setData] = useState<InventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "merchandise">("all");
  const [activeTab, setActiveTab] = useState("master");
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadInventory() {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal load inventory");
      setData(json);
    } catch (error) {
      setMessage(String(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInventory().catch((error) => {
      setMessage(String(error));
      setLoading(false);
    });
  }, []);

  const visibleItems = useMemo(() => {
    const items = data?.items || [];
    return viewMode === "merchandise" ? items.filter(isMerchandiseItem) : items;
  }, [data?.items, viewMode]);

  async function submitMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      itemId: form.get("itemId"),
      type: form.get("type"),
      quantity: form.get("quantity"),
      reference: form.get("reference"),
      proofUrl: form.get("proofUrl"),
      pic: form.get("pic"),
      notes: form.get("notes"),
    };
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal simpan movement");
      setMessage(`✅ Movement tersimpan: ${json.item.name} sekarang ${json.item.qty} ${json.item.unit}`);
      event.currentTarget.reset();
      await loadInventory();
    } catch (error) {
      setMessage(`❌ ${String(error)}`);
    } finally {
      setSaving(false);
    }
  }

  async function saveItem(e: FormEvent<HTMLFormElement>, isEdit: boolean) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const payload: Record<string, string | number> = {
      name: String(form.get("name") || ""),
      sku: String(form.get("sku") || ""),
      category: String(form.get("category") || "raw_material"),
      unit: String(form.get("unit") || "pcs"),
      qty: Number(form.get("qty") || 0),
      minimumQty: Number(form.get("minimumQty") || 0),
      reorderQty: Number(form.get("reorderQty") || 0),
      unitCost: Number(form.get("unitCost") || 0),
      supplier: String(form.get("supplier") || ""),
      location: String(form.get("location") || ""),
      notes: String(form.get("notes") || ""),
    };
    if (isEdit && editItem) {
      payload.id = editItem.id;
    }
    try {
      const res = await fetch("/api/inventory/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal simpan item");
      setMessage(`✅ ${isEdit ? "Item diupdate" : "Item baru ditambahkan"}: ${json.item?.name || payload.name}`);
      setEditItem(null);
      setShowAddItem(false);
      await loadInventory();
    } catch (error) {
      setMessage(`❌ ${String(error)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteItem(id: string) {
    if (!confirm("Hapus item ini dari Inventory_Master?")) return;
    setDeleting(id);
    setMessage("");
    try {
      const res = await fetch("/api/inventory/items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal hapus item");
      setMessage(`✅ Item dihapus`);
      await loadInventory();
    } catch (error) {
      setMessage(`❌ ${String(error)}`);
    } finally {
      setDeleting(null);
    }
  }

  const summary = data?.summary;
  const alerts = data?.summary.alerts || [];

  return (
    <div className="space-y-6">
      {/* Edit Item Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Edit Item</CardTitle>
                <CardDescription>{editItem.sku} — {editItem.name}</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEditItem(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => saveItem(e, true)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">SKU</Label>
                    <input name="sku" defaultValue={editItem.sku} required className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Nama Item</Label>
                    <input name="name" defaultValue={editItem.name} required className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Kategori</Label>
                    <select name="category" defaultValue={editItem.category} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Unit</Label>
                    <input name="unit" defaultValue={editItem.unit} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Qty</Label>
                    <input name="qty" type="number" defaultValue={editItem.qty} min={0} step="0.01" className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Minimum</Label>
                    <input name="minimumQty" type="number" defaultValue={editItem.minimumQty} min={0} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Reorder Qty</Label>
                    <input name="reorderQty" type="number" defaultValue={editItem.reorderQty} min={0} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Unit Cost (Rp)</Label>
                    <input name="unitCost" type="number" defaultValue={editItem.unitCost} min={0} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Supplier</Label>
                    <input name="supplier" defaultValue={editItem.supplier} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">Lokasi</Label>
                  <input name="location" defaultValue={editItem.location} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">Catatan</Label>
                  <textarea name="notes" rows={2} defaultValue={editItem.notes} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setEditItem(null)}>Batal</Button>
                  <Button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "💾 Simpan"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tambah Item Baru</CardTitle>
                <CardDescription>Tambah item ke Inventory Master</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAddItem(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => saveItem(e, false)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">SKU *</Label>
                    <input name="sku" required placeholder="RM-ALC-96" className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Nama Item *</Label>
                    <input name="name" required placeholder="Alcohol 96%" className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Kategori</Label>
                    <select name="category" defaultValue="raw_material" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Unit</Label>
                    <input name="unit" defaultValue="pcs" className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Qty Awal</Label>
                    <input name="qty" type="number" defaultValue={0} min={0} step="0.01" className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Minimum</Label>
                    <input name="minimumQty" type="number" defaultValue={0} min={0} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Reorder Qty</Label>
                    <input name="reorderQty" type="number" defaultValue={0} min={0} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Unit Cost (Rp)</Label>
                    <input name="unitCost" type="number" defaultValue={0} min={0} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Supplier</Label>
                    <input name="supplier" placeholder="TBA" className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">Lokasi</Label>
                  <input name="location" placeholder="Gudang Produksi" className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">Catatan</Label>
                  <textarea name="notes" rows={2} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowAddItem(false)}>Batal</Button>
                  <Button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "💾 Tambah Item"}</Button>
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
            <Warehouse className="h-6 w-6" />
            Inventory & Stok
          </h2>
          <p className="text-muted-foreground">
            Master stok bahan baku, packaging, barang jadi & merchandise — real-time dari Google Sheets.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddItem(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Tambah Item
          </Button>
          <Button onClick={loadInventory} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {message && (
        <Card className={message.startsWith("✅") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardContent className="py-3 text-sm">{message}</CardContent>
        </Card>
      )}

      {data?.sourceStatus === "degraded" && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-3 text-sm text-yellow-800">
            ⚠️ Google OAuth perlu re-auth. Data inventory mungkin tidak lengkap.
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Package className="h-3 w-3" /> Total SKU</CardDescription>
            <CardTitle className="text-2xl">{loading ? "..." : fmtNum(summary?.totalItems || 0)}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">bahan, packaging, barang jadi, merch</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Nilai Inventory</CardDescription>
            <CardTitle className="text-2xl">{loading ? "..." : rupiah(summary?.totalValue || 0)}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">qty × unit cost</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Alert Stok</CardDescription>
            <CardTitle className="text-2xl">{(summary?.lowStockCount || 0) + (summary?.criticalCount || 0)}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">{summary?.lowStockCount || 0} low, {summary?.criticalCount || 0} critical/empty</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Merch TIM</CardDescription>
            <CardTitle className="text-2xl">{loading ? "..." : fmtNum(summary?.merchandise?.totalItems || 0)}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">{rupiah(summary?.merchandise?.totalValue || 0)} nilai retail</p></CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("all")}
        >
          Semua SKU
        </Button>
        <Button
          variant={viewMode === "merchandise" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("merchandise")}
        >
          Merch TIM
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="master">Master Stok</TabsTrigger>
          <TabsTrigger value="movement">Input Movement</TabsTrigger>
          <TabsTrigger value="alerts">Alert Restock ({alerts.length})</TabsTrigger>
          <TabsTrigger value="recent">Recent Movements</TabsTrigger>
        </TabsList>

        {/* Master Stok */}
        <TabsContent value="master" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{viewMode === "merchandise" ? "Master Stok Merch TIM" : "Master Stok"}</CardTitle>
              <CardDescription>{visibleItems.length} SKU — data real-time dari Google Sheets</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : visibleItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Min</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Unit Cost</TableHead>
                        <TableHead className="text-right">Nilai</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Lokasi</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-muted-foreground">{item.sku}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[item.category] || item.category}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{fmtNum(item.qty)} {item.unit}</TableCell>
                          <TableCell className="text-right">{fmtNum(item.minimumQty)}</TableCell>
                          <TableCell>{stockStatusBadge(item.status)}</TableCell>
                          <TableCell className="text-right">{rupiah(item.unitCost)}</TableCell>
                          <TableCell className="text-right font-medium">{rupiah(item.qty * item.unitCost)}</TableCell>
                          <TableCell className="text-sm">{item.supplier || "TBA"}</TableCell>
                          <TableCell className="text-sm">{item.location || "TBA"}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setEditItem(item)} title="Edit">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={deleting === item.id}
                                className="text-red-500 hover:text-red-700"
                                title="Hapus"
                              >
                                {deleting === item.id ? "..." : <Trash2 className="h-3.5 w-3.5" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState title="Belum ada item" description="Tambah item inventory untuk mulai tracking stok." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Input Movement */}
        <TabsContent value="movement" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Input Movement</CardTitle>
              <CardDescription>Catat stok masuk, keluar, atau adjustment — langsung tersimpan ke Google Sheets.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitMovement} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Item *</Label>
                    <select name="itemId" required className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                      <option value="">Pilih item</option>
                      {(data?.items || []).map((item) => (
                        <option key={item.id} value={item.id}>{item.name} — {item.qty} {item.unit}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Tipe Movement *</Label>
                    <select name="type" required className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                      <option value="in">Masuk (In)</option>
                      <option value="out">Keluar (Out)</option>
                      <option value="adjustment">Adjustment Qty Final</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Quantity *</Label>
                    <input name="quantity" required type="number" min="0.01" step="0.01" className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Referensi PO/Batch/Invoice</Label>
                    <input name="reference" placeholder="PO-20260610-001 / BATCH-ARC" className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Proof URL</Label>
                    <input name="proofUrl" placeholder="Drive URL bukti pembelian / QC" className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">PIC</Label>
                    <input name="pic" defaultValue="HemuHemu/OWL" className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">Catatan</Label>
                  <textarea name="notes" rows={2} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Menyimpan..." : "💾 Simpan Movement"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts */}
        <TabsContent value="alerts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Alert Restock
              </CardTitle>
              <CardDescription>Item dengan stok di bawah minimum atau critical.</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.sku} • {CATEGORY_LABELS[item.category] || item.category}</div>
                      </div>
                      <div className="text-right">
                        {stockStatusBadge(item.status)}
                        <div className="text-xs text-muted-foreground mt-1">
                          Stok {item.qty} {item.unit} / min {item.minimumQty}
                        </div>
                        <div className="text-xs text-amber-600">Reorder disarankan: {item.reorderQty} {item.unit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="Tidak ada alert" description="Semua stok dalam batas aman." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Movements */}
        <TabsContent value="recent" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Movements</CardTitle>
              <CardDescription>30 movement terakhir dari Google Sheets.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : (data?.movements || []).length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Ref</TableHead>
                        <TableHead>PIC</TableHead>
                        <TableHead>Proof</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data?.movements || []).map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="text-sm">{m.date || m.timestamp?.slice(0, 10)}</TableCell>
                          <TableCell className="text-sm font-mono">{m.sku || m.itemId}</TableCell>
                          <TableCell>
                            <Badge variant={m.type === "in" ? "default" : m.type === "out" ? "destructive" : "secondary"} className="text-xs">
                              {m.type === "in" ? "↓ Masuk" : m.type === "out" ? "↑ Keluar" : "↔ Adj"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm">{m.quantity}</TableCell>
                          <TableCell className="text-sm">{m.reference || "-"}</TableCell>
                          <TableCell className="text-sm">{m.pic || "-"}</TableCell>
                          <TableCell className="text-sm">
                            {m.proofUrl ? <a href={m.proofUrl} className="text-blue-500 hover:underline" target="_blank">open</a> : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState title="Belum ada movement" description="Catat stok masuk/keluar untuk mulai tracking." />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
