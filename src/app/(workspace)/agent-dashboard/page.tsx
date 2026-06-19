"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleGate } from "@/components/auth/role-gate";

interface Integration {
  id: string;
  name: string;
  description: string;
  envVar: string;
  active: boolean;
  complianceNote: string;
}

interface PendingApproval {
  approvalId: string;
  title: string;
  description: string;
  agent: string;
  action: string;
  status: string;
  amount: string;
  timestamp: string;
}

interface AuditEntry {
  timestamp: string;
  agent: string;
  action: string;
  target: string;
  status: string;
  humanApproved: string;
  notes: string;
}

interface AgentModule {
  phase: number;
  name: string;
  file: string;
  description: string;
}

interface DashboardData {
  ok: boolean;
  timestamp: string;
  summary: {
    totalIntegrations: number;
    activeIntegrations: number;
    pendingApprovals: number;
    totalModules: number;
    phasesComplete: number;
  };
  integrations: Integration[];
  pendingApprovals: PendingApproval[];
  recentAudit: AuditEntry[];
  modules: AgentModule[];
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        active
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
      }`}
    >
      {active ? "● Aktif" : "○ Belum"}
    </span>
  );
}

function SeverityBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    pending_approval: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    approved: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    partial: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        colors[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

function PhaseBadge({ phase }: { phase: number }) {
  const colors: Record<number, string> = {
    1: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    2: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    3: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    4: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        colors[phase] || "bg-gray-100 text-gray-600"
      }`}
    >
      P{phase}
    </span>
  );
}

export default function AgentDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "approvals" | "audit" | "modules">("overview");

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/agent/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">🤖 Agent Dashboard</h2>
          <p className="text-muted-foreground">Memuat data agent...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">🤖 Agent Dashboard</h2>
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <RoleGate feature="ai-features">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">🤖 Agent Dashboard</h2>
            <p className="text-muted-foreground">
              Monitoring semua agent, integrasi, dan approval — Terakhir:{" "}
              {new Date(data.timestamp).toLocaleString("id-ID")}
            </p>
          </div>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground">Integrasi Aktif</div>
              <div className="text-3xl font-bold mt-1">
                {data.summary.activeIntegrations}/{data.summary.totalIntegrations}
              </div>
              <div className="text-xs text-muted-foreground mt-1">eksternal API terhubung</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground">Pending Approvals</div>
              <div className="text-3xl font-bold mt-1 text-amber-600">
                {data.summary.pendingApprovals}
              </div>
              <div className="text-xs text-muted-foreground mt-1">menunggu approval manusia</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground">Agent Modules</div>
              <div className="text-3xl font-bold mt-1">
                {data.summary.totalModules}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Phase 1-4 terpasang</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground">Phases Complete</div>
              <div className="text-3xl font-bold mt-1 text-green-600">
                {data.summary.phasesComplete}/4
              </div>
              <div className="text-xs text-muted-foreground mt-1">Phase 4 = local logic ✓</div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b">
          {(["overview", "approvals", "audit", "modules"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "overview" && "🔌 Integrasi"}
              {tab === "approvals" && "⚠️ Approvals"}
              {tab === "audit" && "📋 Audit Trail"}
              {tab === "modules" && "🧩 Modules"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status Integrasi Eksternal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.integrations.map((integration) => (
                    <div
                      key={integration.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{integration.name}</span>
                          <StatusBadge active={integration.active} />
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {integration.description}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          📜 {integration.complianceNote}
                        </div>
                      </div>
                      <div className="text-right">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {integration.envVar}
                        </code>
                        {!integration.active && (
                          <div className="text-xs text-amber-600 mt-1">Set env var untuk aktif</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Compliance Notice */}
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚖️</span>
                  <div>
                    <div className="font-medium text-amber-900 dark:text-amber-100">
                      Human-in-the-Loop Compliance
                    </div>
                    <div className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                      Semua aksi agent yang kritis (transaksi &gt; Rp 10jt, new vendor, legal, tax)
                      memerlukan approval manusia via Telegram. Agent hanya draft & suggest —
                      eksekusi final tetap manusia. Sesuai UU ITE/PDP, UU Ketenagakerjaan, dan OJK.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "approvals" && (
          <div className="space-y-4">
            {data.pendingApprovals.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-4xl mb-3">✅</div>
                  <div className="font-medium">Tidak ada pending approval</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Semua approval sudah diproses. Agent sedang menunggu task berikutnya.
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Pending Approvals ({data.pendingApprovals.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.pendingApprovals.map((approval) => (
                      <div
                        key={approval.approvalId}
                        className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{approval.title}</span>
                              <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded">
                                {approval.approvalId}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {approval.description}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>🤖 {approval.agent}</span>
                              <span>📝 {approval.action}</span>
                              {approval.amount && <span>💰 {approval.amount}</span>}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(approval.timestamp).toLocaleString("id-ID")}
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
                          <div className="text-xs text-amber-700 dark:text-amber-300">
                            💡 Buka Telegram untuk approve/reject — atau gunakan tombol di pesan Telegram
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "audit" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Audit Trail (30 terakhir)</CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentAudit.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Belum ada audit entries
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 font-medium">Waktu</th>
                          <th className="text-left py-2 px-2 font-medium">Agent</th>
                          <th className="text-left py-2 px-2 font-medium">Action</th>
                          <th className="text-left py-2 px-2 font-medium">Target</th>
                          <th className="text-left py-2 px-2 font-medium">Status</th>
                          <th className="text-left py-2 px-2 font-medium">Approved</th>
                          <th className="text-left py-2 px-2 font-medium">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentAudit.map((entry, i) => (
                          <tr key={i} className="border-b hover:bg-accent/50">
                            <td className="py-2 px-2 text-xs whitespace-nowrap">
                              {new Date(entry.timestamp).toLocaleString("id-ID", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-2 px-2 text-xs">{entry.agent}</td>
                            <td className="py-2 px-2 text-xs font-medium">{entry.action}</td>
                            <td className="py-2 px-2 text-xs text-muted-foreground max-w-[200px] truncate">
                              {entry.target}
                            </td>
                            <td className="py-2 px-2">
                              <SeverityBadge status={entry.status} />
                            </td>
                            <td className="py-2 px-2 text-xs">{entry.humanApproved}</td>
                            <td className="py-2 px-2 text-xs text-muted-foreground max-w-[250px] truncate">
                              {entry.notes}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "modules" && (
          <div className="space-y-6">
            {[1, 2, 3, 4].map((phase) => {
              const phaseModules = data.modules.filter((m) => m.phase === phase);
              const phaseNames: Record<number, string> = {
                1: "Phase 1 — Agent Infrastructure",
                2: "Phase 2 — Agent Automation",
                3: "Phase 3 — Agent Intelligence",
                4: "Phase 4 — Agent Ecosystem",
              };
              const phaseStatus: Record<number, string> = {
                1: "✅ Complete",
                2: "✅ Complete",
                3: "✅ Complete",
                4: "🟡 Enhanced (local logic)",
              };
              return (
                <Card key={phase}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{phaseNames[phase]}</CardTitle>
                      <span className="text-sm text-muted-foreground">{phaseStatus[phase]}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {phaseModules.map((mod) => (
                        <div
                          key={mod.name}
                          className="p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <PhaseBadge phase={mod.phase} />
                            <span className="font-medium text-sm">{mod.name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {mod.description}
                          </div>
                          <code className="text-xs text-muted-foreground mt-1 block">
                            {mod.file}
                          </code>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </RoleGate>
  );
}
