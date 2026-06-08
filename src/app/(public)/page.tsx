// Home Page - SWI Public Landing Page
import { Metadata } from "next";
import Link from "next/link";
import { COMPANY_INFO, BRAND_PORTFOLIO, BUSINESS_PILLARS, UPCOMING_EVENTS } from "@/lib/public";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Sensasi Wangi Indonesia | Fragrance Ecosystem",
    description: "Membangun Ekosistem Wewangian Nusantara. Rumah bagi berbagai brand parfum, platform digital, komunitas kreator wewangian, serta penyelenggara event parfum terbesar di Indonesia.",
    keywords: ["parfum Indonesia", "fragrance", "wewangian", "Fragrantions", "workshop parfum"],
    openGraph: {
        title: "Sensasi Wangi Indonesia",
        description: "Membangun Ekosistem Wewangian Nusantara",
        type: "website",
    },
};

// Icon components
const SparklesIcon = () => (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

const LayersIcon = () => (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
);

const ShoppingBagIcon = () => (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
);

const Building2Icon = () => (
    <svg className="w-16 h-16 mx-auto mb-6 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const fragrantionsPortfolioHighlights = [
    {
        name: "Road to Fragrantions Vol. 1",
        date: "Juli 2025",
        type: "Roadshow / Pop-up",
        description: "Rangkaian pemanasan pertama menuju Fragrantions 2025.",
    },
    {
        name: "Fragrantions 2025",
        date: "November 2025",
        type: "Festival",
        description: "Acara utama Fragrantions 2025 untuk komunitas dan pelaku fragrance.",
    },
    {
        name: "Road to Fragrantions 2026 Vol. 1",
        date: "April 2026",
        type: "Roadshow / Pop-up",
        description: "Rangkaian menuju Fragrantions 2026 yang sudah terlaksana.",
    },
];

const divisions = [
    {
        icon: SparklesIcon,
        title: "Event & Experience",
        description: "Menghadirkan pengalaman parfum lewat Fragrantions, roadshow, workshop, dan kolaborasi komunitas.",
        bullets: ["Fragrantions", "Road to Fragrantions", "Workshop & Brand Activation"],
        color: "from-amber-500 to-orange-600",
    },
    {
        icon: LayersIcon,
        title: "Digital & Platform",
        description: "SensasiWangi.id – marketplace parfum premium, forum, dan kelas online.",
        bullets: ["Marketplace", "Forum Komunitas", "Online Class"],
        color: "from-blue-500 to-indigo-600",
    },
    {
        icon: ShoppingBagIcon,
        title: "Production & Brands",
        description: "R&D, formulasi, laboratorium, dan rumah bagi brand-brand unggulan SWI.",
        bullets: ["R&D & Formulasi", "Produksi Parfum", "Brand Incubation"],
        color: "from-purple-500 to-pink-600",
    },
];

export default function HomePage() {
    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="relative gradient-hero text-white">
                <div className="container mx-auto px-4 py-24 md:py-32">
                    <div className="max-w-3xl mx-auto text-center space-y-6">
                        <h1 className="text-4xl md:text-6xl font-bold leading-tight animate-fade-in">
                            Membangun Ekosistem Wewangian Nusantara.
                        </h1>
                        <p className="text-lg md:text-xl text-white/90 animate-slide-in-delay-1">
                            Kami adalah rumah bagi berbagai brand parfum, platform digital, komunitas kreator wewangian, serta penyelenggara event parfum terbesar di Indonesia. Dari riset aroma, edukasi, hingga produksi — semua kami kemas menjadi sebuah pengalaman wangi yang holistik.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-slide-in-delay-2">
                            <Link href="/portfolio">
                                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                                    Lihat Portfolio Event
                                    <ArrowRightIcon />
                                </Button>
                            </Link>
                            <Link href="/upcoming-events">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/30">
                                    Upcoming Fragrantions
                                </Button>
                            </Link>
                        </div>
                        <div className="grid grid-cols-3 gap-3 pt-8 max-w-xl mx-auto animate-slide-in-delay-2">
                            <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-md shadow-sm">
                                <div className="text-3xl font-bold">3</div>
                                <div className="text-xs text-white/75">portfolio completed</div>
                            </div>
                            <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-md shadow-sm">
                                <div className="text-3xl font-bold">2</div>
                                <div className="text-xs text-white/75">upcoming/planning</div>
                            </div>
                            <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-md shadow-sm">
                                <div className="text-3xl font-bold">@</div>
                                <div className="text-xs text-white/75">fragrantions docs</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent"></div>
            </section>

            {/* About SWI Section */}
            <section className="py-20 bg-background">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Tentang SWI</h2>
                        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                            Didirikan pada tahun 2021, PT Sensasi Wangi Indonesia hadir sebagai pelopor ekosistem parfum di Indonesia. Kami tidak hanya menciptakan wangi — kami membangun ruang bagi komunitas, kreator, dan pecinta parfum untuk bertumbuh bersama.
                        </p>
                    </div>

                    <div className="mt-16">
                        <h3 className="text-2xl font-bold mb-8 text-center">4 Pilar Bisnis SWI</h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="border-none shadow-md hover:shadow-elegant transition-smooth">
                                <CardHeader>
                                    <CardTitle className="text-lg">Media</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">Youtube, Edukasi, dan Narasi wewangian</p>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-md hover:shadow-elegant transition-smooth">
                                <CardHeader>
                                    <CardTitle className="text-lg">Komunitas</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">Marketplace, forum, dan perfumer tools</p>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-md hover:shadow-elegant transition-smooth">
                                <CardHeader>
                                    <CardTitle className="text-lg">Event</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">Penyelenggara acara bertema parfum dan lifestyle</p>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-md hover:shadow-elegant transition-smooth">
                                <CardHeader>
                                    <CardTitle className="text-lg">Retail</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">Produksi & distribusi brand parfum artisan</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Unit Bisnis Kami */}
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Unit Bisnis Kami</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Tiga pilar utama yang menopang ekosistem SWI
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {divisions.map((division, index) => (
                            <Card
                                key={index}
                                className="group rounded-3xl border-0 bg-background shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                            >
                                <CardHeader>
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${division.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth`}>
                                        <division.icon />
                                    </div>
                                    <CardTitle className="text-xl">{division.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <CardDescription className="text-base mb-4">
                                        {division.description}
                                    </CardDescription>
                                    <ul className="space-y-2">
                                        {division.bullets.map((bullet, i) => (
                                            <li key={i} className="flex items-center text-sm text-muted-foreground">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                                                {bullet}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <div className="p-6 pt-0 mt-auto">
                                    <Link href="/about" className="text-primary hover:underline text-sm font-medium flex items-center">
                                        Pelajari Lebih Lanjut <ArrowRightIcon />
                                    </Link>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Brand Kami */}
            <section className="py-20 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Brand Kami</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Perjalanan aroma dari hati Indonesia.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <Card className="overflow-hidden rounded-3xl border-0 bg-background shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="h-48 bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600"></div>
                            <CardHeader>
                                <CardTitle>L&apos;Arc~en~Scent</CardTitle>
                                <CardDescription>Luxury Artisan Perfume</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Elegan, eksklusif, crafted dengan presisi.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden rounded-3xl border-0 bg-background shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="h-48 bg-gradient-to-br from-cyan-600 via-blue-600 to-purple-600"></div>
                            <CardHeader>
                                <CardTitle>Pixel Potion</CardTitle>
                                <CardDescription>Gamer-Inspired Fragrance</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Wangi yang hidup di dunia virtual dan nyata.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden rounded-3xl border-0 bg-background shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="h-48 bg-gradient-to-br from-amber-700 via-orange-600 to-red-600"></div>
                            <CardHeader>
                                <CardTitle>NUScentZa</CardTitle>
                                <CardDescription>Aroma Indonesia</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Membawa keindahan Nusantara dalam setiap semprotan.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="text-center mt-12">
                        <Link href="/products">
                            <Button variant="outline" size="lg">
                                Jelajahi Brand Kami
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Fragrantions Portfolio + Event & Community */}
            <section className="py-24 bg-[#f7f3ec]">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-start max-w-6xl mx-auto">
                        <div className="lg:sticky lg:top-24">
                            <p className="text-sm uppercase tracking-[0.28em] text-primary font-semibold mb-4">Event & Community</p>
                            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Fragrantions Portfolio</h2>
                            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                                Rekam jejak Fragrantions dan Road to Fragrantions sebagai ruang temu brand, kreator, dan pecinta parfum. Portfolio yang sudah terlaksana terhubung ke dokumentasi @fragrantions, sementara agenda berikutnya ada di Upcoming Events.
                            </p>
                            <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                                <Link href="/portfolio">
                                    <Button size="lg" variant="default" className="w-full sm:w-auto lg:w-full rounded-full shadow-md shadow-primary/15">
                                        Lihat Portfolio Event
                                    </Button>
                                </Link>
                                <Link href="/upcoming-events">
                                    <Button size="lg" variant="secondary" className="w-full sm:w-auto lg:w-full rounded-full bg-background shadow-sm border-0">
                                        Lihat Upcoming Events
                                    </Button>
                                </Link>
                                <a href="https://www.instagram.com/fragrantions/" target="_blank" rel="noopener noreferrer">
                                    <Button size="lg" variant="ghost" className="w-full sm:w-auto lg:w-full rounded-full text-primary hover:text-primary hover:bg-primary/10">
                                        Instagram @fragrantions
                                    </Button>
                                </a>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {fragrantionsPortfolioHighlights.map((event, index) => (
                                <Card key={event.name} className="overflow-hidden border-0 rounded-3xl bg-background/85 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    <CardHeader className="p-6 md:p-7">
                                        <div className="flex items-start justify-between gap-5">
                                            <div className="space-y-3">
                                                <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wide">{event.type}</span>
                                                <CardTitle className="text-2xl md:text-3xl tracking-tight">{event.name}</CardTitle>
                                                <CardDescription className="text-base leading-relaxed">{event.description}</CardDescription>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Completed</div>
                                                <div className="text-lg font-semibold text-foreground">{event.date}</div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    {index === 1 && (
                                        <CardContent className="px-7 pb-7 pt-0">
                                            <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-amber-500/10 to-orange-500/10 p-4 text-sm text-muted-foreground">
                                                Main event Fragrantions sebagai anchor utama portfolio event SWI.
                                            </div>
                                        </CardContent>
                                    )}
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-primary text-primary-foreground">
                <div className="container mx-auto px-4 text-center">
                    <Building2Icon />
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Ajak Kami Berkolaborasi
                    </h2>
                    <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto mb-8">
                        Mari bersama membangun masa depan wewangian Indonesia. Kerja sama event, brand, edukasi, maupun inovasi parfum.
                    </p>
                    <Link href="/about">
                        <Button size="lg" variant="secondary">
                            Hubungi Kami
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
