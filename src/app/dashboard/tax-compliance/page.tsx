import { AlertTriangle, CheckCircle2, FileCheck2, ShieldCheck } from "lucide-react";
import { dataRoomChecklist } from "@/lib/swi-overview";

const complianceItems = [
  { name: "PPh 21", scope: "Gaji karyawan", deadline: "Tanggal 10 bulan berikutnya", status: "Pending", tone: "risk" },
  { name: "PPh 23", scope: "Jasa vendor", deadline: "Tanggal 10 bulan berikutnya", status: "Aman", tone: "ready" },
  { name: "PPh Final UMKM", scope: "Jika relevan terhadap omzet", deadline: "Tanggal 15 bulan berikutnya", status: "Review", tone: "plan" },
  { name: "SPT Tahunan Badan", scope: "Laporan tahunan perusahaan", deadline: "30 April", status: "Upcoming", tone: "build" },
  { name: "BPJS Ketenagakerjaan", scope: "Karyawan dan event crew", deadline: "Tanggal 15 bulan berikutnya", status: "Aman", tone: "ready" },
  { name: "BPJS Kesehatan", scope: "Karyawan terdaftar", deadline: "Tanggal 10 bulan berikutnya", status: "Aman", tone: "ready" },
];

const toneClass = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  build: "border-amber-200 bg-amber-50 text-amber-700",
  plan: "border-sky-200 bg-sky-50 text-sky-700",
  risk: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function TaxCompliance() {
  return (
    <div className="p-4 md:p-8">
      <header className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-700">Tax and compliance</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-950 md:text-6xl">
          Compliance Monitor
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600">
          Monitor pajak, BPJS, legal document, dan investor data room. Modul ini perlu berkembang menjadi kalender
          compliance yang mengingatkan sebelum deadline.
        </p>
      </header>

      <section className="mt-5 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Obligations</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Pajak dan BPJS</h2>
          </div>
          <ShieldCheck className="h-6 w-6 text-teal-700" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-bold">Kewajiban</th>
                <th className="px-4 py-3 font-bold">Scope</th>
                <th className="px-4 py-3 font-bold">Tenggat</th>
                <th className="px-4 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {complianceItems.map((item) => (
                <tr key={item.name} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-4 font-bold text-slate-950">{item.name}</td>
                  <td className="px-4 py-4 text-slate-600">{item.scope}</td>
                  <td className="px-4 py-4 text-slate-600">{item.deadline}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${toneClass[item.tone as keyof typeof toneClass]}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-5 grid gap-5 2xl:grid-cols-[0.82fr_1.18fr]">
        <div className="rounded-2xl border border-black/10 bg-[#10231f] p-6 text-white shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-100">Compliance warning</p>
              <h2 className="mt-2 text-2xl font-bold">Yang perlu dipantau.</h2>
            </div>
            <AlertTriangle className="h-6 w-6 text-amber-300" />
          </div>
          <div className="space-y-3">
            {[
              "Distribusi bukti potong PPh 21 sebelum deadline tahunan.",
              "Pastikan vendor event punya dokumen pajak yang bisa diproses.",
              "Cek status BPJS untuk tenaga kerja tetap dan event crew.",
              "Pisahkan dokumen legal internal dari dokumen yang aman untuk investor room.",
            ].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/[0.06] p-4 text-sm leading-6 text-white/75">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Legal data room</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Dokumen yang harus dilengkapi</h2>
            </div>
            <FileCheck2 className="h-6 w-6 text-teal-700" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {dataRoomChecklist.slice(0, 8).map((item) => (
              <div key={item} className="flex gap-3 rounded-xl border border-slate-200 bg-[#fbfaf7] p-4 text-sm leading-6 text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
