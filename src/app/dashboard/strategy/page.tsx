'use client';

import React, { useState } from 'react';

export default function StrategySimulator() {
  const [budget] = useState(4000000); // Modal 4 Juta
  
  const scenarios = [
    {
      id: 1,
      name: 'Produksi Parfum "Queen Rosa"',
      cost: 3500000,
      output: '50-70 Botol (30ml)',
      roi_est: 'High (300%)',
      risk: 'Medium (Stok mati jika marketing gagal)',
      desc: 'Fokus pada Hero Product Pixel Potion. Memanfaatkan hype karakter Rosa.',
      verdict: 'Recommended'
    },
    {
      id: 2,
      name: 'Webinar "Rahasia Perfumer" (SensasiWangi.id)',
      cost: 500000,
      output: '50-100 Peserta Berbayar',
      roi_est: 'Medium (150%) + Leads',
      risk: 'Low',
      desc: 'Modal zoom & ads kecil. Keuntungan utama adalah Database Email & Brand Authority.',
      verdict: 'Safe Bet'
    },
    {
      id: 3,
      name: 'Event Fragrantions 2026 (DP Venue)',
      cost: 4000000,
      output: 'Booking Slot',
      roi_est: 'Long Term',
      risk: 'High',
      desc: 'Menghabiskan seluruh modal hanya untuk DP. Tidak ada cashflow masuk segera.',
      verdict: 'Not Recommended'
    }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Strategic Simulator: &quot;The 4 Million Challenge&quot;</h1>
      <p className="text-gray-600 mb-6">Analisis alokasi modal terbatas (IDR 4.000.000) untuk dampak maksimal di 2026.</p>

      <div className="grid grid-cols-1 gap-6">
        {scenarios.map((scene) => (
          <div key={scene.id} className={`p-6 rounded-lg border-l-4 shadow-sm ${
            scene.verdict === 'Recommended' ? 'bg-green-50 border-green-500' :
            scene.verdict === 'Safe Bet' ? 'bg-blue-50 border-blue-500' :
            'bg-red-50 border-red-500'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold">{scene.name}</h3>
              <span className="font-mono text-sm bg-white px-2 py-1 rounded border">Biaya: Rp {scene.cost.toLocaleString('id-ID')}</span>
            </div>
            
            <p className="text-gray-700 mb-4">{scene.desc}</p>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="block text-gray-500 font-bold">Output:</span>
                {scene.output}
              </div>
              <div>
                <span className="block text-gray-500 font-bold">Est. ROI:</span>
                {scene.roi_est}
              </div>
              <div>
                <span className="block text-gray-500 font-bold">Risk:</span>
                {scene.risk}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <span className="font-bold">Verdict: </span>
              <span className={`font-bold ${
                scene.verdict === 'Recommended' ? 'text-green-700' :
                scene.verdict === 'Safe Bet' ? 'text-blue-700' :
                'text-red-700'
              }`}>{scene.verdict}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gray-800 text-white p-6 rounded-lg">
        <h2 className="text-lg font-bold mb-4">🤖 Osmo Strategic Recommendation</h2>
        <p className="mb-4">
          Dengan modal <strong>Rp 4.000.000</strong>, strategi &quot;All-In&quot; ke produksi fisik terlalu berisiko karena menghabiskan likuiditas.
          Strategi terbaik adalah <strong>Hybrid Approach</strong>:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-300">
          <li>
            <strong className="text-white">Jalankan Webinar (Rp 500rb):</strong> Gunakan webinar berbayar murah (Rp 50rb/org) untuk mengumpulkan dana segar cepat (~Rp 2.5jt revenue) + Database Market.
          </li>
          <li>
            <strong className="text-white">Pre-Order Queen Rosa (Rp 1jt - Ads/Sample):</strong> Jangan produksi massal dulu. Buat sample, foto estetik (pakai Manggo), lalu buka PO. Gunakan uang DP customer untuk produksi.
          </li>
          <li>
            <strong className="text-white">Sisa Kas (Rp 2.5jt):</strong> Simpan sebagai &quot;Safety Net&quot; atau cicil hutang modal pendiri.
          </li>
        </ol>
      </div>
    </div>
  );
}
