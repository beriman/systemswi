'use client';

import React, { useState, useEffect } from 'react';

interface Shareholder {
  no: string;
  nama: string;
  jumlahSaham: number;
  nilai: number;
  persen: string;
  kewajiban: number;
  sudahSetor: number;
  sisaKewajiban: number;
  status: string;
  progress: number;
}

function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function EquityDashboard() {
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [totalModalDasar, setTotalModalDasar] = useState(1000000000);
  const [totalModalDitempatkan, setTotalModalDitempatkan] = useState(0);
  const [totalSudahSetor, setTotalSudahSetor] = useState(0);
  const [totalSisaKewajiban, setTotalSisaKewajiban] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        if (data.shareholders && data.shareholders.length > 0) {
          setShareholders(data.shareholders);
          setTotalModalDasar(data.totalModalDasar || 1000000000);
          setTotalModalDitempatkan(data.totalModalDitempatkan || 0);
          setTotalSudahSetor(data.totalSudahSetor || 0);
          setTotalSisaKewajiban(data.totalSisaKewajiban || 0);
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Founder Equity & Debt Monitor</h1>
        <div className="text-sm text-muted-foreground">Memuat data dari Google Sheets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Founder Equity & Debt Monitor</h1>
        <div className="text-sm text-red-600">Error: {error}</div>
      </div>
    );
  }

  const totalSetoranPercent = totalModalDitempatkan > 0 ? (totalSudahSetor / totalModalDitempatkan) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">👑 Founder Equity & Debt Monitor</h1>
        <p className="text-gray-600 text-sm mt-1">
          Data riil dari Google Sheets — PemegangSaham. Modal Dasar: {formatCurrency(totalModalDasar)}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="p-4 border rounded-lg bg-blue-50">
          <div className="text-xs text-muted-foreground">Modal Dasar</div>
          <div className="text-xl font-bold">{formatCurrency(totalModalDasar)}</div>
          <div className="text-xs text-muted-foreground">10.000 saham × Rp 100.000</div>
        </div>
        <div className="p-4 border rounded-lg bg-green-50">
          <div className="text-xs text-muted-foreground">Modal Ditempatkan</div>
          <div className="text-xl font-bold">{formatCurrency(totalModalDitempatkan)}</div>
          <div className="text-xs text-muted-foreground">2.500 saham × Rp 100.000</div>
        </div>
        <div className="p-4 border rounded-lg bg-purple-50">
          <div className="text-xs text-muted-foreground">Sudah Disetor</div>
          <div className="text-xl font-bold">{formatCurrency(totalSudahSetor)}</div>
          <div className="text-xs text-muted-foreground">{totalSetoranPercent.toFixed(1)}% dari ditempatkan</div>
        </div>
        <div className="p-4 border rounded-lg bg-red-50">
          <div className="text-xs text-muted-foreground">Sisa Kewajiban</div>
          <div className="text-xl font-bold text-red-700">{formatCurrency(totalSisaKewajiban)}</div>
          <div className="text-xs text-muted-foreground">Belum disetor</div>
        </div>
      </div>

      {/* Shareholder Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {shareholders.map((sh) => (
          <div key={sh.no} className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{sh.nama}</h3>
                <span className="text-sm text-gray-500">{sh.jumlahSaham} saham • {sh.persen} kepemilikan</span>
              </div>
              <div className={`px-2 py-1 text-xs rounded ${sh.sisaKewajiban > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {sh.sisaKewajiban > 0 ? 'Dalam Proses' : 'Lunas'}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Kewajiban Setor:</span>
                <span className="font-medium">{formatCurrency(sh.kewajiban)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sudah Disetor:</span>
                <span className="font-medium text-green-600">{formatCurrency(sh.sudahSetor)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-gray-700 font-bold">Sisa Kewajiban:</span>
                <span className={`font-bold ${sh.sisaKewajiban > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(sh.sisaKewajiban)}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${sh.progress >= 100 ? 'bg-green-600' : sh.progress >= 50 ? 'bg-blue-600' : 'bg-orange-500'}`}
                  style={{ width: `${Math.min(sh.progress, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-right mt-1 text-gray-500">{sh.progress.toFixed(1)}% Terpenuhi</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
