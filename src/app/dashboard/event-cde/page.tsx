import {
  CalendarDays,
  CheckCircle2,
  Handshake,
  Megaphone,
  Presentation,
  Ticket,
  Users,
} from "lucide-react";
import { eventPipeline, quarterlyRoadmap } from "@/lib/swi-overview";

const packageReadiness = [
  "Sponsor deck",
  "Tenant database",
  "Tenant package",
  "Vendor list",
  "Budget event",
  "Run of show",
  "Media partner",
  "Post-event report template",
];

const eventFunnels = [
  { label: "Audience leads", value: "TBD", note: "Event registration, QR, community list", icon: Users },
  { label: "Sponsor pipeline", value: "0", note: "LOI and package value not entered", icon: Handshake },
  { label: "Tenant pipeline", value: "0", note: "Booth prospect database needed", icon: Ticket },
  { label: "Media assets", value: "Draft", note: "Deck, poster, content, press kit", icon: Megaphone },
];

const toneClass = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  build: "border-amber-200 bg-amber-50 text-amber-700",
  plan: "border-sky-200 bg-sky-50 text-sky-700",
  risk: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function EventCDE() {
  return (
    <div className="p-4 md:p-8">
      <header className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-700">Event CDE</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-950 md:text-6xl">
          Fragrantions Command Desk
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600">
          Modul ini memaksa event dilihat sebagai pipeline bisnis: sponsor, tenant, ticketing, audience, media,
          vendor, budget, dan conversion ke SWI Store serta marketplace.
        </p>
      </header>

      <section className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {eventFunnels.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                  <p className="mt-2 text-4xl font-bold text-slate-950">{item.value}</p>
                </div>
                <div className="rounded-lg bg-[#f2f6f4] p-3 text-teal-700">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.note}</p>
            </article>
          );
        })}
      </section>

      <section className="mt-5 grid gap-5 2xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Pipeline</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Event and activation board</h2>
            </div>
            <Presentation className="h-6 w-6 text-teal-700" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {eventPipeline.map((event) => (
              <article key={event.name} className="rounded-xl border border-slate-200 bg-[#fbfaf7] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">{event.period}</p>
                    <h3 className="mt-1 font-bold text-slate-950">{event.name}</h3>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${toneClass[event.tone]}`}>
                    {event.status}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{event.commercial}</p>
                <div className="mt-5 rounded-lg bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Next step</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{event.next}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-[#10231f] p-6 text-white shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-100">CDE readiness</p>
              <h2 className="mt-2 text-2xl font-bold">Yang harus ada sebelum pitching.</h2>
            </div>
            <CalendarDays className="h-6 w-6 text-amber-300" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {packageReadiness.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.06] p-4 text-sm text-white/75">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Timeline</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">2026 execution plan</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {quarterlyRoadmap.map((quarter) => (
            <article key={quarter.period} className="rounded-xl border border-slate-200 bg-[#fbfaf7] p-5">
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${toneClass[quarter.tone]}`}>
                {quarter.status}
              </span>
              <p className="mt-5 text-sm font-semibold text-slate-500">{quarter.period}</p>
              <h3 className="mt-2 font-bold text-slate-950">{quarter.title}</h3>
              <div className="mt-4 space-y-2">
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
      </section>
    </div>
  );
}
