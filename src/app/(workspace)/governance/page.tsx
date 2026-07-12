"use client";

import { useEffect, useState } from "react";
import { RoleGate } from "@/components/auth/role-gate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Score = {
  key: string;
  label: string;
  score: number;
  status: "good" | "watch" | "risk";
  evidence: string;
};

type GovernanceException = {
  type: string;
  severity: string;
  entityId: string;
  description: string;
  amount: number;
  owner: string;
};

type AuditTrailItem = {
  logId: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  amount: number;
  division: string;
  before: string;
  after: string;
  reason: string;
  proofUrl: string;
  sourceModule: string;
};

type DashboardPayload = {
  sourceStatus?: string;
  warning?: string;
  generatedAt?: string;
  overallScore?: number;
  scores?: Score[];
  summary?: {
    expenses?: {
      total: number;
      pendingCount: number;
      pendingAmount: number;
      needsProofCount: number;
      needsProofAmount: number;
      withoutDivisionCount: number;
      largeWithoutApprovalCount: number;
      personalPaidCount: number;
      personalPaidAmount: number;
      personalPaidNotInLedgerCount: number;
    };
    shareholder?: { ledgerRows: number; outstandingDebt: number };
    compliance?: { total: number; open: number; overdue: number; dueSoon: number; completedWithoutProof: number };
    vendor?: { total: number; relatedParty: number; exceptions: number; benchmarkComplete: number };
    audit?: { governanceAuditRows: number };
    monthlyGcgReport?: { total: number; latestPeriod: string; latestGeneratedAt: string; latestStatus: string };
    event?: { events: number; budgetRows: number; overBudgetRows: number; overBudgetWithoutNotes: number };
  };
  exceptions?: GovernanceException[];
  recentAuditTrail?: AuditTrailItem[];
  nextActions?: string[];
};

function rupiah(value: number | undefined): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value || 0);
}

function statusClass(status?: string): string {
  if (status === "good") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "watch") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
}

