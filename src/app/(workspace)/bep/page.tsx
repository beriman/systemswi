"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface BEPCalc {
  brand: string;
  product: string;
  fixedCost: number;
  variableCost: number;
  sellingPrice: number;
  contributionMargin: number;
  bepUnits: number;
  bepRevenue: number;
  currentSales: number;
  marginOfSafety: number;
  profit: number;
}

export default function BEPPage() {
  const [calcs, setCalcs] = useState<BEPCalc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brand, setBrand] = useState("L'Arc~en~Scent");
  const [fixedCost, setFixedCost] = useState("5000000");
  const [variableCost, setVariableCost] = useState("75000");
  const [sellingPrice, setSellingPrice] = useState("185000");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bep");
      const data = await res.json();
      if (data.calculations) {
        setCalcs(data.calculations);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCalculate = async () => {
    try {
      const res = await fetch("/api/bep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand,
          product: `${brand} EDP 30ml`,
          fixedCost: Number(fixedCost),
          variableCost: Number(variableCost),
          sellingPrice: Number(sellingPrice),
          currentSales: 50,
        }),
      });
      const data = await res.json();
      if (data.calculation) {
        loadData();
      }
    } catch (e) {
      setError(String(e));
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">📐 Break-Even Analysis</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">
            ← Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {/* Calculator */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">BEP Calculator</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Cost (Rp)</label>
              <input
                type="number"
                value={fixedCost}
                onChange={(e) => setFixedCost(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Variable Cost/Unit (Rp)</label>
              <input
                type="number"
                value={variableCost}
                onChange={(e) => setVariableCost(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price/Unit (Rp)</label>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleCalculate}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Calculate BEP
          </button>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">BEP Analysis Results</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : calcs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No BEP calculations yet. Use the calculator above or seed data.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Brand</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Fixed Cost</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Variable/Unit</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Price/Unit</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">CM</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">BEP (units)</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">BEP (Rp)</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">MoS %</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {calcs.map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{c.brand}</td>
                      <td className="px-4 py-3 text-right">{fmt(c.fixedCost)}</td>
                      <td className="px-4 py-3 text-right">{fmt(c.variableCost)}</td>
                      <td className="px-4 py-3 text-right">{fmt(c.sellingPrice)}</td>
                      <td className="px-4 py-3 text-right">{fmt(c.contributionMargin)}</td>
                      <td className="px-4 py-3 text-right">{Math.round(c.bepUnits).toLocaleString("id-ID")}</td>
                      <td className="px-4 py-3 text-right">{fmt(c.bepRevenue)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={c.marginOfSafety > 0 ? "text-green-600" : "text-red-600"}>
                          {c.marginOfSafety.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={c.profit > 0 ? "text-green-600" : "text-red-600"}>
                          {fmt(c.profit)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
