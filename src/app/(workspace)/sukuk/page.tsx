"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ── Types ──────────────────────────────────────────────────────────
type SukukProduct = {
  id: number; kode: string; nama: string; deskripsi: string; kategori: string;
  harga_per_unit: number; jumlah_unit: number; nilai_sukuk: number;
  tenor_bulan: number; nisbah_investor: number; nisbah_pengelola: number;
  jenis_akad: string; target_cogs: number; target_harga_jual: number;
  status: string; unit_terjual?: number; total_terkumpul?: number; created_at: string;
};

type Investment = {
  id: number; product_id: number; product_name: string; product_code: string;
  investor_name: string; investor_email: string; investor_phone: string;
  jumlah_unit: number; nilai_investasi: number; tanggal_investasi: string;
  status: string; consent: number;
};

type ProfitDistribution = {
  id: number; product_id: number; product_name: string; product_code: string;
  periode: string; total_revenue: number; total_cogs: number; total_profit: number;
  nisbah_investor: number; nisbah_pengelola: number; jumlah_dibagikan: number;
  jumlah_per_unit: number; status: string;
};

type Investor = {
  id: string; nama: string; email: string; telepon: string; alamat: string;
  npwp: string; bank: string; no_rekening: string; saldo_investasi: number;
  total_profit: number; status: string; consent: string; tanggal_daftar: string;
};

type Creditor = {
  id: string; nama: string; email: string; telepon: string; alamat: string;
  npwp: string; bank: string; no_rekening: string; tipe: string;
  plafon: number; saldo_pinjaman: number; tenor_bulan: number;
  bunga_persen: number; status: string; tanggal_akad: string;
};

type RABItem = {
  id: string; kategori: string; deskripsi: string; volume: number;
  satuan: string; harga_satuan: number; jumlah: number; realisasi: number;
  variance: number; status: string; catatan: string;
};

type ScheduleItem = {
  id: string; product_id: string; product_name: string; periode: string;
  tanggal_jatuh_tempo: string; jumlah_pokok: number; jumlah_bagi_hasil: number;
  total_bayar: number; status: string; tanggal_bayar: string; catatan: string;
};

type AuditItem = {
  id: string; timestamp: string; user: string; action: string;
  entity: string; entity_id: string; details: string; ip_address: string;
};

type NotificationItem = {
  id: string; timestamp: string; tipe: string; judul: string;
  pesan: string; recipient: string; read_status: string; action_url: string;
};

type ProyeksiItem = {
  id: string; brand: string; product_id: string; product_name: string;
  investasi: number; bagi_hasil_bulanan: number; return_6bulan: number;
  return_12bulan: number; roi_persen: number; payback_bulan: number;
  npv: number; irr: number; status: string; catatan: string;
};

type StoreItem = {
  id: string; brand: string; kategori: string; lokasi: string;
  revenue_bulanan: number; unit_terjual: number; avg_ticket: number;
  pelanggan_aktif: number; conversion_rate: number; nps: number;
  status: string; catatan: string;
};

// ── Helpers ────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v || 0);

const fmtNum = (v: number) => new Intl.NumberFormat("id-ID").format(v || 0);

function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    open: "bg-emerald-600", funded: "bg-blue-600", launched: "bg-purple-600",
    closed: "bg-red-500", aktif: "bg-emerald-600", draft: "bg-yellow-600",
    paid: "bg-emerald-600", scheduled: "bg-blue-600", lunas: "bg-emerald-600",
    Perencanaan: "bg-blue-500", Ideasi: "bg-yellow-500",
  };
  const label: Record<string, string> = {
    open: "Open", funded: "Fully Funded", launched: "Launched",
    closed: "Closed", aktif: "Aktif", draft: "Draft", paid: "Dibayar",
    scheduled: "Terjadwal", lunas: "Lunas", Perencanaan: "Perencanaan", Ideasi: "Ideasi",
  };
  return <Badge className={tone[status] || "bg-gray-500"}>{label[status] || status}</Badge>;
}

function statusLabel(s: string) {
  const label: Record<string, string> = {
    open: "Open", funded: "Fully Funded", launched: "Launched",
    closed: "Closed", draft: "Draft", Perencanaan: "Perencanaan", Ideasi: "Ideasi",
  };
  return label[s] || s;
}

