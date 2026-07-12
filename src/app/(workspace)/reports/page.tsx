"use client";

import { useState, useEffect, useCallback } from "react";
import { RoleGate } from "@/components/auth/role-gate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "report";
}

function downloadTextFile(filename: string, content: string, mimeType = "text/markdown;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function downloadReportPDF(title: string, content: string, period: string): Promise<boolean> {
  try {
    const { exportContentToPDF } = await import("@/lib/document/pdf-export");
    return await exportContentToPDF({
      title,
      content,
      filename: `systemswi-${slugify(title)}-${slugify(period)}.pdf`,
    });
  } catch (err) {
    console.error("PDF export failed:", err);
    return false;
  }
}

type ReportTemplate = {
  type: string;
  name: string;
  cadence: string;
  description: string;
};

type GeneratedReport = {
  id: string;
  type: string;
  title: string;
  period: string;
  content: string;
  createdAt: string;
};

type DashboardData = {
  totalSaldoAkhir?: number;
  totalSudahSetor?: number;
  totalSisaKewajiban?: number;
  totalSetoranPercent?: number;
  totalModalDitempatkan?: number;
  sourceStatus?: string;
  sukukInfo?: { status?: string; nilai?: string; akad?: string; nisbah?: string; yield?: string };
  rekapData?: Array<{
    bulan: string;
    akun: string;
    periode: string;
    saldoAwal: string;
    totalMasuk: string;
    totalKeluar: string;
    saldoAkhir: string;
  }>;
  shareholders?: Array<{
    nama: string;
    persen: string;
    jumlahSaham: string;
    progress: number;
    kewajiban: number;
    sudahSetor: number;
    sisaKewajiban?: number;
  }>;
};

