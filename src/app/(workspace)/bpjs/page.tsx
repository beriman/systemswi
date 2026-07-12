"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Clock, CreditCard, FileText, Building2, Shield, Users } from "lucide-react";

// Data dari Gmail (BPJS Ketenagakerjaan)
const BPJS_KETENAGAKERJAAN = {
  npp: "25216707-000",
  namaPerusahaan: "PT Sensasi Wangi Indonesia",
  status: "AKTIF",
  iuranBulanan: 394107,
  metodePembayaran: "BNI",
  contactPerson: "Reza Permana Aji",
  contactPhone: "08535111431",
  contactEmail: "reza.permana@bpjsketenagakerjaan.go.id",
  kantorCabang: "BPJS Ketenagakerjaan Jakarta",
  periodeAktif: "Mei 2026",
  lastPaymentDate: "25-05-2026",
  lastPaymentAmount: 394107,
};

const PAYMENT_HISTORY = [
  { periode: "Mei 2026", amount: 394107, date: "25-05-2026", method: "BNI", status: "Lunas" },
  { periode: "Apr 2026", amount: 394107, date: "30-04-2026", method: "BNI", status: "Lunas" },
  { periode: "Mar 2026", amount: 394108, date: "10-03-2026", method: "BNI", status: "Lunas" },
  { periode: "Feb 2026", amount: 394108, date: "10-02-2026", method: "BNI", status: "Lunas" },
  { periode: "Jan 2026", amount: 394108, date: "30-01-2026", method: "BRI", status: "Lunas" },
  { periode: "Des 2025", amount: 394108, date: "10-12-2025", method: "BNI", status: "Lunas" },
  { periode: "Nov 2025", amount: 394108, date: "10-11-2025", method: "BNI", status: "Lunas" },
  { periode: "Okt 2025", amount: 394108, date: "10-10-2025", method: "BNI", status: "Lunas" },
];

const BPJS_KESEHATAN = {
  status: "BELUM TERDAFTAR",
  lastEmailDate: "21-10-2025",
  lastEmailSubject: "Pendaftaran Badan Usaha Baru - PT Sensasi Wangi Indonesia",
  note: "Email pendaftaran terdeteksi (21 Okt 2025) namun tidak ada tagihan atau konfirmasi pembayaran BPJS Kesehatan. Perlu verifikasi ke BPJS Kesehatan.",
};

type ComplianceRegisterEntry = {
  id: string;
  area: string;
  obligation: string;
  period: string;
  dueDate: string;
  status: string;
  owner: string;
  sourceProof: string;
  riskLevel: string;
  notes: string;
  daysUntilDue: number | null;
  riskBadge: "green" | "yellow" | "red" | "gray";
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "aktif" || s === "lunas") return <Badge className="bg-green-100 text-green-700">{status}</Badge>;
  if (s === "belum terdaftar" || s === "pending") return <Badge className="bg-yellow-100 text-yellow-700">{status}</Badge>;
  if (s === "non-aktif" || s === "overdue") return <Badge className="bg-red-100 text-red-700">{status}</Badge>;
  return <Badge className="bg-gray-100 text-gray-700">{status}</Badge>;
}

function gcgBadgeClass(badge: ComplianceRegisterEntry["riskBadge"]) {
  if (badge === "green") return "bg-green-100 text-green-700";
  if (badge === "yellow") return "bg-yellow-100 text-yellow-700";
  if (badge === "red") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
}

