import { AlertTriangle, CheckCircle2, CircleDollarSign, Lightbulb, Target } from "lucide-react";
import { investorThesis, productRoadmap, riskRegister } from "@/lib/swi-overview";

const scenarios = [
  {
    name: "Pixel Potion Rosa 1L preorder",
    capital: "Rp 1-1,5 juta",
    upside: "Validasi demand sebelum produksi massal",
    risk: "Marketing lemah membuat preorder lambat",
    verdict: "Prioritas",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    name: "Webinar paid fragrance starter",
    capital: "Rp 500 ribu",
    upside: "Cash cepat, database customer, brand authority",
    risk: "Butuh landing page dan follow-up sales",
    verdict: "Aman",
    tone: "border-sky-200 bg-sky-50 text-sky-700",
  },
  {
    name: "Fragrantions venue deposit",
    capital: "Rp 4 juta+",
    upside: "Mengunci timeline event",
    risk: "Cash keluar sebelum sponsor/tenant masuk",
    verdict: "Tunggu bukti",
    tone: "border-amber-200 bg-amber-50 text-amber-700",
  },
];

export default function StrategySimulator() {
  return (
    <div className="p-4 md:p-8">
      <header className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-700">Strategy room</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-950 md:text-6xl">
          SWI Decision Simulator
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600">
          Ruang strategi untuk memilih langkah yang paling masuk akal saat modal, waktu, dan tenaga terbatas. Fokusnya
          bukan ide paling ramai, tetapi keputusan yang cepat menghasilkan data dan cashflow.
        </p>
      </header>

      <section className="mt-5 grid gap-5 lg:grid-cols-3">
        {scenarios.map((scenario) => (
          <article key={scenario.name} className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <Target className="h-6 w-6 text-teal-700" />
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${scenario.tone}`}>
                {scenario.verdict}
              </span>
            </div>
            <h2 className="mt-5 text-xl font-bold text-slate-950">{scenario.name}</h2>
            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="font-bold text-slate-500">Capital needed</p>
                <p className="mt-1 text-slate-800">{scenario.capital}</p>
              </div>
              <div>
                <p className="font-bold text-slate-500">Upside</p>
                <p className="mt-1 text-slate-800">{scenario.upside}</p>
              </div>
              <div>
                <p className="font-bold text-slate-500">Risk</p>
                <p className="mt-1 text-slate-800">{scenario.risk}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-5 grid gap-5 2xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Product strategy</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Produk mana yang harus diprioritaskan?</h2>
            </div>
            <CircleDollarSign className="h-6 w-6 text-teal-700" />
          </div>
          <div className="space-y-4">
            {productRoadmap.map((product) => (
              <article key={product.name} className="rounded-xl border border-slate-200 bg-[#fbfaf7] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-950">{product.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{product.brand}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
                    {product.phase}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{product.target}</p>
                <div className="mt-4 grid gap-2 md:grid-cols-3">
                  {product.blockers.map((blocker) => (
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

        <div className="rounded-2xl border border-black/10 bg-[#10231f] p-6 text-white shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-100">Recommended strategy</p>
              <h2 className="mt-2 text-2xl font-bold">Hybrid approach.</h2>
            </div>
            <Lightbulb className="h-6 w-6 text-amber-300" />
          </div>
          <div className="space-y-3">
            {[
              "Jalankan webinar berbayar kecil untuk menghasilkan cash cepat dan database.",
              "Buka preorder Pixel Potion Rosa 1L sebelum produksi besar.",
              "Gunakan sponsor/tenant LOI sebelum membayar komitmen besar event.",
              "Simpan cash buffer untuk produksi batch dan kewajiban operasional.",
            ].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/[0.06] p-4 text-sm leading-6 text-white/75">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 2xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Investor thesis</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Narasi yang harus dibuktikan</h2>
            </div>
            <Lightbulb className="h-6 w-6 text-teal-700" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {investorThesis.map((item) => (
              <article key={item.title} className="rounded-xl border border-slate-200 bg-[#fbfaf7] p-5">
                <h3 className="font-bold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.copy}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Risk discipline</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Jangan biarkan strategi melebar</h2>
            </div>
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <div className="space-y-3">
            {riskRegister.map((risk) => (
              <article key={risk.risk} className="rounded-xl border border-slate-200 bg-[#fbfaf7] p-4">
                <p className="font-bold text-slate-950">{risk.risk}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{risk.mitigation}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
