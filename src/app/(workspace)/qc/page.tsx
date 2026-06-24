"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/* ── Types ── */

type QCResult = {
  resultId: string;
  batchCode: string;
  productionId: string;
  date: string;
  inspector: string;
  aromaScore: number;
  warnaScore: number;
  kejernihanScore: number;
  packagingScore: number;
  sealIntegrityScore: number;
  overallScore: number;
  status: string;
  notes: string;
  followUpRequired: string;
};

type QCSummary = {
  total: number;
  passed: number;
  failed: number;
  conditional: number;
  passRate: number;
};

type ChecklistCategory = {
  category: string;
  items: { id: string; category: string; item: string; description: string; type: string; order: number }[];
};

type BatchHistory = {
  batchCode: string;
  summary: { total: number; passed: number; failed: number; conditional: number; avgOverall: number; latestStatus: string };
  data: QCResult[];
};

/* ── Helpers ── */

function statusVariant(s: string): "default" | "destructive" | "outline" | "secondary" {
  const v = s.toLowerCase();
  if (v === "pass") return "default";
  if (v === "fail") return "destructive";
  if (v === "conditional") return "secondary";
  return "outline";
}

function scoreColor(score: number): string {
  if (score >= 7) return "text-green-600";
  if (score >= 5) return "text-amber-600";
  return "text-red-600";
}

/* ── KPI Card ── */

