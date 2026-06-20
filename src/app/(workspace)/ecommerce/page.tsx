"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, ShoppingCart, TrendingUp, DollarSign, Package, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type EcomTransaction = {
  id: string;
  date: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  status: string;
  channel: string;
  customerRef: string;
  notes: string;
  rowNumber: number;
};

type EcomMetrics = {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  categories: string[];
  lastTransaction: string;
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);

const formatShortDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
};

const statusBadge: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
};

function TransactionForm({ onSubmit, onCancel }: {
  onSubmit: (data: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState("sales");
  const [category, setCategory] = useState("parfum");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("completed");
  const [channel, setChannel] = useState("online");
  const [customerRef, setCustomerRef] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ date, type, category, description, amount, status, channel, customerRef, notes });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ecom-date">Tanggal</Label>
          <Input id="ecom-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="ecom-type">Tipe</Label>
          <select id="ecom-type" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="sales">Sales</option>
            <option value="refund">Refund</option>
            <option value="marketplace">Marketplace</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ecom-cat">Kategori</Label>
          <select id="ecom-cat" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="parfum">Parfum</option>
            <option value="merch">Merchandise</option>
            <option value="discovery">Discovery Set</option>
            <option value="gift">Gift Set</option>
            <option value="other">Lainnya</option>
          </select>
        </div>
        <div>
          <Label htmlFor="ecom-amount">Amount (Rp)</Label>
          <Input id="ecom-amount" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="300000" />
        </div>
      </div>
      <div>
        <Label htmlFor="ecom-desc">Description</Label>
        <Input id="ecom-desc" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="EDP 30ml Rose x2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ecom-status">Status</Label>
          <select id="ecom-status" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <div>
          <Label htmlFor="ecom-channel">Channel</Label>
          <Input id="ecom-channel" value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="online, shopee, tokopedia" />
        </div>
      </div>
      <div>
        <Label htmlFor="ecom-customer">Customer Ref</Label>
        <Input id="ecom-customer" value={customerRef} onChange={(e) => setCustomerRef(e.target.value)} placeholder="Customer name or order ID" />
      </div>
      <div>
        <Label htmlFor="ecom-notes">Notes</Label>
        <Textarea id="ecom-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit">Simpan Transaction</Button>
      </DialogFooter>
    </form>
  );
}

export default function EcommercePage() {
  const [transactions, setTransactions] = useState<EcomTransaction[]>([]);
  const [metrics, setMetrics] = useState<EcomMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState("transactions");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<EcomTransaction | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ecommerce", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal load e-commerce");
      setTransactions(json.transactions || []);
      setMetrics(json.metrics || null);
    } catch (error) {
      setMessage({ type: "error", text: `❌ ${String(error)}` });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSubmit(formData: Record<string, string>) {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        action: editing ? "update" : "create",
        ...editing ? { id: editing.id } : {},
        ...formData,
      };
      const res = await fetch("/api/ecommerce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");
      setMessage({ type: "success", text: `✅ Transaction tersimpan` });
      setShowDialog(false);
      setEditing(null);
      await loadData();
    } catch (error) {
      setMessage({ type: "error", text: `❌ ${String(error)}` });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus transaksi ini?")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/ecommerce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus");
      setMessage({ type: "success", text: "✅ Transaction dihapus" });
      await loadData();
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
            <ShoppingCart className="h-6 w-6" />
            E-Commerce
          </h2>
          <p className="text-muted-foreground">
            Online orders, metrics, conversion tracking — source: Google Sheets Ecommerse
          </p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm border ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
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
              <DollarSign className="h-3 w-3" /> Total Revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(metrics?.totalRevenue || 0)}</div>
            <div className="text-xs text-muted-foreground">{metrics?.totalOrders || 0} orders</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Avg Order Value
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(metrics?.avgOrderValue || 0)}</div>
            <div className="text-xs text-muted-foreground">per order</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Package className="h-3 w-3" /> Categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.categories?.length || 0}</div>
            <div className="text-xs text-muted-foreground">product categories</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <ShoppingCart className="h-3 w-3" /> Last Transaction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatShortDate(metrics?.lastTransaction || "")}</div>
            <div className="text-xs text-muted-foreground">terakhir</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>E-Commerce Transactions</CardTitle>
                <CardDescription>Daftar semua transaksi online</CardDescription>
              </div>
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setEditing(null)}>
                    <Plus className="h-4 w-4 mr-1" /> New Order
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editing ? "Edit Transaction" : "Tambah Transaction"}</DialogTitle>
                    <DialogDescription>Data langsung ditulis ke sheet Ecommerse</DialogDescription>
                  </DialogHeader>
                  <TransactionForm
                    onSubmit={handleSubmit}
                    onCancel={() => { setShowDialog(false); setEditing(null); }}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : !transactions.length ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Belum ada transaksi. Tambah order pertama.</TableCell></TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium">{formatShortDate(tx.date)}</TableCell>
                        <Badge variant="outline">{tx.type}</Badge>
                        <TableCell>{tx.category}</TableCell>
                        <TableCell className="text-sm">{tx.description}</TableCell>
                        <TableCell>{formatRupiah(tx.amount)}</TableCell>
                        <Badge className={statusBadge[tx.status] || "bg-gray-100 text-gray-700"}>
                          {tx.status}
                        </Badge>
                        <TableCell className="text-sm">{tx.channel}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => { setEditing(tx); setShowDialog(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(tx.id)}>
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

        {/* Metrics Tab */}
        <TabsContent value="metrics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Total pendapatan e-commerce</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Revenue</span>
                  <span className="font-medium">{formatRupiah(metrics?.totalRevenue || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Orders</span>
                  <span className="font-medium">{metrics?.totalOrders || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Order Value</span>
                  <span className="font-medium">{formatRupiah(metrics?.avgOrderValue || 0)}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Produk kategori aktif</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(metrics?.categories || []).map((cat) => (
                    <Badge key={cat} variant="outline">{cat}</Badge>
                  ))}
                  {(!metrics?.categories || metrics.categories.length === 0) && (
                    <span className="text-muted-foreground text-sm">Tidak ada data kategori</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
