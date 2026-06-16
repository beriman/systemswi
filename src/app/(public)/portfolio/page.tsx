// Portfolio Page - Events & Past Work
"use client";

import { useEffect, useMemo, useState } from "react";
import { PORTFOLIO_ITEMS, getPortfolioByCategory } from "@/lib/public";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type FragrantionsEvent = {
    id: string;
    name: string;
    slug: string;
    type: string;
    status: string;
    description: string;
    pic: string;
    instagram: string;
    startDate: string;
    endDate: string;
    location: string;
    venue: string;
    attendeeActual?: number;
    tenantCount?: number;
    sponsorCount?: number;
    notes?: string;
};

const PORTFOLIO_CATEGORIES_DISPLAY: Record<string, string> = {
    all: "All",
    completed: "Sudah Terlaksana",
    exhibition: "Exhibition",
    festival: "Festival",
    "pop-up": "Roadshow / Pop-up",
    workshop: "Workshop",
    other: "Other",
};

const EVENT_IMAGE_BY_SLUG: Record<string, string> = {
    "road-to-fragrantions-2025-vol-1": "/images/events/road-to-fragrantions-tim.svg",
    "fragrantions-2025": "/images/events/fragrantions-gedung-emeria.svg",
    "road-to-fragrantions-2026-vol-1": "/images/events/road-to-fragrantions-tim.svg",
};

const FALLBACK_EVENT_IMAGE_BY_TYPE: Record<string, string> = {
    festival: "/images/events/fragrantions-gedung-emeria.svg",
    exhibition: "/images/events/fragrantions-gedung-emeria.svg",
    "pop-up": "/images/events/road-to-fragrantions-tim.svg",
    workshop: "/images/events/road-to-fragrantions-tim.svg",
    other: "/images/swi/logosensasiwangi.png",
};

const getEventImage = (event: { slug?: string; type?: string }, index = 0) => {
    if (event.slug && EVENT_IMAGE_BY_SLUG[event.slug]) return EVENT_IMAGE_BY_SLUG[event.slug];
    if (event.type && FALLBACK_EVENT_IMAGE_BY_TYPE[event.type]) return FALLBACK_EVENT_IMAGE_BY_TYPE[event.type];
    return index % 2 === 0 ? "/images/events/road-to-fragrantions-tim.svg" : "/images/events/fragrantions-gedung-emeria.svg";
};

function formatEventDate(startDate: string, endDate?: string) {
    if (!startDate) return "Tanggal TBA";

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    const startLabel = start.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

    if (!end || Number.isNaN(end.getTime())) return startLabel;

    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    if (sameMonth) return startLabel;

    return `${startLabel} - ${end.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`;
}

function normalizeInstagramUrl(value?: string) {
    if (!value) return "https://www.instagram.com/fragrantions/";
    if (value.startsWith("http")) return value;
    return `https://www.instagram.com/${value.replace("@", "")}/`;
}