function KpiCard({ title, value, note, accent }: { title: string; value: string; note?: string; accent?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${accent || ""}`}>{value}</div>
        {note && <p className="text-xs text-muted-foreground mt-1">{note}</p>}
      </CardContent>
    </Card>
  );
}

/* ── Main Component ── */

export default function QCPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [summary, setSummary] = useState<QCSummary | null>(null);
  const [qcResults, setQcResults] = useState<QCResult[]>([]);
  const [checklist, setChecklist] = useState<ChecklistCategory[]>([]);
  const [batchHistory, setBatchHistory] = useState<BatchHistory | null>(null);

  // Form state
  const [formBatchCode, setFormBatchCode] = useState("");
  const [formProductionId, setFormProductionId] = useState("");
  const [formInspector, setFormInspector] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formScores, setFormScores] = useState({ aroma: 7, warna: 7, kejernihan: 7, packaging: 7, seal: 7 });
  const [formNotes, setFormNotes] = useState("");
  const [formFollowUp, setFormFollowUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Batch tracking filter
  const [batchSearch, setBatchSearch] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [qcRes, clRes] = await Promise.all([
        fetch("/api/qc", { cache: "no-store" }),
        fetch("/api/qc/checklist", { cache: "no-store" }),
      ]);

      if (qcRes.ok) {
        const qcJson = await qcRes.json();
        setSummary(qcJson.summary || null);
        setQcResults(qcJson.data || []);
      }
      if (clRes.ok) {
        const clJson = await clRes.json();
        setChecklist(clJson.categories || []);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Auto-calculate overall
  const overallScore = Math.round(
    ((formScores.aroma + formScores.warna + formScores.kejernihan + formScores.packaging + formScores.seal) / 5) * 100
  ) / 100;
  const overallStatus = overallScore >= 7 ? "Pass" : overallScore >= 5 ? "Conditional" : "Fail";

  // Submit QC form
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formBatchCode) {
      setError("Batch Code wajib diisi");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSubmitSuccess(null);
    try {
      const res = await fetch("/api/qc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchCode: formBatchCode,
          productionId: formProductionId,
          inspector: formInspector,
          date: formDate,
          aromaScore: formScores.aroma,
          warnaScore: formScores.warna,
          kejernihanScore: formScores.kejernihan,
          packagingScore: formScores.packaging,
          sealIntegrityScore: formScores.seal,
          notes: formNotes,
          followUpRequired: formFollowUp,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal submit QC");
      setSubmitSuccess(`QC ${json.data?.resultId || ""} berhasil disubmit — Status: ${json.data?.status || overallStatus}`);
      // Reset form
      setFormBatchCode("");
      setFormProductionId("");
      setFormNotes("");
      setFormFollowUp(false);
      setFormScores({ aroma: 7, warna: 7, kejernihan: 7, packaging: 7, seal: 7 });
      await loadDashboard();
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  // Load batch history
  async function loadBatchHistory(code: string) {
    if (!code) return;
    setBatchLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/qc/batch/${encodeURIComponent(code)}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal load batch history");
      const json = await res.json();
      setBatchHistory(json);
    } catch (err) {
      setError(String(err));
    } finally {
      setBatchLoading(false);
    }
  }

  // Seed data handler
  async function handleSeed() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/qc/seed", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal seed data");
      setSubmitSuccess(`Seed: ${json.seeded || 0} data ditambahkan (${json.skipped || 0} sudah ada)`);
      await loadDashboard();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  // Print report
  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">🔬 QC — Quality Control</h2>
          <p className="text-muted-foreground">
            Sistem quality control produksi parfum: checklist, tracking, dan reporting.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSeed} variant="outline" disabled={loading}>
            🌱 Seed Data
          </Button>
          <Button onClick={loadDashboard} disabled={loading} variant="outline">
            {loading ? "Memuat..." : "↻ Refresh"}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
          <CardContent className="py-4 text-red-700 dark:text-red-300 text-sm">{error}</CardContent>
        </Card>
      )}

      {submitSuccess && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
          <CardContent className="py-4 text-green-700 dark:text-green-300 text-sm">{submitSuccess}</CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
          <TabsTrigger value="checklist">✅ QC Checklist</TabsTrigger>
          <TabsTrigger value="tracking">📦 Batch Tracking</TabsTrigger>
          <TabsTrigger value="reports">📋 QC Reports</TabsTrigger>
        </TabsList>

        {/* ── Dashboard Tab ── */}
        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Total QC"
              value={loading ? "..." : String(summary?.total || 0)}
              note="semua batch"
            />
            <KpiCard
              title="Pass Rate"
              value={loading ? "..." : `${summary?.passRate || 0}%`}
              note={`${summary?.passed || 0} passed`}
              accent="text-green-600"
            />
            <KpiCard
              title="Fail Count"
              value={loading ? "..." : String(summary?.failed || 0)}
              note="perlu follow-up"
              accent={summary && summary.failed > 0 ? "text-red-600" : ""}
            />
            <KpiCard
              title="Conditional"
              value={loading ? "..." : String(summary?.conditional || 0)}
              note="review required"
              accent={summary && summary.conditional > 0 ? "text-amber-600" : ""}
            />
          </div>

          {/* Recent QC Results */}
          <Card>
            <CardHeader>
              <CardTitle>Recent QC Results</CardTitle>
              <CardDescription>Hasil QC terbaru</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-32 w-full" />
              ) : qcResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada data QC — klik Seed Data untuk mengisi sample</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Result ID</TableHead>
                        <TableHead>Batch Code</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Inspector</TableHead>
                        <TableHead className="text-right">Overall</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Follow-up</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {qcResults.slice(0, 10).map((r) => (
                        <TableRow key={r.resultId}>
                          <TableCell className="font-mono text-xs">{r.resultId}</TableCell>
                          <TableCell className="font-mono text-xs">{r.batchCode}</TableCell>
                          <TableCell>{r.date}</TableCell>
                          <TableCell>{r.inspector}</TableCell>
                          <TableCell className={`text-right font-semibold ${scoreColor(r.overallScore)}`}>
                            {r.overallScore.toFixed(1)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                          </TableCell>
                          <TableCell>{r.followUpRequired === "Yes" ? "⚠️ Yes" : "No"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── QC Checklist Tab ── */}
        <TabsContent value="checklist" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>QC Checklist Form</CardTitle>
              <CardDescription>Form quality control — isi skor 1-10 per kategori</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Batch info */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Batch Code *</Label>
                    <Input
                      value={formBatchCode}
                      onChange={(e) => setFormBatchCode(e.target.value)}
                      placeholder="BATCH-2026-06-01-AB100"
                      required
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Production ID</Label>
                    <Input
                      value={formProductionId}
                      onChange={(e) => setFormProductionId(e.target.value)}
                      placeholder="PROD-2026-001"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Inspector</Label>
                    <Input
                      value={formInspector}
                      onChange={(e) => setFormInspector(e.target.value)}
                      placeholder="Nama inspector"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">Tanggal QC</Label>
                    <Input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Overall Score: </span>
                      <span className={`text-lg font-bold ${scoreColor(overallScore)}`}>
                        {overallScore.toFixed(1)}
                      </span>
                      <span className="ml-2">
                        <Badge variant={statusVariant(overallStatus)}>{overallStatus}</Badge>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score inputs per category */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Scores (1-10)</h4>
                  {[
                    { key: "aroma" as const, label: "🌸 Aroma Score", desc: "Kesesuaian & kekuatan aroma" },
                    { key: "warna" as const, label: "🎨 Warna Score", desc: "Konsistensi warna & kejernihan visual" },
                    { key: "kejernihan" as const, label: "💧 Kejernihan Score", desc: "Kejernihan cairan, tidak ada partikel" },
                    { key: "packaging" as const, label: "📦 Packaging Score", desc: "Kualitas botol, label, kartu" },
                    { key: "seal" as const, label: "🔒 Seal Integrity Score", desc: "Keutuhan seal & tidak bocor" },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center gap-4">
                      <div className="w-48">
                        <Label className="text-sm font-medium">{label}</Label>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setFormScores((prev) => ({ ...prev, [key]: n }))}
                            className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                              formScores[key] === n
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-accent"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <span className={`text-sm font-bold ${scoreColor(formScores[key])}`}>
                        {formScores[key]}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">Notes</Label>
                  <Textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={3}
                    placeholder="Catatan tambahan, temuan, rekomendasi..."
                  />
                </div>

                {/* Follow-up */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="followUp"
                    checked={formFollowUp}
                    onChange={(e) => setFormFollowUp(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="followUp" className="text-sm">Follow-up Required</Label>
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Menyimpan..." : "🔬 Submit QC Result"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Checklist Template Reference */}
          {checklist.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>QC Checklist Template</CardTitle>
                <CardDescription>Referensi item QC per kategori</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {checklist.map((cat) => (
                    <div key={cat.category} className="space-y-2">
                      <h4 className="font-semibold text-sm">{cat.category}</h4>
                      <ul className="space-y-1">
                        {cat.items.map((item) => (
                          <li key={item.id} className="text-xs text-muted-foreground">
                            • {item.item}: {item.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Batch Tracking Tab ── */}
        <TabsContent value="tracking" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch QC Tracking</CardTitle>
              <CardDescription>Cari riwayat QC per batch code</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  value={batchSearch}
                  onChange={(e) => setBatchSearch(e.target.value)}
                  placeholder="Masukkan batch code..."
                  className="max-w-sm"
                />
                <Button onClick={() => loadBatchHistory(batchSearch)} disabled={batchLoading}>
                  {batchLoading ? "Mencari..." : "🔍 Cari"}
                </Button>
              </div>

              {batchHistory && (
                <div className="space-y-4">
                  {/* Batch summary */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <KpiCard title="Batch" value={batchHistory.batchCode} />
                    <KpiCard title="Total QC" value={String(batchHistory.summary.total)} />
                    <KpiCard
                      title="Latest Status"
                      value={batchHistory.summary.latestStatus}
                      accent={
                        batchHistory.summary.latestStatus === "Pass"
                          ? "text-green-600"
                          : batchHistory.summary.latestStatus === "Fail"
                          ? "text-red-600"
                          : "text-amber-600"
                      }
                    />
                    <KpiCard
                      title="Avg Overall"
                      value={batchHistory.summary.avgOverall.toFixed(1)}
                      accent={scoreColor(batchHistory.summary.avgOverall)}
                    />
                  </div>

                  {/* QC history table */}
                  {batchHistory.data.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Result ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Inspector</TableHead>
                            <TableHead className="text-right">Aroma</TableHead>
                            <TableHead className="text-right">Warna</TableHead>
                            <TableHead className="text-right">Kejernihan</TableHead>
                            <TableHead className="text-right">Packaging</TableHead>
                            <TableHead className="text-right">Seal</TableHead>
                            <TableHead className="text-right">Overall</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {batchHistory.data.map((r) => (
                            <TableRow key={r.resultId}>
                              <TableCell className="font-mono text-xs">{r.resultId}</TableCell>
                              <TableCell>{r.date}</TableCell>
                              <TableCell>{r.inspector}</TableCell>
                              <TableCell className="text-right">{r.aromaScore}</TableCell>
                              <TableCell className="text-right">{r.warnaScore}</TableCell>
                              <TableCell className="text-right">{r.kejernihanScore}</TableCell>
                              <TableCell className="text-right">{r.packagingScore}</TableCell>
                              <TableCell className="text-right">{r.sealIntegrityScore}</TableCell>
                              <TableCell className={`text-right font-semibold ${scoreColor(r.overallScore)}`}>
                                {r.overallScore.toFixed(1)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Tidak ada riwayat QC untuk batch ini</p>
                  )}
                </div>
              )}

              {!batchHistory && (
                <p className="text-sm text-muted-foreground text-center py-8">Masukkan batch code untuk melihat riwayat QC</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── QC Reports Tab ── */}
        <TabsContent value="reports" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={handlePrint} variant="outline">🖨️ Print Report</Button>
          </div>

          {/* All QC Results Report */}
          <Card>
            <CardHeader>
              <CardTitle>QC Report — All Results</CardTitle>
              <CardDescription>Laporan lengkap semua hasil quality control</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : qcResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada data QC</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Result ID</TableHead>
                        <TableHead>Batch Code</TableHead>
                        <TableHead>Production ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Inspector</TableHead>
                        <TableHead className="text-right">Aroma</TableHead>
                        <TableHead className="text-right">Warna</TableHead>
                        <TableHead className="text-right">Kejernihan</TableHead>
                        <TableHead className="text-right">Packaging</TableHead>
                        <TableHead className="text-right">Seal</TableHead>
                        <TableHead className="text-right">Overall</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Follow-up</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {qcResults.map((r) => (
                        <TableRow key={r.resultId}>
                          <TableCell className="font-mono text-xs">{r.resultId}</TableCell>
                          <TableCell className="font-mono text-xs">{r.batchCode}</TableCell>
                          <TableCell className="font-mono text-xs">{r.productionId}</TableCell>
                          <TableCell>{r.date}</TableCell>
                          <TableCell>{r.inspector}</TableCell>
                          <TableCell className="text-right">{r.aromaScore}</TableCell>
                          <TableCell className="text-right">{r.warnaScore}</TableCell>
                          <TableCell className="text-right">{r.kejernihanScore}</TableCell>
                          <TableCell className="text-right">{r.packagingScore}</TableCell>
                          <TableCell className="text-right">{r.sealIntegrityScore}</TableCell>
                          <TableCell className={`text-right font-semibold ${scoreColor(r.overallScore)}`}>
                            {r.overallScore.toFixed(1)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs">{r.notes}</TableCell>
                          <TableCell>{r.followUpRequired === "Yes" ? "⚠️" : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status breakdown */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-green-200 dark:border-green-900">
              <CardHeader>
                <CardTitle className="text-green-700 dark:text-green-400">✅ Pass</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{summary?.passed || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Score &ge; 7.0</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200 dark:border-amber-900">
              <CardHeader>
                <CardTitle className="text-amber-700 dark:text-amber-400">⚠️ Conditional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">{summary?.conditional || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Score 5.0 — 6.99</p>
              </CardContent>
            </Card>
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="text-red-700 dark:text-red-400">❌ Fail</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{summary?.failed || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Score &lt; 5.0</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
