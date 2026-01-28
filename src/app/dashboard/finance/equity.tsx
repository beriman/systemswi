'use client';

import React from 'react';

export default function EquityDashboard() {
  // Data Hardcoded sesuai arahan user
  // Target Modal Dasar: Rp 1.000.000.000
  const founders = [
    { name: 'Beriman Juliano', share: 34, role: 'CEO', commited: 340000000, paid: 50000000 },
    { name: 'Wapiq Rizya', share: 33, role: 'COO', commited: 330000000, paid: 30000000 },
    { name: 'Muhamad Malsiaf', share: 33, role: 'CFO', commited: 330000000, paid: 30000000 },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Founder Equity & Debt Monitor</h1>
      <p className="text-gray-600">Pelacakan kewajiban setoran modal pendiri (Akta Perusahaan: IDR 1M)</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {founders.map((founder) => {
          const debt = founder.commited - founder.paid;
          const progress = (founder.paid / founder.commited) * 100;
          
          return (
            <div key={founder.name} className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{founder.name}</h3>
                  <span className="text-sm text-gray-500">{founder.role} • {founder.share}% Saham</span>
                </div>
                <div className={`px-2 py-1 text-xs rounded ${debt > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {debt > 0 ? 'Belum Lunas' : 'Lunas'}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Komitmen:</span>
                  <span className="font-medium">Rp {founder.commited.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Disetor:</span>
                  <span className="font-medium text-green-600">Rp {founder.paid.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-gray-700 font-bold">Hutang Setor:</span>
                  <span className="font-bold text-red-600">Rp {debt.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-xs text-right mt-1 text-gray-500">{progress.toFixed(1)}% Terpenuhi</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 p-4 rounded border border-blue-200">
        <h3 className="font-bold text-blue-800 mb-2">💡 Strategic Insight</h3>
        <p className="text-sm text-blue-700">
          Dana setoran modal yang belum terbayar dapat dicatat sebagai <strong>Piutang Pemegang Saham</strong> dalam neraca. 
          Pembayaran bertahap disarankan dilakukan saat perusahaan membutuhkan injeksi kas (misal: untuk produksi Batch 2 Pixel Potion) 
          agar cashflow perusahaan tetap sehat tanpa mengendap terlalu lama.
        </p>
      </div>
    </div>
  );
}
