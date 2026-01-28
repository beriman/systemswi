'use client';

export default function EventCDE() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Event CDE & Webinar Planner</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Webinar Planner Module */}
        <div className="bg-white p-6 rounded-lg shadow border border-purple-200">
          <h2 className="text-xl font-bold text-purple-800 mb-4">📢 Webinar Planner</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Topik Webinar</label>
              <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500" placeholder="Contoh: Rahasia Top Notes Citrus" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal</label>
                <input type="date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Harga Tiket</label>
                <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="IDR" />
              </div>
            </div>
            <button type="button" className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700">
              Buat Landing Page Pendaftaran
            </button>
          </form>
        </div>

        {/* Fragrantions 2026 CDE */}
        <div className="bg-white p-6 rounded-lg shadow border border-indigo-200">
          <h2 className="text-xl font-bold text-indigo-800 mb-4">🏆 Fragrantions 2026 (CDE)</h2>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded">
              <h3 className="font-bold text-sm">Tenant Database</h3>
              <p className="text-xs text-gray-500">Central repository untuk data calon tenant bazaar.</p>
              <button className="text-xs text-indigo-600 font-bold mt-1">Access Database →</button>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <h3 className="font-bold text-sm">Sponsorship Proposal</h3>
              <p className="text-xs text-gray-500">Versi: v2.4 (Draft Osmo)</p>
              <button className="text-xs text-indigo-600 font-bold mt-1">Download PDF →</button>
            </div>
            <div className="border-t pt-4">
              <h3 className="font-bold text-sm mb-2">Timeline</h3>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '10%' }}></div>
              </div>
              <p className="text-xs text-right mt-1">Fase 1: Konsep</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
