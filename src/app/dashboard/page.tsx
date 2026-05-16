import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  LineChart,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import {
  boardPriorities,
  dataRoomChecklist,
  executiveStats,
  financeAssumptions,
  holdingDivisions,
  investorReadiness,
  kpiTracker,
  quarterlyRoadmap,
  riskRegister,
  workstreams,
} from "@/lib/swi-overview";

const toneClass = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  build: "border-amber-200 bg-amber-50 text-amber-700",
  plan: "border-sky-200 bg-sky-50 text-sky-700",
  risk: "border-rose-200 bg-rose-50 text-rose-700",
};

const dashboardCards = [
  { label: "Readiness holding", value: "44%", note: "Rata-rata awal dari 6 unit kerja", icon: BarChart3 },
  { label: "Investor room", value: "45%", note: "Narrative ada, angka dan proof perlu dirapikan", icon: BriefcaseBusiness },
  { label: "Finance model", value: "40%", note: "Asumsi awal perlu diganti transaksi aktual", icon: CircleDollarSign },
  { label: "Legal / HKI", value: "35%", note: "Audit dokumen dan status merek wajib diprioritaskan", icon: ShieldCheck },
];

export default function DashboardHome() {
  return (
    <div className="p-4 md:p-8">
      <header className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-700">Internal dashboard</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-950 md:text-6xl">
              PT Sensasi Wangi Indonesia Control Tower
            </h1>
            <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600">
              Satu layar untuk memantau operasional holding, SWI Store, Fragrantions, Production & Brands, marketplace
              sensasiwangi.id, finance, legal, HKI, partner, vendor, dan investor readiness.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              Frontpage publik
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/finance"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800"
            >
              Finance module
              <LineChart className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">{card.label}</p>
                  <p className="mt-2 text-4xl font-bold text-slate-950">{card.value}</p>
                </div>
                <div className="rounded-lg bg-[#f2f6f4] p-3 text-teal-700">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{card.note}</p>
            </article>
          );
        })}
      </section>

      <section className="mt-5 grid gap-5 2xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Operating units</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Peta divisi holding</h2>
            </div>
            <p className="text-sm text-slate-500">Readiness adalah indikator awal untuk rapat mingguan.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {holdingDivisions.map((division) => (
              <article key={division.name} className="rounded-xl border border-slate-200 bg-[#fbfaf7] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{division.code}</p>
                    <h3 className="mt-2 font-bold text-slate-950">{division.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{division.headline}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${toneClass[division.tone]}`}>
                    {division.status}
                  </span>
                </div>
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Readiness</span>
                    <span>{division.readiness}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-slate-950" style={{ width: `${division.readiness}%` }} />
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-700">
                  <span className="font-bold">Decision: </span>
                  {division.nextDecision}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-[#10231f] p-6 text-white shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-100">Board priorities</p>
              <h2 className="mt-2 text-2xl font-bold">Keputusan yang harus dipaksa jelas.</h2>
            </div>
            <CheckCircle2 className="h-6 w-6 text-amber-300" />
          </div>
          <div className="space-y-3">
            {boardPriorities.map((item, index) => (
              <div key={item} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.06] p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-300 text-sm font-bold text-slate-950">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-white/75">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Holding tracker</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Workstream mingguan</h2>
          </div>
          <p className="text-sm text-slate-500">Status, PIC, decision needed, dan evidence dalam satu tabel.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-bold">Workstream</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Progress</th>
                <th className="px-4 py-3 font-bold">PIC</th>
                <th className="px-4 py-3 font-bold">Decision</th>
                <th className="px-4 py-3 font-bold">Next step</th>
              </tr>
            </thead>
            <tbody>
              {workstreams.map((item) => (
                <tr key={item.name} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-4 align-top font-bold text-slate-950">
                    {item.name}
                    <p className="mt-1 max-w-xs text-xs font-normal leading-5 text-slate-500">{item.evidence}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${toneClass[item.tone]}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-slate-950" style={{ width: `${item.progress}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-slate-500">{item.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-slate-600">{item.owner}</td>
                  <td className="px-4 py-4 align-top font-semibold text-slate-800">{item.decisionNeeded}</td>
                  <td className="px-4 py-4 align-top text-slate-600">{item.nextStep}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-5 grid gap-5 2xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Finance</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Asumsi yang harus diganti data aktual</h2>
            </div>
            <CircleDollarSign className="h-6 w-6 text-teal-700" />
          </div>
          <div className="space-y-3">
            {financeAssumptions.map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200 bg-[#fbfaf7] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="font-bold text-slate-950">{item.label}</p>
                  <p className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-950">{item.value}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Investor readiness</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Data room score</h2>
            </div>
            <FileCheck2 className="h-6 w-6 text-teal-700" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {investorReadiness.map((group) => (
              <article key={group.title} className="rounded-xl border border-slate-200 bg-[#fbfaf7] p-5">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-bold text-slate-950">{group.title}</h3>
                  <span className="text-sm font-bold text-slate-600">{group.score}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-teal-700" style={{ width: `${group.score}%` }} />
                </div>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-700" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 2xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">2026 roadmap</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Timeline eksekusi</h2>
            </div>
            <CalendarDays className="h-6 w-6 text-teal-700" />
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
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Risk register</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Risiko yang harus dikunci</h2>
            </div>
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <div className="space-y-3">
            {riskRegister.map((risk) => (
              <article key={risk.risk} className="rounded-xl border border-slate-200 bg-[#fbfaf7] p-4">
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${toneClass[risk.tone]}`}>
                  Risk
                </span>
                <p className="mt-3 font-bold text-slate-950">{risk.risk}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{risk.mitigation}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 2xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">KPI tracker</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">RUPS 2026 metrics</h2>
            </div>
            <PackageCheck className="h-6 w-6 text-teal-700" />
          </div>
          <div className="space-y-3">
            {kpiTracker.map((kpi) => (
              <div key={kpi.metric} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-[#fbfaf7] p-4">
                <div>
                  <p className="font-bold text-slate-950">{kpi.metric}</p>
                  <p className="mt-1 text-sm text-slate-500">Target: {kpi.target}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-950">{kpi.current}</p>
                  <p className="text-xs font-semibold text-slate-500">{kpi.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Data room</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Checklist investor readiness</h2>
            </div>
            <FileCheck2 className="h-6 w-6 text-teal-700" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {dataRoomChecklist.map((item) => (
              <div key={item} className="flex gap-3 rounded-xl border border-slate-200 bg-[#fbfaf7] p-4 text-sm leading-6 text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {executiveStats.map((stat) => (
          <article key={stat.label} className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
            <p className="mt-2 text-4xl font-bold text-slate-950">{stat.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{stat.note}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
