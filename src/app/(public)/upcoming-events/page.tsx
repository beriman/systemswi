// Upcoming Events Page with enhanced design
import { Metadata } from "next";
import Link from "next/link";
import { getPublicEvents } from "@/lib/public";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Event & Komunitas | Sensasi Wangi Indonesia",
    description: "Merayakan kreativitas dan inovasi dalam dunia wewangian melalui acara-acara inspiratif. Fragrantions, Road to Fragrantions, Workshop, dan lainnya.",
    openGraph: {
        title: "Event & Komunitas | Sensasi Wangi Indonesia",
        description: "Merayakan kreativitas dan inovasi dalam dunia wewangian",
    },
};

export default function EventsPage() {
    const events = getPublicEvents();

    return (
        <div className="flex flex-col">
            {/* Hero */}
            <section className="gradient-hero text-white py-20">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Event & Komunitas</h1>
                    <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                        Merayakan kreativitas dan inovasi dalam dunia wewangian melalui acara-acara inspiratif.
                    </p>
                </div>
            </section>

            {/* Featured Events */}
            <section className="py-20 bg-background">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="space-y-20">
                        {/* Fragrantions */}
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="order-2 md:order-1">
                                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-1 transform rotate-2 hover:rotate-0 transition-transform duration-500 shadow-elegant">
                                    <div className="bg-background rounded-xl overflow-hidden h-64 md:h-96 flex items-center justify-center">
                                        <h3 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">
                                            FRAGRANTIONS
                                        </h3>
                                    </div>
                                </div>
                            </div>
                            <div className="order-1 md:order-2 space-y-6">
                                <h2 className="text-3xl md:text-4xl font-bold">Fragrantions</h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Acara utama Fragrantions yang mempertemukan brand lokal, perfumer, kolektor, dan pecinta wewangian. Fragrantions 2025 berlangsung pada November 2025; Fragrantions 2026 masih tentative antara Agustus atau November 2026.
                                </p>
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <span className="text-primary">📅</span>
                                        <span>Tahunan (Annual Event)</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <span className="text-primary">📍</span>
                                        <span>Jakarta Convention Center / ICE BSD</span>
                                    </div>
                                </div>
                                <Button className="w-fit">Daftar Waitlist</Button>
                            </div>
                        </div>

                        {/* Road to Fragrantions */}
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <h2 className="text-3xl md:text-4xl font-bold">Road to Fragrantions</h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Rangkaian acara pemanasan menuju event utama. Saat ini record yang dipakai: Road to Fragrantions Juli 2025 dan Road to Fragrantions 2026 Vol. 1 April 2026; next event adalah Vol. 2 pada Juli 2026.
                                </p>
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <span className="text-primary">📅</span>
                                        <span>2 kali Road to Fragrantions tercatat; Vol. 2 berikutnya Juli 2026</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <span className="text-primary">📍</span>
                                        <span>Lokasi mengikuti pengumuman @fragrantions</span>
                                    </div>
                                </div>
                                <Button variant="outline" className="w-fit">Lihat Jadwal</Button>
                            </div>
                            <div>
                                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-1 transform -rotate-2 hover:rotate-0 transition-transform duration-500 shadow-elegant">
                                    <div className="bg-background rounded-xl overflow-hidden h-64 md:h-96 flex items-center justify-center">
                                        <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600 text-center px-4">
                                            Road to<br />Fragrantions
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Upcoming Events Grid */}
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-12 text-center">Upcoming Events</h2>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
                        {events.map((event) => {
                            const eventDate = new Date(event.date);
                            const isUpcoming = eventDate > new Date();

                            return (
                                <Card key={event.id} className="overflow-hidden flex flex-col hover:shadow-elegant transition-smooth group">
                                    <div className="h-48 bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center relative">
                                        <span className="text-6xl group-hover:scale-110 transition-transform">🎪</span>
                                        {isUpcoming && (
                                            <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                                                Coming Soon
                                            </div>
                                        )}
                                    </div>
                                    <CardHeader>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                            <span>📅 {eventDate.toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })}</span>
                                        </div>
                                        <CardTitle className="group-hover:text-primary transition-colors">{event.name}</CardTitle>
                                        <CardDescription className="flex items-center gap-1">
                                            📍 {event.location}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col">
                                        <p className="text-sm text-muted-foreground flex-1">
                                            {event.description}
                                        </p>
                                        {event.registrationUrl && (
                                            <Link href={event.registrationUrl} target="_blank">
                                                <Button className="w-full mt-4">
                                                    Register Now →
                                                </Button>
                                            </Link>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {events.length === 0 && (
                        <div className="text-center py-12">
                            <span className="text-6xl">🎪</span>
                            <p className="text-muted-foreground mt-4">
                                Belum ada event yang upcoming. Stay tuned!
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* Community CTA */}
            <section className="py-20 bg-primary text-primary-foreground">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-6">Bergabung dengan Komunitas</h2>
                    <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto mb-8">
                        Jadilah bagian dari ekosistem wewangian terbesar di Indonesia. Dapatkan akses ke event eksklusif, networking, dan berbagai benefit menarik lainnya.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a href="https://wa.me/628118556688" target="_blank" rel="noopener">
                            <Button size="lg" variant="secondary">
                                💬 Gabung Komunitas
                            </Button>
                        </a>
                        <a href="https://instagram.com/sensasiwangi.id" target="_blank" rel="noopener">
                            <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30">
                                📸 Follow Instagram
                            </Button>
                        </a>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold mb-4">Ingin Mengadakan Event?</h2>
                    <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                        Konsultasikan kebutuhan event Anda dengan tim profesional kami. Free consultation!
                    </p>
                    <a href="https://wa.me/628118556688" target="_blank" rel="noopener">
                        <Button size="lg">
                            💬 Hubungi Kami
                        </Button>
                    </a>
                </div>
            </section>
        </div>
    );
}
