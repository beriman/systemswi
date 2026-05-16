import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  CheckCircle2,
  Database,
  Factory,
  Landmark,
  LineChart,
  ShoppingBag,
  Sparkles,
  Store,
} from "lucide-react";
import { COMPANY_INFO } from "@/lib/public";
import { holdingDivisions, publicHighlights } from "@/lib/swi-overview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "PT Sensasi Wangi Indonesia | Company Profile",
  description:
    "Company profile PT Sensasi Wangi Indonesia, holding parfum Indonesia untuk SWI Store, Fragrantions, brand parfum, produksi, marketplace, dan sistem digital.",
  keywords: [
    "PT Sensasi Wangi Indonesia",
    "SWI Store",
    "Fragrantions",
    "sensasiwangi.id",
    "parfum Indonesia",
    "investor parfum",
  ],
  openGraph: {
    title: "PT Sensasi Wangi Indonesia",
    description: "Holding parfum Indonesia yang menghubungkan store, event, brand, produksi, marketplace, dan data.",
    type: "website",
  },
};

const divisionIcons = [Landmark, Store, CalendarDays, Factory, ShoppingBag, Database];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="border-b bg-gradient-to-b from-white via-slate-50 to-white">
        <div className="container mx-auto grid gap-12 px-4 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-24">
          <div className="space-y-7">
            <Badge variant="secondary" className="w-fit border border-primary/10 bg-primary/5 text-primary">
              PT Sensasi Wangi Indonesia
            </Badge>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-4xl font-bold leading-tight text-slate-950 md:text-6xl">
                Holding parfum Indonesia untuk experience, brand, event, marketplace, dan customer data.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                SWI menghubungkan SWI Store, Fragrantions, production and brands, serta marketplace sensasiwangi.id
                menjadi ekosistem fragrance yang mudah dipahami customer, partner, vendor, dan calon investor.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="#investor">
                  Lihat peluang investor
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/about">Pelajari company profile</Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {publicHighlights.map((item) => (
                <div key={item.label} className="rounded-lg border bg-white p-4 shadow-sm">
                  <p className="font-semibold text-slate-950">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-elegant">
            <div className="flex items-center gap-4 border-b pb-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-50">
                <Image src={COMPANY_INFO.logo} alt="Logo PT Sensasi Wangi Indonesia" width={52} height={52} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Company profile</p>
                <h2 className="text-2xl font-bold text-slate-950">SWI ecosystem map</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {[
                ["SWI Store", "Offline experience, kelas, booking, racik parfum"],
                ["Fragrantions", "Event, komunitas, tenant, sponsor, media"],
                ["Production & Brands", "R&D, formula, SKU, QC, brand portfolio"],
                ["sensasiwangi.id", "Marketplace, checkout, CRM, repeat order"],
              ].map(([title, copy]) => (
                <div key={title} className="flex gap-3 rounded-lg bg-slate-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold text-slate-950">{title}</p>
                    <p className="text-sm text-muted-foreground">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="py-20">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-4">
            <Badge variant="outline" className="w-fit">Tentang holding</Badge>
            <h2 className="text-3xl font-bold leading-tight md:text-4xl">
              SWI dibangun sebagai operating holding, bukan hanya brand parfum tunggal.
            </h2>
          </div>
          <div className="grid gap-5 text-muted-foreground">
            <p className="text-lg leading-8">
              PT Sensasi Wangi Indonesia mengembangkan bisnis fragrance dari beberapa sisi: retail offline,
              pengalaman customer, edukasi, event, produksi, brand portfolio, marketplace, dan sistem digital.
            </p>
            <p className="text-lg leading-8">
              Model ini membuat setiap unit saling memberi traffic dan data. Customer bisa datang dari event,
              landing page, QR, shareable link, store visit, atau marketplace, lalu diarahkan ke pengalaman yang
              terukur dan bisa diikuti dengan repeat order.
            </p>
          </div>
        </div>
      </section>

      <section id="divisions" className="border-y bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 max-w-3xl">
            <Badge variant="outline" className="mb-4">Divisi SWI</Badge>
            <h2 className="text-3xl font-bold md:text-4xl">Struktur holding yang bisa dikembangkan bertahap.</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Setiap divisi punya fungsi bisnis jelas, tetapi tetap terhubung dalam satu funnel customer dan satu
              sistem monitoring internal.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {holdingDivisions.map((division, index) => {
              const Icon = divisionIcons[index] ?? Building2;
              return (
                <Card key={division.name} className="h-full border-none shadow-sm">
                  <CardHeader>
                    <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl">{division.name}</CardTitle>
                    <CardDescription className="text-sm leading-6">{division.summary}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {division.focus.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="marketplace" className="py-20">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="space-y-5">
            <Badge variant="outline" className="w-fit">sensasiwangi.id</Badge>
            <h2 className="text-3xl font-bold leading-tight md:text-4xl">
              Marketplace menjadi pusat katalog, booking, checkout, dan data customer SWI.
            </h2>
            <p className="text-lg leading-8 text-muted-foreground">
              Kanal digital perlu dirancang sebagai business engine: dari discovery, booking kelas atau store
              experience, checkout produk, customer support, hingga analytics untuk repeat order.
            </p>
            <Button asChild variant="outline">
              <Link href="/products">Lihat layanan dan brand</Link>
            </Button>
          </div>
          <div className="grid gap-4">
            {[
              ["Catalog and brand pages", "Produk SWI Store, Larc-en-Scent, Nuscentza, Pixel Potion, dan brand lain."],
              ["Booking and checkout", "Kelas, visit store, racik parfum, event, pembayaran, dan fulfillment."],
              ["CRM and analytics", "Traffic source, conversion, AOV, feedback, scent profile, dan repeat order."],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-lg border bg-white p-5 shadow-sm">
                <p className="font-semibold text-slate-950">{title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="investor" className="border-y bg-slate-950 py-20 text-white">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="space-y-5">
              <Badge variant="secondary" className="w-fit bg-white/10 text-white">Investor friendly</Badge>
              <h2 className="text-3xl font-bold leading-tight md:text-4xl">
                Investor dapat membaca SWI sebagai ekosistem, bukan hanya toko atau event.
              </h2>
              <p className="text-lg leading-8 text-white/75">
                Narasi investasi perlu menunjukkan bagaimana store, event, brand, produksi, marketplace, dan data
                customer saling menguatkan revenue stream.
              </p>
              <Button asChild size="lg" variant="secondary">
                <Link href="/dashboard">
                  Buka dashboard internal
                  <LineChart className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Multi-channel revenue", "Retail store, kelas, event, brand, B2B, marketplace, dan repeat order."],
                ["Experience-led moat", "Customer tidak hanya membeli produk, tetapi mengalami proses memilih dan meracik aroma."],
                ["Data advantage", "AI Mix dan scent profile dapat menjadi dasar CRM dan rekomendasi produk."],
                ["Governance path", "Dashboard internal membantu legal, finance, HKI, vendor, dan investor readiness lebih transparan."],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-lg border border-white/10 bg-white/5 p-5">
                  <ChartNoAxesCombined className="mb-4 h-6 w-6 text-amber-300" />
                  <p className="font-semibold">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <Sparkles className="mx-auto mb-6 h-12 w-12 text-primary" />
          <h2 className="mx-auto max-w-3xl text-3xl font-bold leading-tight md:text-4xl">
            Siap dikembangkan menjadi company profile, investor room, dan operating dashboard.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Tahap berikutnya adalah melengkapi foto, angka aktual, legal/HKI, vendor list, partner pipeline, dan
            financial model agar materi publik dan internal semakin kuat.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/about">Lihat detail perusahaan</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/dashboard">Masuk dashboard</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
