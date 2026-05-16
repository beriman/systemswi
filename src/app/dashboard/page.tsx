import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  LineChart,
  ShieldCheck,
} from "lucide-react";
import { financeAssumptions, holdingDivisions, investorReadiness, workstreams } from "@/lib/swi-overview";

const toneClass = {
  ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  build: "bg-amber-50 text-amber-700 border-amber-200",
  plan: "bg-blue-50 text-blue-700 border-blue-200",
  risk: "bg-red-50 text-red-700 border-red-200",
};

const summaryCards = [
  { label: "Unit monitoring", value: "6", note: "Holding, Store, Event, Brand, WEB, Digital/AI", icon: Building2 },
  { label: "Investor pack", value: "45%", note: "Narasi ada, data room perlu dilengkapi", icon: BriefcaseBusiness },
  { label: "Finance model", value: "40%", note: "Asumsi awal siap dirinci ke aktual", icon: CircleDollarSign },
  { label: "Legal / HKI", value: "35%", note: "Butuh audit dokumen dan status merek", icon: ShieldCheck },
];

export default function DashboardHome() {
  return (
    <div className="min-h-screen bg-slate-50 p-5 md:p-8">
      <header className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Internal dashboard</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">PT Sensasi Wangi Indonesia</h1>
            <p className="mt-3 max-w-3xl text-slate-600">
              Monitoring holding, SWI Store, Fragrantions, Production & Brands, marketplace sensasiwangi.id,
              finance, legal, HKI, partner, vendor, dan investor readiness.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Frontpage publik
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/finance"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Finance module
              <LineChart className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">{card.value}</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3 text-blue-700">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{card.note}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Peta divisi holding</h2>
              <p className="text-sm text-slate-500">Gunakan readiness sebagai indikator awal, bukan angka final.</p>
            </div>
            <BarChart3 className="h-5 w-5 text-blue-700" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {holdingDivisions.map((division) => (
              <div key={division.name} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">{division.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{division.summary}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass[division.tone]}`}>
                    {division.status}
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-blue-700" style={{ width: `${division.readiness}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-500">{division.readiness}% readiness</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Prioritas 7 hari</h2>
              <p className="text-sm text-slate-500">Fokus keputusan yang paling berdampak.</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="space-y-3">
            {[
              "Isi PIC dan deadline setiap workstream.",
              "Satukan dokumen legal, pajak, rekening, kontrak, dan status merek.",
              "Lengkapi kas, omzet, OPEX, CAPEX, hutang/piutang, dan runway.",
              "Pilih foto dan data publik yang aman untuk company profile.",
              "Siapkan investor room: deck, financial model, partner, vendor, dan traction.",
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Tracker kerja holding</h2>
            <p className="text-sm text-slate-500">Status awal untuk rapat mingguan dan follow-up lintas divisi.</p>
          </div>
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-semibold">Workstream</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Progress</th>
                <th className="px-4 py-3 font-semibold">PIC</th>
                <th className="px-4 py-3 font-semibold">Next step</th>
              </tr>
            </thead>
            <tbody>
              {workstreams.map((item) => (
                <tr key={item.name} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-950">{item.name}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass[item.tone]}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-blue-700" style={{ width: `${item.progress}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{item.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.owner}</td>
                  <td className="px-4 py-3 text-slate-600">{item.nextStep}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Monitoring keuangan</h2>
              <p className="text-sm text-slate-500">Asumsi awal yang perlu dipecah menjadi data aktual.</p>
            </div>
            <CircleDollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="space-y-3">
            {financeAssumptions.map((item) => (
              <div key={item.label} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-slate-950">{item.label}</p>
                  <p className="shrink-0 font-bold text-blue-700">{item.value}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Investor readiness</h2>
              <p className="text-sm text-slate-500">Checklist sebelum data dibagikan ke investor.</p>
            </div>
            <FileCheck2 className="h-5 w-5 text-blue-700" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {investorReadiness.map((group) => (
              <div key={group.title} className="rounded-lg bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-950">{group.title}</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-700" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
