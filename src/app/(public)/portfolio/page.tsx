"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Presentation,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PORTFOLIO_ITEMS, getPortfolioByCategory } from "@/lib/public";
import { eventPipeline, rupsSnapshot } from "@/lib/swi-overview";

const categoryDisplay: Record<string, string> = {
  exhibition: "Fragrantions & Exhibition",
  corporate: "Corporate / B2B",
  wedding: "Private Experience",
  music: "Lifestyle Activation",
  other: "Workshop & Education",
};

const categoryNotes: Record<string, string> = {
  exhibition: "Proof untuk komunitas, sponsor, tenant, media, dan event-led customer acquisition.",
  corporate: "Proof untuk peluang custom formulation, scent branding, dan partnership B2B.",
  wedding: "Proof untuk private premium experience dan gifting.",
  music: "Proof untuk youth traffic, fandom, dan brand activation.",
  other: "Proof untuk kelas, edukasi, store visit, dan repeat order.",
};

const proofStack = [
  {
    title: "Category platform",
    copy: "Fragrantions memberi SWI posisi sebagai penghubung brand, perfumer, komunitas, sponsor, dan customer.",
    icon: Presentation,
  },
  {
    title: "Experience format",
    copy: "Workshop dan store experience mengubah fragrance dari produk pasif menjadi aktivitas yang bisa ditiketkan.",
    icon: Sparkles,
  },
  {
    title: "Commercial bridge",
    copy: "Setiap event harus punya jalan pulang ke marketplace, booking, brand catalog, CRM, dan B2B inquiry.",
    icon: BriefcaseBusiness,
  },
];

export default function PortfolioPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const items = selectedCategory ? getPortfolioByCategory(selectedCategory) : PORTFOLIO_ITEMS;
  const categories = Object.entries(categoryDisplay);

  return (
    <div className="bg-[#fbfaf7] text-slate-950">
      <section className="border-b border-black/10 bg-[#10231f] py-20 text-white">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
          <div>
            <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
              Portfolio and proof of work
            </Badge>
            <h1 className="mt-5 text-5xl font-bold leading-[1.04] md:text-7xl">
              Bukti kerja SWI harus dibaca sebagai mesin bisnis.
            </h1>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-100">Portfolio logic</p>
            <p className="mt-4 text-xl font-semibold leading-8 text-white">
              Event, kelas, komunitas, dan B2B bukan dokumentasi kosong. Semuanya harus menunjukkan traction, channel,
              customer intent, dan peluang revenue.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {["Proof", "Pipeline", "Conversion"].map((item) => (
                <div key={item} className="rounded-lg bg-white/10 p-3 text-sm font-semibold text-white/85">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white py-10">
        <div className="container mx-auto grid gap-5 px-4 md:grid-cols-3">
          {proofStack.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <article key={pillar.title} className="rounded-xl border border-slate-200 p-6">
                <Icon className="h-6 w-6 text-teal-700" />
                <h2 className="mt-5 text-xl font-bold text-slate-950">{pillar.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{pillar.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <div className="container mx-auto px-4 py-16">
          <div className="mb-8 grid gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-end">
            <div>
              <Badge variant="outline" className="border-slate-300 bg-white">
                Evidence layer
              </Badge>
              <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">Portfolio publik</h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                Filter ini membantu halaman dibaca sesuai audiens: sponsor, investor, tenant, B2B client, atau calon
                peserta kelas.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
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

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#f8fafc,#f3f4e8)] p-6">
                  <div className="flex items-start justify-between gap-4">
                    <Badge variant="outline" className="bg-white/80">
                      {categoryDisplay[item.category] || item.category}
                    </Badge>
                    {item.participants && (
                      <span className="flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                        <Users className="h-3.5 w-3.5" />
                        {item.participants.toLocaleString("id-ID")}
                      </span>
                    )}
                  </div>
                  <div className="mt-10 flex h-20 items-end justify-between">
                    <Sparkles className="h-12 w-12 text-teal-700" />
                    <p className="text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      SWI proof
                    </p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(item.date).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                  </div>
                  <h3 className="mt-3 text-xl font-bold text-slate-950">{item.title}</h3>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" />
                    {item.location}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
                  <div className="mt-5 rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Investor note</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {categoryNotes[item.category] || "Proof point untuk ekosistem SWI."}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {items.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white py-12 text-center text-slate-500">
              Belum ada portfolio untuk kategori ini.
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-black/10 bg-white py-16">
        <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Badge variant="outline" className="border-slate-300 bg-[#fbfaf7]">
              RUPS and event evidence
            </Badge>
            <h2 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">
              Dari catatan RUPS ke pipeline yang bisa dipitch.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {rupsSnapshot.date}: {rupsSnapshot.agenda}. Halaman portfolio perlu menghubungkan catatan ini ke
              paket sponsor, tenant, dan post-event report.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {eventPipeline.map((event) => (
              <article key={event.name} className="rounded-xl border border-slate-200 bg-[#fbfaf7] p-5">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-bold text-slate-950">{event.name}</h3>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                    {event.period}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{event.commercial}</p>
                <p className="mt-4 flex gap-2 text-sm font-semibold text-slate-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                  {event.next}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex items-center gap-3 text-teal-100">
              <Store className="h-5 w-5" />
              <p className="text-sm font-semibold uppercase tracking-[0.18em]">Portfolio to commerce</p>
            </div>
            <h2 className="mt-4 text-3xl font-bold">Portfolio harus berakhir di revenue stream.</h2>
            <p className="mt-3 max-w-2xl text-white/72">
              Tahap berikutnya: masukkan foto aktual, sponsor/tenant list, ticketing, omzet event, leads partner, dan
              conversion ke marketplace atau booking store.
            </p>
          </div>
          <Button asChild size="lg" variant="secondary">
            <Link href="/products">
              Lihat brand dan layanan
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
