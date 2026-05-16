"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Beaker,
  CheckCircle2,
  Factory,
  PackageCheck,
  Palette,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { BRAND_PORTFOLIO, PRODUCTS, PRODUCT_CATEGORIES, getProductsByCategory } from "@/lib/public";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const brandAccents = [
  "from-purple-900 via-purple-700 to-pink-600",
  "from-cyan-600 via-blue-600 to-purple-600",
  "from-amber-700 via-orange-600 to-red-600",
];

const productIcons = [Sparkles, Beaker, Factory, PackageCheck];

const operatingNotes = [
  {
    title: "Brand portfolio",
    copy: "Larc-en-Scent, Pixel Potion, dan NUScentZa memberi SWI beberapa positioning pasar dalam satu holding.",
    icon: Palette,
  },
  {
    title: "Production capability",
    copy: "R&D, formula, bahan, packaging, QC, dan batch production perlu diikat ke COGS dan margin.",
    icon: Factory,
  },
  {
    title: "Marketplace-ready catalog",
    copy: "Produk dan layanan harus mudah masuk ke katalog, checkout, booking, CRM, dan repeat order.",
    icon: ShoppingBag,
  },
];

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const products = selectedCategory ? getProductsByCategory(selectedCategory) : PRODUCTS;
  const categories = Object.entries(PRODUCT_CATEGORIES);

  const handleWhatsAppContact = (productName: string) => {
    const message = encodeURIComponent(`Halo, saya ingin konsultasi tentang ${productName}`);
    window.open(`https://wa.me/628118556688?text=${message}`, "_blank");
  };

  return (
    <div className="flex flex-col">
      <section className="border-b bg-gradient-to-b from-white via-slate-50 to-white py-20">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <Badge variant="secondary" className="mb-5 border border-primary/10 bg-primary/5 text-primary">
              Brands & services
            </Badge>
            <h1 className="text-4xl font-bold leading-tight text-slate-950 md:text-6xl">
              Brand parfum dan layanan SWI sebagai mesin produk, experience, dan repeat order.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
              Halaman ini menampilkan portfolio brand dan service line yang dapat dijual melalui SWI Store,
              Fragrantions, B2B partnership, dan marketplace sensasiwangi.id.
            </p>
          </div>
          <div className="grid gap-4">
            {operatingNotes.map((note) => {
              const Icon = note.icon;
              return (
                <div key={note.title} className="flex gap-4 rounded-xl border bg-white p-5 shadow-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">{note.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{note.copy}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 max-w-3xl">
            <h2 className="text-3xl font-bold text-slate-950">Brand portfolio</h2>
            <p className="mt-3 text-muted-foreground">
              Setiap brand perlu punya positioning, SKU, harga, margin, kanal distribusi, dan role yang jelas dalam holding.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {BRAND_PORTFOLIO.map((brand, index) => (
              <Card key={brand.id} className="overflow-hidden border-none shadow-sm">
                <div className={`h-40 bg-gradient-to-br ${brandAccents[index % brandAccents.length]} p-6 text-white`}>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {brand.category}
                  </Badge>
                  <div className="mt-10">
                    <h3 className="text-2xl font-bold">{brand.name}</h3>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">{brand.name}</CardTitle>
                  <CardDescription className="leading-6">{brand.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-muted/60 p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-950">Yang perlu dilengkapi</p>
                    <p className="mt-1">SKU, hero product, harga, COGS, margin, stok, foto produk, dan status merek.</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-950">Service lines</h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Layanan ini menjadi jembatan antara experience, produksi, event, dan customer acquisition.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
              >
                Semua
              </Button>
              {categories.map(([key, label]) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? "default" : "outline"}
                  onClick={() => setSelectedCategory(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {products.map((product, index) => {
              const Icon = productIcons[index % productIcons.length];
              return (
                <Card key={product.id} className="border-none shadow-sm">
                  <CardHeader>
                    <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {PRODUCT_CATEGORIES[product.category as keyof typeof PRODUCT_CATEGORIES]}
                      </Badge>
                      {product.priceRange && <Badge variant="secondary">{product.priceRange}</Badge>}
                    </div>
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                    <CardDescription className="leading-6">{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {product.features.map((feature) => (
                        <li key={feature} className="flex gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button className="mt-6 w-full" onClick={() => handleWhatsAppContact(product.name)}>
                      Konsultasi layanan
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-3xl font-bold">Produk dan layanan harus siap masuk marketplace.</h2>
            <p className="mt-3 max-w-2xl text-white/75">
              Tahap berikutnya adalah menyusun katalog SKU, halaman brand, booking flow, checkout, inventory,
              fulfillment, dan CRM untuk repeat order.
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
