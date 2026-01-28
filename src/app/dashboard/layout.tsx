import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-900">System SWI</h1>
          <p className="text-xs text-gray-500">v2.0 (Osmo Edition)</p>
        </div>
        
        <nav className="mt-6 px-4 space-y-2">
          <Link href="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Home</Link>
          <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-400 uppercase">Modules</div>
          <Link href="/dashboard/finance" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded">💰 Finance & Equity</Link>
          <Link href="/dashboard/tax-compliance" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded">⚖️ Tax & BPJS</Link>
          <Link href="/dashboard/event-cde" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded">🎉 Event CDE</Link>
          <Link href="/dashboard/strategy" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded">🧠 Strategy AI</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen">
        {children}
      </main>
    </div>
  );
}
