"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BrandSummary = {
  id: string;
  name: string;
  category: string;
  status: string;
  pic: string;
  positioning: string;
  defaultChannel: string;
  notes: string;
  productionQty: number;
  productionCost: number;
  unitsSold: number;
  netRevenue: number;
  cogs: number;
  expenses: number;
  grossProfit: number;
  operatingProfit: number;
  avgSellingPrice: number;
  stockEstimate: number;
};

type ApiData = {
  brands: BrandSummary[];
  totals: {
    brandCount: number;
    productionQty: number;
    productionCost: number;
    unitsSold: number;
    netRevenue: number;
    cogs: number;
    expenses: number;
    grossProfit: number;
    operatingProfit: number;
  };
  workflow: string[];
};

const BRAND_COLORS: Record<string, string> = {
  "brand-larcenscent": "from-purple-500 to-fuchsia-500",
  "brand-pixel-potion": "from-orange-500 to-pink-500",
  "brand-nuscentza": "from-emerald-500 to-teal-500",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value || 0);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function BrandsPage() {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("all");
  const [activeForm, setActiveForm] = useState<"brand" | "production" | "sale" | "expense">("production");

  const selectedBrand = useMemo(
    () => data?.brands.find((brand) => brand.id === selectedBrandId) || data?.brands[0],
    [data, selectedBrandId]
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/brands", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.details || json.error || "Gagal memuat brand");
      setData(json);
      if (selectedBrandId === "all" && json.brands?.[0]) setSelectedBrandId(json.brands[0].id);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(action: string, payload: Record<string, string | number>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.details || json.error || "Gagal menyimpan data");
      await load();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  function ProductionForm() {
    function handleSubmit(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      submit("production", {
        date: String(form.get("date") || today()),
        brandId: selectedBrand?.id || "",
        brandName: selectedBrand?.name || "",
        sku: String(form.get("sku") || ""),
        productName: String(form.get("productName") || ""),
        productType: String(form.get("productType") || "Perfume"),
        batchCode: String(form.get("batchCode") || ""),
        qtyProduced: Number(form.get("qtyProduced") || 0),
        hppPerUnit: Number(form.get("hppPerUnit") || 0),
        status: String(form.get("status") || "Done"),
        notes: String(form.get("notes") || ""),
      });
      e.currentTarget.reset();
    }

    return (
      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
        <Field name="date" label="Tanggal" type="date" defaultValue={today()} />
        <Field name="sku" label="SKU" placeholder="ARC-001" />
        <Field name="productName" label="Nama Produk" placeholder="Eau de Parfum 30ml" />
        <Field name="productType" label="Tipe Produk" placeholder="Perfume / Merchandise" defaultValue="Perfume" />
        <Field name="batchCode" label="Batch Code" placeholder="BATCH-2026-001" />
        <Field name="qtyProduced" label="Qty Produksi" type="number" placeholder="100" />
        <Field name="hppPerUnit" label="HPP / Unit" type="number" placeholder="45000" />
        <Field name="status" label="Status" placeholder="Done / QC / Planned" defaultValue="Done" />
        <Field className="md:col-span-2" name="notes" label="Catatan" placeholder="Formula, packaging, vendor, dll" />
        <Button disabled={saving || !selectedBrand} className="md:col-span-2">Simpan Produksi</Button>
      </form>
    );
  }

  function SaleForm() {
    function handleSubmit(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      const qty = Number(form.get("qtySold") || 0);
      const price = Number(form.get("unitPrice") || 0);
      const discount = Number(form.get("discount") || 0);
      submit("sale", {
        date: String(form.get("date") || today()),
        brandId: selectedBrand?.id || "",
        brandName: selectedBrand?.name || "",
        sku: String(form.get("sku") || ""),
        productName: String(form.get("productName") || ""),
        channel: String(form.get("channel") || "Direct"),
        qtySold: qty,
        unitPrice: price,
        grossRevenue: qty * price,
        discount,
        netRevenue: qty * price - discount,
        cogs: Number(form.get("cogs") || 0),
        notes: String(form.get("notes") || ""),
      });
      e.currentTarget.reset();
    }

    return (
      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
        <Field name="date" label="Tanggal" type="date" defaultValue={today()} />
        <Field name="sku" label="SKU" placeholder="ARC-001" />
        <Field name="productName" label="Nama Produk" placeholder="Discovery Set" />
        <Field name="channel" label="Channel" placeholder="Bazaar / Online / Store / Direct" />
        <Field name="qtySold" label="Qty Terjual" type="number" placeholder="10" />
        <Field name="unitPrice" label="Harga / Unit" type="number" placeholder="120000" />
        <Field name="discount" label="Diskon" type="number" placeholder="0" />
        <Field name="cogs" label="COGS Total" type="number" placeholder="450000" />
        <Field className="md:col-span-2" name="notes" label="Catatan" placeholder="Customer/event/payment notes" />
        <Button disabled={saving || !selectedBrand} className="md:col-span-2">Simpan Penjualan</Button>
      </form>
    );
  }

  function ExpenseForm() {
    function handleSubmit(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      submit("expense", {
        date: String(form.get("date") || today()),
        brandId: selectedBrand?.id || "",
        brandName: selectedBrand?.name || "",
        category: String(form.get("category") || "Marketing"),
        expenseName: String(form.get("expenseName") || ""),
        channelEvent: String(form.get("channelEvent") || ""),
        amount: Number(form.get("amount") || 0),
        paymentMethod: String(form.get("paymentMethod") || ""),
        vendor: String(form.get("vendor") || ""),
        proofUrl: String(form.get("proofUrl") || ""),
        notes: String(form.get("notes") || ""),
      });
      e.currentTarget.reset();
    }

    return (
      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
        <Field name="date" label="Tanggal" type="date" defaultValue={today()} />
        <Field name="category" label="Kategori" placeholder="Booth / Ads / Packaging / R&D" />
        <Field name="expenseName" label="Nama Pengeluaran" placeholder="Sewa booth bazar" />
        <Field name="channelEvent" label="Channel/Event" placeholder="Bazar TIM / Meta Ads" />
        <Field name="amount" label="Nominal" type="number" placeholder="1500000" />
        <Field name="paymentMethod" label="Metode Bayar" placeholder="Transfer / Cash / QRIS" />
        <Field name="vendor" label="Vendor" placeholder="Nama vendor/platform" />
        <Field name="proofUrl" label="Proof URL" placeholder="Link nota/Drive" />
        <Field className="md:col-span-2" name="notes" label="Catatan" placeholder="Keterangan tambahan" />
        <Button disabled={saving || !selectedBrand} className="md:col-span-2">Simpan Pengeluaran</Button>
      </form>
    );
  }

  function BrandForm() {
    function handleSubmit(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      submit("add-brand", {
        name: String(form.get("name") || ""),
        category: String(form.get("category") || "Perfume"),
        pic: String(form.get("pic") || "Team Produksi"),
        positioning: String(form.get("positioning") || ""),
        defaultChannel: String(form.get("defaultChannel") || ""),
        notes: String(form.get("notes") || ""),
      });
      e.currentTarget.reset();
    }

    return (
      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
        <Field name="name" label="Nama Brand" placeholder="Nama brand baru" />
        <Field name="category" label="Kategori" placeholder="Perfume / Merchandise / Apparel" defaultValue="Perfume" />
        <Field name="pic" label="PIC" placeholder="Team Produksi" />
        <Field name="defaultChannel" label="Channel Default" placeholder="Store / Online / Bazaar" />
        <Field className="md:col-span-2" name="positioning" label="Positioning" placeholder="Premium, youth, heritage, dll" />
        <Field className="md:col-span-2" name="notes" label="Catatan" placeholder="Template brand bisa diterapkan untuk produk non-parfum juga" />
        <Button disabled={saving} className="md:col-span-2">Tambah Brand</Button>
      </form>
    );
  }

  const totals = data?.totals;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">🏭 Brand Production & Selling</h2>
          <p className="text-muted-foreground">
            Template dashboard per brand: produksi → selling → pengeluaran → analisa margin/profit.
          </p>
        </div>
        <Button onClick={load} disabled={loading}>Refresh Data</Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-red-700">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi title="Brand Aktif" value={loading ? "..." : formatNumber(totals?.brandCount || 0)} note="template bisa ditambah" />
        <Kpi title="Qty Produksi" value={loading ? "..." : formatNumber(totals?.productionQty || 0)} note="semua brand" />
        <Kpi title="Net Revenue" value={loading ? "..." : formatCurrency(totals?.netRevenue || 0)} note="selling - diskon" />
        <Kpi title="Operating Profit" value={loading ? "..." : formatCurrency(totals?.operatingProfit || 0)} note="gross profit - expense" accent={(totals?.operatingProfit || 0) >= 0 ? "text-green-600" : "text-red-600"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflow Template Brand</CardTitle>
          <CardDescription>Ini pola yang dipakai setiap brand baru, termasuk merchandise SWI Store nanti.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-5">
            {["Brand_Master", "Brand_Production", "Brand_Sales", "Brand_Expenses", "Brand_Dashboard"].map((step, i) => (
              <div key={step} className="rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="mb-1 font-semibold">{i + 1}. {step}</div>
                <div className="text-xs text-muted-foreground">
                  {i === 0 ? "Tambah brand/SKU" : i === 1 ? "Catat batch" : i === 2 ? "Catat selling" : i === 3 ? "Catat biaya" : "Analisa brand"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {(data?.brands || []).map((brand) => (
          <Card key={brand.id} className={`overflow-hidden ${selectedBrandId === brand.id ? "ring-2 ring-primary" : ""}`}>
            <div className={`h-2 bg-gradient-to-r ${BRAND_COLORS[brand.id] || "from-slate-500 to-slate-700"}`} />
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{brand.name}</CardTitle>
                  <CardDescription>{brand.positioning || brand.category}</CardDescription>
                </div>
                <Badge>{brand.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Metric label="Produksi" value={`${formatNumber(brand.productionQty)} unit`} />
              <Metric label="Terjual" value={`${formatNumber(brand.unitsSold)} unit`} />
              <Metric label="Stock Est." value={`${formatNumber(brand.stockEstimate)} unit`} />
              <Metric label="Net Revenue" value={formatCurrency(brand.netRevenue)} />
              <Metric label="Expense" value={formatCurrency(brand.expenses)} />
              <Metric label="Operating Profit" value={formatCurrency(brand.operatingProfit)} highlight={brand.operatingProfit >= 0 ? "text-green-600" : "text-red-600"} />
              <Button className="w-full" variant={selectedBrandId === brand.id ? "default" : "outline"} onClick={() => setSelectedBrandId(brand.id)}>
                Input untuk brand ini
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Input Data Brand</CardTitle>
              <CardDescription>
                Brand aktif: <strong>{selectedBrand?.name || "-"}</strong>. Semua input masuk ke Google Sheets.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                ["production", "Produksi"],
                ["sale", "Selling"],
                ["expense", "Pengeluaran"],
                ["brand", "+ Brand"],
              ].map(([key, label]) => (
                <Button key={key} size="sm" variant={activeForm === key ? "default" : "outline"} onClick={() => setActiveForm(key as typeof activeForm)}>
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeForm === "production" ? <ProductionForm /> : activeForm === "sale" ? <SaleForm /> : activeForm === "expense" ? <ExpenseForm /> : <BrandForm />}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, className = "", ...props }: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <Label className="mb-1 block text-xs text-muted-foreground">{label}</Label>
      <Input {...props} />
    </div>
  );
}

function Kpi({ title, value, note, accent = "" }: { title: string; value: string; note: string; accent?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${accent}`}>{value}</div>
        <div className="text-xs text-muted-foreground">{note}</div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, highlight = "" }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${highlight}`}>{value}</span>
    </div>
  );
}
