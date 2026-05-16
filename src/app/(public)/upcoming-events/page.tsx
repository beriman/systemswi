import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Handshake,
  MapPin,
  Megaphone,
  Presentation,
  Store,
  Ticket,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPublicEvents } from "@/lib/public";
import { eventPipeline, kpiTracker, quarterlyRoadmap } from "@/lib/swi-overview";

export const metadata: Metadata = {
  title: "Fragrantions & Event Pipeline | Sensasi Wangi Indonesia",
  description:
    "Pipeline Fragrantions PT Sensasi Wangi Indonesia untuk sponsor, tenant, komunitas, customer acquisition, dan marketplace growth.",
  openGraph: {
    title: "Fragrantions & Event Pipeline | Sensasi Wangi Indonesia",
    description: "Event pipeline SWI untuk komunitas, sponsor, tenant, customer acquisition, dan marketplace growth.",
  },
};

const eventEngines = [
  {
    title: "Audience and community",
    copy: "Roadshow, workshop, dan event utama mengumpulkan audience yang tidak bisa didapat dari katalog saja.",
    icon: Users,
  },
  {
    title: "Sponsor and tenant",
    copy: "Fragrantions bisa dikemas sebagai sponsor package, tenant booth, ticketing, media, dan activation.",
    icon: Handshake,
  },
  {
    title: "Commerce bridge",
    copy: "Setiap traffic event diarahkan ke SWI Store, brand catalog, booking, marketplace, dan CRM.",
    icon: Store,
  },
];

const packageReadiness = [
  "Sponsor deck",
  "Tenant package",
  "Ticketing plan",
  "Vendor list",
  "Media partner",
  "Budget event",
  "Run of show",
  "Post-event report",
];

