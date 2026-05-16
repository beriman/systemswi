import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Database,
  Factory,
  FileCheck2,
  Landmark,
  LineChart,
  Network,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COMPANY_INFO } from "@/lib/public";
import {
  brandArchitecture,
  ecosystemFlow,
  eventPipeline,
  executiveStats,
  holdingDivisions,
  investorThesis,
  publicHighlights,
  rupsSnapshot,
} from "@/lib/swi-overview";

export const metadata: Metadata = {
  title: "PT Sensasi Wangi Indonesia | Fragrance Ecosystem Holding",
  description:
    "Investor-friendly company profile PT Sensasi Wangi Indonesia: SWI Store, Fragrantions, brand parfum, produksi, marketplace, dan dashboard data.",
  keywords: [
    "PT Sensasi Wangi Indonesia",
    "SWI Store",
    "Fragrantions",
    "sensasiwangi.id",
    "fragrance ecosystem",
    "investor parfum Indonesia",
  ],
  openGraph: {
    title: "PT Sensasi Wangi Indonesia",
    description:
      "Holding parfum Indonesia yang menghubungkan store, event, brand, produksi, marketplace, dan customer data.",
    type: "website",
  },
};

const divisionIcons = [Landmark, Store, CalendarDays, Factory, ShoppingBag, Database];