// ── Tab type ───────────────────────────────────────────────────────
type TabKey = "products" | "invest" | "distributions" | "register" | "investors" | "creditors" | "rab" | "schedule" | "audit" | "notifications" | "proyeksi" | "store";

// ── Main Component ────────────────────────────────────────────────
export default function SukukMicroPage() {
  const [products, setProducts] = useState<SukukProduct[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [distributions, setDistributions] = useState<ProfitDistribution[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [rab, setRab] = useState<RABItem[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [proyeksi, setProyeksi] = useState<ProyeksiItem[]>([]);
  const [store, setStore] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("products");
  const [selectedProduct, setSelectedProduct] = useState<SukukProduct | null>(null);
  const [status, setStatus] = useState("Memuat...");

  const [investForm, setInvestForm] = useState({
    investor_name: "", investor_email: "", investor_phone: "",
    jumlah_unit: "1", notes: "", consent: false,
  });

  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    kode: "", nama: "", deskripsi: "", kategori: "merchandise",
    harga_per_unit: "", jumlah_unit: "", tenor_bulan: "6",
    nisbah_investor: "60", nisbah_pengelola: "40", jenis_akad: "musyarakah",
    target_cogs: "", target_harga_jual: "",
  });

  const [investorForm, setInvestorForm] = useState({
    nama: "", email: "", telepon: "", alamat: "",
    npwp: "", bank: "", no_rekening: "", saldo_investasi: "",
  });

  // ── Data Loading ─────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoints = [
        { key: "products", url: "/api/sukuk/products" },
        { key: "invest", url: "/api/sukuk/invest" },
        { key: "distributions", url: "/api/sukuk/distributions" },
        { key: "investors", url: "/api/sukuk/investors" },
        { key: "creditors", url: "/api/sukuk/creditors" },
        { key: "rab", url: "/api/sukuk/rab" },
        { key: "schedule", url: "/api/sukuk/schedule" },
        { key: "audit", url: "/api/sukuk/audit" },
        { key: "notifications", url: "/api/sukuk/notifications" },
        { key: "proyeksi", url: "/api/sukuk/proyeksi" },
        { key: "store", url: "/api/sukuk/store" },
      ];
      const results = await Promise.all(endpoints.map((e) => fetch(e.url, { cache: "no-store" })));
      const data = await Promise.all(results.map((r) => r.json()));

      const [pData, iData, dData, invData, cData, rabData, schData, audData, notData, proData, stoData] = data;

      // Normalize products
      const rawProducts = pData.products || [];
      const normalizedProducts = rawProducts.map((p: any) => ({
        ...p,
        nilai_sukuk: p.nilai_sukuk || p.modal_dibutuhkan || 0,
        harga_per_unit: p.harga_per_unit || p.modal_dibutuhkan || 0,
        jumlah_unit: p.jumlah_unit || p.target_investor || 0,
        unit_terjual: p.unit_terjual || 0,
        total_terkumpul: p.total_terkumpul || 0,
        nisbah_investor: p.nisbah_investor || 50,
        nisbah_pengelola: p.nisbah_pengelola || 50,
        target_cogs: p.target_cogs || 0,
        target_harga_jual: p.target_harga_jual || 0,
        tenor_bulan: p.tenor_bulan || 6,
        jenis_akad: p.jenis_akad || "musyarakah",
      }));

      setProducts(normalizedProducts);
      setInvestments(iData.investments || []);
      setDistributions(dData.distributions || []);
      setInvestors(invData.investors || []);
      setCreditors(cData.creditors || []);
      setRab(rabData.rab || []);
      setSchedule(schData.schedule || []);
      setAudit(audData.audit || []);
      setNotifications(notData.notifications || []);
      setProyeksi(proData.proyeksi || []);
      setStore(stoData.store || []);

      const src = pData.source || "unknown";
      setStatus(`Source: ${src} | ${normalizedProducts.length} produk, ${iData.investments?.length || 0} investasi, ${invData.investors?.length || 0} investor`);
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Handlers ─────────────────────────────────────────────────────
  async function handleInvest(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct) return;
    setStatus("Memproses investasi...");
    try {
      const res = await fetch("/api/sukuk/invest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          investor_name: investForm.investor_name,
          investor_email: investForm.investor_email,
          investor_phone: investForm.investor_phone,
          jumlah_unit: Number(investForm.jumlah_unit) || 1,
          consent: investForm.consent,
          notes: investForm.notes,
          nilai_investasi: (Number(investForm.jumlah_unit) || 1) * (selectedProduct.harga_per_unit || 0),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal investasi");
      setStatus(`Investasi berhasil: ${data.investment?.nilai_investasi ? fmt(data.investment.nilai_investasi) : ""}`);
      setInvestForm({ investor_name: "", investor_email: "", investor_phone: "", jumlah_unit: "1", notes: "", consent: false });
      setSelectedProduct(null);
      setTab("products");
      await loadData();
    } catch (err) {
      setStatus(`${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Membuat produk sukuk mikro...");
    try {
      const res = await fetch("/api/sukuk/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...productForm,
          harga_per_unit: Number(productForm.harga_per_unit),
          jumlah_unit: Number(productForm.jumlah_unit),
          tenor_bulan: Number(productForm.tenor_bulan),
          nisbah_investor: Number(productForm.nisbah_investor),
          nisbah_pengelola: Number(productForm.nisbah_pengelola),
          target_cogs: Number(productForm.target_cogs),
          target_harga_jual: Number(productForm.target_harga_jual),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat produk");
      setStatus(`Produk dibuat: ${data.product?.kode} — ${data.product?.nama}`);
      setShowProductForm(false);
      setProductForm({ kode: "", nama: "", deskripsi: "", kategori: "merchandise", harga_per_unit: "", jumlah_unit: "", tenor_bulan: "6", nisbah_investor: "60", nisbah_pengelola: "40", jenis_akad: "musyarakah", target_cogs: "", target_harga_jual: "" });
      await loadData();
    } catch (err) {
      setStatus(`${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handleAddInvestor(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Menambah investor...");
    try {
      const res = await fetch("/api/sukuk/investors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...investorForm,
          saldo_investasi: Number(investorForm.saldo_investasi) || 0,
          consent: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambah investor");
      setStatus(`Investor ditambahkan: ${data.investor?.nama}`);
      setInvestorForm({ nama: "", email: "", telepon: "", alamat: "", npwp: "", bank: "", no_rekening: "", saldo_investasi: "" });
      await loadData();
    } catch (err) {
      setStatus(`${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ── KPI ──────────────────────────────────────────────────────────
  const totalFundingTarget = products.reduce((s, p) => s + p.nilai_sukuk, 0);
  const totalRaised = products.reduce((s, p) => s + (p.total_terkumpul || 0), 0);
  const totalInvestors = new Set(investments.map((i) => i.investor_email || i.investor_name)).size;
  const totalInvestorBalance = investors.reduce((s, i) => s + i.saldo_investasi, 0);

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">FASE 7 — Financial Ecosystem</p>
          <h1 className="text-3xl font-bold">Sukuk Full Suite</h1>
          <p className="text-muted-foreground">
            Platform sukuk mikro syariah — Investor, Kreditur, RAB, Audit, Notifikasi, Proyeksi, Store.
          </p>
        </div>
        <Button onClick={loadData} disabled={loading}>{loading ? "Memuat..." : "Refresh Data"}</Button>
      </div>

      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>Produk Aktif</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold">{products.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Target Pendanaan</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(totalFundingTarget)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Terkumpul</CardDescription></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{fmt(totalRaised)}</div>
            <div className="text-xs text-muted-foreground">{totalFundingTarget > 0 ? ((totalRaised / totalFundingTarget) * 100).toFixed(1) : 0}% tercapai</div>
          </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Total Investor</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalInvestors}</div>
            <div className="text-xs text-muted-foreground">Saldo: {fmt(totalInvestorBalance)}</div></CardContent></Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b flex-wrap">
        {([
          { key: "products", label: "Produk" },
          { key: "invest", label: "Investasi" },
          { key: "distributions", label: "Distribusi" },
          { key: "investors", label: "Investor" },
          { key: "creditors", label: "Kreditur" },
          { key: "rab", label: "RAB" },
          { key: "schedule", label: "Jadwal" },
          { key: "audit", label: "Audit" },
          { key: "notifications", label: "Notifikasi" },
          { key: "proyeksi", label: "Proyeksi" },
          { key: "store", label: "Store" },
          { key: "register", label: "Produk Baru" },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as TabKey)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground">{status}</p>
        {products.length > 0 && products[0]?.from_sheets && (
          <Badge variant="outline" className="text-xs">📋 Google Sheets</Badge>
        )}
      </div>

      {/* ═══ TAB: Produk ═══ */}
      {tab === "products" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Daftar Produk Sukuk Mikro</h2>
            <Button size="sm" onClick={() => { setTab("register"); setShowProductForm(true); }}>+ Produk Baru</Button>
          </div>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <Card key={i}><CardContent className="py-8 text-center text-muted-foreground">Memuat...</CardContent></Card>)}
            </div>
          ) : products.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <div className="text-4xl mb-4">🪙</div>
              <h3 className="text-lg font-semibold mb-2">Belum Ada Produk</h3>
              <p className="text-sm text-muted-foreground">Daftarkan produk pertama untuk sukuk mikro SWI.</p>
            </CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => {
                const sold = p.unit_terjual || 0;
                const pct = p.jumlah_unit > 0 ? Math.min((sold / p.jumlah_unit) * 100, 100) : 0;
                const margin = p.target_harga_jual > 0 && p.target_cogs > 0 ? ((p.target_harga_jual - p.target_cogs) / p.target_harga_jual * 100) : 0;
                return (
                  <Card key={p.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{p.nama}</CardTitle>
                          <CardDescription>{p.kode} · {p.kategori}</CardDescription>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-muted-foreground">{p.deskripsi}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">Harga/unit:</span> <span className="font-medium">{fmt(p.harga_per_unit)}</span></div>
                        <div><span className="text-muted-foreground">Total Unit:</span> <span className="font-medium">{fmtNum(p.jumlah_unit)}</span></div>
                        <div><span className="text-muted-foreground">Nilai Sukuk:</span> <span className="font-medium">{fmt(p.nilai_sukuk)}</span></div>
                        <div><span className="text-muted-foreground">Tenor:</span> <span className="font-medium">{p.tenor_bulan} bulan</span></div>
                        <div><span className="text-muted-foreground">Nisbah:</span> <span className="font-medium">{p.nisbah_investor}:{p.nisbah_pengelola}</span></div>
                        <div><span className="text-muted-foreground">Margin:</span> <span className="font-medium">{margin.toFixed(1)}%</span></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>{fmtNum(sold)} / {fmtNum(p.jumlah_unit)} unit</span>
                          <span>{pct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-emerald-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="w-full"
                        onClick={() => { setSelectedProduct(p); setTab("invest"); }}
                        disabled={p.status !== "open"}>
                        {p.status === "open" ? "Invest" : statusLabel(p.status)}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: Invest ═══ */}
      {tab === "invest" && (
        <div className="space-y-4">
          {selectedProduct ? (
            <Card>
              <CardHeader>
                <CardTitle>Investasi: {selectedProduct.nama}</CardTitle>
                <CardDescription>
                  {selectedProduct.kode} · Harga per unit: {fmt(selectedProduct.harga_per_unit)} · Nisbah: {selectedProduct.nisbah_investor}:{selectedProduct.nisbah_pengelola} ({selectedProduct.jenis_akad})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4 max-w-lg" onSubmit={handleInvest}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="grid gap-1">
                      <Label>Nama Investor *</Label>
                      <Input value={investForm.investor_name} onChange={(e) => setInvestForm({ ...investForm, investor_name: e.target.value })} required />
                    </div>
                    <div className="grid gap-1">
                      <Label>Email</Label>
                      <Input type="email" value={investForm.investor_email} onChange={(e) => setInvestForm({ ...investForm, investor_email: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="grid gap-1">
                      <Label>Telepon / WhatsApp</Label>
                      <Input value={investForm.investor_phone} onChange={(e) => setInvestForm({ ...investForm, investor_phone: e.target.value })} />
                    </div>
                    <div className="grid gap-1">
                      <Label>Jumlah Unit *</Label>
                      <Input type="number" min={1} max={selectedProduct.jumlah_unit - (selectedProduct.unit_terjual || 0)} value={investForm.jumlah_unit} onChange={(e) => setInvestForm({ ...investForm, jumlah_unit: e.target.value })} required />
                    </div>
                  </div>
                  <div className="grid gap-1">
                    <Label>Catatan</Label>
                    <Textarea value={investForm.notes} onChange={(e) => setInvestForm({ ...investForm, notes: e.target.value })} rows={2} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="consent" checked={investForm.consent} onChange={(e) => setInvestForm({ ...investForm, consent: e.target.checked })} />
                    <label htmlFor="consent" className="text-sm">Saya menyetujui syarat dan ketentuan sukuk mikro SWI (consent) *</label>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total investasi: <span className="font-bold">{fmt(Number(investForm.jumlah_unit || 0) * selectedProduct.harga_per_unit)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={!investForm.consent || !investForm.investor_name}>Konfirmasi Investasi</Button>
                    <Button type="button" variant="outline" onClick={() => { setSelectedProduct(null); setTab("products"); }}>Batal</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <>
              <h2 className="text-lg font-semibold">Riwayat Investasi</h2>
              {investments.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada investasi tercatat.</CardContent></Card>
              ) : (
                <div className="rounded-md border overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60 text-left">
                      <tr>
                        <th className="p-3">Investor</th><th className="p-3">Produk</th>
                        <th className="p-3 text-right">Unit</th><th className="p-3 text-right">Nilai</th>
                        <th className="p-3">Tanggal</th><th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investments.map((inv) => (
                        <tr key={inv.id} className="border-t">
                          <td className="p-3">
                            <div className="font-medium">{inv.investor_name}</div>
                            <div className="text-xs text-muted-foreground">{inv.investor_email || inv.investor_phone}</div>
                          </td>
                          <td className="p-3">{inv.product_name}</td>
                          <td className="p-3 text-right">{fmtNum(inv.jumlah_unit)}</td>
                          <td className="p-3 text-right font-medium">{fmt(inv.nilai_investasi)}</td>
                          <td className="p-3 text-xs">{inv.tanggal_investasi?.slice(0, 10)}</td>
                          <td className="p-3"><StatusBadge status={inv.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══ TAB: Distributions ═══ */}
      {tab === "distributions" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Distribusi Profit</h2>
          {distributions.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              <p>Belum ada distribusi profit tercatat.</p>
              <p className="text-xs mt-2">Distribusi profit akan muncul setelah produk menghasilkan revenue.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {distributions.map((d) => (
                <Card key={d.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{d.product_name} — {d.periode}</CardTitle>
                        <CardDescription>{d.product_code}</CardDescription>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Revenue:</span> <span className="font-medium">{fmt(d.total_revenue)}</span></div>
                      <div><span className="text-muted-foreground">COGS:</span> <span className="font-medium">{fmt(d.total_cogs)}</span></div>
                      <div><span className="text-muted-foreground">Profit:</span> <span className="font-medium text-emerald-600">{fmt(d.total_profit)}</span></div>
                      <div><span className="text-muted-foreground">Per Unit:</span> <span className="font-medium">{fmt(d.jumlah_per_unit)}</span></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">Nisbah: {d.nisbah_investor}:{d.nisbah_pengelola} · Dibagikan: {fmt(d.jumlah_dibagikan)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: Investors ═══ */}
      {tab === "investors" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Manajemen Investor</h2>
            <Badge variant="outline">{investors.length} investor</Badge>
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Tambah Investor Baru</CardTitle></CardHeader>
            <CardContent>
              <form className="space-y-3 max-w-2xl" onSubmit={handleAddInvestor}>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="grid gap-1"><Label>Nama *</Label><Input value={investorForm.nama} onChange={(e) => setInvestorForm({ ...investorForm, nama: e.target.value })} required /></div>
                  <div className="grid gap-1"><Label>Email</Label><Input type="email" value={investorForm.email} onChange={(e) => setInvestorForm({ ...investorForm, email: e.target.value })} /></div>
                  <div className="grid gap-1"><Label>Telepon</Label><Input value={investorForm.telepon} onChange={(e) => setInvestorForm({ ...investorForm, telepon: e.target.value })} /></div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="grid gap-1"><Label>Alamat</Label><Input value={investorForm.alamat} onChange={(e) => setInvestorForm({ ...investorForm, alamat: e.target.value })} /></div>
                  <div className="grid gap-1"><Label>Bank</Label><Input value={investorForm.bank} onChange={(e) => setInvestorForm({ ...investorForm, bank: e.target.value })} /></div>
                  <div className="grid gap-1"><Label>No. Rekening</Label><Input value={investorForm.no_rekening} onChange={(e) => setInvestorForm({ ...investorForm, no_rekening: e.target.value })} /></div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="grid gap-1"><Label>Saldo Investasi (Rp)</Label><Input type="number" value={investorForm.saldo_investasi} onChange={(e) => setInvestorForm({ ...investorForm, saldo_investasi: e.target.value })} /></div>
                  <div className="grid gap-1"><Label>NPWP</Label><Input value={investorForm.npwp} onChange={(e) => setInvestorForm({ ...investorForm, npwp: e.target.value })} /></div>
                </div>
                <Button type="submit" disabled={!investorForm.nama}>Tambah Investor</Button>
              </form>
            </CardContent>
          </Card>
          {investors.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada investor terdaftar.</CardContent></Card>
          ) : (
            <div className="rounded-md border overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left">
                  <tr>
                    <th className="p-3">Nama</th><th className="p-3">Email</th><th className="p-3">Telepon</th>
                    <th className="p-3">Bank</th><th className="p-3 text-right">Saldo</th>
                    <th className="p-3 text-right">Profit</th><th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {investors.map((inv) => (
                    <tr key={inv.id} className="border-t">
                      <td className="p-3 font-medium">{inv.nama}</td>
                      <td className="p-3 text-xs">{inv.email || "—"}</td>
                      <td className="p-3 text-xs">{inv.telepon || "—"}</td>
                      <td className="p-3 text-xs">{inv.bank ? `${inv.bank} (${inv.no_rekening})` : "—"}</td>
                      <td className="p-3 text-right font-medium">{fmt(inv.saldo_investasi)}</td>
                      <td className="p-3 text-right text-emerald-600">{fmt(inv.total_profit)}</td>
                      <td className="p-3"><StatusBadge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: Creditors ═══ */}
      {tab === "creditors" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Data Kreditur</h2>
          {creditors.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada data kreditur.</CardContent></Card>
          ) : (
            <div className="rounded-md border overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left">
                  <tr>
                    <th className="p-3">Nama</th><th className="p-3">Telepon</th><th className="p-3">Bank</th>
                    <th className="p-3 text-right">Plafon</th><th className="p-3 text-right">Saldo</th>
                    <th className="p-3 text-right">Tenor</th><th className="p-3 text-right">Bunga</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {creditors.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="p-3">
                        <div className="font-medium">{c.nama}</div>
                        <div className="text-xs text-muted-foreground">{c.tipe}</div>
                      </td>
                      <td className="p-3 text-xs">{c.telepon || c.email}</td>
                      <td className="p-3 text-xs">{c.bank} {c.no_rekening}</td>
                      <td className="p-3 text-right">{fmt(c.plafon)}</td>
                      <td className="p-3 text-right font-medium">{fmt(c.saldo_pinjaman)}</td>
                      <td className="p-3 text-right">{c.tenor_bulan} bln</td>
                      <td className="p-3 text-right">{c.bunga_persen}%</td>
                      <td className="p-3"><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: RAB ═══ */}
      {tab === "rab" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Rencana Anggaran Biaya (RAB)</h2>
          {rab.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada data RAB.</CardContent></Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card><CardHeader className="pb-2"><CardDescription>Total Anggaran</CardDescription></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{fmt(rab.reduce((s, r) => s + r.jumlah, 0))}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Total Realisasi</CardDescription></CardHeader>
                  <CardContent><div className="text-2xl font-bold text-blue-600">{fmt(rab.reduce((s, r) => s + r.realisasi, 0))}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Variance</CardDescription></CardHeader>
                  <CardContent><div className="text-2xl font-bold text-amber-600">{fmt(rab.reduce((s, r) => s + r.variance, 0))}</div></CardContent></Card>
              </div>
              <div className="rounded-md border overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-left">
                    <tr>
                      <th className="p-3">Kategori</th><th className="p-3">Deskripsi</th>
                      <th className="p-3 text-right">Volume</th><th className="p-3">Satuan</th>
                      <th className="p-3 text-right">Harga Satuan</th><th className="p-3 text-right">Jumlah</th>
                      <th className="p-3 text-right">Realisasi</th><th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rab.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="p-3 font-medium">{r.kategori}</td>
                        <td className="p-3 text-xs">{r.deskripsi}</td>
                        <td className="p-3 text-right">{fmtNum(r.volume)}</td>
                        <td className="p-3">{r.satuan}</td>
                        <td className="p-3 text-right">{fmt(r.harga_satuan)}</td>
                        <td className="p-3 text-right font-medium">{fmt(r.jumlah)}</td>
                        <td className="p-3 text-right text-blue-600">{fmt(r.realisasi)}</td>
                        <td className="p-3"><StatusBadge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ TAB: Schedule ═══ */}
      {tab === "schedule" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Jadwal Pembayaran</h2>
          {schedule.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada jadwal pembayaran.</CardContent></Card>
          ) : (
            <div className="rounded-md border overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left">
                  <tr>
                    <th className="p-3">Produk</th><th className="p-3">Periode</th>
                    <th className="p-3">Jatuh Tempo</th><th className="p-3 text-right">Pokok</th>
                    <th className="p-3 text-right">Bagi Hasil</th><th className="p-3 text-right">Total</th>
                    <th className="p-3">Status</th><th className="p-3">Tgl Bayar</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="p-3 font-medium">{s.product_name}</td>
                      <td className="p-3">{s.periode}</td>
                      <td className="p-3 text-xs">{s.tanggal_jatuh_tempo}</td>
                      <td className="p-3 text-right">{fmt(s.jumlah_pokok)}</td>
                      <td className="p-3 text-right">{fmt(s.jumlah_bagi_hasil)}</td>
                      <td className="p-3 text-right font-medium">{fmt(s.total_bayar)}</td>
                      <td className="p-3"><StatusBadge status={s.status} /></td>
                      <td className="p-3 text-xs">{s.tanggal_bayar || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: Audit ═══ */}
      {tab === "audit" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Audit Trail</h2>
          {audit.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada log audit.</CardContent></Card>
          ) : (
            <div className="rounded-md border overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left">
                  <tr>
                    <th className="p-3">Waktu</th><th className="p-3">User</th>
                    <th className="p-3">Aksi</th><th className="p-3">Entitas</th>
                    <th className="p-3">Detail</th><th className="p-3">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.map((a) => (
                    <tr key={a.id} className="border-t">
                      <td className="p-3 text-xs">{a.timestamp}</td>
                      <td className="p-3 font-medium">{a.user}</td>
                      <td className="p-3"><Badge variant="outline">{a.action}</Badge></td>
                      <td className="p-3 text-xs">{a.entity} {a.entity_id}</td>
                      <td className="p-3 text-xs text-muted-foreground">{a.details}</td>
                      <td className="p-3 text-xs text-muted-foreground">{a.ip_address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: Notifications ═══ */}
      {tab === "notifications" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Notifikasi</h2>
          {notifications.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Tidak ada notifikasi.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <Card key={n.id} className={n.read_status === "unread" ? "border-l-4 border-l-blue-500" : ""}>
                  <CardContent className="py-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{n.judul}</span>
                          <Badge variant="outline" className="text-xs">{n.tipe}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{n.pesan}</p>
                        <p className="text-xs text-muted-foreground mt-1">{n.timestamp} → {n.recipient}</p>
                      </div>
                      <Badge className={n.read_status === "unread" ? "bg-blue-500" : "bg-gray-400"}>{n.read_status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: Proyeksi ═══ */}
      {tab === "proyeksi" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Proyeksi Return</h2>
          {proyeksi.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada data proyeksi.</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {proyeksi.map((p) => (
                <Card key={p.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{p.brand}</CardTitle>
                    <CardDescription>{p.product_name}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Investasi</span><span className="font-medium">{fmt(p.investasi)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Return 6 Bln</span><span className="font-medium text-emerald-600">{fmt(p.return_6bulan)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Return 12 Bln</span><span className="font-medium text-emerald-600">{fmt(p.return_12bulan)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">ROI</span><span className="font-bold">{p.roi_persen}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Payback</span><span>{p.payback_bulan} bln</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">IRR</span><span>{p.irr}%</span></div>
                    <StatusBadge status={p.status} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: Store ═══ */}
      {tab === "store" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Performa Store</h2>
          {store.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada data store.</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {store.map((s) => (
                <Card key={s.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{s.brand}</CardTitle>
                        <CardDescription>{s.kategori} · {s.lokasi}</CardDescription>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Revenue/Bulan</span><span className="font-medium">{fmt(s.revenue_bulanan)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Unit Terjual</span><span>{fmtNum(s.unit_terjual)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Avg Ticket</span><span>{fmt(s.avg_ticket)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Pelanggan Aktif</span><span>{fmtNum(s.pelanggan_aktif)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Conversion</span><span>{(s.conversion_rate * 100).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">NPS</span><span>{s.nps}</span></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: Register Product ═══ */}
      {tab === "register" && (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Produk Sukuk Mikro Baru</CardTitle>
            <CardDescription>Produk akan masuk Batch berikutnya. Pastikan COGS & harga jual sudah terhitung.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4 max-w-2xl" onSubmit={handleCreateProduct}>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-1"><Label>Kode *</Label><Input placeholder="SM-006" value={productForm.kode} onChange={(e) => setProductForm({ ...productForm, kode: e.target.value })} required /></div>
                <div className="grid gap-1"><Label>Nama Produk *</Label><Input placeholder="SWI ..." value={productForm.nama} onChange={(e) => setProductForm({ ...productForm, nama: e.target.value })} required /></div>
              </div>
              <div className="grid gap-1"><Label>Deskripsi</Label><Textarea value={productForm.deskripsi} onChange={(e) => setProductForm({ ...productForm, deskripsi: e.target.value })} rows={2} /></div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="grid gap-1"><Label>Kategori</Label>
                  <select className="rounded-md border bg-background px-3 py-2 text-sm" value={productForm.kategori} onChange={(e) => setProductForm({ ...productForm, kategori: e.target.value })}>
                    <option value="merchandise">Merchandise</option>
                    <option value="produk">Produk SWI</option>
                    <option value="experience">Experience</option>
                  </select>
                </div>
                <div className="grid gap-1"><Label>Harga per Unit (Rp) *</Label><Input type="number" value={productForm.harga_per_unit} onChange={(e) => setProductForm({ ...productForm, harga_per_unit: e.target.value })} required /></div>
                <div className="grid gap-1"><Label>Jumlah Unit *</Label><Input type="number" value={productForm.jumlah_unit} onChange={(e) => setProductForm({ ...productForm, jumlah_unit: e.target.value })} required /></div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="grid gap-1"><Label>Tenor (bulan)</Label><Input type="number" value={productForm.tenor_bulan} onChange={(e) => setProductForm({ ...productForm, tenor_bulan: e.target.value })} /></div>
                <div className="grid gap-1"><Label>Nisbah Investor (%)</Label><Input type="number" value={productForm.nisbah_investor} onChange={(e) => setProductForm({ ...productForm, nisbah_investor: e.target.value })} /></div>
                <div className="grid gap-1"><Label>Nisbah Pengelola (%)</Label><Input type="number" value={productForm.nisbah_pengelola} onChange={(e) => setProductForm({ ...productForm, nisbah_pengelola: e.target.value })} /></div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-1"><Label>Target COGS / unit (Rp)</Label><Input type="number" value={productForm.target_cogs} onChange={(e) => setProductForm({ ...productForm, target_cogs: e.target.value })} /></div>
                <div className="grid gap-1"><Label>Target Harga Jual / unit (Rp)</Label><Input type="number" value={productForm.target_harga_jual} onChange={(e) => setProductForm({ ...productForm, target_harga_jual: e.target.value })} /></div>
              </div>
              <div className="text-sm text-muted-foreground">
                Nilai sukuk: <span className="font-bold">{fmt(Number(productForm.harga_per_unit || 0) * Number(productForm.jumlah_unit || 0))}</span>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Daftarkan Produk</Button>
                <Button type="button" variant="outline" onClick={() => setTab("products")}>Batal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
