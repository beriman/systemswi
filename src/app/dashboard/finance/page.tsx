import { AlertTriangle, CircleDollarSign, FileSpreadsheet, LineChart } from "lucide-react";
import { financeAssumptions } from "@/lib/swi-overview";
import EquityDashboard from "./equity";

const financeTasks = [
  "Pisahkan omzet store, kelas, brand, B2B, marketplace, dan event.",
  "Isi COGS dan margin per SKU, terutama produk 1 liter.",
  "Buat monthly P&L, cashflow, runway, hutang/piutang, dan CAPEX tracker.",
  "Kunci format use of funds untuk investor room.",
];

const cashflowSnapshot = [
  { label: "Pemasukan YTD", value: "Rp 22.350.000", tone: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { label: "Pengeluaran YTD", value: "Rp 18.200.000", tone: "text-rose-700 bg-rose-50 border-rose-200" },
  { label: "Net profit sementara", value: "Rp 4.150.000", tone: "text-teal-700 bg-teal-50 border-teal-200" },
];

export default function FinancePage() {
  return (
    <div className="p-4 md:p-8">
      <header className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-700">Finance and capital</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-950 md:text-6xl">
          Finance Pack SWI
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600">
          Modul finance harus mengubah asumsi menjadi angka aktual: modal, piutang pemegang saham, cashflow, OPEX,
          CAPEX, margin SKU, event budget, dan use of funds untuk investor.
        </p>
      </header>

      <section className="mt-5 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Equity</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Founder equity and capital receivable</h2>
          </div>
          <CircleDollarSign className="h-6 w-6 text-teal-700" />
        </div>
        <EquityDashboard />
      </section>

      <section className="mt-5 grid gap-5 2xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Assumptions</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Model awal yang harus divalidasi</h2>
            </div>
            <LineChart className="h-6 w-6 text-teal-700" />
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
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Cashflow</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Current snapshot</h2>
            </div>
            <FileSpreadsheet className="h-6 w-6 text-teal-700" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {cashflowSnapshot.map((item) => (
              <article key={item.label} className={`rounded-xl border p-5 ${item.tone}`}>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="mt-3 text-2xl font-bold">{item.value}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-[#fbfaf7] p-6">
            <p className="font-bold text-slate-950">Upload finance report</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Siapkan sumber data XLSX/CSV untuk monthly close. Kolom minimal: tanggal, unit bisnis, kategori,
              deskripsi, pemasukan, pengeluaran, dan bukti.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-black/10 bg-[#10231f] p-6 text-white shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-100">Finance control</p>
            <h2 className="mt-2 text-2xl font-bold">Pekerjaan finance prioritas</h2>
          </div>
          <AlertTriangle className="h-6 w-6 text-amber-300" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {financeTasks.map((task) => (
            <div key={task} className="rounded-lg border border-white/10 bg-white/[0.06] p-4 text-sm leading-6 text-white/75">
              {task}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
