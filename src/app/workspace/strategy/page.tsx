"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StrategyPage() {
  const scenarios = [
    {
      id: 1,
      name: "Produksi Parfum Batch",
      cost: 3500000,
      output: "50-70 Botol (30ml)",
      roi_est: "High (300%)",
      risk: "Medium",
      desc: "Fokus pada Hero Product. Memanfaatkan hype karakter.",
      verdict: "Recommended",
    },
    {
      id: 2,
      name: "Webinar \"Rahasia Perfumer\"",
      cost: 500000,
      output: "50-100 Peserta Berbayar",
      roi_est: "Medium (150%) + Leads",
      risk: "Low",
      desc: "Modal zoom & ads kecil. Keuntungan utama adalah Database Email & Brand Authority.",
      verdict: "Safe Bet",
    },
    {
      id: 3,
      name: "Event Fragrantions 2026 (DP Venue)",
      cost: 4000000,
      output: "Booking Slot",
      roi_est: "Long Term",
      risk: "High",
      desc: "Menghabiskan seluruh modal hanya untuk DP. Tidak ada cashflow masuk segera.",
      verdict: "Not Recommended",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">🧠 Strategy Simulator</h2>
        <p className="text-muted-foreground">Analisis alokasi modal terbatas (IDR 4.000.000) untuk dampak maksimal</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {scenarios.map((scene) => (
          <div key={scene.id} className={`p-5 rounded-lg border-l-4 ${
            scene.verdict === "Recommended" ? "bg-green-50 border-green-500" :
            scene.verdict === "Safe Bet" ? "bg-blue-50 border-blue-500" :
            "bg-red-50 border-red-500"
          }`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold">{scene.name}</h3>
              <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                Biaya: Rp {scene.cost.toLocaleString("id-ID")}
              </span>
            </div>
            <p className="text-gray-700 mb-3">{scene.desc}</p>
            <div className="grid grid-cols-3 gap-3 text-sm">
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
            <div className="mt-3 pt-3 border-t border-gray-200">
              <span className="font-bold">Verdict: </span>
              <span className={`font-bold ${
                scene.verdict === "Recommended" ? "text-green-700" :
                scene.verdict === "Safe Bet" ? "text-blue-700" :
                "text-red-700"
              }`}>{scene.verdict}</span>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>💡 Strategic Recommendation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3">
            Dengan modal <strong>Rp 4.000.000</strong>, strategi "All-In" ke produksi fisik terlalu berisiko.
            Strategi terbaik adalah <strong>Hybrid Approach</strong>:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li><strong>Jalankan Webinar (Rp 500rb):</strong> Kumpulkan dana segar + Database Market.</li>
            <li><strong>Pre-Order (Rp 1jt):</strong> Buat sample, buka PO. Gunakan DP customer untuk produksi.</li>
            <li><strong>Sisa Kas (Rp 2.5jt):</strong> Safety Net atau cicil hutang modal pendiri.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
