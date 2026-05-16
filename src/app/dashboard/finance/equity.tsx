import { CheckCircle2, CircleDollarSign, TrendingUp } from "lucide-react";

const founders = [
  { name: "Beriman Juliano", share: 34, role: "CEO", committed: 340_000_000, paid: 50_000_000 },
  { name: "Wapiq Rizya", share: 33, role: "COO", committed: 330_000_000, paid: 30_000_000 },
  { name: "Muhamad Malsiaf", share: 33, role: "Komisaris", committed: 330_000_000, paid: 30_000_000 },
];

function rupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export default function EquityDashboard() {
  const totalCommitted = founders.reduce((sum, founder) => sum + founder.committed, 0);
  const totalPaid = founders.reduce((sum, founder) => sum + founder.paid, 0);
  const totalReceivable = totalCommitted - totalPaid;
  const paidProgress = (totalPaid / totalCommitted) * 100;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-[#fbfaf7] p-5">
          <CircleDollarSign className="h-5 w-5 text-teal-700" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Modal dasar terpantau</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{rupiah(totalCommitted)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-[#fbfaf7] p-5">
          <CheckCircle2 className="h-5 w-5 text-emerald-700" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Modal disetor</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{rupiah(totalPaid)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-[#fbfaf7] p-5">
          <TrendingUp className="h-5 w-5 text-amber-700" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Piutang pemegang saham</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{rupiah(totalReceivable)}</p>
        </article>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-4 text-sm font-semibold text-slate-500">
          <span>Progress setoran modal</span>
          <span>{paidProgress.toFixed(1)}%</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-teal-700" style={{ width: `${paidProgress}%` }} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {founders.map((founder) => {
          const receivable = founder.committed - founder.paid;
          const progress = (founder.paid / founder.committed) * 100;

          return (
            <article key={founder.name} className="rounded-xl border border-slate-200 bg-[#fbfaf7] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-950">{founder.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {founder.role} | {founder.share}% saham
                  </p>
                </div>
                <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                  Belum lunas
                </span>
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Komitmen</span>
                  <span className="font-bold text-slate-900">{rupiah(founder.committed)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Disetor</span>
                  <span className="font-bold text-emerald-700">{rupiah(founder.paid)}</span>
                </div>
                <div className="flex justify-between gap-4 border-t border-slate-200 pt-3">
                  <span className="font-bold text-slate-700">Sisa piutang</span>
                  <span className="font-bold text-rose-700">{rupiah(receivable)}</span>
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-teal-700" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-right text-xs font-semibold text-slate-500">{progress.toFixed(1)}% terpenuhi</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
