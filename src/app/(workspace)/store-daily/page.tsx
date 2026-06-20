"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, TrendingUp, Users, ShoppingBag, Clock, Pencil, Trash2, Store } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type DailyEntry = {
  id: string;
  date: string;
  day: string;
  openTime: string;
  closeTime: string;
  traffic: number;
  transactions: number;
  omzet: number;
  topProduct: string;
  notes: string;
  rowNumber: number;
};

type Analytics = {
  last7Days: { traffic: number; transactions: number; omzet: number; conversion: string };
  thisMonth: { traffic: number; transactions: number; omzet: number };
};

type StoreDailyData = {
  source: string;
  sourceStatus: string;
  entries: DailyEntry[];
  analytics: Analytics | null;
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

function DailyEntryForm({ onSubmit, onCancel }: {
  onSubmit: (data: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [openTime, setOpenTime] = useState("10:00");
  const [closeTime, setCloseTime] = useState("21:00");
  const [traffic, setTraffic] = useState("");
  const [transactions, setTransactions] = useState("");
  const [omzet, setOmzet] = useState("");
  const [topProduct, setTopProduct] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ date, openTime, closeTime, traffic, transactions, omzet, topProduct, notes });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="daily-date">Tanggal</Label>
          <Input id="daily-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="daily-open">Jam Buka</Label>
          <Input id="daily-open" type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="daily-close">Jam Tutup</Label>
          <Input id="daily-close" type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="daily-traffic">Traffic (pengunjung)</Label>
          <Input id="daily-traffic" type="number" min="0" value={traffic} onChange={(e) => setTraffic(e.target.value)} placeholder="45" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="daily-trans">Transaksi</Label>
          <Input id="daily-trans" type="number" min="0" value={transactions} onChange={(e) => setTransactions(e.target.value)} placeholder="12" />
        </div>
        <div>
          <Label htmlFor="daily-omzet">Omzet (Rp)</Label>
          <Input id="daily-omzet" type="number" min="0" value={omzet} onChange={(e) => setOmzet(e.target.value)} placeholder="2500000" />
        </div>
      </div>
      <div>
        <Label htmlFor="daily-top">Produk Terlaris</Label>
        <Input id="daily-top" value={topProduct} onChange={(e) => setTopProduct(e.target.value)} placeholder="EDP 30ml Rose" />
      </div>
      <div>
        <Label htmlFor="daily-notes">Catatan</Label>
        <Textarea id="daily-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Promosi booth, cuaca, dll" />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit">Simpan Entry</Button>
      </DialogFooter>
    </form>
  );
}