export default function BPJSPage() {
  const [activeTab, setActiveTab] = useState("ketenagakerjaan");
  const [bpjsCompliance, setBpjsCompliance] = useState<ComplianceRegisterEntry[]>([]);
  const [complianceStatus, setComplianceStatus] = useState<"loading" | "live" | "degraded">("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/governance/compliance-register", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const entries = Array.isArray(json.entries) ? (json.entries as ComplianceRegisterEntry[]) : [];
        setBpjsCompliance(entries.filter((entry) => entry.area.toUpperCase().startsWith("BPJS")));
        setComplianceStatus(json.sourceStatus === "live" ? "live" : "degraded");
      })
      .catch(() => {
        if (!cancelled) setComplianceStatus("degraded");
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            BPJS Tracker
          </h1>
          <p className="text-muted-foreground">
            Monitoring BPJS Ketenagakerjaan & Kesehatan — data dari email & transaksi bank
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>BPJS Ketenagakerjaan</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <StatusBadge status={BPJS_KETENAGAKERJAAN.status} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">NPP: {BPJS_KETENAGAKERJAAN.npp}</p>
            <p className="text-lg font-semibold mt-1">{formatRupiah(BPJS_KETENAGAKERJAAN.iuranBulanan)}/bln</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>BPJS Kesehatan</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <StatusBadge status={BPJS_KESEHATAN.status} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Belum ada tagihan</p>
            <p className="text-xs text-yellow-600 mt-1">Perlu verifikasi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pembayaran Terakhir</CardDescription>
            <CardTitle className="text-lg">{formatRupiah(BPJS_KETENAGAKERJAAN.lastPaymentAmount)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{BPJS_KETENAGAKERJAAN.lastPaymentDate}</p>
            <p className="text-xs text-muted-foreground mt-1">via {BPJS_KETENAGAKERJAAN.metodePembayaran}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total YTD 2026</CardDescription>
            <CardTitle className="text-lg">{formatRupiah(394107 * 5 + 394108 * 3)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">8 bulan (s/d Mei 2026)</p>
            <p className="text-xs text-muted-foreground mt-1">Est. tahunan: {formatRupiah(394107 * 12)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>GCG Compliance_Register — BPJS</CardTitle>
          <CardDescription>
            Source of truth tata kelola: sheet Compliance_Register. Jika bukti kosong, tampilkan Belum dicatat dan jangan diasumsikan selesai.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {complianceStatus === "loading" ? (
            <p className="text-sm text-muted-foreground">Memuat register BPJS dari Google Sheets…</p>
          ) : bpjsCompliance.length === 0 ? (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              Belum ada item BPJS di Compliance_Register atau Google Workspace sedang degraded. Buka /compliance untuk seed/register kewajiban BPJSKT dan BPJSKS.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-3">Area</th>
                    <th className="py-2 pr-3">Kewajiban</th>
                    <th className="py-2 pr-3">Due</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Owner</th>
                    <th className="py-2 pr-3">Bukti</th>
                  </tr>
                </thead>
                <tbody>
                  {bpjsCompliance.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{item.area}<div className="text-xs text-muted-foreground">{item.id}</div></td>
                      <td className="py-2 pr-3">{item.obligation}<div className="text-xs text-muted-foreground">{item.period || "TBA"} • Risiko: {item.riskLevel || "TBA"}</div></td>
                      <td className="py-2 pr-3">{item.dueDate || "TBA"}</td>
                      <td className="py-2 pr-3"><Badge className={gcgBadgeClass(item.riskBadge)}>{item.status || "TBA"}</Badge></td>
                      <td className="py-2 pr-3">{item.owner || "Belum dicatat"}</td>
                      <td className="py-2 pr-3">{item.sourceProof ? <a className="text-teal-700 underline" href={item.sourceProof}>Bukti</a> : <span className="text-muted-foreground">Belum dicatat</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">⚠️ BPJS Kesehatan Belum Terdaftar</p>
              <p className="text-sm text-yellow-700 mt-1">
                Email pendaftaran terdeteksi tanggal {BPJS_KESEHATAN.lastEmailDate} ({BPJS_KESEHATAN.lastEmailSubject}),
                namun tidak ada tagihan atau bukti pembayaran BPJS Kesehatan. Segera verifikasi ke BPJS Kesehatan
                atau daftarkan ulang untuk memastikan kepatuhan ketenagakerjaan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ketenagakerjaan">BPJS Ketenagakerjaan</TabsTrigger>
          <TabsTrigger value="kesehatan">BPJS Kesehatan</TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat Pembayaran</TabsTrigger>
          <TabsTrigger value="reminder">Reminder & Jadwal</TabsTrigger>
        </TabsList>

        {/* Tab: Ketenagakerjaan */}
        <TabsContent value="ketenagakerjaan" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Info Perusahaan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nama Perusahaan</span>
                  <span className="font-medium">{BPJS_KETENAGAKERJAAN.namaPerusahaan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NPP-Divisi</span>
                  <span className="font-mono font-medium">{BPJS_KETENAGAKERJAAN.npp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={BPJS_KETENAGAKERJAAN.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Iuran Bulanan</span>
                  <span className="font-semibold">{formatRupiah(BPJS_KETENAGAKERJAAN.iuranBulanan)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metode Bayar</span>
                  <span className="font-medium">{BPJS_KETENAGAKERJAAN.metodePembayaran}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Kontak BPJS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PIC</span>
                  <span className="font-medium">{BPJS_KETENAGAKERJAAN.contactPerson}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telepon</span>
                  <span className="font-medium">{BPJS_KETENAGAKERJAAN.contactPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium text-sm">{BPJS_KETENAGAKERJAAN.contactEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kantor Cabang</span>
                  <span className="font-medium text-sm">{BPJS_KETENAGAKERJAAN.kantorCabang}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contact Center</span>
                  <span className="font-medium">175</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Detail Pembayaran Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Periode</p>
                  <p className="font-semibold">{BPJS_KETENAGAKERJAAN.periodeAktif}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Bayar</p>
                  <p className="font-semibold">{formatRupiah(BPJS_KETENAGAKERJAAN.lastPaymentAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Bayar</p>
                  <p className="font-semibold">{BPJS_KETENAGAKERJAAN.lastPaymentDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Via</p>
                  <p className="font-semibold">{BPJS_KETENAGAKERJAAN.metodePembayaran}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Kesehatan */}
        <TabsContent value="kesehatan" className="space-y-4">
          <Card className="border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <AlertTriangle className="h-5 w-5" />
                Status: Belum Terdaftar
              </CardTitle>
              <CardDescription>
                BPJS Kesehatan belum aktif untuk PT Sensasi Wangi Indonesia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Email pendaftaran terdeteksi:</strong> {BPJS_KESEHATAN.lastEmailDate} —
                  &quot;{BPJS_KESEHATAN.lastEmailSubject}&quot;
                </p>
                <p className="text-sm text-yellow-700 mt-2">
                  Namun tidak ada tagihan iuran atau bukti pembayaran yang diterima. Kemungkinan:
                </p>
                <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside space-y-1">
                  <li>Pendaftaran belum selesai / tertunda</li>
                  <li>Perusahaan belum memenuhi syarat minimum (10 karyawan)</li>
                  <li>Data salah masuk ke email perusahaan</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium">📋 Tindakan yang Disarankan:</p>
                <ol className="text-sm text-blue-700 mt-2 list-decimal list-inside space-y-1">
                  <li>Hubungi BPJS Kesehatan di 1500-112 untuk verifikasi status pendaftaran</li>
                  <li>Cek kepesertaan di aplikasi JKN Mobile atau website bpjs-kesehatan.go.id</li>
                  <li>Jika belum terdaftar, siapkan dokumen: NPWP, SIUP, NIB, data karyawan</li>
                  <li>Daftar melalui kantor cabang BPJS Kesehatan terdekat</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Riwayat */}
        <TabsContent value="riwayat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Pembayaran BPJS Ketenagakerjaan</CardTitle>
              <CardDescription>Data dari email konfirmasi pembayaran BPJS (8 bulan terakhir)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Periode</th>
                      <th className="text-right py-2 px-3">Jumlah</th>
                      <th className="text-left py-2 px-3">Tanggal Bayar</th>
                      <th className="text-left py-2 px-3">Metode</th>
                      <th className="text-left py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PAYMENT_HISTORY.map((p, i) => (
                      <tr key={i} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium">{p.periode}</td>
                        <td className="py-2 px-3 text-right">{formatRupiah(p.amount)}</td>
                        <td className="py-2 px-3">{p.date}</td>
                        <td className="py-2 px-3">{p.method}</td>
                        <td className="py-2 px-3">
                          <StatusBadge status={p.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold">
                      <td className="py-2 px-3">Total 8 bulan</td>
                      <td className="py-2 px-3 text-right">{formatRupiah(PAYMENT_HISTORY.reduce((s, p) => s + p.amount, 0))}</td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Reminder */}
        <TabsContent value="reminder" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Jadwal Pembayaran BPJS Ketenagakerjaan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jatuh Tempo</span>
                  <span className="font-medium">Tanggal 10-15 setiap bulan</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tagihan Terbit</span>
                  <span className="font-medium">Awal bulan (1-5)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Akses e-Billing</span>
                  <span className="text-sm text-muted-foreground">Tidak ditampilkan di System SWI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimasi Juni 2026</span>
                  <span className="font-semibold">{formatRupiah(394107)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimasi Juli 2026</span>
                  <span className="font-semibold">{formatRupiah(394107)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Reminder Checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">BPJS Ketenagakerjaan — Mei 2026 Lunas ✅</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-yellow-50 border border-yellow-200">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">BPJS Ketenagakerjaan — Juni 2026 (sebelum 15 Juni)</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-red-50 border border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">BPJS Kesehatan — Verifikasi status pendaftaran!</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 border border-blue-200">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">Laporan Data Peserta — Update via SIPP Online</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-purple-50 border border-purple200">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-purple-800">Tenaga Kerja — Perbarui data karyawan aktif</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>📧 Sumber Data</CardTitle>
              <CardDescription>Data diambil dari email Gmail sensasiwangi.id@gmail.com</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">BPJS Ketenagakerjaan</p>
                  <p className="text-muted-foreground">20+ email</p>
                  <p className="text-xs text-muted-foreground mt-1">noreply@bpjsketenagakerjaan.go.id</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">BRI Transactions</p>
                  <p className="text-muted-foreground">1 bukti transaksi</p>
                  <p className="text-xs text-muted-foreground mt-1">BankBRI@bri.co.id</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">BPJS Kesehatan</p>
                  <p className="text-muted-foreground">0 email tagihan</p>
                  <p className="text-xs text-muted-foreground mt-1">Hanya pendaftaran (Okt 2025)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
