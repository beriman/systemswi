import Link from "next/link";

const dashboardLinks = [
  { href: "/dashboard", label: "Holding Overview" },
  { href: "/dashboard/finance", label: "Finance & Equity" },
  { href: "/dashboard/tax-compliance", label: "Tax & BPJS" },
  { href: "/dashboard/event-cde", label: "Event CDE" },
  { href: "/dashboard/strategy", label: "Strategy AI" },
];

const publicLinks = [
  { href: "/", label: "Frontpage SWI" },
  { href: "/about", label: "Company Profile" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-64 border-r border-gray-200 bg-white md:block">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-900">System SWI</h1>
          <p className="text-xs text-gray-500">v2.0 Holding Dashboard</p>
        </div>

        <nav className="mt-6 space-y-2 px-4">
          <div className="px-4 pb-2 pt-4 text-xs font-bold uppercase text-gray-400">Internal</div>
          {dashboardLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
            >
              {link.label}
            </Link>
          ))}

          <div className="px-4 pb-2 pt-6 text-xs font-bold uppercase text-gray-400">Public</div>
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="h-screen flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
