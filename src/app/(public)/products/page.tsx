"use client";

import { useState } from "react";
import { PRODUCTS, PRODUCT_CATEGORIES, getProductsByCategory } from "@/lib/public";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Placeholder image URLs
const getProductImage = (category: string, index: number) => {
    const seeds: Record<string, number[]> = {
        "event-organizer": [601, 602, 603, 604],
        "media-production": [701, 702, 703, 704],
        "creative-services": [801, 802, 803, 804],
        venue: [901, 902, 903, 904],
    };
    const seed = seeds[category]?.[index % 4] || 600 + index;
    return `https://picsum.photos/seed/${seed}/400/300`;
};

export default function ProductsPage() {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const products = selectedCategory
        ? getProductsByCategory(selectedCategory)
        : PRODUCTS;

    const categories = Object.entries(PRODUCT_CATEGORIES);

    const handleWhatsAppContact = (productName: string) => {
        const message = encodeURIComponent(`Halo, saya ingin konsultasi tentang layanan ${productName}`);
        window.open(`https://wa.me/6281234567890?text=${message}`, "_blank");
    };

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Header */}
            <section className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Layanan Kami</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Berbagai layanan profesional untuk mewujudkan event impian Anda
                </p>
            </section>

            {/* Filter */}
            <section className="flex flex-wrap gap-2 justify-center mb-8">
                <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    onClick={() => setSelectedCategory(null)}
                >
                    All Services
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

            {/* Products Grid */}
            <section className="grid gap-6 md:grid-cols-2">
                {products.map((product, index) => (
                    <Card key={product.id} className="overflow-hidden">
                        <div className="h-48 relative overflow-hidden">
                            <img
                                src={getProductImage(product.category, index)}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-primary font-medium">
                                    {PRODUCT_CATEGORIES[product.category as keyof typeof PRODUCT_CATEGORIES]}
                                </span>
                                {product.priceRange && (
                                    <span className="text-xs text-muted-foreground">
                                        {product.priceRange}
                                    </span>
                                )}
                            </div>
                            <CardTitle>{product.name}</CardTitle>
                            <CardDescription>{product.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <h4 className="text-sm font-medium mb-2">Features:</h4>
                            <ul className="space-y-1">
                                {product.features.map((feature, i) => (
                                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                        <span className="text-primary">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Button
                                className="w-full mt-4"
                                onClick={() => handleWhatsAppContact(product.name)}
                            >
                                💬 Konsultasi Gratis
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </section>
        </div>
    );
}
