"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  FileCheck2,
  Home,
  Landmark,
  LineChart,
  Presentation,
  ShieldCheck,
} from "lucide-react";

const dashboardLinks = [
  { href: "/dashboard", label: "Holding Overview", icon: BarChart3 },
  { href: "/dashboard/finance", label: "Finance & Capital", icon: LineChart },
  { href: "/dashboard/tax-compliance", label: "Tax & Compliance", icon: ShieldCheck },
  { href: "/dashboard/event-cde", label: "Fragrantions CDE", icon: CalendarDays },
  { href: "/dashboard/strategy", label: "Strategy Room", icon: Presentation },
];

const publicLinks = [
  { href: "/", label: "Public Frontpage", icon: Home },
  { href: "/about", label: "Company Profile", icon: Landmark },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#f5f7f6] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[292px] border-r border-black/10 bg-[#10231f] text-white xl:block">
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10">
              <FileCheck2 className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-lg font-bold">System SWI</h1>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">Control tower</p>
            </div>
          </div>
        </div>

        <nav className="space-y-7 p-4">
          <div>
            <p className="px-3 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-white/40">Internal</p>
            <div className="space-y-1">
              {dashboardLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-colors ${
                      isActive(link.href) ? "bg-white text-slate-950" : "text-white/72 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <p className="px-3 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-white/40">Public</p>
            <div className="space-y-1">
              {publicLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-white/72 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">Operating principle</p>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Frontpage menjual narasi. Dashboard menjaga keputusan, data, dan eksekusi tetap sinkron.
          </p>
        </div>
      </aside>

      <div className="xl:pl-[292px]">
        <div className="sticky top-0 z-30 border-b border-black/10 bg-[#f5f7f6]/90 backdrop-blur xl:hidden">
          <div className="flex gap-2 overflow-x-auto px-4 py-3">
            {dashboardLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                  isActive(link.href) ? "bg-slate-950 text-white" : "border border-black/10 bg-white text-slate-700"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <main>{children}</main>
      </div>
    </div>
  );
}
