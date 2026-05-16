import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Factory,
  Landmark,
  MapPin,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BUSINESS_PILLARS, COMPANY_INFO, LABORATORY_ADDRESS, TEAM_MEMBERS } from "@/lib/public";
import { holdingDivisions, rupsSnapshot } from "@/lib/swi-overview";

export const metadata: Metadata = {
  title: "Tentang PT Sensasi Wangi Indonesia",
  description:
    "Company profile PT Sensasi Wangi Indonesia: identitas, struktur holding, tim, lokasi, dan arah bisnis fragrance ecosystem.",
  openGraph: {
    title: "Tentang PT Sensasi Wangi Indonesia",
    description: "Holding parfum Indonesia untuk store, event, brand, produksi, marketplace, dan customer data.",
  },
};

const legalFacts = [
  ["Badan hukum", "PT Sensasi Wangi Indonesia"],
  ["Akta pendirian", "No. 61, 6 Oktober 2023"],
  ["Notaris", "Eka Astri Maerisa, SH., MH., M.Kn"],
  ["Bidang usaha", "Kosmetik, event khusus, bahan kimia, pelatihan kerja"],
];

const pillarIcons = [Sparkles, Store, Factory];

export default function AboutPage() {
  const yearsInBusiness = new Date().getFullYear() - COMPANY_INFO.founded;
  const pillars = Object.values(BUSINESS_PILLARS);

  return (
    <div className="bg-[#fbfaf7] text-slate-950">
      <section className="border-b border-black/10 bg-white py-20">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <Badge variant="outline" className="border-slate-300 bg-[#fbfaf7]">
              About the company
            </Badge>
            <h1 className="mt-5 text-5xl font-bold leading-[1.04] md:text-7xl">
              SWI adalah operating holding untuk ekosistem wewangian Indonesia.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              PT Sensasi Wangi Indonesia menghubungkan edukasi, experience, event, produksi, brand, digital platform,
              dan data customer menjadi satu ekosistem fragrance yang bisa tumbuh bertahap.
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-[#10231f] p-6 text-white shadow-sm">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-100">Company identity</p>
                <h2 className="mt-4 text-3xl font-bold">PT Sensasi Wangi Indonesia</h2>
                <p className="mt-3 text-sm leading-7 text-white/72">{COMPANY_INFO.description}</p>
              </div>
              <Landmark className="h-7 w-7 shrink-0 text-amber-300" />
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Founded</p>
                <p className="mt-2 text-2xl font-bold">{COMPANY_INFO.founded}</p>
              </div>
              <div className="rounded-lg bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Operating years</p>
                <p className="mt-2 text-2xl font-bold">{yearsInBusiness}+</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Badge variant="outline" className="border-slate-300 bg-white">
              Why SWI exists
            </Badge>
            <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
              Membangun struktur bisnis wewangian yang lebih mandiri dan terukur.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Indonesia punya kekayaan aroma, bahan, komunitas, dan pasar. Tantangannya adalah menyambungkan potensi
              tersebut ke format bisnis yang punya standar, produk, pengalaman, distribusi, dan data.
            </p>
          </div>
          <div className="grid gap-5">
            <article className="rounded-xl border border-black/10 bg-white p-6">
              <h3 className="text-xl font-bold text-slate-950">Peran SWI</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                SWI mengambil peran sebagai arsitek ekosistem: menghubungkan brand, event, kelas, store, produksi, dan
                platform digital supaya masing-masing unit tidak berjalan sendiri-sendiri.
              </p>
            </article>
            <article className="rounded-xl border border-black/10 bg-white p-6">
              <h3 className="text-xl font-bold text-slate-950">Arah 2026</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Berdasarkan {rupsSnapshot.date}, fokus tahun 2026 adalah produksi, partisipasi event parfum nasional,
                serta pengembangan produk ukuran 1 liter untuk pasar reseller.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-black/10 bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <Badge variant="outline" className="border-slate-300 bg-[#fbfaf7]">
                Legal and structure
              </Badge>
              <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">Identitas perusahaan dibuat jelas.</h2>
            </div>
            <p className="text-base leading-8 text-slate-600">
              Bagian ini membantu partner dan investor memahami status badan hukum, lini bisnis, dan ruang lingkup
              operasional SWI.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="rounded-xl border border-black/10 bg-[#fbfaf7] p-6">
              <ShieldCheck className="h-7 w-7 text-teal-700" />
              <h3 className="mt-5 text-2xl font-bold text-slate-950">Legalitas dasar</h3>
              <div className="mt-6 divide-y divide-slate-200">
                {legalFacts.map(([label, value]) => (
                  <div key={label} className="grid gap-2 py-4 sm:grid-cols-[150px_1fr]">
                    <p className="text-sm font-semibold text-slate-500">{label}</p>
                    <p className="text-sm font-bold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {pillars.map((pillar, index) => {
                const Icon = pillarIcons[index] ?? Building2;
                return (
                  <article key={pillar.name} className="rounded-xl border border-black/10 bg-[#fbfaf7] p-5">
                    <Icon className="h-6 w-6 text-teal-700" />
                    <h3 className="mt-5 text-xl font-bold text-slate-950">{pillar.name}</h3>
                    <div className="mt-4 space-y-3">
                      {pillar.items.map((item) => (
                        <div key={item.name}>
                          <p className="text-sm font-bold text-slate-800">{item.name}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-600">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 max-w-3xl">
            <Badge variant="outline" className="border-slate-300 bg-white">
              Functional holding
            </Badge>
            <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
              Struktur holding yang siap dipantau dari dashboard.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {holdingDivisions.map((division) => (
              <article key={division.name} className="rounded-xl border border-black/10 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{division.code}</p>
                <h3 className="mt-2 text-xl font-bold text-slate-950">{division.name}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{division.headline}</p>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Revenue lever</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{division.revenueLever}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-black/10 bg-[#10231f] py-20 text-white">
        <div className="container mx-auto px-4">
          <div className="mb-10 grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div>
              <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                Leadership
              </Badge>
              <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">Tim kepemimpinan SWI.</h2>
            </div>
            <p className="text-base leading-8 text-white/72">
              Tim perlu ditampilkan ringkas dan profesional, lalu dilengkapi foto aktual ketika sudah siap untuk
              materi investor.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {TEAM_MEMBERS.map((member) => (
              <article key={member.id} className="rounded-xl border border-white/10 bg-white/[0.06] p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-amber-300">
                  <Users className="h-7 w-7" />
                </div>
                <h3 className="mt-6 text-xl font-bold">{member.name}</h3>
                <p className="mt-2 text-sm font-semibold text-teal-100">{member.role}</p>
                <p className="mt-4 text-sm leading-7 text-white/70">{member.bio}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Badge variant="outline" className="border-slate-300 bg-white">
              Locations
            </Badge>
            <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">Kantor, lab, dan pusat aktivitas.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Lokasi operasional menjadi bagian dari proof karena SWI perlu bisa menjalankan store, kelas, produksi,
              dan event secara nyata.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <article className="rounded-xl border border-black/10 bg-white p-6">
              <MapPin className="h-6 w-6 text-teal-700" />
              <h3 className="mt-5 text-xl font-bold text-slate-950">Kantor pusat</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{COMPANY_INFO.address}</p>
            </article>
            <article className="rounded-xl border border-black/10 bg-white p-6">
              <Factory className="h-6 w-6 text-teal-700" />
              <h3 className="mt-5 text-xl font-bold text-slate-950">Laboratorium</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{LABORATORY_ADDRESS}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-3xl font-bold">Lanjutkan ke dashboard internal.</h2>
            <p className="mt-3 max-w-2xl text-white/72">
              Company profile menjelaskan cerita. Dashboard memantau pekerjaan, finance, legal, event, produk, dan
              investor readiness.
            </p>
          </div>
          <Button asChild size="lg" variant="secondary">
            <Link href="/dashboard">
              Buka dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
