"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Beaker,
  CheckCircle2,
  Factory,
  FlaskConical,
  PackageCheck,
  Palette,
  ShoppingBag,
  Sparkles,
  Tags,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BRAND_PORTFOLIO, PRODUCTS, PRODUCT_CATEGORIES, getProductsByCategory } from "@/lib/public";
import { brandArchitecture, productRoadmap } from "@/lib/swi-overview";

const brandPanels = [
  "bg-[linear-gradient(135deg,#111827,#155e75)]",
  "bg-[linear-gradient(135deg,#0f172a,#0d9488)]",
  "bg-[linear-gradient(135deg,#3f3f46,#b45309)]",
];

const productIcons = [Sparkles, Beaker, Factory, PackageCheck];

const operatingNotes = [
  {
    title: "Positioning first",
    copy: "Setiap brand harus punya audiens, hero SKU, harga, margin, channel, dan alasan masuk ke holding.",
    icon: Palette,
  },
  {
    title: "Production discipline",
    copy: "Formula, sourcing, packaging, batch, QC, COGS, dan stock turn harus bisa dibaca dari dashboard.",
    icon: Factory,
  },
  {
    title: "Marketplace ready",
    copy: "Produk dan layanan harus siap menjadi katalog, booking, checkout, CRM, dan repeat order.",
    icon: ShoppingBag,
  },
];

const roadmapTone = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  build: "border-amber-200 bg-amber-50 text-amber-700",
  plan: "border-sky-200 bg-sky-50 text-sky-700",
  risk: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const products = selectedCategory ? getProductsByCategory(selectedCategory) : PRODUCTS;
  const categories = Object.entries(PRODUCT_CATEGORIES);

  const handleWhatsAppContact = (productName: string) => {
    const message = encodeURIComponent(`Halo, saya ingin konsultasi tentang ${productName}`);
    window.open(`https://wa.me/628118556688?text=${message}`, "_blank");
  };

  return (
    <div className="bg-[#fbfaf7] text-slate-950">
      <section className="border-b border-black/10 bg-white py-20">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <Badge variant="outline" className="border-slate-300 bg-[#fbfaf7]">
              Brands, products, and service lines
            </Badge>
            <h1 className="mt-5 text-5xl font-bold leading-[1.04] text-slate-950 md:text-7xl">
              Produk SWI harus punya arsitektur, bukan hanya daftar jualan.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              Brand portfolio, produk 1 liter, workshop, R&D, booth, dan B2B service perlu disusun sebagai mesin
              revenue yang bisa dilacak dari produksi sampai marketplace.
            </p>
          </div>
          <div className="grid gap-4">
            {operatingNotes.map((note) => {
              const Icon = note.icon;
              return (
                <article key={note.title} className="flex gap-4 rounded-xl border border-black/10 bg-[#fbfaf7] p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-slate-950 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-950">{note.title}</h2>
                    <p className="mt-1 text-sm leading-7 text-slate-600">{note.copy}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <Badge variant="outline" className="border-slate-300 bg-white">
                Brand architecture
              </Badge>
              <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">Tiga brand, tiga peran pasar.</h2>
            </div>
            <p className="text-base leading-8 text-slate-600">
              Data RUPS 2026 menunjukkan tiap brand berada di fase berbeda. Ini perlu ditampilkan jujur dan
              profesional agar investor melihat prioritas, bukan sekadar katalog cantik.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {BRAND_PORTFOLIO.map((brand, index) => {
              const detail = brandArchitecture.find((item) => item.name === brand.name);
              return (
                <article key={brand.id} className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
                  <div className={`p-6 text-white ${brandPanels[index % brandPanels.length]}`}>
                    <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                      {brand.category}
                    </Badge>
                    <h3 className="mt-12 text-3xl font-bold">{brand.name}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/75">{brand.description}</p>
                  </div>
                  <div className="p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Audience</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{detail?.audience ?? "Customer fragrance SWI"}</p>
                    <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">2025 proof</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{detail?.proof ?? "Perlu dilengkapi dengan traction aktual."}</p>
                    <div className="mt-5 rounded-lg bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Next move</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{detail?.nextMove ?? "Rapikan SKU, foto, price, dan margin."}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-black/10 bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <Badge variant="outline" className="border-slate-300 bg-[#fbfaf7]">
                2026 product roadmap
              </Badge>
              <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
                Roadmap produk yang langsung nyambung ke task tracker.
              </h2>
            </div>
            <p className="text-base leading-8 text-slate-600">
              Fokus 2026 bukan memperbanyak SKU tanpa arah. Fokusnya adalah produk 1 liter untuk reseller, product
              launch yang punya cerita, dan readiness produksi yang bisa dihitung.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {productRoadmap.map((item) => (
              <article key={item.name} className="rounded-xl border border-slate-200 bg-[#fbfaf7] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-slate-950 shadow-sm">
                    <FlaskConical className="h-5 w-5" />
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${roadmapTone[item.tone]}`}>
                    {item.brand}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-bold text-slate-950">{item.name}</h3>
                <p className="mt-2 text-sm font-semibold text-slate-700">{item.target}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.phase}</p>
                <div className="mt-5 space-y-2">
                  {item.blockers.map((blocker) => (
                    <p key={blocker} className="flex gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                      {blocker}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge variant="outline" className="border-slate-300 bg-white">
                Sellable service lines
              </Badge>
              <h2 className="mt-4 text-4xl font-bold text-slate-950 md:text-5xl">Layanan yang bisa langsung dipaketkan.</h2>
              <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">
                Layanan menjadi jembatan antara experience, produksi, event, dan customer acquisition.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                className={selectedCategory === null ? "bg-slate-950 hover:bg-slate-800" : "bg-white"}
                onClick={() => setSelectedCategory(null)}
              >
                Semua
              </Button>
              {categories.map(([key, label]) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? "default" : "outline"}
                  className={selectedCategory === key ? "bg-slate-950 hover:bg-slate-800" : "bg-white"}
                  onClick={() => setSelectedCategory(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {products.map((product, index) => {
              const Icon = productIcons[index % productIcons.length];
              return (
                <article key={product.id} className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-950">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-white">
                        {PRODUCT_CATEGORIES[product.category as keyof typeof PRODUCT_CATEGORIES]}
                      </Badge>
                      {product.priceRange && <Badge variant="secondary">{product.priceRange}</Badge>}
                    </div>
                  </div>
                  <h3 className="mt-5 text-2xl font-bold text-slate-950">{product.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{product.description}</p>
                  <div className="mt-6 grid gap-2 sm:grid-cols-2">
                    {product.features.map((feature) => (
                      <p key={feature} className="flex gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                        {feature}
                      </p>
                    ))}
                  </div>
                  <Button className="mt-6 bg-slate-950 hover:bg-slate-800" onClick={() => handleWhatsAppContact(product.name)}>
                    Konsultasi layanan
                    <Tags className="h-4 w-4" />
                  </Button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#10231f] py-16 text-white">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-3xl font-bold">Katalog harus siap masuk marketplace.</h2>
            <p className="mt-3 max-w-2xl text-white/72">
              Tahap berikutnya: SKU, harga, COGS, margin, stok, foto, status merek, fulfillment, dan CRM disambungkan
              ke dashboard internal.
            </p>
          </div>
          <Button asChild size="lg" variant="secondary">
            <Link href="/upcoming-events">
              Lihat event pipeline
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