export default function StoreDailyPage() {
  const [data, setData] = useState<StoreDailyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState("daily");
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DailyEntry | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/store-daily", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal load store daily");
      setData({
        source: json.source || "Store_Daily",
        sourceStatus: json.sourceStatus || "unknown",
        entries: json.entries || [],
        analytics: json.analytics || null,
      });
    } catch (error) {
      setMessage({ type: "error", text: `❌ ${String(error)}` });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = useMemo(() => {
    const entries = data?.entries || [];
    const last7 = entries.slice(0, 7);
    return {
      todayOmzet: entries[0]?.omzet || 0,
      todayTraffic: entries[0]?.traffic || 0,
      todayTrans: entries[0]?.transactions || 0,
      last7Omzet: last7.reduce((s, e) => s + e.omzet, 0),
      last7Traffic: last7.reduce((s, e) => s + e.traffic, 0),
      avgConversion: last7.length > 0
        ? ((last7.reduce((s, e) => s + e.transactions, 0) / Math.max(last7.reduce((s, e) => s + e.traffic, 0), 1)) * 100).toFixed(1)
        : "0",
    };
  }, [data]);

  async function handleSubmitEntry(formData: Record<string, string>) {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        action: editingEntry ? "update" : "create",
        ...editingEntry ? { id: editingEntry.id } : {},
        ...formData,
      };
      const res = await fetch("/api/store-daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan entry");
      setMessage({ type: "success", text: `✅ Entry tersimpan: ${formData.date}` });
      setShowEntryDialog(false);
      setEditingEntry(null);
      await loadData();
    } catch (error) {
      setMessage({ type: "error", text: `❌ ${String(error)}` });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus entry ini?")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/store-daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus");
      setMessage({ type: "success", text: "✅ Entry dihapus" });
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
            <Store className="h-6 w-6" />
            Store Daily
          </h2>
          <p className="text-muted-foreground">
            Daily sales input, traffic & conversion tracking — source: Google Sheets Store_Daily
          </p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {/* Message */}
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
              <ShoppingBag className="h-3 w-3" /> Omzet Hari Ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(stats.todayOmzet)}</div>
            <div className="text-xs text-muted-foreground">{stats.todayTrans} transaksi</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Users className="h-3 w-3" /> Traffic Hari Ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayTraffic}</div>
            <div className="text-xs text-muted-foreground">pengunjung</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Conversion Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgConversion}%</div>
            <div className="text-xs text-muted-foreground">last 7 days</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Last 7 Days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(stats.last7Omzet)}</div>
            <div className="text-xs text-muted-foreground">{stats.last7Traffic} traffic</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="daily">Daily Log</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Daily Log Tab */}
        <TabsContent value="daily">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Daily Sales Log</CardTitle>
                <CardDescription>Input harian penjualan store</CardDescription>
              </div>
              <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setEditingEntry(null)}>
                    <Plus className="h-4 w-4 mr-1" /> New Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingEntry ? "Edit Entry" : "Tambah Daily Entry"}</DialogTitle>
                    <DialogDescription>Data langsung ditulis ke sheet Store_Daily</DialogDescription>
                  </DialogHeader>
                  <DailyEntryForm
                    onSubmit={handleSubmitEntry}
                    onCancel={() => { setShowEntryDialog(false); setEditingEntry(null); }}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Open</TableHead>
                    <TableHead>Close</TableHead>
                    <TableHead>Traffic</TableHead>
                    <TableHead>Trans</TableHead>
                    <TableHead>Omzet</TableHead>
                    <TableHead>Top Product</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : !data?.entries.length ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Belum ada data. Tambah entry pertama.</TableCell></TableRow>
                  ) : (
                    data?.entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{formatDate(entry.date)}</TableCell>
                        <TableCell>{entry.day}</TableCell>
                        <TableCell>{entry.openTime}</TableCell>
                        <TableCell>{entry.closeTime}</TableCell>
                        <TableCell>{entry.traffic}</TableCell>
                        <TableCell>{entry.transactions}</TableCell>
                        <TableCell>{formatRupiah(entry.omzet)}</TableCell>
                        <TableCell className="text-sm">{entry.topProduct || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingEntry(entry); setShowEntryDialog(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(entry.id)}>
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
                <CardTitle>Last 7 Days</CardTitle>
                <CardDescription>Ringkasan 7 hari terakhir</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Traffic</span>
                  <span className="font-medium">{data?.analytics?.last7Days?.traffic || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transactions</span>
                  <span className="font-medium">{data?.analytics?.last7Days?.transactions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Omzet</span>
                  <span className="font-medium">{formatRupiah(data?.analytics?.last7Days?.omzet || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conversion</span>
                  <span className="font-medium">{data?.analytics?.last7Days?.conversion || "0%"}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>This Month</CardTitle>
                <CardDescription>Ringkasan bulan ini</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Traffic</span>
                  <span className="font-medium">{data?.analytics?.thisMonth?.traffic || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transactions</span>
                  <span className="font-medium">{data?.analytics?.thisMonth?.transactions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Omzet</span>
                  <span className="font-medium">{formatRupiah(data?.analytics?.thisMonth?.omzet || 0)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
