import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Handshake,
  MapPin,
  Megaphone,
  Store,
  Ticket,
  Users,
} from "lucide-react";
import { getPublicEvents } from "@/lib/public";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Fragrantions & Event Pipeline | Sensasi Wangi Indonesia",
  description:
    "Pipeline event PT Sensasi Wangi Indonesia: Fragrantions, Road to Fragrantions, workshop parfum, sponsor, tenant, komunitas, dan activation.",
  openGraph: {
    title: "Fragrantions & Event Pipeline | Sensasi Wangi Indonesia",
    description: "Event pipeline SWI untuk komunitas, sponsor, tenant, customer acquisition, dan marketplace growth.",
  },
};

const eventEngines = [
  {
    title: "Community acquisition",
    copy: "Event membawa pecinta parfum, perfumer, kreator, brand, dan customer baru ke ekosistem SWI.",
    icon: Users,
  },
  {
    title: "Sponsor and tenant revenue",
    copy: "Fragrantions dapat dikembangkan melalui sponsor, tenant booth, media package, ticketing, dan partnership.",
    icon: Handshake,
  },
  {
    title: "Store and marketplace bridge",
    copy: "Traffic event harus diarahkan ke SWI Store, booking kelas, katalog produk, checkout, dan repeat order.",
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

export default function EventsPage() {
  const events = getPublicEvents();

  return (
    <div className="flex flex-col">
      <section className="border-b bg-gradient-to-b from-slate-950 to-primary py-20 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <Badge variant="secondary" className="mb-5 bg-white/10 text-white">
              Fragrantions & event pipeline
            </Badge>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Event SWI sebagai mesin komunitas, sponsor, tenant, dan customer acquisition.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/80">
              Fragrantions dan Road to Fragrantions tidak hanya menjadi acara publik, tetapi juga growth engine
              untuk brand, marketplace, store experience, dan investor traction.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b bg-muted/30 py-12">
        <div className="container mx-auto grid gap-5 px-4 md:grid-cols-3">
          {eventEngines.map((engine) => {
            const Icon = engine.icon;
            return (
              <Card key={engine.title} className="border-none shadow-sm">
                <CardHeader>
                  <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">{engine.title}</CardTitle>
                  <CardDescription className="leading-6">{engine.copy}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="rounded-xl border bg-gradient-to-br from-amber-100 via-white to-primary/10 p-8 shadow-sm">
            <Badge variant="outline" className="bg-white/70">Flagship event</Badge>
            <h2 className="mt-6 text-4xl font-bold text-slate-950">Fragrantions</h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Platform event fragrance untuk mempertemukan brand lokal, perfumer, kolektor, komunitas,
              sponsor, tenant, media, dan customer dalam satu ruang kurasi.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-white p-4">
                <CalendarDays className="mb-2 h-5 w-5 text-primary" />
                <p className="font-semibold">Annual flagship</p>
                <p className="text-sm text-muted-foreground">Dapat diperkuat dengan roadshow dan pre-event.</p>
              </div>
              <div className="rounded-lg bg-white p-4">
                <Ticket className="mb-2 h-5 w-5 text-primary" />
                <p className="font-semibold">Monetization layer</p>
                <p className="text-sm text-muted-foreground">Ticketing, sponsor, booth, media, dan merchandise.</p>
              </div>
            </div>
          </div>

          <div>
            <Badge variant="outline" className="mb-4">Road to Fragrantions</Badge>
            <h2 className="text-3xl font-bold leading-tight text-slate-950 md:text-4xl">
              Roadshow membuat event utama punya funnel sebelum hari H.
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Format pop-up market, mini workshop, community gathering, dan brand activation dapat menjadi cara
              menguji kota, mengumpulkan leads, serta mengarahkan traffic ke sensasiwangi.id.
            </p>
            <div className="mt-6 grid gap-3">
              {["Bandung", "Surabaya", "Bali", "Medan", "Jakarta"].map((city) => (
                <div key={city} className="flex items-center gap-3 rounded-lg border bg-white p-3 text-sm text-slate-700">
                  <MapPin className="h-4 w-4 text-primary" />
                  {city}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 max-w-3xl">
            <h2 className="text-3xl font-bold text-slate-950">Upcoming events</h2>
            <p className="mt-3 text-muted-foreground">
              Gunakan daftar ini sebagai public pipeline. Lengkapi registration link, sponsor package, dan post-event
              report agar siap untuk partner dan investor.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const eventDate = new Date(event.date);
              const isUpcoming = eventDate > new Date();

              return (
                <Card key={event.id} className="flex flex-col border-none shadow-sm transition-smooth hover:shadow-elegant">
                  <CardHeader>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <Badge variant={isUpcoming ? "default" : "secondary"}>
                        {isUpcoming ? "Coming soon" : "Past / review"}
                      </Badge>
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      {eventDate.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                    <CardTitle className="text-xl">{event.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {event.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <p className="flex-1 text-sm leading-6 text-muted-foreground">{event.description}</p>
                    {event.registrationUrl && (
                      <Button asChild className="mt-6 w-full">
                        <Link href={event.registrationUrl} target="_blank">
                          Register / lihat detail
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {events.length === 0 && (
            <div className="rounded-xl border bg-white py-12 text-center text-muted-foreground">
              Belum ada event yang upcoming. Tambahkan pipeline event di data publik.
            </div>
          )}
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Badge variant="outline" className="mb-4">Partner readiness</Badge>
            <h2 className="text-3xl font-bold text-slate-950">Yang perlu siap sebelum event dipitch ke sponsor.</h2>
            <p className="mt-4 text-muted-foreground">
              Checklist ini membantu Fragrantions terlihat lebih matang untuk sponsor, tenant, media partner, dan investor.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {packageReadiness.map((item) => (
              <div key={item} className="rounded-lg border bg-white p-4 text-sm font-medium text-slate-700 shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-3xl font-bold">Ingin menjadi partner Fragrantions?</h2>
            <p className="mt-3 max-w-2xl text-primary-foreground/85">
              SWI terbuka untuk sponsor, tenant, media partner, brand activation, workshop, dan kolaborasi komunitas.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary">
              <a href="https://wa.me/628118556688" target="_blank" rel="noopener noreferrer">
                Hubungi tim SWI
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
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
