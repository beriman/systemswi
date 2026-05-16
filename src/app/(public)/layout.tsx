"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Frontpage" },
  { href: "/about", label: "Company" },
  { href: "/portfolio", label: "Proof" },
  { href: "/products", label: "Brands" },
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
    <div className="min-h-screen bg-[#fbfaf7]">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#fbfaf7]/92 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex h-[72px] items-center justify-between gap-4 py-3">
            <Link href="/" className="group flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-black/10 bg-white shadow-sm">
                <Image
                  src="/logo-swi.png"
                  alt="Logo PT Sensasi Wangi Indonesia"
                  width={36}
                  height={36}
                  className="transition-transform group-hover:scale-105"
                />
              </span>
              <span className="hidden leading-none sm:block">
                <span className="block text-sm font-bold text-slate-950">PT Sensasi Wangi Indonesia</span>
                <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Fragrance ecosystem
                </span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                    isActiveLink(link.href)
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-white hover:text-slate-950"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-2 lg:flex">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </div>

            <button
              className="rounded-md border border-black/10 bg-white p-2 text-slate-950 shadow-sm lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="space-y-1 border-t border-black/10 py-4 lg:hidden">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-md px-4 py-3 text-sm font-semibold transition-colors ${
                    isActiveLink(link.href) ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-white"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/dashboard"
                className="mx-4 mt-3 flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4" />
                Internal Dashboard
              </Link>
            </div>
          )}
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-black/10 bg-white py-14">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-black/10 bg-[#fbfaf7]">
                  <Image src="/logo-swi.png" alt="Logo PT Sensasi Wangi Indonesia" width={36} height={36} />
                </span>
                <div>
                  <p className="font-bold text-slate-950">PT Sensasi Wangi Indonesia</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Fragrance ecosystem
                  </p>
                </div>
              </div>
              <p className="mt-5 max-w-sm text-sm leading-7 text-slate-600">
                Holding parfum Indonesia untuk SWI Store, Fragrantions, brand portfolio, produksi, marketplace, dan
                customer data.
              </p>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-bold text-slate-950">Public</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                {NAV_LINKS.slice(0, 5).map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-slate-950">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-bold text-slate-950">Kontak</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <a href="mailto:sensasiwangi.id@gmail.com" className="hover:text-slate-950">
                    sensasiwangi.id@gmail.com
                  </a>
                </li>
                <li>
                  <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-slate-950">
                    +62 811-855-6688
                  </a>
                </li>
                <li>Jakarta, Indonesia</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-bold text-slate-950">Channels</h4>
              <div className="flex flex-wrap gap-2">
                <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-[#fbfaf7]">
                  Instagram
                </a>
                <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-[#fbfaf7]">
                  YouTube
                </a>
                <a href="/dashboard" className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-[#fbfaf7]">
                  Dashboard
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-500">
            Copyright {new Date().getFullYear()} PT Sensasi Wangi Indonesia. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
