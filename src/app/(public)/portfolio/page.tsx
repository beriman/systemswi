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

export default function PortfolioPage() {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const items = selectedCategory
        ? getPortfolioByCategory(selectedCategory)
        : PORTFOLIO_ITEMS;

    const categories = Object.entries(PORTFOLIO_CATEGORIES);

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Header */}
            <section className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Portfolio</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Lihat berbagai event yang telah kami selenggarakan dengan sukses
                </p>
            </section>

            {/* Filter */}
            <section className="flex flex-wrap gap-2 justify-center mb-8">
                <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    onClick={() => setSelectedCategory(null)}
                >
                    All
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
            </section>

            {/* Portfolio Grid */}
            <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item, index) => (
                    <Card key={item.id} className="overflow-hidden group cursor-pointer">
                        <div className="h-48 relative overflow-hidden">
                            {/* Placeholder image */}
                            <img
                                src={getPlaceholderImage(item.category, index)}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white font-medium">View Details</span>
                            </div>
                        </div>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-primary font-medium">
                                    {PORTFOLIO_CATEGORIES[item.category as keyof typeof PORTFOLIO_CATEGORIES]}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(item.date).toLocaleDateString("id-ID", { year: "numeric", month: "short" })}
                                </span>
                            </div>
                            <CardTitle className="text-lg">{item.title}</CardTitle>
                            <CardDescription>{item.location}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {item.description}
                            </p>
                            {item.participants && (
                                <p className="text-xs text-primary mt-2">
                                    👥 {item.participants.toLocaleString()} peserta
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </section>

            {items.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    Belum ada portfolio untuk kategori ini
                </div>
            )}
        </div>
    );
}
