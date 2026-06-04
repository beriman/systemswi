"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EventCDE() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">🎉 Event CDE & Webinar Planner</h2>
        <p className="text-muted-foreground">Pusat data event dan webinar — PT Sensasi Wangi Indonesia</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Webinar Planner */}
        <Card>
          <CardHeader>
            <CardTitle>📢 Webinar Planner</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Buat landing page pendaftaran webinar dengan mudah.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Topik Webinar</label>
                <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm" placeholder="Contoh: Rahasia Top Notes Citrus" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tanggal</label>
                  <input type="date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Harga Tiket</label>
                  <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm" placeholder="IDR" />
                </div>
              </div>
              <button className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 text-sm">
                Buat Landing Page Pendaftaran
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Fragrantions 2026 */}
        <Card>
          <CardHeader>
            <CardTitle>🏆 Fragrantions 2026</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded">
                <h3 className="font-bold text-sm">Tenant Database</h3>
                <p className="text-xs text-gray-500">Central repository untuk data calon tenant bazaar.</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <h3 className="font-bold text-sm">Sponsorship Proposal</h3>
                <p className="text-xs text-gray-500">Versi: v2.4</p>
              </div>
              <div className="border-t pt-3">
                <h3 className="font-bold text-sm mb-2">Timeline</h3>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: "10%" }} />
                </div>
                <p className="text-xs text-right mt-1 text-muted-foreground">Fase 1: Konsep</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
