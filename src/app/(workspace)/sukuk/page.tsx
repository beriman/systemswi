"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SukukProduct = {
  id: number;
  kode: string;
  nama: string;
  deskripsi: string;
  kategori: string;
  harga_per_unit: number;
  jumlah_unit: number;
  nilai_sukuk: number;
  tenor_bulan: number;
  nisbah_investor: number;
  nisbah_pengelola: number;
  jenis_akad: string;
  target_cogs: number;
  target_harga_jual: number;
  status: string;
  unit_terjual?: number;
  total_terkumpul?: number;
  created_at: string;
};

type Investment = {
  id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  investor_name: string;
  investor_email: string;
  investor_phone: string;
  jumlah_unit: number;
  nilai_investasi: number;
  tanggal_investasi: string;
  status: string;
  consent: number;
};

type ProfitDistribution = {
  id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  periode: string;
  total_revenue: number;
  total_cogs: number;
  total_profit: number;
  nisbah_investor: number;
  nisbah_pengelola: number;
  jumlah_dibagikan: number;
  jumlah_per_unit: number;
  status: string;
};

const fmt = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v || 0);

const fmtNum = (v: number) => new Intl.NumberFormat("id-ID").format(v || 0);

function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    open: "bg-emerald-600", funded: "bg-blue-600", launched: "bg-purple-600",
    closed: "bg-red-500", aktif: "bg-emerald-600", draft: "bg-yellow-600", paid: "bg-emerald-600",
  };
  const label: Record<string, string> = {
    open: "Open", funded: "Fully Funded", launched: "Launched",
    closed: "Closed", aktif: "Aktif", draft: "Draft", paid: "Dibayar",
  };
  return <Badge className={tone[status] || "bg-gray-500"}>{label[status] || status}</Badge>;
}

export default function SukukMicroPage() {
  const [products, setProducts] = useState<SukukProduct[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [distributions, setDistributions] = useState<ProfitDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"products" | "invest" | "distributions" | "register">("products");
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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, iRes, dRes] = await Promise.all([
        fetch("/api/sukuk/products", { cache: "no-store" }),
        fetch("/api/sukuk/invest", { cache: "no-store" }),
        fetch("/api/sukuk/distributions", { cache: "no-store" }),
      ]);
      const [pData, iData, dData] = await Promise.all([pRes.json(), iRes.json(), dRes.json()]);
      setProducts(pData.products || []);
      setInvestments(iData.investments || []);
      setDistributions(dData.distributions || []);
      setStatus(`Loaded: ${pData.products?.length || 0} produk, ${iData.investments?.length || 0} investasi`);
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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
          ...investForm,
          jumlah_unit: Number(investForm.jumlah_unit) || 1,
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

  const totalFundingTarget = products.reduce((s, p) => s + p.nilai_sukuk, 0);
  const totalRaised = products.reduce((s, p) => s + (p.total_terkumpul || 0), 0);
  const totalInvestors = new Set(investments.map((i) => i.investor_email || i.investor_name)).size;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">FASE 7 — Financial Ecosystem</p>
          <h1 className="text-3xl font-bold">Sukuk Mikro Per Produk</h1>
          <p className="text-muted-foreground">
            Platform sukuk mikro syariah untuk pendanaan produk SWI. Investasi per unit, profit dibagikan sesuai nisbah Musyarakah.
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
          <CardContent><div className="text-2xl font-bold">{totalInvestors}</div></CardContent></Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {([
          { key: "products", label: "Produk" },
          { key: "invest", label: "Investasi" },
          { key: "distributions", label: "Distribusi Profit" },
          { key: "register", label: "Daftar Produk Baru" },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Status bar */}
      <p className="text-xs text-muted-foreground">{status}</p>

      {/* ═══ TAB: Produk ═══ */}
      {tab === "products" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Daftar Produk Sukuk Mikro — Batch 1</h2>
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
                      {/* Progress bar */}
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
                        <th className="p-3">Investor</th>
                        <th className="p-3">Produk</th>
                        <th className="p-3 text-right">Unit</th>
                        <th className="p-3 text-right">Nilai</th>
                        <th className="p-3">Tanggal</th>
                        <th className="p-3">Status</th>
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
              <p className="text-xs mt-2">Distribusi profit akan muncul setelah produk menghasilkan revenue dan admin membuat jadwal pembagian.</p>
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
