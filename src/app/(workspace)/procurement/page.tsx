"use client";

import { FormEvent, useEffect, useMemo, useState, useCallback } from "react";
import { Pencil, Trash2, Plus, Package, ShoppingCart, FileCheck, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Supplier = {
  id: string;
  name: string;
  category: string;
  contact: string;
  channel: string;
  leadTimeDays: number;
  rating: number;
  status: string;
  lastPo: string;
  notes: string;
  governanceVendorId?: string;
  relatedParty?: string;
  benchmarkComplete?: boolean;
  riskFlags?: string[];
  approvalRequirement?: string;
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

type Receipt = {
  timestamp: string;
  id: string;
  poId: string;
  date: string;
  itemId: string;
  sku: string;
  quantity: number;
  qcStatus: "pending" | "passed" | "failed";
  qcNotes: string;
  proofUrl: string;
  pic: string;
  movementRef: string;
  notes: string;
};

type ProcurementData = {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  receipts: Receipt[];
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

const statusBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  draft: "secondary",
  ordered: "default",
  partial: "warning",
  received: "success",
  cancelled: "destructive",
  pending: "secondary",
  passed: "success",
  failed: "destructive",
};

const statusLabel: Record<string, string> = {
  draft: "Draft",
  ordered: "Ordered",
  partial: "Partial",
  received: "Received",
  cancelled: "Cancelled",
  pending: "Pending",
  passed: "Passed",
  failed: "Failed",
};

function SupplierForm({ onSave, onCancel }: {
  onSave: (data: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [contact, setContact] = useState("");
  const [channel, setChannel] = useState("WhatsApp");
  const [leadTimeDays, setLeadTimeDays] = useState("7");
  const [rating, setRating] = useState("3");
  const [status, setStatus] = useState("active");
  const [relatedParty, setRelatedParty] = useState("No");
  const [relationshipDetail, setRelationshipDetail] = useState("");
  const [priceBenchmark1, setPriceBenchmark1] = useState("");
  const [priceBenchmark2, setPriceBenchmark2] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [paymentTerm, setPaymentTerm] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      name, category, contact, channel, leadTimeDays, rating, status,
      relatedParty, relationshipDetail, priceBenchmark1, priceBenchmark2, selectedReason, paymentTerm,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="supplier-name">Nama Supplier</Label>
          <Input id="supplier-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="PT. Sumber Wangi" />
        </div>
        <div>
          <Label htmlFor="supplier-category">Kategori</Label>
          <Input id="supplier-category" value={category} onChange={(e) => setCategory(e.target.value)} required placeholder="Chemical, Packaging, Operational" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="supplier-contact">Kontak (WA/Email)</Label>
          <Input id="supplier-contact" value={contact} onChange={(e) => setContact(e.target.value)} required placeholder="08123456789" />
        </div>
        <div>
          <Label htmlFor="supplier-channel">Channel</Label>
          <Input id="supplier-channel" value={channel} onChange={(e) => setChannel(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="supplier-leadtime">Lead Time (hari)</Label>
          <Input id="supplier-leadtime" type="number" min="1" value={leadTimeDays} onChange={(e) => setLeadTimeDays(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="supplier-rating">Rating (1-5)</Label>
          <Input id="supplier-rating" type="number" min="1" max="5" value={rating} onChange={(e) => setRating(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="supplier-status">Status</Label>
          <Input id="supplier-status" value={status} onChange={(e) => setStatus(e.target.value)} />
        </div>
      </div>
      <div className="rounded-lg border bg-amber-50 p-3 text-xs text-amber-900">
        <b>Vendor_Register GCG:</b> supplier baru otomatis masuk Vendor_Register status Trial. Jika related party atau transaksi besar, isi relasi, 2 benchmark, alasan pemilihan, dan payment term sebelum PO/approval.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="supplier-related-party">Related Party?</Label>
          <select
            id="supplier-related-party"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            value={relatedParty}
            onChange={(e) => setRelatedParty(e.target.value)}
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>
        <div>
          <Label htmlFor="supplier-payment-term">Payment Term</Label>
          <Input id="supplier-payment-term" value={paymentTerm} onChange={(e) => setPaymentTerm(e.target.value)} placeholder="DP / Lunas / Net 7 / TBA" />
        </div>
      </div>
      <div>
        <Label htmlFor="supplier-relationship">Detail Relasi / COI</Label>
        <Input id="supplier-relationship" value={relationshipDetail} onChange={(e) => setRelationshipDetail(e.target.value)} placeholder="Tidak ada / teman / keluarga / afiliasi bisnis" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="supplier-benchmark-1">Benchmark Harga 1</Label>
          <Input id="supplier-benchmark-1" value={priceBenchmark1} onChange={(e) => setPriceBenchmark1(e.target.value)} placeholder="Nominal/link pembanding 1" />
        </div>
        <div>
          <Label htmlFor="supplier-benchmark-2">Benchmark Harga 2</Label>
          <Input id="supplier-benchmark-2" value={priceBenchmark2} onChange={(e) => setPriceBenchmark2(e.target.value)} placeholder="Nominal/link pembanding 2" />
        </div>
      </div>
      <div>
        <Label htmlFor="supplier-selected-reason">Alasan Pemilihan</Label>
        <Textarea id="supplier-selected-reason" value={selectedReason} onChange={(e) => setSelectedReason(e.target.value)} rows={2} placeholder="Harga/kualitas/waktu terbaik; tulis TBA jika belum dibandingkan" />
      </div>
      <div>
        <Label htmlFor="supplier-notes">Catatan</Label>
        <Textarea id="supplier-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit">Simpan Supplier</Button>
      </DialogFooter>
    </form>
  );
}

function PoForm({ suppliers, onSubmit, onCancel }: {
  suppliers: Supplier[];
  onSubmit: (data: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [supplierId, setSupplierId] = useState("");
  const [itemId, setItemId] = useState("");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("unit");
  const [unitCost, setUnitCost] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      supplierId, itemId, itemName, quantity, unit, unitCost, expectedDate, proofUrl, notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="po-supplier">Supplier</Label>
        <select
          id="po-supplier"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          required
        >
          <option value="">Pilih Supplier</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name} — {s.category}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="po-itemid">Item ID / SKU</Label>
          <Input id="po-itemid" value={itemId} onChange={(e) => setItemId(e.target.value)} required placeholder="RM-ESS-001" />
        </div>
        <div>
          <Label htmlFor="po-itemname">Nama Item</Label>
          <Input id="po-itemname" value={itemName} onChange={(e) => setItemName(e.target.value)} required placeholder="Essential Oil TBA" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="po-qty">Qty</Label>
          <Input id="po-qty" type="number" min="0.01" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="po-unit">Unit</Label>
          <Input id="po-unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="po-cost">Unit Cost (Rp)</Label>
          <Input id="po-cost" type="number" min="0" step="1" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="po-eta">Expected Date</Label>
        <Input id="po-eta" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="po-proof">Proof / Invoice URL</Label>
        <Input id="po-proof" value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} placeholder="Drive URL" />
      </div>
      <div>
        <Label htmlFor="po-notes">Catatan</Label>
        <Textarea id="po-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit">Simpan PO</Button>
      </DialogFooter>
    </form>
  );
}

function ReceiptForm({ purchaseOrders, onSubmit, onCancel }: {
  purchaseOrders: PurchaseOrder[];
  onSubmit: (data: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [poId, setPoId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [qcStatus, setQcStatus] = useState("pending");
  const [qcNotes, setQcNotes] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [pic, setPic] = useState("HemuHemu/OWL");
  const [notes, setNotes] = useState("");

  const selectedPo = purchaseOrders.find((po) => po.id === poId);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      poId, quantity, qcStatus, qcNotes, proofUrl, pic, notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="rcv-po">Purchase Order</Label>
        <select
          id="rcv-po"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          value={poId}
          onChange={(e) => setPoId(e.target.value)}
          required
        >
          <option value="">Pilih PO</option>
          {purchaseOrders.map((po) => (
            <option key={po.id} value={po.id}>{po.id} — {po.itemName} ({po.supplierName})</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="rcv-qty">Qty Received</Label>
          <Input id="rcv-qty" type="number" min="0.01" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} required defaultValue={selectedPo?.quantity || ""} />
        </div>
        <div>
          <Label htmlFor="rcv-qc">QC Status</Label>
          <select
            id="rcv-qc"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            value={qcStatus}
            onChange={(e) => setQcStatus(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="rcv-qcnotes">QC Notes</Label>
        <Textarea id="rcv-qcnotes" value={qcNotes} onChange={(e) => setQcNotes(e.target.value)} rows={2} placeholder="Batch diterima, COA/expiry/fisik dicek" />
      </div>
      <div>
        <Label htmlFor="rcv-proof">Proof URL</Label>
        <Input id="rcv-proof" value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} placeholder="Drive URL surat jalan/foto barang/QC" />
      </div>
      <div>
        <Label htmlFor="rcv-pic">PIC</Label>
        <Input id="rcv-pic" value={pic} onChange={(e) => setPic(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="rcv-notes">Catatan Tambahan</Label>
        <Textarea id="rcv-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit">Simpan Receiving</Button>
      </DialogFooter>
    </form>
  );
}

export default function ProcurementPage() {
  const [data, setData] = useState<ProcurementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState("suppliers");

  // Dialog states
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [showPoDialog, setShowPoDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const loadProcurement = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/procurement", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal load procurement");
      setData({
        suppliers: json.suppliers || [],
        purchaseOrders: json.purchaseOrders || [],
        receipts: json.receipts || [],
      });
    } catch (error) {
      setMessage({ type: "error", text: `❌ ${String(error)}` });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load is intentionally started on mount.
    loadProcurement();
  }, [loadProcurement]);

  const openPos = useMemo(
    () => data?.purchaseOrders.filter((po) => po.status !== "received" && po.status !== "cancelled") || [],
    [data?.purchaseOrders]
  );

  const stats = useMemo(() => {
    const suppliers = data?.suppliers || [];
    const pos = data?.purchaseOrders || [];
    const receipts = data?.receipts || [];
    const open = pos.filter((po) => ["draft", "ordered", "partial"].includes(po.status));
    return {
      totalSuppliers: suppliers.length,
      openPo: open.length,
      pendingReceipts: open.filter((po) => po.status !== "received").length,
      totalPoValue: open.reduce((sum, po) => sum + po.total, 0),
      qcFailed: receipts.filter((r) => r.qcStatus === "failed").length,
    };
  }, [data]);

  async function handleSaveSupplier(formData: Record<string, string>) {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        action: editingSupplier ? "update-supplier" : "create-supplier",
        ...editingSupplier ? { supplierId: editingSupplier.id } : {},
        ...formData,
      };
      const res = await fetch("/api/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan supplier");
      setMessage({ type: "success", text: `✅ Supplier ${formData.name} berhasil disimpan` });
      setShowSupplierDialog(false);
      setEditingSupplier(null);
      await loadProcurement();
    } catch (error) {
      setMessage({ type: "error", text: `❌ ${String(error)}` });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSupplier(supplierId: string) {
    if (!confirm("Hapus supplier ini?")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-supplier", supplierId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus supplier");
      setMessage({ type: "success", text: "✅ Supplier berhasil dihapus" });
      await loadProcurement();
    } catch (error) {
      setMessage({ type: "error", text: `❌ ${String(error)}` });
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitPo(formData: Record<string, string>) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-po", ...formData }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat PO");
      setMessage({ type: "success", text: `✅ PO dibuat: ${json.po?.id || ""} — ${formatRupiah(json.po?.total || 0)}` });
      setShowPoDialog(false);
      await loadProcurement();
    } catch (error) {
      setMessage({ type: "error", text: `❌ ${String(error)}` });
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitReceipt(formData: Record<string, string>) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "receive", ...formData }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan receiving");
      setMessage({ type: "success", text: `✅ Receiving tersimpan: ${json.receipt?.id || ""}, QC ${json.receipt?.qcStatus || ""}` });
      setShowReceiptDialog(false);
      await loadProcurement();
    } catch (error) {
      setMessage({ type: "error", text: `❌ ${String(error)}` });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePo(poId: string) {
    if (!confirm("Hapus PO ini?")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-po", poId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus PO");
      setMessage({ type: "success", text: "✅ PO berhasil dihapus" });
      await loadProcurement();
    } catch (error) {
      setMessage({ type: "error", text: `❌ ${String(error)}` });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Procurement & PO
          </h2>
          <p className="text-muted-foreground">
            Supplier management, purchase orders, goods receipts — source of truth Google Sheets
          </p>
        </div>
        <Button variant="outline" onClick={loadProcurement} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm border ${
          message.type === "success"
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-3 text-xs underline">Tutup</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Package className="h-3 w-3" /> Total Suppliers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
            <div className="text-xs text-muted-foreground">vendor aktif</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <ShoppingCart className="h-3 w-3" /> Open PO
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openPo}</div>
            <div className="text-xs text-muted-foreground">draft/ordered/partial</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Truck className="h-3 w-3" /> Pending Receipt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReceipts}</div>
            <div className="text-xs text-muted-foreground">perlu follow up</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <FileCheck className="h-3 w-3" /> Total PO Value
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(stats.totalPoValue)}</div>
            <div className="text-xs text-muted-foreground">open PO bulan ini</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="po">Purchase Orders</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
          <TabsTrigger value="master">Supplier Master</TabsTrigger>
        </TabsList>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Supplier List</CardTitle>
                <CardDescription>Daftar semua supplier terdaftar di Google Sheets</CardDescription>
              </div>
              <Dialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setEditingSupplier(null)}>
                    <Plus className="h-4 w-4 mr-1" /> Supplier
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingSupplier ? "Edit Supplier" : "Tambah Supplier Baru"}</DialogTitle>
                    <DialogDescription>Form supplier — data langsung ditulis ke sheet Supplier_Master</DialogDescription>
                  </DialogHeader>
                  <SupplierForm
                    onSave={handleSaveSupplier}
                    onCancel={() => { setShowSupplierDialog(false); setEditingSupplier(null); }}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Lead Time</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vendor GCG</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : !data?.suppliers.length ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Belum ada supplier. Tambah supplier pertama.</TableCell></TableRow>
                  ) : (
                    data?.suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.category}</TableCell>
                        <TableCell className="text-sm">{supplier.contact}</TableCell>
                        <TableCell>{supplier.leadTimeDays} hari</TableCell>
                        <TableCell>{"★".repeat(supplier.rating || 0)}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant[supplier.status] || "secondary"}>
                            {statusLabel[supplier.status] || supplier.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={supplier.riskFlags?.length ? "warning" : "success"}>
                              {supplier.governanceVendorId ? "Terdaftar" : "Belum Register"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Related: {supplier.relatedParty || "Belum dicatat"} • Benchmark: {supplier.benchmarkComplete ? "Lengkap" : "Belum lengkap"}
                            </span>
                            {supplier.riskFlags?.length ? (
                              <span className="text-xs text-amber-700">{supplier.riskFlags.join(", ")}</span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingSupplier(supplier); setShowSupplierDialog(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteSupplier(supplier.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Orders Tab */}
        <TabsContent value="po">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Purchase Orders</CardTitle>
                <CardDescription>Semua PO yang belum fully received</CardDescription>
              </div>
              <Dialog open={showPoDialog} onOpenChange={setShowPoDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" /> New PO
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Buat Purchase Order</DialogTitle>
                    <DialogDescription>PO akan ditulis ke sheet Purchase_Orders</DialogDescription>
                  </DialogHeader>
                  <PoForm
                    suppliers={data?.suppliers || []}
                    onSubmit={handleSubmitPo}
                    onCancel={() => setShowPoDialog(false)}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
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
                    <TableHead>ETA</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : !data?.purchaseOrders.length ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Belum ada PO. Buat PO pertama.</TableCell></TableRow>
                  ) : (
                    data?.purchaseOrders.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.id}</TableCell>
                        <TableCell>{formatDate(po.date)}</TableCell>
                        <TableCell>{po.supplierName}</TableCell>
                        <TableCell>
                          <div>{po.itemName}</div>
                          <div className="text-xs text-muted-foreground">{po.itemId}</div>
                        </TableCell>
                        <TableCell>{po.quantity} {po.unit}</TableCell>
                        <TableCell>{formatRupiah(po.total)}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant[po.status] || "secondary"}>
                            {statusLabel[po.status] || po.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(po.expectedDate)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeletePo(po.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receipts Tab */}
        <TabsContent value="receipts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Goods Receipts</CardTitle>
                <CardDescription>Riwayat penerimaan barang & QC</CardDescription>
              </div>
              <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={openPos.length === 0}>
                    <Plus className="h-4 w-4 mr-1" /> New Receipt
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Receiving + QC</DialogTitle>
                    <DialogDescription>Jika QC passed, stok otomatis bertambah di Inventory_Master</DialogDescription>
                  </DialogHeader>
                  <ReceiptForm
                    purchaseOrders={openPos}
                    onSubmit={handleSubmitReceipt}
                    onCancel={() => setShowReceiptDialog(false)}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>PO Ref</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>QC Status</TableHead>
                    <TableHead>PIC</TableHead>
                    <TableHead>Proof</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : !data?.receipts.length ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Belum ada receipt. Terima barang untuk membuat receipt.</TableCell></TableRow>
                  ) : (
                    data?.receipts.slice(0, 50).map((receipt) => (
                      <TableRow key={receipt.id}>
                        <TableCell className="font-medium">{receipt.id}</TableCell>
                        <TableCell>{formatDate(receipt.date)}</TableCell>
                        <TableCell>{receipt.poId}</TableCell>
                        <TableCell>{receipt.quantity}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant[receipt.qcStatus] || "secondary"}>
                            {statusLabel[receipt.qcStatus] || receipt.qcStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{receipt.pic}</TableCell>
                        <TableCell>
                          {receipt.proofUrl ? (
                            <a href={receipt.proofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">open</a>
                          ) : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supplier Master Tab */}
        <TabsContent value="master">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Master Data</CardTitle>
              <CardDescription>Detail lengkap setiap supplier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!data?.suppliers.length ? (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">Belum ada data supplier.</div>
                ) : (
                  data?.suppliers.map((supplier) => (
                    <Card key={supplier.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{supplier.name}</CardTitle>
                            <CardDescription>{supplier.id} • {supplier.category}</CardDescription>
                          </div>
                          <Badge variant={statusBadgeVariant[supplier.status] || "secondary"}>
                            {statusLabel[supplier.status] || supplier.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Kontak:</span> {supplier.contact} / {supplier.channel}</p>
                        <p><span className="text-muted-foreground">Lead Time:</span> {supplier.leadTimeDays} hari • Rating: {"★".repeat(supplier.rating || 0)}</p>
                        <p><span className="text-muted-foreground">Vendor_Register:</span> {supplier.governanceVendorId || "Belum dicatat"} • Related party: {supplier.relatedParty || "Belum dicatat"}</p>
                        <p><span className="text-muted-foreground">Benchmark:</span> {supplier.benchmarkComplete ? "Lengkap" : "Belum lengkap"} • Approval: {supplier.approvalRequirement || "Belum dicatat"}</p>
                        {supplier.riskFlags?.length ? <p className="text-amber-700">TARIF flags: {supplier.riskFlags.join(", ")}</p> : null}
                        {supplier.notes && <p className="text-muted-foreground">{supplier.notes}</p>}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
