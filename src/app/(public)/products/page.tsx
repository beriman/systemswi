// Products/Services Page - Brands & Services
"use client";

import { useState } from "react";
import { PRODUCTS, PRODUCT_CATEGORIES, getProductsByCategory, BRAND_PORTFOLIO } from "@/lib/public";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Inline SVG placeholder generator — no external dependencies
const getProductImage = (category: string, index: number) => {
    const palettes: Record<string, { bg: string; fg: string; icon: string }> = {
        "event-organizer": { bg: "#f59e0b", fg: "#fffbeb", icon: "🎪" },
        "media-production":   { bg: "#6366f1", fg: "#eef2ff", icon: "🎬" },
        "creative-services":  { bg: "#ec4899", fg: "#fdf2f8", icon: "🎨" },
        "venue":              { bg: "#10b981", fg: "#ecfdf5", icon: "🏛️" },
    };
    const { bg, fg, icon } = palettes[category] || { bg: "#8b5cf6", fg: "#f5f3ff", icon: "✨" };
    const label = encodeURIComponent(category.replace("-", " ").toUpperCase());
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="${bg}"/>
        <rect x="0" y="0" width="400" height="300" fill="url(#g)"/>
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${bg}" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="${fg}" stop-opacity="0.3"/>
        </linearGradient></defs>
        <text x="200" y="130" text-anchor="middle" font-size="64">${icon}</text>
        <text x="200" y="190" text-anchor="middle" font-family="system-ui,sans-serif" font-size="16" font-weight="600" fill="${fg}" opacity="0.9">${category.replace(/-/g, " ").toUpperCase()}</text>
        <text x="200" y="215" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="${fg}" opacity="0.6">SWI Services</text>
    </svg>`;
    return `data:image/svg+xml,${svg.replace(/"/g, "'").replace(/#/g, "%23")}`;
};

export default function ProductsPage() {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const products = selectedCategory
        ? getProductsByCategory(selectedCategory)
        : PRODUCTS;

    const categories = Object.entries(PRODUCT_CATEGORIES);

    const handleWhatsAppContact = (productName: string) => {
        const message = encodeURIComponent(`Halo, saya ingin konsultasi tentang layanan ${productName}`);
        window.open(`https://wa.me/628118556688?text=${message}`, "_blank");
    };

    const brands = [
        {
            name: "L'Arc~en~Scent",
            tagline: "Luxury Artisan Line",
            description: "Kehalusan aroma, detail komposisi, dan desain kemasan eksklusif.",
            products: ["Body Perfume", "Reed Diffuser", "Soap Bar"],
            gradient: "from-purple-900 via-purple-700 to-pink-600",
            category: "Luxury"
        },
        {
            name: "Pixel Potion",
            tagline: "Gamer & Wibu Line",
            description: "Dunia aroma bertemu dunia gaming. Enerjik, unik, dan berkarakter.",
            products: ["Gaming Inspired Scents", "Anime Collection"],
            gradient: "from-cyan-600 via-blue-600 to-purple-600",
            category: "Gamer & Pop Culture"
        },
        {
            name: "NUScentZa",
            tagline: "Indonesian Scent Heritage",
            description: "Aroma khas kota-kota Indonesia, dikemas dengan sentuhan artistik dan harga terjangkau.",
            products: ["City Series", "Heritage Collection"],
            gradient: "from-amber-700 via-orange-600 to-red-600",
            category: "Nusantara"
        }
    ];

    return (
        <div className="flex flex-col">
            {/* Hero */}
            <section className="gradient-hero text-white py-20">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Brand & Layanan Kami</h1>
                    <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                        Perjalanan aroma dari hati Indonesia
                    </p>
                </div>
            </section>

            {/* Brands Section */}
            <section className="py-20 bg-background">
                <div className="container mx-auto px-4 max-w-6xl">
                    <h2 className="text-3xl font-bold mb-12 text-center">Brand Kami</h2>
                    <div className="grid gap-12">
                        {brands.map((brand, index) => (
                            <Card key={index} className="overflow-hidden border-none shadow-elegant hover:shadow-2xl transition-all duration-300 group">
                                <div className="grid md:grid-cols-2 gap-0">
                                    <div className={`h-64 md:h-auto bg-gradient-to-br ${brand.gradient} flex items-center justify-center p-8 ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                                        <div className="text-center text-white transform group-hover:scale-105 transition-transform duration-500">
                                            <h3 className="text-3xl font-bold mb-2">{brand.name}</h3>
                                            <Badge variant="secondary" className="bg-white/20 text-white border-none backdrop-blur-sm">
                                                {brand.category}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className={`p-8 md:p-12 flex flex-col justify-center ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                                        <CardHeader className="p-0 mb-6">
                                            <CardTitle className="text-2xl md:text-3xl mb-2 text-primary">{brand.tagline}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                                                {brand.description}
                                            </p>
                                            <div className="space-y-3">
                                                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Produk Unggulan:</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {brand.products.map((product, idx) => (
                                                        <Badge key={idx} variant="outline" className="border-primary/20 text-primary bg-primary/5">
                                                            {product}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-4 text-center">Layanan Kami</h2>
                    <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
                        Berbagai layanan profesional untuk mewujudkan kebutuhan parfum dan event Anda
                    </p>

                    {/* Filter */}
                    <div className="flex flex-wrap gap-2 justify-center mb-8">
                        <Button
                            variant={selectedCategory === null ? "default" : "outline"}
                            onClick={() => setSelectedCategory(null)}
                            className="transition-smooth"
                        >
                            All Services
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
                    </div>

                    {/* Products Grid */}
                    <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
                        {products.map((product, index) => (
                            <Card key={product.id} className="overflow-hidden hover:shadow-elegant transition-smooth">
                                <div className="h-48 relative overflow-hidden">
                                    <img
                                        src={getProductImage(product.category, index)}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                                </div>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-primary font-medium uppercase tracking-wide">
                                            {PRODUCT_CATEGORIES[product.category as keyof typeof PRODUCT_CATEGORIES]}
                                        </span>
                                        {product.priceRange && (
                                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                                {product.priceRange}
                                            </span>
                                        )}
                                    </div>
                                    <CardTitle>{product.name}</CardTitle>
                                    <CardDescription>{product.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <h4 className="text-sm font-medium mb-3">Termasuk:</h4>
                                    <ul className="space-y-2">
                                        {product.features.map((feature, i) => (
                                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                <span className="text-primary mt-0.5">✓</span>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        className="w-full mt-6"
                                        onClick={() => handleWhatsAppContact(product.name)}
                                    >
                                        💬 Konsultasi Gratis
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
