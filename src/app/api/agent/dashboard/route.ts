// GET /api/agent/dashboard — Aggregate all agent status data for the dashboard
// Shows: integration status, pending approvals, recent audit trail, draft queues
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";
import { checkApprovalSLA } from "@/lib/agent/approval-sla-monitor";

export const runtime = "nodejs";

export async function GET(_request: NextRequest) {
  const timestamp = new Date().toISOString();

  // ── Integration status ────────────────────────────────────────────
  const integrations = [
    {
      id: "efaktur",
      name: "e-Faktur DJP",
      description: "Faktur pajak elektronik via DJP",
      envVar: "DJP_EFATUR_API_KEY",
      active: !!(process.env.DJP_EFATUR_API_KEY && process.env.DJP_EFATUR_USERNAME),
      complianceNote: "PP 94/2023 — upload faktur pajak",
    },
    {
      id: "bpom",
      name: "OSS/BPOM",
      description: "Tracking sertifikasi BPOM & Halal",
      envVar: "OSS_API_KEY",
      active: !!process.env.OSS_API_KEY,
      complianceNote: "UU No. 33/2014 — registrasi BPOM",
    },
    {
      id: "bri",
      name: "Bank BRI API",
      description: "Auto-sync mutasi rekening",
      envVar: "BRI_API_KEY",
      active: !!(process.env.BRI_API_KEY && process.env.BRI_API_SECRET),
      complianceNote: "POJK No. 10/2021 — sistem pembayaran",
    },
    {
      id: "whatsapp",
      name: "WhatsApp Business",
      description: "Auto-reply FAQ & follow-up customer",
      envVar: "WHATSAPP_BUSINESS_TOKEN",
      active: !!(process.env.WHATSAPP_BUSINESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
      complianceNote: "UU ITE/PP PST — perlindungan data",
    },
    {
      id: "sukuk",
      name: "Sukuk Payment",
      description: "Distribusi profit investor sukuk",
      envVar: "SUKUK_CONTRACT_ADDRESS",
      active: !!(process.env.SUKUK_CONTRACT_ADDRESS || process.env.SUKUK_API_URL),
      complianceNote: "OJK — regulasi sukuk",
    },
    {
      id: "telegram",
      name: "Telegram Bot",
      description: "Notifikasi & approval gate",
      envVar: "TELEGRAM_BOT_TOKEN",
      active: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
      complianceNote: "Human-in-the-loop approval",
    },
  ];

  const activeCount = integrations.filter((i) => i.active).length;

  // ── Pending approvals from Agent_Approvals sheet ──────────────────
  let pendingApprovals: {
    approvalId: string;
    title: string;
    description: string;
    agent: string;
    action: string;
    status: string;
    amount: string;
    timestamp: string;
  }[] = [];

  try {
    const rows = await readRange("Agent_Approvals!A1:J500");
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[0]) continue;
      const status = (row[5] || "").toLowerCase();
      if (status === "pending_approval") {
        pendingApprovals.push({
          approvalId: row[0] || "",
          title: row[1] || "",
          description: row[2] || "",
          agent: row[3] || "",
          action: row[4] || "",
          status: row[5] || "",
          amount: row[8] || "",
          timestamp: row[9] || "",
        });
      }
    }
  } catch (error) {
    console.error("[Dashboard] Failed to read approvals:", error);
  }

  // ── Recent audit trail from Agent_Audit_Log ───────────────────────
  let recentAudit: {
    timestamp: string;
    agent: string;
    action: string;
    target: string;
    status: string;
    humanApproved: string;
    notes: string;
  }[] = [];

  try {
    const rows = await readRange("Agent_Audit_Log!A1:H200");
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[0]) continue;
      recentAudit.push({
        timestamp: row[0] || "",
        agent: row[1] || "",
        action: row[2] || "",
        target: row[3] || "",
        status: row[4] || "",
        humanApproved: row[5] || "",
        notes: row[6] || "",
      });
    }
    // Keep last 30 entries, newest first
    recentAudit = recentAudit.slice(-30).reverse();
  } catch (error) {
    console.error("[Dashboard] Failed to read audit log:", error);
  }

  // ── Phase 1-3 agent modules status ────────────────────────────────
  const modules = [
    { phase: 1, name: "Daily Health Check", file: "health-check.ts", description: "Cek semua sistem SWI" },
    { phase: 1, name: "Transaction Detection", file: "transaction-detection.ts", description: "Baca mutasi, suggest kategori" },
    { phase: 1, name: "Invoice Generation", file: "invoice-generation.ts", description: "Generate invoice + PPN 11%" },
    { phase: 1, name: "Tax Reminder", file: "tax-reminder.ts", description: "Reminder H-3 jatuh tempo pajak" },
    { phase: 1, name: "Stock Alert", file: "stock-alert/route.ts", description: "Alert stok minimum" },
    { phase: 1, name: "Event Pipeline", file: "event-pipeline.ts", description: "Follow-up event & customer" },
    { phase: 2, name: "Procurement Auto", file: "procurement-auto.ts", description: "Draft PO dari low-stock" },
    { phase: 2, name: "Finance Reconciliation", file: "finance-reconciliation.ts", description: "Cash vs Rekening Koran" },
    { phase: 2, name: "Compliance Tracking", file: "compliance-tracking.ts", description: "BPOM/Halal expiry tracker" },
    { phase: 2, name: "Customer Follow-up", file: "customer-follow-up.ts", description: "Segmentasi + WhatsApp draft" },
    { phase: 2, name: "Event Workflow", file: "event-pipeline-workflow.ts", description: "Agreement drafting + overdue" },
    { phase: 3, name: "Cashflow Forecast", file: "cashflow-forecast.ts", description: "Linear regression 3-month" },
    { phase: 3, name: "Brand Performance", file: "brand-performance.ts", description: "Profitability ranking" },
    { phase: 3, name: "Event ROI", file: "event-roi.ts", description: "Event grading A-F" },
    { phase: 3, name: "Customer Segmentation", file: "customer-segmentation.ts", description: "RFM 10 segments" },
    { phase: 3, name: "Tax Optimization", file: "tax-optimization.ts", description: "COA + Pajak analysis" },
    { phase: 4, name: "e-Faktur DJP", file: "phase4-scaffold.ts", description: "Draft e-Faktur + approval" },
    { phase: 4, name: "BPOM/OSS", file: "phase4-scaffold.ts", description: "Cert expiry + OSS update" },
    { phase: 4, name: "BRI API", file: "phase4-scaffold.ts", description: "Bank mutation auto-sync" },
    { phase: 4, name: "WhatsApp Business", file: "phase4-scaffold.ts", description: "Auto-reply + broadcast" },
    { phase: 4, name: "Sukuk Payment", file: "phase4-scaffold.ts", description: "Profit distribution" },
    { phase: 5, name: "Agent Health Widget", file: "health-stats/route.ts", description: "Real-time uptime & duration per module" },
    { phase: 5, name: "Approval SLA Monitor", file: "approval-sla-monitor.ts", description: "Track time-to-approval, escalate >2h" },
    { phase: 5, name: "Weekly Agent Report", file: "weekly-report.ts", description: "Auto-generated weekly summary" },
  ];

  // ── Approval SLA status ──────────────────────────────────────────
  let slaReport: {
    status: string;
    totalPending: number;
    breachedSLA: number;
    criticalEscalation: number;
    averageWaitTimeMinutes: number;
  } | null = null;

  try {
    const rawSLAResult = await checkApprovalSLA();
    slaReport = {
      status: rawSLAResult.status,
      totalPending: rawSLAResult.totalPending,
      breachedSLA: rawSLAResult.breachedSLA,
      criticalEscalation: rawSLAResult.criticalEscalation,
      averageWaitTimeMinutes: rawSLAResult.averageWaitTimeMinutes,
    };
  } catch (error) {
    console.error("[Dashboard] Failed to check SLA:", error);
  }

  return NextResponse.json({
    ok: true,
    timestamp,
    summary: {
      totalIntegrations: integrations.length,
      activeIntegrations: activeCount,
      pendingApprovals: pendingApprovals.length,
      totalModules: modules.length,
      phasesComplete: 5,
      sla: slaReport,
    },
    integrations,
    pendingApprovals,
    recentAudit,
    modules,
  });
}
