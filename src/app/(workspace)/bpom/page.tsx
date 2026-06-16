"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Registration = {
  id: string;
  timestamp: string;
  productName: string;
  brand: string;
  category: string;
  registrationType: string;
  status: string;
  submissionDate: string;
  approvalDate: string;
  expiryDate: string;
  certificateNumber: string;
  pic: string;
  notes: string;
  proofUrl: string;
};

type Summary = {
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  rejected: number;
  expired: number;
  expirySoon: number;
  expiredActual: number;
};

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "approved") return "bg-green-100 text-green-700";
  if (s === "submitted") return "bg-blue-100 text-blue-700";
  if (s === "rejected") return "bg-red-100 text-red-700";
  if (s === "expired") return "bg-gray-100 text-gray-700";
  return "bg-yellow-100 text-yellow-700";
}

function formatDate(date: string) {
  if (!date || date === "TBA") return "TBA";
  return date;
}

export default function BpomPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [sourceStatus, setSourceStatus] = useState<"live" | "degraded" | "unknown">("unknown");
  const [alerts, setAlerts] = useState<{ expirySoon: Registration[]; expired: Registration[] }>({ expirySoon: [], expired: [] });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bpom", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat BPOM data");
      setRegistrations(json.registrations || []);
      setSummary(json.summary || null);
      setSourceStatus(json.sourceStatus || "unknown");
      setAlerts(json.alerts || { expirySoon: [], expired: [] });
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSeed(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/bpom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal seed BPOM data");
      await load();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const form = new FormData(e.currentTarget);
      const res = await fetch("/api/bpom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          productName: form.get("productName"),
          brand: form.get("brand"),
          category: form.get("category"),
          registrationType: form.get("registrationType"),
          status: form.get("status"),
          submissionDate: form.get("submissionDate"),
          pic: form.get("pic"),
          notes: form.get("notes"),
          proofUrl: form.get("proofUrl"),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menambah registrasi");
      await load();
      setShowForm(false);
      e.currentTarget.reset();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">🏛️ BPOM Registration Tracker</h2>
          <p className="text-muted-foreground">
            Registrasi BPOM produk parfum PT Sensasi Wangi Indonesia. Tracking status dari draft sampai approved.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={load} disabled={loading}>Refresh</Button>
          <Button variant="outline" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Tutup" : "+ BPOM Baru"}
          </Button>
        </div>
      </div>

      {sourceStatus === "degraded" && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-3 text-yellow-700 text-sm">
            ⚠️ Google OAuth tidak valid. Data BPOM tidak bisa dimuat dari Google Sheets. Silakan re-auth.
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-red-700">{error}</CardContent>
        </Card>
      )}

      {/* Expiry Alerts */}
      {(alerts.expired.length > 0 || alerts.expirySoon.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {alerts.expired.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-700">❌ Expired ({alerts.expired.length})</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-red-600 space-y-1">
                {alerts.expired.map((r) => (
                  <div key={r.id}>{r.productName} — {r.brand} (exp: {r.expiryDate})</div>
                ))}
              </CardContent>
            </Card>
          )}
          {alerts.expirySoon.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-yellow-700">⚠️ Expiring Soon ≤90 hari ({alerts.expirySoon.length})</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-yellow-600 space-y-1">
                {alerts.expirySoon.map((r) => (
                  <div key={r.id}>{r.productName} — {r.brand} (exp: {r.expiryDate})</div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi title="Total Registrasi" value={summary?.total || 0} note="semua brand" />
        <Kpi title="Approved" value={summary?.approved || 0} note="sertifikat aktif" accent="text-green-600" />
        <Kpi title="Draft" value={summary?.draft || 0} note="perlu submission" accent="text-yellow-600" />
        <Kpi title="Submitted" value={summary?.submitted || 0} note="proses review" accent="text-blue-600" />
      </div>

      {/* Registration Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>+ Registrasi BPOM Baru</CardTitle>
            <CardDescription>Draft registrasi baru. Status bisa di-update setelah submission.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="grid gap-3 md:grid-cols-2">
              <Field name="productName" label="Nama Produk" placeholder="L'Arc~en~Scent EDP 30ml" />
              <Field name="brand" label="Brand" placeholder="L'Arc~en~Scent" />
              <Field name="category" label="Kategori" placeholder="Perfume / Skincare" defaultValue="Perfume" />
              <Field name="registrationType" label="Tipe Registrasi" placeholder="Reguler / Tipe Baru / Perubahan" defaultValue="Reguler" />
              <Field name="status" label="Status" placeholder="draft / submitted / approved" defaultValue="draft" />
              <Field name="submissionDate" label="Tanggal Submission" type="date" />
              <Field name="pic" label="PIC" placeholder="Beriman / Team" />
              <Field name="proofUrl" label="Proof URL" placeholder="Link Drive / Docs" />
              <Field className="md:col-span-2" name="notes" label="Catatan" placeholder="Keterangan tambahan, issue, renewal reminder, dll" />
              <Button disabled={saving} className="md:col-span-2">Simpan Registrasi</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registry</CardTitle>
          <CardDescription>Daftar registrasi BPOM. Diambil dari Google Sheets BPOM_Registry.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded bg-muted animate-pulse" />)}
            </div>
          ) : registrations.length === 0 ? (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground py-8">
                Belum ada registrasi BPOM. Seed data contoh atau tambah registrasi baru.
              </p>
              <form onSubmit={handleSeed} className="flex justify-center">
                <Button variant="outline" disabled={saving} type="submit">
                  🌱 Seed 4 Contoh Registrasi
                </Button>
              </form>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-3">Produk</th>
                    <th className="py-2 pr-3">Brand</th>
                    <th className="py-2 pr-3">Tipe</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Submission</th>
                    <th className="py-2 pr-3">Approval</th>
                    <th className="py-2 pr-3">Expiry</th>
                    <th className="py-2 pr-3">No. Sertifikat</th>
                    <th className="py-2 pr-3">PIC</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{reg.productName || "-"}</td>
                      <td className="py-2 pr-3">{reg.brand || "-"}</td>
                      <td className="py-2 pr-3">{reg.registrationType || "-"}</td>
                      <td className="py-2 pr-3">
                        <Badge className={statusBadge(reg.status)}>{reg.status || "draft"}</Badge>
                      </td>
                      <td className="py-2 pr-3">{formatDate(reg.submissionDate)}</td>
                      <td className="py-2 pr-3">{formatDate(reg.approvalDate)}</td>
                      <td className="py-2 pr-3">{formatDate(reg.expiryDate)}</td>
                      <td className="py-2 pr-3 text-xs">{reg.certificateNumber || "-"}</td>
                      <td className="py-2 pr-3">{reg.pic || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ title, value, note, accent = "" }: { title: string; value: number; note: string; accent?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${accent}`}>{value}</div>
        <div className="text-xs text-muted-foreground">{note}</div>
      </CardContent>
    </Card>
  );
}

function Field({ label, className = "", ...props }: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <Label className="mb-1 block text-xs text-muted-foreground">{label}</Label>
      <Input {...props} />
    </div>
  );
}
