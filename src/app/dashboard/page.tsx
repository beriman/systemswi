'use client';

import Link from 'next/link';

export default function DashboardHome() {
  const modules = [
    { 
      title: 'Finance & Equity', 
      desc: 'Monitor arus kas, hutang pemegang saham, dan laporan laba rugi.',
      icon: '💰',
      href: '/dashboard/finance',
      color: 'bg-green-100 text-green-800'
    },
    { 
      title: 'Tax & Compliance', 
      desc: 'Kalkulator PPh 21/25, BPJS Ketenagakerjaan, dan kalender pajak.',
      icon: '⚖️',
      href: '/dashboard/tax-compliance',
      color: 'bg-yellow-100 text-yellow-800'
    },
    { 
      title: 'Event CDE', 
      desc: 'Pusat data Fragrantions 2026, database tenant, dan webinar planner.',
      icon: '🎉',
      href: '/dashboard/event-cde',
      color: 'bg-indigo-100 text-indigo-800'
    },
    { 
      title: 'Strategy AI', 
      desc: 'Simulator keputusan bisnis dengan dana terbatas (ROI Calculator).',
      icon: '🧠',
      href: '/dashboard/strategy',
      color: 'bg-purple-100 text-purple-800'
    }
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back, Master Iman.</h1>
        <p className="text-gray-600">System SWI v2.0 siap membantu operasional harian Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((mod) => (
          <Link key={mod.title} href={mod.href} className="group block">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md hover:border-blue-300">
              <div className="flex items-center gap-4 mb-3">
                <div className={`w-12 h-12 flex items-center justify-center rounded-full text-2xl ${mod.color}`}>
                  {mod.icon}
                </div>
                <h2 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                  {mod.title}
                </h2>
              </div>
              <p className="text-gray-600 pl-16">
                {mod.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions / Recent Activity */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">🔔 Action Items</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded text-red-700 text-sm">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <strong>Pajak:</strong> PPh 21 Masa Januari jatuh tempo dalam 5 hari.
          </div>
          <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded text-yellow-700 text-sm">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            <strong>Strategy:</strong> Keputusan alokasi dana Rp 4jt belum difinalisasi.
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded text-blue-700 text-sm">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <strong>Event:</strong> 3 Tenant baru mendaftar untuk bazaar (via Google Form).
          </div>
        </div>
      </div>
    </div>
  );
}
