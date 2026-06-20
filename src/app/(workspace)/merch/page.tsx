"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Package, TrendingUp, DollarSign, Percent, Pencil, Trash2, Tag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type MerchProduct = {
  id: string;
  sku: string;
  name: string;
  category: string;
  cogs: number;
  price: number;
  margin: number;
  marginPct: string;
  stock: number;
  status: string;
  notes: string;
  rowNumber: number;
};

type MerchAnalytics = {
  totalSKU: number;
  totalCOGS: number;
  totalValue: number;
  avgMargin: string;
  totalStock: number;
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);

function MerchForm({ onSubmit, onCancel }: {
  onSubmit: (data: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("apparel");
  const [cogs, setCogs] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ sku, name, category, cogs, price, stock, status, notes });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="merch-sku">SKU</Label>
          <Input id="merch-sku" value={sku} onChange={(e) => setSku(e.target.value)} required placeholder="M-001" />
        </div>
        <div>
          <Label htmlFor="merch-name">Nama Produk</Label>
          <Input id="merch-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="T-Shirt TIM Logo" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="merch-cat">Kategori</Label>
          <select id="merch-cat" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="apparel">Apparel</option>
            <option value="drinkware">Drinkware</option>
            <option value="accessories">Accessories</option>
            <option value="stationery">Stationery</option>
            <option value="bag">Bag</option>
            <option value="other">Lainnya</option>
          </select>
        </div>
        <div>
          <Label htmlFor="merch-cogs">COGS (Rp)</Label>
          <Input id="merch-cogs" type="number" min="0" value={cogs} onChange={(e) => setCogs(e.target.value)} required placeholder="50000" />
        </div>
        <div>
          <Label htmlFor="merch-price">Harga Jual (Rp)</Label>
          <Input id="merch-price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="120000" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="merch-stock">Stock</Label>
          <Input id="merch-stock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="merch-status">Status</Label>
          <select id="merch-status" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="discontinued">Discontinued</option>
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="merch-notes">Catatan</Label>
        <Textarea id="merch-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Supplier, MOQ, dll" />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit">Simpan Produk</Button>
      </DialogFooter>
    </form>
  );
}

export default function MerchPage() {
  const [products, setProducts] = useState<MerchProduct[]>([]);
  const [analytics, setAnalytics] = useState<MerchAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState("products");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<MerchProduct | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/merch", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal load merch");
      setProducts(json.products || []);
      setAnalytics(json.analytics || null);
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
        ...editing ? { sku: editing.sku } : {},
        ...formData,
      };
      const res = await fetch("/api/merch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");
      setMessage({ type: "success", text: `✅ Produk tersimpan: ${formData.name}` });
      setShowDialog(false);
      setEditing(null);
      await loadData();
    } catch (error) {
      setMessage({ type: "error", text: `❌ ${String(error)}` });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(sku: string) {
    if (!confirm("Hapus produk ini?")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/merch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", sku }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus");
      setMessage({ type: "success", text: "✅ Produk dihapus" });
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
            <Tag className="h-6 w-6" />
            Merchandise TIM
          </h2>
          <p className="text-muted-foreground">
            Product catalog, COGS, margin tracking — source: Google Sheets Merch_TIM
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
              <Package className="h-3 w-3" /> Total SKU
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalSKU || 0}</div>
            <div className="text-xs text-muted-foreground">produk aktif</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Total COGS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(analytics?.totalCOGS || 0)}</div>
            <div className="text-xs text-muted-foreground">cost of goods</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Total Value
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(analytics?.totalValue || 0)}</div>
            <div className="text-xs text-muted-foreground">harga jual total</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Percent className="h-3 w-3" /> Avg Margin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.avgMargin || "0%"}</div>
            <div className="text-xs text-muted-foreground">rata-rata margin</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Product Catalog</CardTitle>
                <CardDescription>Daftar semua produk merchandise TIM</CardDescription>
              </div>
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setEditing(null)}>
                    <Plus className="h-4 w-4 mr-1" /> New Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editing ? "Edit Produk" : "Tambah Produk Baru"}</DialogTitle>
                    <DialogDescription>Data langsung ditulis ke sheet Merch_TIM</DialogDescription>
                  </DialogHeader>
                  <MerchForm
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
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>COGS</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Margin</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : !products.length ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Belum ada produk. Tambah item pertama.</TableCell></TableRow>
                  ) : (
                    products.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <Badge variant="outline">{p.category}</Badge>
                        <TableCell>{formatRupiah(p.cogs)}</TableCell>
                        <TableCell>{formatRupiah(p.price)}</TableCell>
                        <TableCell>
                          <Badge variant={Number(p.marginPct) >= 50 ? "default" : "secondary"}>
                            {p.marginPct}%
                          </Badge>
                        </TableCell>
                        <TableCell>{p.stock}</TableCell>
                        <Badge variant={p.status === "active" ? "default" : p.status === "draft" ? "secondary" : "destructive"}>
                          {p.status}
                        </Badge>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => { setEditing(p); setShowDialog(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(p.sku)}>
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

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Analysis</CardTitle>
                <CardDescription>Ringkasan COGS vs harga jual</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total SKU</span>
                  <span className="font-medium">{analytics?.totalSKU || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total COGS</span>
                  <span className="font-medium">{formatRupiah(analytics?.totalCOGS || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Value</span>
                  <span className="font-medium">{formatRupiah(analytics?.totalValue || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Stock</span>
                  <span className="font-medium">{analytics?.totalStock || 0} pcs</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Margin Overview</CardTitle>
                <CardDescription>Rata-rata margin produk</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Margin</span>
                  <span className="font-medium">{analytics?.avgMargin || "0%"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Potential Profit</span>
                  <span className="font-medium">{formatRupiah((analytics?.totalValue || 0) - (analytics?.totalCOGS || 0))}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