const toneClass = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  build: "border-amber-200 bg-amber-50 text-amber-700",
  plan: "border-sky-200 bg-sky-50 text-sky-700",
  risk: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function HomePage() {
  return (
    <div className="bg-[#fbfaf7] text-slate-950">
      <section className="relative overflow-hidden border-b border-black/10 bg-[#f7f3ea]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(20,184,166,0.22),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(245,158,11,0.22),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.7),rgba(255,255,255,0))]" />
        <div className="container relative mx-auto grid min-h-[760px] gap-12 px-4 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-20">
          <div className="space-y-8">
            <Badge className="border-black/10 bg-white/80 text-slate-800 hover:bg-white" variant="outline">
              Company profile and investor frontpage
            </Badge>
            <div className="max-w-5xl space-y-6">
              <h1 className="text-5xl font-bold leading-[1.02] text-slate-950 md:text-7xl">
                PT Sensasi Wangi Indonesia
              </h1>
              <p className="max-w-3xl text-2xl font-semibold leading-9 text-slate-800 md:text-3xl">
                Fragrance ecosystem holding untuk store, event, brand, produksi, marketplace, dan customer data.
              </p>
              <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                SWI tidak diposisikan sebagai toko parfum tunggal. SWI dibangun sebagai operating holding yang
                menghubungkan pengalaman offline, Fragrantions, brand portfolio, produksi, web marketplace, dan sistem
                internal agar mudah dibaca oleh customer, partner, vendor, dan investor.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-slate-950 text-white hover:bg-slate-800">
                <Link href="/dashboard">
                  Buka dashboard internal
                  <LineChart className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-slate-300 bg-white/80">
                <Link href="/portfolio">
                  Lihat proof of work
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {publicHighlights.map((item) => (
                <div key={item.label} className="rounded-lg border border-black/10 bg-white/75 p-4 shadow-sm backdrop-blur">
                  <p className="text-sm font-bold text-slate-950">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white/85 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="rounded-xl border border-slate-200 bg-slate-950 p-6 text-white">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">SWI ecosystem map</p>
                  <h2 className="mt-3 text-3xl font-bold">Satu funnel, banyak revenue stream.</h2>
                </div>
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white">
                  <Image src={COMPANY_INFO.logo} alt="Logo PT Sensasi Wangi Indonesia" width={52} height={52} />
                </div>
              </div>
              <div className="mt-8 grid gap-3">
                {ecosystemFlow.map((item, index) => (
                  <div key={item.step} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.06] p-4 sm:grid-cols-[92px_1fr]">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-300 text-sm font-bold text-slate-950">
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold text-teal-100">{item.step}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-white/70">{item.copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-black/10 bg-white p-5">
                <Network className="h-5 w-5 text-teal-700" />
                <p className="mt-4 text-sm font-semibold text-slate-500">Holding logic</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">Experience to data</p>
              </div>
              <div className="rounded-xl border border-black/10 bg-white p-5">
                <CircleDollarSign className="h-5 w-5 text-amber-600" />
                <p className="mt-4 text-sm font-semibold text-slate-500">Commercial logic</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">Data to revenue</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white py-8">
        <div className="container mx-auto grid gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4">
          {executiveStats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-slate-200 p-5">
              <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
              <p className="mt-2 text-4xl font-bold text-slate-950">{stat.value}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{stat.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="divisions" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge variant="outline" className="border-slate-300 bg-white">
                Operating holding
              </Badge>
              <h2 className="mt-4 text-4xl font-bold leading-tight text-slate-950 md:text-5xl">
                Enam unit kerja yang saling mengalir, bukan halaman profile yang berdiri sendiri.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-8 text-slate-600">
              Setiap divisi dibuat agar punya fungsi bisnis, metric, next decision, dan revenue lever yang jelas. Ini
              yang membuat dashboard internal dan frontpage publik bicara dalam bahasa yang sama.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {holdingDivisions.map((division, index) => {
              const Icon = divisionIcons[index] ?? Building2;
              return (
                <article key={division.name} className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f1f5f9] text-slate-900">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${toneClass[division.tone]}`}>
                      {division.status}
                    </span>
                  </div>
                  <div className="mt-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{division.code}</p>
                    <h3 className="mt-2 text-xl font-bold text-slate-950">{division.name}</h3>
                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-800">{division.headline}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{division.summary}</p>
                  </div>
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>Readiness</span>
                      <span>{division.readiness}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-slate-950" style={{ width: `${division.readiness}%` }} />
                    </div>
                  </div>
                  <div className="mt-5 rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Next decision</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{division.nextDecision}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-black/10 bg-[#10231f] py-20 text-white">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
              2026 operating agenda
            </Badge>
            <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
              Data RUPS sudah cukup untuk membentuk cerita bisnis yang lebih serius.
            </h2>
            <p className="mt-5 text-base leading-8 text-white/72">
              Catatan RUPS 11 Januari 2026 dan task tracker menunjukkan masalah nyata: brand butuh awareness, produk
              1 liter harus masuk produksi, dan event harus dipersiapkan sebagai growth engine.
            </p>
            <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.06] p-5">
              <p className="text-sm font-semibold text-teal-100">RUPS snapshot</p>
              <p className="mt-1 text-2xl font-bold">{rupsSnapshot.date}</p>
              <p className="mt-2 text-sm leading-6 text-white/70">{rupsSnapshot.agenda}</p>
            </div>
          </div>

          <div className="grid gap-4">
            {rupsSnapshot.facts.map((fact) => (
              <div key={fact} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.06] p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <p className="text-sm leading-6 text-white/80">{fact}</p>
              </div>
            ))}
            <div className="grid gap-4 pt-2 md:grid-cols-3">
              {brandArchitecture.map((brand) => (
                <div key={brand.name} className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                  <p className="font-bold">{brand.name}</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">{brand.position}</p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-teal-100">Next move</p>
                  <p className="mt-2 text-sm leading-6 text-white/78">{brand.nextMove}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="fragrantions" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <Badge variant="outline" className="border-slate-300 bg-white">
                Fragrantions as growth engine
              </Badge>
              <h2 className="mt-4 text-4xl font-bold leading-tight text-slate-950 md:text-5xl">
                Event harus menghasilkan leads, sponsor, tenant, konten, dan repeat order.
              </h2>
            </div>
            <p className="text-base leading-8 text-slate-600">
              Event pipeline tidak cukup tampil sebagai kalender. Di frontpage investor, Fragrantions perlu terlihat
              sebagai platform akuisisi dan monetisasi yang mengalir ke store, brand, marketplace, dan B2B.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-4">
            {eventPipeline.map((event) => (
              <article key={event.name} className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <CalendarDays className="h-5 w-5 text-teal-700" />
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${toneClass[event.tone]}`}>
                    {event.status}
                  </span>
                </div>
                <p className="mt-5 text-sm font-semibold text-slate-500">{event.period}</p>
                <h3 className="mt-2 text-xl font-bold text-slate-950">{event.name}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{event.commercial}</p>
                <div className="mt-5 border-t border-slate-200 pt-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Next</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{event.next}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="investor" className="border-y border-black/10 bg-white py-20">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <Badge variant="outline" className="border-slate-300 bg-[#fbfaf7]">
              Investor thesis
            </Badge>
            <h2 className="mt-4 text-4xl font-bold leading-tight text-slate-950 md:text-5xl">
              Kenapa investor bisa memahami peluang SWI dengan cepat.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Halaman publik harus menjelaskan thesis bisnis dengan struktur sederhana: pengalaman memicu pembelian,
              event membangun kategori, brand menaikkan margin, dan data membuat repeat order lebih kuat.
            </p>
            <Button asChild size="lg" className="mt-8 bg-slate-950 text-white hover:bg-slate-800">
              <Link href="/products">
                Lihat brand dan service line
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {investorThesis.map((item, index) => {
              const icons = [Store, CalendarDays, Factory, BarChart3];
              const Icon = icons[index] ?? FileCheck2;
              return (
                <div key={item.title} className="rounded-xl border border-black/10 bg-[#fbfaf7] p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-slate-950 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.copy}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl border border-black/10 bg-slate-950 p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] md:p-10">
            <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-amber-300" />
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-100">Next step</p>
                </div>
                <h2 className="mt-4 max-w-4xl text-3xl font-bold leading-tight md:text-5xl">
                  Frontpage menjual narasi. Dashboard mengontrol eksekusi. Keduanya sekarang memakai data yang sama.
                </h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button asChild size="lg" variant="secondary">
                  <Link href="/dashboard">
                    Masuk dashboard
                    <ShieldCheck className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/20">
                  <Link href="/upcoming-events">
                    Lihat event pipeline
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