export default function PortfolioPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [events, setEvents] = useState<FragrantionsEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadEvents() {
            try {
                setIsLoading(true);
                const res = await fetch("/api/events", { cache: "no-store" });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                if (!cancelled) {
                    setEvents(Array.isArray(data.events) ? data.events : []);
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    setError("Belum bisa membaca data Events dari Sheets, menampilkan fallback portfolio.");
                    setEvents([]);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        loadEvents();
        return () => {
            cancelled = true;
        };
    }, []);

    const completedEvents = useMemo(
        () => events.filter((event) => event.status?.toLowerCase() === "completed"),
        [events]
    );

    const eventCategories = useMemo(() => {
        const types = Array.from(new Set(completedEvents.map((event) => event.type || "other")));
        return ["all", "completed", ...types];
    }, [completedEvents]);

    const filteredEvents = useMemo(() => {
        if (selectedCategory === "all" || selectedCategory === "completed") return completedEvents;
        return completedEvents.filter((event) => event.type === selectedCategory);
    }, [completedEvents, selectedCategory]);

    const fallbackItems = selectedCategory === "all" || selectedCategory === "completed"
        ? PORTFOLIO_ITEMS
        : getPortfolioByCategory(selectedCategory as never);

    const hasSheetEvents = filteredEvents.length > 0;

    return (
        <div className="flex flex-col">
            {/* Hero */}
            <section className="gradient-hero text-white py-20">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm uppercase tracking-[0.3em] text-white/75 mb-4">Fragrantions by SWI</p>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Portfolio Event</h1>
                    <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
                        Dokumentasi event <strong>Fragrantions</strong> dan <strong>Road to Fragrantions</strong> yang sudah terlaksana. Data ditarik dari sistem Events SWI dan dikurasi dari dokumentasi publik <strong>@fragrantions</strong>.
                    </p>
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <a href="https://www.instagram.com/fragrantions/" target="_blank" rel="noopener noreferrer">
                            <Button size="lg" variant="secondary">Lihat Instagram @fragrantions</Button>
                        </a>
                        <a href="/upcoming-events">
                            <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">Upcoming Events</Button>
                        </a>
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 py-12">
                {/* Summary */}
                <section className="grid gap-4 md:grid-cols-4 mb-10">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Portfolio Terlaksana</CardDescription>
                            <CardTitle className="text-3xl">{completedEvents.length || PORTFOLIO_ITEMS.length}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">Event completed yang tersimpan di sistem SWI.</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Series</CardDescription>
                            <CardTitle className="text-3xl">Fragrantions</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">Main event + Road to Fragrantions.</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Sumber Dokumentasi</CardDescription>
                            <CardTitle className="text-3xl">@fragrantions</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">Link IG ditampilkan di setiap card portfolio.</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Venue Utama</CardDescription>
                            <CardTitle className="text-2xl">TIM Jakarta</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">Promenade + Gedung Emeria, Taman Ismail Marzuki.</CardContent>
                    </Card>
                </section>

                {/* Fragrantions Series Timeline */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold mb-4 text-center">📅 Timeline Series Fragrantions</h2>
                    <div className="relative">
                        <div className="absolute left-1/2 -translate-x-px h-full w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent hidden md:block" />
                        <div className="space-y-6">
                            {[
                                { year: "2025", label: "Road to Fragrantions Vol. 1", venue: "Promenade TIM", status: "completed", month: "Juli" },
                                { year: "2025", label: "Fragrantions 2025", venue: "Gedung Emeria TIM", status: "completed", month: "November" },
                                { year: "2026", label: "Road to Fragrantions 2026 Vol. 1", venue: "Promenade TIM", status: "completed", month: "April" },
                                { year: "2026", label: "Road to Fragrantions 2026 Vol. 2", venue: "Promenade TIM", status: "upcoming", month: "Juli" },
                                { year: "2026", label: "Fragrantions 2026", venue: "Gedung Emeria TIM", status: "upcoming", month: "Agustus" },
                            ].map((item, i) => (
                                <div key={i} className={`flex items-center gap-4 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                                    <div className={`flex-1 ${i % 2 === 0 ? "md:text-right" : "md:text-left"} hidden md:block`}>
                                        <div className={`inline-block rounded-xl px-4 py-3 ${item.status === "completed" ? "bg-primary/10 border border-primary/20" : "bg-muted border border-muted-foreground/20"}`}>
                                            <div className="text-xs text-muted-foreground">{item.year} · {item.month}</div>
                                            <div className="font-semibold text-sm">{item.label}</div>
                                            <div className="text-xs text-muted-foreground">📍 {item.venue}</div>
                                        </div>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${item.status === "completed" ? "bg-primary border-primary" : "bg-background border-primary/40"}`} />
                                    <div className="flex-1 hidden md:block" />
                                    <div className="md:hidden flex items-center gap-3 flex-1">
                                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${item.status === "completed" ? "bg-primary" : "bg-primary/30"}`} />
                                        <div>
                                            <div className="text-xs text-muted-foreground">{item.year} · {item.month}</div>
                                            <div className="font-semibold text-sm">{item.label}</div>
                                            <div className="text-xs text-muted-foreground">📍 {item.venue} · {item.status === "completed" ? "✅" : "📋"}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Filter */}
                <section className="flex flex-wrap gap-2 justify-center mb-12">
                    {(completedEvents.length ? eventCategories : ["all", "completed", "exhibition"]).map((key) => (
                        <Button
                            key={key}
                            variant={selectedCategory === key ? "default" : "outline"}
                            onClick={() => setSelectedCategory(key)}
                            className="transition-smooth"
                        >
                            {PORTFOLIO_CATEGORIES_DISPLAY[key] || key}
                        </Button>
                    ))}
                </section>

                {isLoading && (
                    <div className="text-center py-10 text-muted-foreground">Memuat portfolio dari sistem Events...</div>
                )}

                {error && !isLoading && (
                    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        {error}
                    </div>
                )}

                {/* Portfolio Grid from Events system */}
                {!isLoading && hasSheetEvents && (
                    <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredEvents.map((event, index) => (
                            <Card key={event.id} className="overflow-hidden group rounded-3xl border-0 bg-background shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="h-52 relative overflow-hidden bg-muted">
                                    <img
                                        src={getEventImage(event, index)}
                                        alt={event.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex items-end p-5">
                                        <div>
                                            <span className="inline-flex text-white font-medium bg-primary/90 px-3 py-1 rounded-full text-xs mb-2">
                                                {PORTFOLIO_CATEGORIES_DISPLAY[event.type] || event.type || "Event"}
                                            </span>
                                            <h2 className="text-white text-xl font-bold leading-tight">{event.name}</h2>
                                        </div>
                                    </div>
                                </div>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs text-primary font-medium uppercase tracking-wide">
                                            {event.status === "completed" ? "✅ Completed" : event.status === "planning" ? "📋 Planning" : event.status}
                                        </span>
                                        <span className="text-xs text-muted-foreground text-right">
                                            {formatEventDate(event.startDate, event.endDate)}
                                        </span>
                                    </div>
                                    <CardDescription className="flex items-center gap-1">
                                        📍 {event.venue && event.venue !== "TBA" ? `${event.venue}, ` : ""}{event.location || "Indonesia"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {event.description}
                                    </p>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div className="rounded-lg bg-muted/60 p-2.5 text-center">
                                            <div className="text-muted-foreground">Tenant</div>
                                            <div className="font-semibold text-base">{event.tenantCount || 0}</div>
                                        </div>
                                        <div className="rounded-lg bg-muted/60 p-2.5 text-center">
                                            <div className="text-muted-foreground">Sponsor</div>
                                            <div className="font-semibold text-base">{event.sponsorCount || 0}</div>
                                        </div>
                                        <div className="rounded-lg bg-muted/60 p-2.5 text-center">
                                            <div className="text-muted-foreground">Attendee</div>
                                            <div className="font-semibold text-base">{event.attendeeActual || event.attendeeTarget || 0}</div>
                                        </div>
                                    </div>
                                    {(event.budget > 0 || event.revenue > 0) && (
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            {event.budget > 0 && (
                                                <div className="rounded-lg bg-blue-50 p-2.5">
                                                    <div className="text-blue-600">Budget</div>
                                                    <div className="font-semibold text-blue-800">Rp {(event.budget / 1000000).toFixed(1)}jt</div>
                                                </div>
                                            )}
                                            {event.revenue > 0 && (
                                                <div className="rounded-lg bg-green-50 p-2.5">
                                                    <div className="text-green-600">Revenue</div>
                                                    <div className="font-semibold text-green-800">Rp {(event.revenue / 1000000).toFixed(1)}jt</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {event.notes && (
                                        <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3">
                                            {event.notes}
                                        </p>
                                    )}
                                    <a
                                        href={normalizeInstagramUrl(event.instagram)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex text-sm font-medium text-primary hover:underline"
                                    >
                                        📸 Dokumentasi Instagram →
                                    </a>
                                </CardContent>
                            </Card>
                        ))}
                    </section>
                )}

                {/* Fallback grid */}
                {!isLoading && !hasSheetEvents && (
                    <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {fallbackItems.map((item, index) => (
                            <Card key={item.id} className="overflow-hidden group rounded-3xl border-0 bg-background shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="h-48 relative overflow-hidden">
                                    <img
                                        src={item.images?.[0] || getEventImage({ type: item.category }, index)}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-primary font-medium uppercase tracking-wide">
                                            {PORTFOLIO_CATEGORIES_DISPLAY[item.category] || item.category}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(item.date).toLocaleDateString("id-ID", { year: "numeric", month: "short" })}
                                        </span>
                                    </div>
                                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{item.title}</CardTitle>
                                    <CardDescription className="flex items-center gap-1">
                                        📍 {item.location}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                        {item.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </section>
                )}
            </div>

            {/* CTA Section */}
            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold mb-4">Ingin Berkolaborasi di Fragrantions?</h2>
                    <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                        Hubungi SWI untuk tenant, sponsorship, brand activation, atau kolaborasi komunitas parfum.
                    </p>
                    <a href="https://wa.me/628118556688" target="_blank" rel="noopener noreferrer">
                        <Button size="lg">
                            💬 Hubungi via WhatsApp
                        </Button>
                    </a>
                </div>
            </section>
        </div>
    );
}
