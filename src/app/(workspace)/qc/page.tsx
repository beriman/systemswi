"use client";

import { FormEvent, useEffect, useMemo, useState, useCallback } from "react";
import { ClipboardCheck, BarChart3, Package, FileText, Plus, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type QcResult = {
  id: string;
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

type QcSummary = {
  total: number;
  passed: number;
  failed: number;
  conditional: number;
  passRate: number;
};

type ChecklistCategory = {
  name: string;
  description: string;
  maxScore: number;
};

type ChecklistTemplate = {
  title: string;
  categories: ChecklistCategory[];
  gradingRules: { pass: string; conditional: string; fail: string };
};

type BatchInfo = {
  batchCode: string;
  product: string;
  date: string;
  qcStatus: string;
  inspector: string;
};

const statusBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  Pass: "success",
  Conditional: "warning",
  Fail: "destructive",
};

const statusLabel: Record<string, string> = {
  Pass: "✅ Pass",
  Conditional: "⚠️ Conditional",
  Fail: "❌ Fail",
};

function ScoreInput({ label, value, onChange, description }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  description?: string;
}) {
  return (
    <div>
      <Label>{label} <span className="text-muted-foreground text-xs">({description})</span></Label>
      <div className="flex items-center gap-2 mt-1">
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1"
        />
        <span className="w-8 text-center font-bold text-lg">{value}</span>
      </div>
    </div>
  );
}

