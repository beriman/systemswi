"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

type Step = {
  id: string;
  label: string;
  description: string;
  status: "ready" | "attention" | "blocked" | "draft";
  source: string;
  metric: string;
  metricValue: number | string;
  nextAction: string;
  href: string;
};

type WorkflowLogEntry = {
  id: string;
  timestamp: string;
  stepId: string;
  stepLabel: string;
  action: string;
  reference: string;
  status: string;
  detail: string;
};

type OperationsResponse = {
  source: string;
  sourceStatus?: "degraded" | "blocked" | "live";
  warning?: string;
  generatedAt: string;
  summary: {
    totalSteps: number;
    ready: number;
    attention: number;
    blocked: number;
    draft: number;
    stockAlerts: number;
    openPo: number;
    qcPending: number;
    productionRows: number;
    salesRows: number;
    customerRows: number;
  };
  steps: Step[];
  workflowLog: WorkflowLogEntry[];
  crossDivisionKpis: Array<{
    id: string;
    division: string;
    owner: string;
    health: string;
    primaryMetric: string;
    primaryValue: number | string;
    secondaryMetric: string;
    secondaryValue: number | string;
    nextAction: string;
    href: string;
  }>;
  weeklyCadence: Array<{
    id: string;
    agenda: string;
    owner: string;
    cadence: string;
    prepSource: string;
    output: string;
    href: string;
  }>;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  ready: { label: "Ready", color: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-500" },
  attention: { label: "Perlu Perhatian", color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  blocked: { label: "Blocked", color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
  draft: { label: "Draft / No Data", color: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" },
};

const STEP_ICONS: Record<string, string> = {
  po: "🧾",
  receive: "📦",
  inventory: "📊",
  produce: "🏭",
  compliance: "✅",
  sell: "💰",
  report: "📈",
};

function formatTimestamp(ts: string) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return ts;
  }
}

export default function WorkflowPage() {
  const [data, setData] = useState<OperationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);
  const [executeResult, setExecuteResult] = useState<{ success: boolean; detail: string } | null>(null);
  const [runningFull, setRunningFull] = useState(false);
  const [fullResult, setFullResult] = useState<{ success: boolean; steps: Array<{ stepId: string; stepLabel: string; success: boolean; detail: string }> } | null>(null);

  const fetchWorkflow = useCallback(async () => {
    try {
      const res = await fetch("/api/operations", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflow();
    const interval = setInterval(fetchWorkflow, 30000);
    return () => clearInterval(interval);
  }, [fetchWorkflow]);

  const handleExecuteStep = async (stepId: string) => {
    setExecuting(stepId);
    setExecuteResult(null);
    try {
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "execute_step", stepId, reference: `manual-${Date.now()}` }),
      });
      const json = await res.json();
      setExecuteResult({ success: json.result?.success ?? false, detail: json.result?.detail || json.error || "Unknown result" });
      fetchWorkflow();
    } catch (err) {
      setExecuteResult({ success: false, detail: String(err) });
    } finally {
      setExecuting(null);
    }
  };

  const handleRunFullWorkflow = async () => {
    setRunningFull(true);
    setFullResult(null);
    try {
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run_full_workflow" }),
      });
      const json = await res.json();
      setFullResult({ success: json.success, steps: json.steps || [] });
      fetchWorkflow();
    } catch (err) {
      setFullResult({ success: false, steps: [] });
    } finally {
      setRunningFull(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">🔄 End-to-End Workflow</h2>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700 font-medium">Gagal memuat data workflow</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <Button onClick={fetchWorkflow} variant="outline" size="sm" className="mt-3">Coba Lagi</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const attentionSteps = data.steps.filter((s) => s.status === "attention");
  const readySteps = data.steps.filter((s) => s.status === "ready");
  const draftSteps = data.steps.filter((s) => s.status === "draft");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">🔄 End-to-End Workflow</h2>
          <p className="text-muted-foreground text-sm">
            Pipeline operasional SWI: PO → Receive → Inventory → Produksi → Compliance → Jual → Report
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Source: {data.source} | Status: {data.sourceStatus || "live"} | Updated: {formatTimestamp(data.generatedAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchWorkflow} variant="outline" size="sm">🔄 Refresh</Button>
          <Button
            onClick={handleRunFullWorkflow}
            disabled={runningFull || data.sourceStatus === "degraded"}
            size="sm"
            className="bg-primary"
          >
            {runningFull ? "⏳ Running..." : "🚀 Run Full Workflow"}
          </Button>
        </div>
      </div>

      {/* Degraded banner */}
      {data.warning && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-3">
            <p className="text-amber-700 text-sm font-medium">⚠️ {data.warning}</p>
          </CardContent>
        </Card>
      )}

      {/* Execute result toast */}
      {executeResult && (
        <Card className={`border ${executeResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <CardContent className="py-3 flex items-center justify-between">
            <p className={`text-sm font-medium ${executeResult.success ? "text-green-700" : "text-red-700"}`}>
              {executeResult.success ? "✅" : "❌"} {executeResult.detail}
            </p>
            <Button variant="ghost" size="sm" onClick={() => setExecuteResult(null)}>✕</Button>
          </CardContent>
        </Card>
      )}

      {/* Full workflow result */}
      {fullResult && (
        <Card className={`border ${fullResult.success ? "border-green-200" : "border-amber-200"}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {fullResult.success ? "✅ Full Workflow Selesai" : "⚠️ Full Workflow Selesai dengan Error"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {fullResult.steps.map((s) => (
                <div key={s.stepId} className="flex items-center gap-2 text-sm">
                  <span>{s.success ? "✅" : "❌"}</span>
                  <span className="font-medium">{s.stepLabel}</span>
                  <span className="text-muted-foreground">— {s.detail.slice(0, 80)}{s.detail.length > 80 ? "…" : ""}</span>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setFullResult(null)} className="mt-2">Tutup</Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Summary */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Steps</CardDescription>
            <CardTitle className="text-3xl">{data.summary.totalSteps}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">7 tahap operasional</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ready</CardDescription>
            <CardTitle className="text-3xl text-green-600">{data.summary.ready}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">{readySteps.map((s) => s.label).join(", ") || "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Perlu Perhatian</CardDescription>
            <CardTitle className="text-3xl text-amber-600">{data.summary.attention}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">{attentionSteps.map((s) => s.label).join(", ") || "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Draft / No Data</CardDescription>
            <CardTitle className="text-3xl text-gray-500">{data.summary.draft}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">{draftSteps.map((s) => s.label).join(", ") || "—"}</CardContent>
        </Card>
      </div>

      {/* Main content */}
      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline Steps</TabsTrigger>
          <TabsTrigger value="log">Workflow Log</TabsTrigger>
          <TabsTrigger value="kpi">Cross-Division KPI</TabsTrigger>
          <TabsTrigger value="cadence">Weekly Cadence</TabsTrigger>
        </TabsList>

        {/* Pipeline Steps */}
        <TabsContent value="pipeline" className="space-y-3 mt-4">
          {data.steps.map((step, i) => {
            const cfg = STATUS_CONFIG[step.status] || STATUS_CONFIG.draft;
            return (
              <Card key={step.id} className="transition-all hover:shadow-md">
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Step number */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
                        step.status === "attention" ? "bg-amber-500" : step.status === "ready" ? "bg-green-500" : step.status === "blocked" ? "bg-red-500" : "bg-gray-400"
                      }`}>
                        {STEP_ICONS[step.id] || i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-base">{step.label}</span>
                          <Badge className={`border text-xs ${cfg.color}`}>{cfg.label}</Badge>
                          <Badge variant="outline" className="text-xs">{step.source}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>📊 {step.metric}: <strong className="text-foreground">{step.metricValue}</strong></span>
                          <span className="hidden md:inline">→ {step.nextAction}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a href={step.href} onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm">Buka →</Button>
                      </a>
                      <Button
                        size="sm"
                        variant="default"
                        disabled={executing === step.id || data.sourceStatus === "degraded"}
                        onClick={() => handleExecuteStep(step.id)}
                      >
                        {executing === step.id ? "⏳" : "▶️"} Execute
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Workflow Log */}
        <TabsContent value="log" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📋 Workflow Action Log</CardTitle>
              <CardDescription>Riwayat eksekusi workflow terbaru dari Google Sheets</CardDescription>
            </CardHeader>
            <CardContent>
              {data.workflowLog.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-4xl mb-2">📭</p>
                  <p>Belum ada workflow log.</p>
                  <p className="text-xs mt-1">Jalankan step atau full workflow untuk membuat log entry.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {data.workflowLog.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        entry.status === "executed" ? "bg-green-500" : entry.status === "failed" ? "bg-red-500" : "bg-gray-400"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{entry.stepLabel}</span>
                          <Badge variant="outline" className="text-[10px]">{entry.action}</Badge>
                          <Badge variant={entry.status === "executed" ? "default" : "destructive"} className="text-[10px]">
                            {entry.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{entry.detail}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                          <span>🕐 {formatTimestamp(entry.timestamp)}</span>
                          <span>🔗 {entry.reference}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cross-Division KPI */}
        <TabsContent value="kpi" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {data.crossDivisionKpis.map((kpi) => (
              <Card key={kpi.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{kpi.division}</CardTitle>
                    <Badge className={`border text-xs ${STATUS_CONFIG[kpi.health]?.color || "bg-gray-100 text-gray-600"}`}>
                      {STATUS_CONFIG[kpi.health]?.label || kpi.health}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">Owner: {kpi.owner}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{kpi.primaryMetric}</span>
                    <span className="font-semibold">{kpi.primaryValue}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{kpi.secondaryMetric}</span>
                    <span className="font-medium">{kpi.secondaryValue}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">📌 {kpi.nextAction}</p>
                  </div>
                  <a href={kpi.href}>
                    <Button variant="ghost" size="sm" className="w-full mt-1">Buka Modul →</Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Weekly Cadence */}
        <TabsContent value="cadence" className="mt-4">
          <div className="space-y-3">
            {data.weeklyCadence.map((item) => (
              <Card key={item.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{item.agenda}</span>
                        <Badge variant="outline" className="text-xs">{item.owner}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">🕐 {item.cadence}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">📋 Prep: {item.prepSource}</p>
                      <p className="text-xs text-muted-foreground">📤 Output: {item.output}</p>
                    </div>
                    <a href={item.href} className="shrink-0">
                      <Button variant="outline" size="sm">Buka →</Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Flow Diagram */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 Flow Diagram</CardTitle>
          <CardDescription>Alur data dari procurement sampai dokumentasi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex items-center gap-2 min-w-[800px] py-4 px-2">
              {data.steps.map((step, i) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center gap-1 min-w-[90px]">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      step.status === "attention" ? "bg-amber-500" : step.status === "ready" ? "bg-green-500" : step.status === "blocked" ? "bg-red-500" : "bg-gray-400"
                    }`}>
                      {STEP_ICONS[step.id] || i + 1}
                    </div>
                    <div className="text-xs font-medium text-center leading-tight">{step.label}</div>
                    <Badge variant="outline" className="text-[10px]">{step.metricValue}</Badge>
                  </div>
                  {i < data.steps.length - 1 && (
                    <div className="flex items-center mx-1">
                      <div className="w-6 h-0.5 bg-primary/40" />
                      <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[6px] border-l-primary/40" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
