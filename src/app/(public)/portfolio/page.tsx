"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { PORTFOLIO_ITEMS, getPortfolioByCategory } from "@/lib/public";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const categoryDisplay: Record<string, string> = {
  exhibition: "Fragrantions & Exhibition",
  corporate: "Corporate / B2B",
  wedding: "Private Event",
  music: "Lifestyle Event",
  other: "Workshop & Education",
};

const categoryNotes: Record<string, string> = {
  exhibition: "Proof of community, sponsor, tenant, and media activation.",
  corporate: "Proof of B2B scent branding and partnership opportunity.",
  wedding: "Private experience format for premium customer segments.",
  music: "Lifestyle activation for youth and community traffic.",
  other: "Education funnel for store, class, and repeat order.",
};

const proofPillars = [
  {
    title: "Event traction",
    copy: "Fragrantions dan Road to Fragrantions menjadi bukti bahwa SWI bisa mengumpulkan brand, komunitas, tenant, sponsor, dan customer.",
    icon: CalendarDays,
  },
  {
    title: "Experience format",
    copy: "Workshop dan kelas parfum membuktikan bahwa fragrance bisa dijual sebagai pengalaman, bukan hanya produk di rak.",
    icon: Sparkles,
  },
  {
    title: "Commercial bridge",
    copy: "Setiap portfolio perlu diarahkan ke katalog brand, marketplace, booking, repeat order, dan partnership B2B.",
    icon: BriefcaseBusiness,
  },
];

export default function PortfolioPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const items = selectedCategory ? getPortfolioByCategory(selectedCategory) : PORTFOLIO_ITEMS;
  const categories = Object.entries(categoryDisplay);

  return (
    <div className="flex flex-col">
      <section className="border-b bg-gradient-to-b from-slate-950 to-primary py-20 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <Badge variant="secondary" className="mb-5 bg-white/10 text-white">
              Portfolio & proof of work
            </Badge>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Bukti aktivitas SWI dari event, kelas, komunitas, dan B2B fragrance.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/80">
              Portfolio publik ini perlu membantu partner dan investor melihat bahwa SWI sudah memiliki format
              experience, komunitas, serta peluang komersial yang bisa diarahkan ke store, brand, dan marketplace.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b bg-muted/30 py-12">
        <div className="container mx-auto grid gap-5 px-4 md:grid-cols-3">
          {proofPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Card key={pillar.title} className="border-none shadow-sm">
                <CardHeader>
                  <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">{pillar.title}</CardTitle>
                  <CardDescription className="leading-6">{pillar.copy}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="container mx-auto px-4 py-14">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-950">Portfolio items</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Gunakan filter untuk melihat jenis proof yang relevan saat bicara dengan sponsor, brand, vendor, atau investor.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
            >
              Semua
            </Button>
            {categories.map(([key, label]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? "default" : "outline"}
                onClick={() => setSelectedCategory(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden border-none shadow-sm transition-smooth hover:shadow-elegant">
              <div className="border-b bg-gradient-to-br from-primary/10 via-white to-amber-100 p-6">
                <div className="flex items-start justify-between gap-3">
                  <Badge variant="outline" className="bg-white/70">
                    {categoryDisplay[item.category] || item.category}
                  </Badge>
                  {item.participants && (
                    <div className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-primary">
                      <Users className="h-3.5 w-3.5" />
                      {item.participants.toLocaleString("id-ID")}
                    </div>
                  )}
                </div>
                <div className="mt-10 flex h-20 items-end">
                  <Sparkles className="h-12 w-12 text-primary/70" />
                </div>
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(item.date).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                </div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {item.location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                <div className="mt-5 rounded-lg bg-muted/60 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-950">Investor note</p>
                  <p className="mt-1">{categoryNotes[item.category] || "Proof point untuk ekosistem SWI."}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {items.length === 0 && (
          <div className="rounded-xl border bg-muted/30 py-12 text-center text-muted-foreground">
            Belum ada portfolio untuk kategori ini.
          </div>
        )}
      </section>

      <section className="border-t bg-slate-950 py-16 text-white">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-3xl font-bold">Portfolio harus tersambung ke revenue stream.</h2>
            <p className="mt-3 max-w-2xl text-white/75">
              Langkah berikutnya adalah menambahkan foto aktual, sponsor/tenant list, ticketing, omzet event,
              lead partner, dan conversion ke marketplace atau store booking.
            </p>
          </div>
          <Button asChild size="lg" variant="secondary">
            <Link href="/products">
              Lihat brand & layanan
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
