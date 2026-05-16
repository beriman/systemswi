"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FloatingChatWidget } from "@/components/chat/floating-chat";

const NAV_LINKS = [
  { href: "/", label: "Frontpage" },
  { href: "/about", label: "Company" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/products", label: "Brands & Services" },
  { href: "/upcoming-events", label: "Fragrantions" },
  { href: "/#investor", label: "Investor" },
];

const SOCIAL_LINKS = {
  instagram: "https://instagram.com/sensasiwangi.id",
  whatsapp: "https://wa.me/628118556688",
  youtube: "https://youtube.com/@sensasiwangi",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <div className="min-h-screen">{children}</div>;
  }

  const isActiveLink = (href: string) => {
    if (href.includes("#")) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="group flex items-center gap-3">
              <Image
                src="/logo-swi.png"
                alt="Logo PT Sensasi Wangi Indonesia"
                width={44}
                height={44}
                className="transition-transform group-hover:scale-105"
              />
              <div className="hidden sm:block">
                <span className="block text-lg font-bold leading-none">Sensasi Wangi</span>
                <span className="text-xs text-muted-foreground">Indonesia</span>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActiveLink(link.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                className="ml-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
              >
                Login
              </Link>
            </nav>

            <button
              className="rounded-md p-2 hover:bg-accent/10 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="space-y-1 border-t py-4 md:hidden">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActiveLink(link.href) ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                className="mx-4 mt-4 block rounded-lg bg-accent px-4 py-3 text-center text-sm font-medium text-accent-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </header>

      <main>{children}</main>

      <FloatingChatWidget />

      <footer className="mt-0 border-t bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Image src="/logo-swi.png" alt="Logo PT Sensasi Wangi Indonesia" width={44} height={44} />
                <div>
                  <span className="block font-bold">Sensasi Wangi</span>
                  <span className="text-xs text-muted-foreground">Indonesia</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Holding parfum Indonesia untuk store, event, brand, marketplace, dan customer data.
              </p>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/dashboard" className="transition-colors hover:text-foreground">
                    Internal Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Kontak</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="mailto:sensasiwangi.id@gmail.com" className="hover:text-foreground">
                    Email: sensasiwangi.id@gmail.com
                  </a>
                </li>
                <li>
                  <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                    WhatsApp: +62 811-855-6688
                  </a>
                </li>
                <li>Lokasi: Jakarta, Indonesia</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Ikuti Kami</h4>
              <div className="flex flex-wrap gap-3">
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border bg-background px-3 py-2 text-sm hover:bg-muted"
                >
                  Instagram
                </a>
                <a
                  href={SOCIAL_LINKS.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border bg-background px-3 py-2 text-sm hover:bg-muted"
                >
                  YouTube
                </a>
                <a
                  href={SOCIAL_LINKS.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border bg-background px-3 py-2 text-sm hover:bg-muted"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            Copyright {new Date().getFullYear()} PT Sensasi Wangi Indonesia. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
