"use client";

// Public layout for company profile pages
import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
    { href: "/about", label: "About" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/products", label: "Services" },
    { href: "/upcoming-events", label: "Events" },
];

const SOCIAL_LINKS = {
    instagram: "https://instagram.com/sensasiwangi.id",
    whatsapp: "https://wa.me/6281234567890",
    youtube: "https://youtube.com/@sensasiwangi",
};

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2">
                            <span className="text-2xl">🎪</span>
                            <span className="font-bold text-lg">Sensasi Wangi</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-6">
                            {NAV_LINKS.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-sm font-medium hover:text-primary transition-colors"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <Link
                                href="/login"
                                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                            >
                                Login
                            </Link>
                        </nav>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 rounded-md hover:bg-accent"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? (
                                <span className="text-xl">✕</span>
                            ) : (
                                <span className="text-xl">☰</span>
                            )}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden border-t py-4 space-y-2">
                            {NAV_LINKS.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-md"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <Link
                                href="/login"
                                className="block mx-4 mt-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium text-center"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Login
                            </Link>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main>{children}</main>

            {/* WhatsApp Floating Button */}
            <a
                href={SOCIAL_LINKS.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors hover:scale-110"
                title="Chat via WhatsApp"
            >
                <span className="text-2xl">💬</span>
            </a>

            {/* Footer */}
            <footer className="border-t bg-muted/50 py-12 mt-16">
                <div className="container mx-auto px-4">
                    <div className="grid gap-8 md:grid-cols-4">
                        {/* Company Info */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🎪</span>
                                <span className="font-bold">Sensasi Wangi</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Creating Unforgettable Moments since 2021
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="font-semibold mb-4">Quick Links</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                {NAV_LINKS.map((link) => (
                                    <li key={link.href}>
                                        <Link href={link.href} className="hover:text-foreground">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 className="font-semibold mb-4">Contact</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>
                                    <a href="mailto:hello@sensasiwangi.id" className="hover:text-foreground">
                                        📧 hello@sensasiwangi.id
                                    </a>
                                </li>
                                <li>
                                    <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener" className="hover:text-foreground">
                                        📱 +62 812 3456 7890
                                    </a>
                                </li>
                                <li>📍 Jakarta, Indonesia</li>
                            </ul>
                        </div>

                        {/* Social */}
                        <div>
                            <h4 className="font-semibold mb-4">Follow Us</h4>
                            <div className="flex gap-4">
                                <a
                                    href={SOCIAL_LINKS.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-2xl hover:scale-110 transition-transform"
                                    title="Instagram"
                                >
                                    📸
                                </a>
                                <a
                                    href={SOCIAL_LINKS.youtube}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-2xl hover:scale-110 transition-transform"
                                    title="YouTube"
                                >
                                    📹
                                </a>
                                <a
                                    href={SOCIAL_LINKS.whatsapp}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-2xl hover:scale-110 transition-transform"
                                    title="WhatsApp"
                                >
                                    💬
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
                        © {new Date().getFullYear()} PT. Sensasi Wangi Indonesia. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