export default function ReportsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [reportType, setReportType] = useState("weekly_dashboard");
  const [period, setPeriod] = useState(() => new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" }));
  const [notes, setNotes] = useState("");
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [reportStatus, setReportStatus] = useState("");
  const [generating, setGenerating] = useState(false);
  const [batchReports, setBatchReports] = useState<GeneratedReport[]>([]);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/reports").then((r) => r.json()),
    ])
      .then(([dashboard, reportMeta]) => {
        setData(dashboard);
        setTemplates(reportMeta.templates || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const generateReport = async () => {
    setGenerating(true);
    setReportStatus("Generate report dari Google Sheets context...");
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: reportType, period, year: period, notes }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.warning || payload?.error || "Gagal generate report");
      }
      setReport(payload.report);
      setBatchReports([]);
      setReportStatus(payload.sourceStatus === "degraded" ? `Report dibuat dengan degraded context: ${payload.warning}` : "Report berhasil dibuat dari Google Sheets live context.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setReportStatus(`Gagal: ${message}`);
    } finally {
      setGenerating(false);
    }
  };

  const generateAllReports = async () => {
    setGenerating(true);
    setReportStatus("Generate paket semua report otomatis...");
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_all", period, notes }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.warning || payload?.error || "Gagal generate paket report");
      }
      setBatchReports(payload.reports || []);
      setReport(payload.reports?.[0] || null);
      setReportStatus(payload.sourceStatus === "degraded" ? `Paket ${payload.summary?.totalReports || 0} report dibuat dengan degraded context: ${payload.warning}` : `Paket ${payload.summary?.totalReports || 0} report berhasil dibuat dari Google Sheets live context.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setReportStatus(`Gagal: ${message}`);
    } finally {
      setGenerating(false);
    }
  };

  const downloadCurrentReport = () => {
    if (!report?.content) return;
    const filename = `systemswi-${slugify(report.type || report.title)}-${slugify(report.period || period)}.md`;
    downloadTextFile(filename, report.content);
    setReportStatus(`Download siap: ${filename}. Simpan file ini ke Drive/Docs setelah review operator.`);
  };

  const downloadAllReports = () => {
    const reportsToExport = batchReports.length > 0 ? batchReports : report ? [report] : [];
    if (reportsToExport.length === 0) return;
    const bundle = reportsToExport
      .map((item) => `<!-- ${item.title} | ${item.period} | ${item.createdAt} -->\n\n${item.content}`)
      .join("\n\n---\n\n");
    const filename = `systemswi-report-bundle-${slugify(period)}.md`;
    downloadTextFile(filename, bundle);
    setReportStatus(`Bundle download siap: ${filename} (${reportsToExport.length} report). Belum ada file yang ditulis ke Google Drive.`);
  };

  const recordMonthlyGcgSnapshot = async () => {
    setGenerating(true);
    setReportStatus("Mencatat snapshot Monthly GCG ke Google Sheets...");
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record_monthly_gcg",
          period,
          notes: notes || "Snapshot dicatat dari halaman Reports; review manusia wajib sebelum distribusi.",
          actor: "systemswi user",
        }),
      });
      const payload = await response.json();
      if (!response.ok || payload.success === false) {
        throw new Error(payload?.warning || payload?.error || "Gagal mencatat Monthly_GCG_Report");
      }
      setReportStatus(`Monthly_GCG_Report tercatat: ${payload.reportLog?.id || "ID TBA"}. Governance audit log ikut ditulis.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setReportStatus(`Gagal mencatat Monthly GCG: ${message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = useCallback(async () => {
    if (!report?.content) return;
    setDownloadingPDF(true);
    try {
      const ok = await downloadReportPDF(report.title || report.type || "report", report.content, report.period || period);
      if (ok) {
        setReportStatus(`PDF berhasil di-export: systemswi-${slugify(report.title || report.type)}-${slugify(report.period || period)}.pdf`);
      } else {
        setReportStatus("Gagal export PDF. Pastikan browser mendukung download.");
      }
    } catch {
      setReportStatus("Gagal export PDF. Silakan coba lagi.");
    } finally {
      setDownloadingPDF(false);
    }
  }, [report, period]);

  const handleDownloadAllPDF = useCallback(async () => {
    const reportsToExport = batchReports.length > 0 ? batchReports : report ? [report] : [];
    if (reportsToExport.length === 0) return;
    setDownloadingPDF(true);
    try {
      let successCount = 0;
      for (const r of reportsToExport) {
        const ok = await downloadReportPDF(r.title || r.type || "report", r.content, r.period || period);
        if (ok) successCount++;
      }
      setReportStatus(`PDF export selesai: ${successCount}/${reportsToExport.length} report berhasil di-export.`);
    } catch {
      setReportStatus("Gagal export beberapa PDF. Silakan coba lagi.");
    } finally {
      setDownloadingPDF(false);
    }
  }, [batchReports, report, period]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">📊 Reports & Financial</h2>
        <p className="text-muted-foreground">Data real-time dari Google Sheets + generator report otomatis untuk direksi.</p>
      </div>

      <RoleGate feature="dashboard">
        <Tabs defaultValue="auto">
          <TabsList className="flex-wrap">
            <TabsTrigger value="auto">Auto Reports</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rekap">Rekap Rekening</TabsTrigger>
            <TabsTrigger value="equity">Equity</TabsTrigger>
            <TabsTrigger value="sukuk">Sukuk</TabsTrigger>
          </TabsList>

          <TabsContent value="auto" className="mt-6 space-y-4">
            <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Auto Report Generator</CardTitle>
                  <CardDescription>Weekly dashboard, monthly financial report, investor update, dan annual report draft berbasis source Google Sheets.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Jenis report</label>
                    <select value={reportType} onChange={(event) => setReportType(event.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                      {templates.map((template) => (
                        <option key={template.type} value={template.type}>{template.name} — {template.cadence}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Periode / tahun</label>
                    <input value={period} onChange={(event) => setPeriod(event.target.value)} placeholder="Minggu 2 Juni 2026 / Juni 2026 / 2026" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Catatan operator</label>
                    <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Insight dari meeting, blocker, next action manual..." rows={5} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button onClick={generateReport} disabled={generating || !period} className="w-full">
                      {generating ? "Generating..." : "Generate Report"}
                    </Button>
                    <Button onClick={generateAllReports} disabled={generating || !period} variant="outline" className="w-full">
                      Generate Semua Report
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button onClick={downloadCurrentReport} disabled={!report?.content} variant="secondary" className="w-full">
                      📝 Download Markdown
                    </Button>
                    <Button onClick={downloadAllReports} disabled={!report?.content && batchReports.length === 0} variant="secondary" className="w-full">
                      📦 Download Bundle
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button onClick={handleDownloadPDF} disabled={!report?.content || downloadingPDF} variant="default" className="w-full">
                      {downloadingPDF ? "⏳ Export..." : "📥 Download PDF"}
                    </Button>
                    <Button onClick={handleDownloadAllPDF} disabled={(!report?.content && batchReports.length === 0) || downloadingPDF} variant="outline" className="w-full">
                      📥 Export Semua PDF
                    </Button>
                  </div>
                  <Button onClick={recordMonthlyGcgSnapshot} disabled={generating || !period} variant="outline" className="w-full">
                    ✅ Catat Snapshot Monthly GCG ke Sheets
                  </Button>
                  <p className="text-xs text-muted-foreground">QA otomatis: membuat weekly, monthly, quarterly investor, dan annual report dalam satu request. Download Markdown/PDF bersifat lokal/browser. Tombol snapshot Monthly GCG menulis ringkasan live ke Monthly_GCG_Report dan Governance_Audit_Log untuk jejak kesiapan laporan.</p>
                  {reportStatus && <p className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">ℹ️ {reportStatus}</p>}
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Saldo Bank</CardTitle></CardHeader>
                    <CardContent>{loading ? <Skeleton className="h-8 w-28" /> : <div className="text-xl font-bold">{formatCurrency(data?.totalSaldoAkhir || 0)}</div>}</CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Modal Disetor</CardTitle></CardHeader>
                    <CardContent>{loading ? <Skeleton className="h-8 w-28" /> : <div className="text-xl font-bold">{formatCurrency(data?.totalSudahSetor || 0)}</div>}</CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Sisa Modal</CardTitle></CardHeader>
                    <CardContent>{loading ? <Skeleton className="h-8 w-28" /> : <div className="text-xl font-bold text-red-600">{formatCurrency(data?.totalSisaKewajiban || 0)}</div>}</CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Source</CardTitle></CardHeader>
                    <CardContent><div className="text-xl font-bold">{data?.sourceStatus || "live"}</div></CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>{report?.title || "Preview report"}</CardTitle>
                    <CardDescription>{report ? `Periode ${report.period} • ${report.createdAt}` : "Klik Generate Report untuk membuat draft markdown internal."}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {batchReports.length > 0 && (
                      <div className="mb-4 grid gap-2 md:grid-cols-4">
                        {batchReports.map((item) => (
                          <button key={item.id} onClick={() => setReport(item)} className="rounded-lg border bg-background p-3 text-left text-sm hover:border-primary">
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs text-muted-foreground">{item.period}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    {report ? (
                      <pre className="max-h-[620px] overflow-auto whitespace-pre-wrap rounded-xl border bg-muted/50 p-4 text-sm leading-relaxed">{report.content}</pre>
                    ) : (
                      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                        Report otomatis akan menampilkan executive snapshot, finance, event commercial, operations, dan catatan operator tanpa mengarang data.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Saldo Bank</CardTitle></CardHeader>
                <CardContent>{loading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold text-green-600">{formatCurrency(data?.totalSaldoAkhir || 0)}</div>}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Modal Terkumpul</CardTitle></CardHeader>
                <CardContent>{loading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold">{formatCurrency(data?.totalSudahSetor || 0)}</div>}<p className="text-xs text-muted-foreground">{data?.totalSetoranPercent?.toFixed(1) || 0}% dari target</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pemegang Saham</CardTitle></CardHeader>
                <CardContent>{loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{data?.shareholders?.length || 0}</div>}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Sukuk</CardTitle></CardHeader>
                <CardContent>{loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{data?.sukukInfo?.status || "TBA"}</div>}</CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rekap" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Rekap Rekening Koran</CardTitle>
                <CardDescription>Data 8 bulan terakhir dari Google Sheets</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div> : data?.rekapData?.length > 0 ? (
                  <div className="rounded-md border overflow-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Bulan</TableHead><TableHead>Akun</TableHead><TableHead>Periode</TableHead><TableHead className="text-right">Saldo Awal</TableHead><TableHead className="text-right">Masuk</TableHead><TableHead className="text-right">Keluar</TableHead><TableHead className="text-right">Saldo Akhir</TableHead></TableRow></TableHeader>
                      <TableBody>{data.rekapData.map((row, i) => <TableRow key={i}><TableCell className="font-medium">{row.bulan}</TableCell><TableCell>{row.akun}</TableCell><TableCell className="text-xs">{row.periode}</TableCell><TableCell className="text-right text-xs">{row.saldoAwal}</TableCell><TableCell className="text-right text-green-600 text-xs">{row.totalMasuk}</TableCell><TableCell className="text-right text-red-600 text-xs">{row.totalKeluar}</TableCell><TableCell className="text-right font-medium text-xs">{row.saldoAkhir}</TableCell></TableRow>)}</TableBody>
                    </Table>
                  </div>
                ) : <p className="text-muted-foreground text-center py-8">Tidak ada data rekap rekening</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pemegang Saham</CardTitle>
                <CardDescription>Modal ditempatkan: {formatCurrency(data?.totalModalDitempatkan || 0)} | Terkumpul: {formatCurrency(data?.totalSudahSetor || 0)} | Sisa: {formatCurrency(data?.totalSisaKewajiban || 0)}</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div> : (
                  <div className="grid gap-4 md:grid-cols-3">
                    {data?.shareholders?.map((sh, i) => <div key={i} className="p-4 border rounded-lg"><div className="flex justify-between items-start mb-2"><div><h4 className="font-semibold">{sh.nama}</h4><span className="text-xs text-muted-foreground">{sh.persen} • {sh.jumlahSaham} saham</span></div><span className={`text-xs px-2 py-1 rounded ${sh.progress >= 100 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{sh.progress.toFixed(1)}%</span></div><div className="space-y-1 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Kewajiban:</span><span>{formatCurrency(sh.kewajiban)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Disetor:</span><span className="text-green-600">{formatCurrency(sh.sudahSetor)}</span></div><div className="flex justify-between border-t pt-1"><span className="font-medium">Sisa:</span><span className="font-bold text-red-600">{formatCurrency(sh.sisaKewajiban ?? (sh.kewajiban - sh.sudahSetor))}</span></div></div><div className="mt-3"><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(sh.progress, 100)}%` }} /></div></div></div>)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sukuk" className="mt-6">
            <Card>
              <CardHeader><CardTitle>Info Sukuk</CardTitle><CardDescription>Status: {data?.sukukInfo?.status || "TBA"}</CardDescription></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-3 border rounded"><div className="text-xs text-muted-foreground">Nilai Sukuk</div><div className="font-bold">{data?.sukukInfo?.nilai || "TBA"}</div></div>
                  <div className="p-3 border rounded"><div className="text-xs text-muted-foreground">Akad</div><div className="font-bold">{data?.sukukInfo?.akad || "TBA"}</div></div>
                  <div className="p-3 border rounded"><div className="text-xs text-muted-foreground">Nisbah</div><div className="font-bold">{data?.sukukInfo?.nisbah || "TBA"}</div></div>
                  <div className="p-3 border rounded"><div className="text-xs text-muted-foreground">Yield</div><div className="font-bold">{data?.sukukInfo?.yield || "TBA"}</div></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </RoleGate>
    </div>
  );
}
