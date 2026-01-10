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

const divisions = [
    {
        icon: SparklesIcon,
        title: "Event & Experience",
        description: "Menghadirkan pengalaman parfum yang menyentuh indra dan emosi.",
        bullets: ["Fragrantions", "Workshop & Kelas", "B2B Event"],
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
                            <Link href="/about">
                                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                                    Lihat Tentang Kami
                                    <ArrowRightIcon />
                                </Button>
                            </Link>
                            <Link href="/portfolio">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/30">
                                    Lihat Portfolio
                                </Button>
                            </Link>
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
                                className="group hover:shadow-elegant transition-smooth border-2 hover:border-accent flex flex-col"
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
                        <Card className="overflow-hidden hover:shadow-elegant transition-smooth">
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

                        <Card className="overflow-hidden hover:shadow-elegant transition-smooth">
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

                        <Card className="overflow-hidden hover:shadow-elegant transition-smooth">
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

            {/* Event & Community */}
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Event & Community</h2>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
                        Kami membangun ruang bagi kreativitas, edukasi, dan kolaborasi. Mulai dari Road to Fragrantions hingga Fragrantions, event kami selalu menjadi tempat berkumpulnya para kreator dan pecinta parfum.
                    </p>
                    <Link href="/upcoming-events">
                        <Button size="lg" variant="default">
                            Lihat Event
                        </Button>
                    </Link>
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