export default function QcPage() {
  const [results, setResults] = useState<QcResult[]>([]);
  const [summary, setSummary] = useState<QcSummary | null>(null);
  const [checklist, setChecklist] = useState<ChecklistTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBatch, setFilterBatch] = useState("");

  // QC Form state
  const [showQcForm, setShowQcForm] = useState(false);
  const [batchCode, setBatchCode] = useState("");
  const [productionId, setProductionId] = useState("");
  const [inspector, setInspector] = useState("HemuHemu/OWL");
  const [aromaScore, setAromaScore] = useState(7);
  const [warnaScore, setWarnaScore] = useState(7);
  const [kejernihanScore, setKejernihanScore] = useState(7);
  const [packagingScore, setPackagingScore] = useState(7);
  const [sealIntegrityScore, setSealIntegrityScore] = useState(7);
  const [qcNotes, setQcNotes] = useState("");

  // Batch tracking
  const [batchSearch, setBatchSearch] = useState("");
  const [batchHistory, setBatchHistory] = useState<QcResult[] | null>(null);
  const [batchCodeSearch, setBatchCodeSearch] = useState("");

  const overallScore = useMemo(() => {
    const scores = [aromaScore, warnaScore, kejernihanScore, packagingScore, sealIntegrityScore];
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
  }, [aromaScore, warnaScore, kejernihanScore, packagingScore, sealIntegrityScore]);

  const calcStatus = (score: number) => {
    if (score >= 7) return "Pass";
    if (score >= 5) return "Conditional";
    return "Fail";
  };

  const loadQcData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterBatch) params.set("batch", filterBatch);
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/qc?${params}`, { cache: "no-store" });
      const json = await res.json();
      setResults(json.results || []);
      setSummary(json.summary || { total: 0, passed: 0, failed: 0, conditional: 0, passRate: 0 });
    } catch (error) {
      setMessage({ type: "error", text: `❌ Gagal load QC data: ${String(error)}` });
    } finally {
      setLoading(false);
    }
  }, [filterBatch, filterStatus]);

  const loadChecklist = useCallback(async () => {
    try {
      const res = await fetch("/api/qc/checklist", { cache: "no-store" });
      const json = await res.json();
      setChecklist(json.template || null);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadQcData();
    loadChecklist();
  }, [loadQcData, loadChecklist]);

  // Build batch tracking data from results
  const batchTracking = useMemo(() => {
    const batchMap = new Map<string, BatchInfo>();
    results.forEach((r) => {
      if (!batchMap.has(r.batchCode) || r.date > batchMap.get(r.batchCode)!.date) {
        batchMap.set(r.batchCode, {
          batchCode: r.batchCode,
          product: r.productionId || "—",
          date: r.date,
          qcStatus: r.status,
          inspector: r.inspector,
        });
      }
    });
    return Array.from(batchMap.values()).filter((b) => {
      if (batchSearch) {
        return b.batchCode.toLowerCase().includes(batchSearch.toLowerCase()) ||
          b.product.toLowerCase().includes(batchSearch.toLowerCase());
      }
      return true;
    });
  }, [results, batchSearch]);

  async function handleSubmitQc(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/qc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit-qc",
          batchCode,
          productionId,
          inspector,
          aromaScore,
          warnaScore,
          kejernihanScore,
          packagingScore,
          sealIntegrityScore,
          notes: qcNotes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal submit QC");
      setMessage({ type: "success", text: `✅ QC submitted: ${json.result?.id} — Overall: ${json.result?.overallScore} (${json.result?.status})` });
      setShowQcForm(false);
      // Reset form
      setBatchCode("");
      setProductionId("");
      setAromaScore(7);
      setWarnaScore(7);
      setKejernihanScore(7);
      setPackagingScore(7);
      setSealIntegrityScore(7);
      setQcNotes("");
      await loadQcData();
    } catch (error) {
      setMessage({ type: "error", text: `❌ ${String(error)}` });
    } finally {
      setSaving(false);
    }
  }

  async function handleSeed() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/qc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal seed data");
      setMessage({ type: "success", text: `✅ Seeded ${json.seeded} QC results` });
      await loadQcData();
    } catch (error) {
      setMessage({ type: "error", text: `❌ ${String(error)}` });
    } finally {
      setSaving(false);
    }
  }

  async function loadBatchHistory(code: string) {
    setBatchCodeSearch(code);
    try {
      const res = await fetch(`/api/qc/batch/${encodeURIComponent(code)}`, { cache: "no-store" });
      const json = await res.json();
      setBatchHistory(json.results || []);
    } catch {
      setBatchHistory([]);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-7 w-7" />
            Quality Control
          </h1>
          <p className="text-muted-foreground">Sistem quality control untuk produksi parfum</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadQcData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleSeed} disabled={saving}>
            🌱 Seed Data
          </Button>
          <Dialog open={showQcForm} onOpenChange={setShowQcForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New QC Check
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>QC Checklist — New Inspection</DialogTitle>
                <DialogDescription>Isi skor untuk setiap parameter QC (1-10)</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitQc} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="qc-batch">Batch Code</Label>
                    <Input id="qc-batch" value={batchCode} onChange={(e) => setBatchCode(e.target.value)} required placeholder="BATCH-001" />
                  </div>
                  <div>
                    <Label htmlFor="qc-prod">Production ID</Label>
                    <Input id="qc-prod" value={productionId} onChange={(e) => setProductionId(e.target.value)} placeholder="PROD-001" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="qc-inspector">Inspector</Label>
                  <Input id="qc-inspector" value={inspector} onChange={(e) => setInspector(e.target.value)} />
                </div>

                <div className="space-y-3 border rounded-lg p-4">
                  <h3 className="font-semibold text-sm">QC Scores (1-10)</h3>
                  <ScoreInput label="Aroma" value={aromaScore} onChange={setAromaScore} description="Kesesuaian aroma" />
                  <ScoreInput label="Warna" value={warnaScore} onChange={setWarnaScore} description="Konsistensi warna" />
                  <ScoreInput label="Kejernihan" value={kejernihanScore} onChange={setKejernihanScore} description="Kejernihan cairan" />
                  <ScoreInput label="Packaging" value={packagingScore} onChange={setPackagingScore} description="Kualitas packaging" />
                  <ScoreInput label="Seal Integrity" value={sealIntegrityScore} onChange={setSealIntegrityScore} description="Kekedapan segel" />
                </div>

                <div className="bg-muted rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">Overall Score</span>
                    <p className="text-2xl font-bold">{overallScore}</p>
                  </div>
                  <Badge variant={statusBadgeVariant[calcStatus(overallScore)]} className="text-lg px-4 py-1">
                    {calcStatus(overallScore)}
                  </Badge>
                </div>

                <div>
                  <Label htmlFor="qc-notes">Notes</Label>
                  <Textarea id="qc-notes" value={qcNotes} onChange={(e) => setQcNotes(e.target.value)} rows={2} placeholder="Catatan tambahan..." />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowQcForm(false)}>Batal</Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Menyimpan..." : "Submit QC"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard"><BarChart3 className="h-4 w-4 mr-2" />Dashboard</TabsTrigger>
          <TabsTrigger value="checklist"><ClipboardCheck className="h-4 w-4 mr-2" />QC Checklist</TabsTrigger>
          <TabsTrigger value="tracking"><Package className="h-4 w-4 mr-2" />Batch Tracking</TabsTrigger>
          <TabsTrigger value="reports"><FileText className="h-4 w-4 mr-2" />QC Reports</TabsTrigger>
        </TabsList>

        {/* Tab 1: Dashboard */}
        <TabsContent value="dashboard" className="space-y-4">
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total QC</p>
                  <p className="text-3xl font-bold">{summary.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Pass Rate</p>
                  <p className="text-3xl font-bold text-green-600">{summary.passRate}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Passed</p>
                  <p className="text-3xl font-bold text-green-600">{summary.passed}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Conditional</p>
                  <p className="text-3xl font-bold text-yellow-600">{summary.conditional}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-3xl font-bold text-red-600">{summary.failed}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Recent QC Results</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : results.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Belum ada QC results. Klik "Seed Data" untuk menambahkan data awal.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Inspector</TableHead>
                      <TableHead className="text-center">Aroma</TableHead>
                      <TableHead className="text-center">Warna</TableHead>
                      <TableHead className="text-center">Jernih</TableHead>
                      <TableHead className="text-center">Package</TableHead>
                      <TableHead className="text-center">Seal</TableHead>
                      <TableHead className="text-center">Overall</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Follow-up</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.slice(-10).reverse().map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.id}</TableCell>
                        <TableCell className="font-medium">{r.batchCode}</TableCell>
                        <TableCell>{r.date}</TableCell>
                        <TableCell>{r.inspector}</TableCell>
                        <TableCell className="text-center">{r.aromaScore}</TableCell>
                        <TableCell className="text-center">{r.warnaScore}</TableCell>
                        <TableCell className="text-center">{r.kejernihanScore}</TableCell>
                        <TableCell className="text-center">{r.packagingScore}</TableCell>
                        <TableCell className="text-center">{r.sealIntegrityScore}</TableCell>
                        <TableCell className="text-center font-bold">{r.overallScore}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant[r.status] || "default"}>
                            {statusLabel[r.status] || r.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{r.followUpRequired === "Yes" ? "⚠️ Yes" : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: QC Checklist */}
        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>QC Checklist Template</CardTitle>
              <CardDescription>Parameter evaluasi quality control untuk produksi parfum</CardDescription>
            </CardHeader>
            <CardContent>
              {checklist ? (
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4">
                    <h3 className="font-semibold mb-2">{checklist.title}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div className="bg-green-100 text-green-800 rounded px-3 py-1">
                        <strong>Pass:</strong> {checklist.gradingRules.pass}
                      </div>
                      <div className="bg-yellow-100 text-yellow-800 rounded px-3 py-1">
                        <strong>Conditional:</strong> {checklist.gradingRules.conditional}
                      </div>
                      <div className="bg-red-100 text-red-800 rounded px-3 py-1">
                        <strong>Fail:</strong> {checklist.gradingRules.fail}
                      </div>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parameter</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead className="text-center">Max Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {checklist.categories.map((cat) => (
                        <TableRow key={cat.name}>
                          <TableCell className="font-medium">{cat.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{cat.description}</TableCell>
                          <TableCell className="text-center">{cat.maxScore}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex justify-end">
                    <Button onClick={() => setShowQcForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New QC Inspection
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Loading checklist template...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Batch Tracking */}
        <TabsContent value="tracking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Tracking</CardTitle>
              <CardDescription>Status QC per batch produksi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Cari batch atau produk..."
                  value={batchSearch}
                  onChange={(e) => setBatchSearch(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              {batchTracking.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Tidak ada batch data. Seed data terlebih dahulu.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Code</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>QC Status</TableHead>
                      <TableHead>Inspector</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchTracking.map((b) => (
                      <TableRow key={b.batchCode}>
                        <TableCell className="font-medium font-mono">{b.batchCode}</TableCell>
                        <TableCell>{b.product}</TableCell>
                        <TableCell>{b.date}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant[b.qcStatus] || "default"}>
                            {statusLabel[b.qcStatus] || b.qcStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{b.inspector}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => {
                            loadBatchHistory(b.batchCode);
                            setActiveTab("reports");
                          }}>
                            View History
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: QC Reports */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>QC Reports — Batch History</CardTitle>
              <CardDescription>Detail QC per batch dan historical trend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Masukkan batch code..."
                  value={batchCodeSearch}
                  onChange={(e) => setBatchCodeSearch(e.target.value)}
                  className="max-w-sm"
                />
                <Button variant="outline" onClick={() => batchCodeSearch && loadBatchHistory(batchCodeSearch)}>
                  Search
                </Button>
              </div>

              {batchHistory === null ? (
                <p className="text-muted-foreground text-center py-8">Masukkan batch code untuk melihat history QC.</p>
              ) : batchHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Tidak ada QC history untuk batch ini.</p>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4">
                    <h3 className="font-semibold">Batch: {batchHistory[0]?.batchCode}</h3>
                    <p className="text-sm text-muted-foreground">
                      Total Inspections: {batchHistory.length} | Latest Status: {batchHistory[batchHistory.length - 1]?.status} | Latest Overall: {batchHistory[batchHistory.length - 1]?.overallScore}
                    </p>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>QC ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Inspector</TableHead>
                        <TableHead className="text-center">Aroma</TableHead>
                        <TableHead className="text-center">Warna</TableHead>
                        <TableHead className="text-center">Jernih</TableHead>
                        <TableHead className="text-center">Package</TableHead>
                        <TableHead className="text-center">Seal</TableHead>
                        <TableHead className="text-center">Overall</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batchHistory.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-xs">{r.id}</TableCell>
                          <TableCell>{r.date}</TableCell>
                          <TableCell>{r.inspector}</TableCell>
                          <TableCell className="text-center">{r.aromaScore}</TableCell>
                          <TableCell className="text-center">{r.warnaScore}</TableCell>
                          <TableCell className="text-center">{r.kejernihanScore}</TableCell>
                          <TableCell className="text-center">{r.packagingScore}</TableCell>
                          <TableCell className="text-center">{r.sealIntegrityScore}</TableCell>
                          <TableCell className="text-center font-bold">{r.overallScore}</TableCell>
                          <TableCell>
                            <Badge variant={statusBadgeVariant[r.status] || "default"}>
                              {statusLabel[r.status] || r.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{r.notes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => window.print()}>
                      🖨️ Print Report
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
