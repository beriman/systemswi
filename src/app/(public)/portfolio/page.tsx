// Portfolio Page - Events & Past Work
"use client";

import { useState } from "react";
import { PORTFOLIO_ITEMS, PORTFOLIO_CATEGORIES, getPortfolioByCategory } from "@/lib/public";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Placeholder image URLs using picsum.photos
const getPlaceholderImage = (category: string, index: number) => {
    const seeds: Record<string, number[]> = {
        wedding: [101, 102, 103, 104],
        corporate: [201, 202, 203, 204],
        music: [301, 302, 303, 304],
        exhibition: [401, 402, 403, 404],
        other: [501, 502, 503, 504],
    };
    const seed = seeds[category]?.[index % 4] || 100 + index;
    return `https://picsum.photos/seed/${seed}/400/300`;
};

export const PORTFOLIO_CATEGORIES_DISPLAY: Record<string, string> = {
    exhibition: "Exhibition",
    corporate: "Corporate",
    wedding: "Wedding",
    music: "Music",
    other: "Workshop",
};

export default function PortfolioPage() {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const items = selectedCategory
        ? getPortfolioByCategory(selectedCategory)
        : PORTFOLIO_ITEMS;

    const categories = Object.entries(PORTFOLIO_CATEGORIES_DISPLAY);

    return (
        <div className="flex flex-col">
            {/* Hero */}
            <section className="gradient-hero text-white py-20">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Portfolio</h1>
                    <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                        Lihat berbagai event yang telah kami selenggarakan dengan sukses
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 py-12">
                {/* Filter */}
                <section className="flex flex-wrap gap-2 justify-center mb-12">
                    <Button
                        variant={selectedCategory === null ? "default" : "outline"}
                        onClick={() => setSelectedCategory(null)}
                        className="transition-smooth"
                    >
                        All
                    </Button>
                    {categories.map(([key, label]) => (
                        <Button
                            key={key}
                            variant={selectedCategory === key ? "default" : "outline"}
                            onClick={() => setSelectedCategory(key)}
                            className="transition-smooth"
                        >
                            {label}
                        </Button>
                    ))}
                </section>

                {/* Portfolio Grid */}
                <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((item, index) => (
                        <Card key={item.id} className="overflow-hidden group cursor-pointer hover:shadow-elegant transition-smooth border-2 hover:border-primary/20">
                            <div className="h-48 relative overflow-hidden">
                                {/* Placeholder image */}
                                <img
                                    src={getPlaceholderImage(item.category, index)}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                                    <span className="text-white font-medium bg-primary/80 px-4 py-2 rounded-full text-sm">View Details</span>
                                </div>
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
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {item.description}
                                </p>
                                {item.participants && (
                                    <p className="text-xs text-primary mt-3 font-medium">
                                        👥 {item.participants.toLocaleString()} peserta
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </section>

                {items.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <span className="text-6xl block mb-4">📂</span>
                        Belum ada portfolio untuk kategori ini
                    </div>
                )}
            </div>

            {/* CTA Section */}
            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold mb-4">Ingin Bekerja Sama dengan Kami?</h2>
                    <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                        Hubungi kami untuk konsultasi gratis tentang event parfum atau kolaborasi brand.
                    </p>
                    <a href="https://wa.me/628118556688" target="_blank" rel="noopener">
                        <Button size="lg">
                            💬 Hubungi via WhatsApp
                        </Button>
                    </a>
                </div>
            </section>
        </div>
    );
}