const toneClass = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  build: "border-amber-200 bg-amber-50 text-amber-700",
  plan: "border-sky-200 bg-sky-50 text-sky-700",
  risk: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function EventsPage() {
  const events = getPublicEvents();

  return (
    <div className="bg-[#fbfaf7] text-slate-950">
      <section className="border-b border-black/10 bg-[#10231f] py-20 text-white">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
              Fragrantions and event pipeline
            </Badge>
            <h1 className="mt-5 text-5xl font-bold leading-[1.04] md:text-7xl">
              Event SWI harus jadi growth engine, bukan sekadar agenda.
            </h1>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-100">Commercial model</p>
            <p className="mt-4 text-xl font-semibold leading-8">
              Fragrantions menghubungkan komunitas, sponsor, tenant, brand, media, dan customer ke satu funnel yang
              berakhir di store, marketplace, B2B, dan repeat order.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {["Lead capture", "Event revenue", "Marketplace growth"].map((item) => (
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
          {eventEngines.map((engine) => {
            const Icon = engine.icon;
            return (
              <article key={engine.title} className="rounded-xl border border-slate-200 p-6">
                <Icon className="h-6 w-6 text-teal-700" />
                <h2 className="mt-5 text-xl font-bold text-slate-950">{engine.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{engine.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[0.98fr_1.02fr] lg:items-start">
          <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
            <Badge variant="outline" className="bg-[#fbfaf7]">
              Flagship
            </Badge>
            <h2 className="mt-6 text-5xl font-bold text-slate-950">Fragrantions 2026</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Event utama fragrance yang harus dikemas sebagai kategori bisnis: sponsor, tenant, ticketing, workshop,
              media, product launch, dan post-event leads.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-[#f4f8f6] p-5">
                <Ticket className="h-5 w-5 text-teal-700" />
                <p className="mt-4 font-bold">Revenue layer</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Sponsor, booth tenant, ticketing, workshop, merchandise.</p>
              </div>
              <div className="rounded-xl bg-[#fff7e6] p-5">
                <Presentation className="h-5 w-5 text-amber-700" />
                <p className="mt-4 font-bold">Proof layer</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Documentation, post-event report, lead list, partner proof.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {eventPipeline.map((event) => (
              <article key={event.name} className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">{event.period}</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-950">{event.name}</h3>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${toneClass[event.tone]}`}>
                    {event.status}
                  </span>
                </div>
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-600">{event.commercial}</p>
                <div className="mt-5 rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Next step</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{event.next}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-black/10 bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <Badge variant="outline" className="border-slate-300 bg-[#fbfaf7]">
                2026 execution timeline
              </Badge>
              <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
                Timeline yang mengikuti task tracker, bukan asumsi kosong.
              </h2>
            </div>
            <p className="text-base leading-8 text-slate-600">
              Q1 membangun fondasi, Q2 mengeksekusi event dan produksi batch pertama, Q3-Q4 mengevaluasi penjualan dan
              scale. Dashboard internal harus menjaga timeline ini tidak lepas.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {quarterlyRoadmap.map((quarter) => (
              <article key={quarter.period} className="rounded-xl border border-slate-200 bg-[#fbfaf7] p-6">
                <div className="flex items-start justify-between gap-4">
                  <CalendarDays className="h-6 w-6 text-teal-700" />
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${toneClass[quarter.tone]}`}>
                    {quarter.status}
                  </span>
                </div>
                <p className="mt-5 text-sm font-semibold text-slate-500">{quarter.period}</p>
                <h3 className="mt-2 text-xl font-bold text-slate-950">{quarter.title}</h3>
                <div className="mt-5 space-y-3">
                  {quarter.items.map((item) => (
                    <p key={item} className="flex gap-2 text-sm leading-6 text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                      {item}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <Badge variant="outline" className="border-slate-300 bg-white">
              Public event listing
            </Badge>
            <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
              Event publik tetap tampil, tetapi dikasih konteks bisnis.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Tanggal publik bisa berubah, tetapi struktur bisnisnya harus tetap: audience, package, registration, dan
              conversion path.
            </p>
            <div className="mt-8 rounded-xl border border-black/10 bg-white p-5">
              <p className="text-sm font-semibold text-slate-500">KPI tracker awal</p>
              <div className="mt-4 space-y-3">
                {kpiTracker.map((kpi) => (
                  <div key={kpi.metric} className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{kpi.metric}</p>
                      <p className="text-xs text-slate-500">Target: {kpi.target}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-700">{kpi.current}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {events.map((event) => {
              const eventDate = new Date(event.date);
              const isUpcoming = eventDate > new Date();

              return (
                <article key={event.id} className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={isUpcoming ? "default" : "secondary"} className={isUpcoming ? "bg-slate-950" : ""}>
                      {isUpcoming ? "Coming soon" : "Past / review"}
                    </Badge>
                    <Megaphone className="h-5 w-5 text-teal-700" />
                  </div>
                  <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                    <CalendarDays className="h-4 w-4" />
                    {eventDate.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                  <h3 className="mt-3 text-xl font-bold text-slate-950">{event.name}</h3>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{event.description}</p>
                  {event.registrationUrl && (
                    <Button asChild className="mt-6 w-full bg-slate-950 hover:bg-slate-800">
                      <Link href={event.registrationUrl} target="_blank">
                        Register / lihat detail
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-black/10 bg-white py-16">
        <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Badge variant="outline" className="border-slate-300 bg-[#fbfaf7]">
              Partner readiness
            </Badge>
            <h2 className="mt-4 text-3xl font-bold text-slate-950">Yang wajib siap sebelum event dipitch.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Checklist ini membuat Fragrantions terlihat matang untuk sponsor, tenant, vendor, media partner, dan investor.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {packageReadiness.map((item) => (
              <div key={item} className="rounded-lg border border-slate-200 bg-[#fbfaf7] p-4 text-sm font-bold text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-3xl font-bold">Ingin menjadi partner Fragrantions?</h2>
            <p className="mt-3 max-w-2xl text-white/72">
              SWI terbuka untuk sponsor, tenant, media partner, brand activation, workshop, dan kolaborasi komunitas.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary">
              <a href="https://wa.me/628118556688" target="_blank" rel="noopener noreferrer">
                Hubungi tim SWI
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/20">
              <a href="https://instagram.com/sensasiwangi.id" target="_blank" rel="noopener noreferrer">
                Follow Instagram
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