function severityClass(severity?: string): string {
  if (severity === "high") return "bg-red-100 text-red-700";
  if (severity === "medium") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

export default function GovernancePage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const load = async (showPending = true) => {
    if (showPending) {
      setLoading(true);
      setError("");
    }
    try {
      const response = await fetch("/api/governance/dashboard", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.warning || payload?.error || "Gagal memuat governance dashboard");
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetch("/api/governance/dashboard", { cache: "no-store" })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!response.ok) throw new Error(payload?.warning || payload?.error || "Gagal memuat governance dashboard");
        setData(payload);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoading(false));
  }, []);

  const summary = data?.summary || {};
  const expenses = summary.expenses;
  const compliance = summary.compliance;
  const vendor = summary.vendor;
  const shareholder = summary.shareholder;
  const audit = summary.audit;
  const monthlyGcgReport = summary.monthlyGcgReport;
  const event = summary.event;

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setError("");
    try {
      const { exportElementToPDF } = await import("@/lib/document/pdf-export");
      const ok = await exportElementToPDF("governance-dashboard-print", `governance-tarif-${new Date().toISOString().slice(0, 10)}.pdf`);
      if (!ok) throw new Error("Area governance dashboard tidak ditemukan untuk export PDF.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">⚖️ Governance / TARIF Dashboard</h2>
          <p className="text-muted-foreground">Monitoring GCG dari Google Sheets: transparency, accountability, responsibility, independency, fairness, dan pengecualian etika keuangan.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => load()} disabled={loading} variant="outline">Refresh</Button>
          <Button asChild variant="outline">
            <a href="/api/governance/dashboard?format=csv">Export CSV</a>
          </Button>
          <Button onClick={handleExportPdf} disabled={loading || isExportingPdf} variant="outline">
            {isExportingPdf ? "Exporting PDF..." : "Export PDF"}
          </Button>
        </div>
      </div>

      <RoleGate feature="dashboard">
        <div id="governance-dashboard-print" className="space-y-6 bg-background p-1">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {data?.sourceStatus === "degraded" && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">⚠️ {data.warning || "Google Sheets source degraded. Angka ditampilkan sebagai 0/TBA sampai auth pulih."}</div>}

        <div className="grid gap-4 md:grid-cols-5">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Overall GCG Score</CardTitle>
              <CardDescription>Rata-rata 5 prinsip TARIF</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-14 w-28" /> : <div className="text-5xl font-bold">{data?.overallScore ?? 0}<span className="text-lg text-muted-foreground">/100</span></div>}
              <p className="mt-2 text-xs text-muted-foreground">Generated: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString("id-ID") : "TBA"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Expense Pending</CardTitle></CardHeader>
            <CardContent>{loading ? <Skeleton className="h-8" /> : <><div className="text-2xl font-bold">{expenses?.pendingCount || 0}</div><p className="text-sm text-muted-foreground">{rupiah(expenses?.pendingAmount)}</p></>}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Needs Proof</CardTitle></CardHeader>
            <CardContent>{loading ? <Skeleton className="h-8" /> : <><div className="text-2xl font-bold">{expenses?.needsProofCount || 0}</div><p className="text-sm text-muted-foreground">{rupiah(expenses?.needsProofAmount)}</p></>}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Hutang Pemegang Saham</CardTitle></CardHeader>
            <CardContent>{loading ? <Skeleton className="h-8" /> : <><div className="text-xl font-bold">{rupiah(shareholder?.outstandingDebt)}</div><p className="text-sm text-muted-foreground">{shareholder?.ledgerRows || 0} ledger rows</p></>}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Monthly GCG Report</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8" /> : <><div className="text-2xl font-bold">{monthlyGcgReport?.total || 0}</div><p className="text-sm text-muted-foreground">{monthlyGcgReport?.latestPeriod || "TBA"} • {monthlyGcgReport?.latestStatus || "Belum dicatat"}</p></>}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          {(loading ? [] : data?.scores || []).map((score) => (
            <Card key={score.key}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm">{score.label}</CardTitle>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${statusClass(score.status)}`}>{score.status}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{score.score}</div>
                <p className="mt-2 text-xs text-muted-foreground">{score.evidence}</p>
              </CardContent>
            </Card>
          ))}
          {loading && Array.from({ length: 5 }).map((_, index) => <Card key={index}><CardHeader><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-12" /></CardContent></Card>)}
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Responsibility & Compliance</CardTitle>
              <CardDescription>LKPM, BPJS, pajak, legal, BPOM/Halal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Total register</span><b>{compliance?.total || 0}</b></div>
              <div className="flex justify-between"><span>Open</span><b>{compliance?.open || 0}</b></div>
              <div className="flex justify-between"><span>Due soon</span><b>{compliance?.dueSoon || 0}</b></div>
              <div className="flex justify-between text-amber-600"><span>Completed no proof</span><b>{compliance?.completedWithoutProof || 0}</b></div>
              <div className="flex justify-between text-red-600"><span>Overdue</span><b>{compliance?.overdue || 0}</b></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Independency Vendor</CardTitle>
              <CardDescription>Benchmark dan conflict-of-interest.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Total vendor</span><b>{vendor?.total || 0}</b></div>
              <div className="flex justify-between"><span>Benchmark complete</span><b>{vendor?.benchmarkComplete || 0}</b></div>
              <div className="flex justify-between"><span>Related party</span><b>{vendor?.relatedParty || 0}</b></div>
              <div className="flex justify-between text-amber-600"><span>Exceptions</span><b>{vendor?.exceptions || 0}</b></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Accountability Audit</CardTitle>
              <CardDescription>Approval/reject harus meninggalkan jejak.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Governance audit rows</span><b>{audit?.governanceAuditRows || 0}</b></div>
              <div className="flex justify-between"><span>Large pending approval</span><b>{expenses?.largeWithoutApprovalCount || 0}</b></div>
              <div className="flex justify-between"><span>Without division/COA</span><b>{expenses?.withoutDivisionCount || 0}</b></div>
              <div className="flex justify-between"><span>Personal paid not in ledger</span><b>{expenses?.personalPaidNotInLedgerCount || 0}</b></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Event Closeout Control</CardTitle>
              <CardDescription>Budget vs actual dan catatan post-event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Events</span><b>{event?.events || 0}</b></div>
              <div className="flex justify-between"><span>Budget rows</span><b>{event?.budgetRows || 0}</b></div>
              <div className="flex justify-between"><span>Over-budget rows</span><b>{event?.overBudgetRows || 0}</b></div>
              <div className="flex justify-between text-red-600"><span>Over-budget no notes</span><b>{event?.overBudgetWithoutNotes || 0}</b></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Etika Keuangan Exceptions</CardTitle>
            <CardDescription>Tidak dibuat-buat; jika tidak ada data maka tampil 0/Belum dicatat.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-28" /> : (data?.exceptions?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground"><tr><th className="py-2">Type</th><th>Entity</th><th>Description</th><th>Owner</th><th>Amount</th><th>Severity</th></tr></thead>
                  <tbody>
                    {data.exceptions.slice(0, 20).map((item, index) => (
                      <tr key={`${item.type}-${item.entityId}-${index}`} className="border-t">
                        <td className="py-2 font-medium">{item.type}</td>
                        <td>{item.entityId || "TBA"}</td>
                        <td>{item.description || "Belum dicatat"}</td>
                        <td>{item.owner || "Belum dicatat"}</td>
                        <td>{rupiah(item.amount)}</td>
                        <td><span className={`rounded-full px-2 py-0.5 text-xs ${severityClass(item.severity)}`}>{item.severity}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-sm text-muted-foreground">Tidak ada exception dari data yang terbaca saat ini.</p>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Governance Audit Trail</CardTitle>
            <CardDescription>Jejak approve/reject dan aksi GCG manusia dari Governance_Audit_Log.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-28" /> : (data?.recentAuditTrail?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground"><tr><th className="py-2">Waktu</th><th>Actor</th><th>Action</th><th>Entity</th><th>Status</th><th>Amount</th><th>Module</th></tr></thead>
                  <tbody>
                    {data.recentAuditTrail.slice(0, 10).map((item) => (
                      <tr key={item.logId || `${item.timestamp}-${item.entityId}`} className="border-t">
                        <td className="py-2 whitespace-nowrap">{item.timestamp && item.timestamp !== "TBA" ? new Date(item.timestamp).toLocaleString("id-ID") : "TBA"}</td>
                        <td>{item.actor || "Belum dicatat"}</td>
                        <td className="font-medium">{item.action || "TBA"}</td>
                        <td>{item.entityType || "TBA"}:{item.entityId || "TBA"}</td>
                        <td>{item.before || ""}{item.before || item.after ? " → " : ""}{item.after || ""}</td>
                        <td>{rupiah(item.amount)}</td>
                        <td>{item.sourceModule || "TBA"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-sm text-muted-foreground">Belum ada baris Governance_Audit_Log dari data yang terbaca.</p>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next Actions TARIF</CardTitle>
            <CardDescription>Prioritas tindak lanjut dari data Sheets saat ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {(data?.nextActions || []).map((action, index) => <li key={index} className="rounded-md border bg-muted/40 px-3 py-2">{action}</li>)}
            </ul>
          </CardContent>
        </Card>
        </div>
      </RoleGate>
    </div>
  );
}
