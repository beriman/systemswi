// Approval SLA Monitor — Phase 5.3
// Tracks time-to-approval for pending requests in Agent_Approvals sheet
// Escalates to Telegram if approval pending > 2 hours (SLA breach)
// Compliance: UU ITE/PP PST — all audit actions logged

import { readRange, appendRows } from "@/lib/sheets/sheets-real";
import { logAgentActionSafe } from "./audit";
import { sendTelegramAlert, sendTelegramMessage, isTelegramConfigured } from "./telegram";

const SHEET_NAME = "Agent_Approvals";
const SLA_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const ESCALATION_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 hours — critical escalation

export interface ApprovalSLAReport {
  timestamp: string;
  totalPending: number;
  withinSLA: number;
  breachedSLA: number;
  criticalEscalation: number;
  breachedItems: BreachedApproval[];
  averageWaitTimeMinutes: number;
  status: "healthy" | "warning" | "critical";
}

export interface BreachedApproval {
  approvalId: string;
  title: string;
  description: string;
  agentAction: string;
  amount: string;
  requestedAt: string;
  waitTimeHours: number;
  severity: "warning" | "critical";
}

// ── Read pending approvals and check SLA ──
export async function checkApprovalSLA(): Promise<ApprovalSLAReport> {
  const timestamp = new Date().toISOString();
  const now = Date.now();

  let rows: string[][] = [];
  try {
    rows = await readRange(`${SHEET_NAME}!A1:J500`);
  } catch (error) {
    console.error("[SLA Monitor] Failed to read approvals sheet:", error);
    return {
      timestamp,
      totalPending: 0,
      withinSLA: 0,
      breachedSLA: 0,
      criticalEscalation: 0,
      breachedItems: [],
      averageWaitTimeMinutes: 0,
      status: "healthy",
    };
  }

  const pendingApprovals: {
    approvalId: string;
    title: string;
    description: string;
    agent: string;
    action: string;
    status: string;
    amount: string;
    requestedAt: string;
  }[] = [];

  // Parse rows (skip header)
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
        requestedAt: row[9] || "",
      });
    }
  }

  // Check SLA for each pending approval
  const breachedItems: BreachedApproval[] = [];
  let totalWaitMs = 0;

  for (const approval of pendingApprovals) {
    if (!approval.requestedAt) continue;

    const requestedTime = new Date(approval.requestedAt).getTime();
    if (isNaN(requestedTime)) continue;

    const waitMs = now - requestedTime;
    totalWaitMs += waitMs;
    const waitHours = waitMs / (1000 * 60 * 60);

    if (waitMs >= ESCALATION_THRESHOLD_MS) {
      breachedItems.push({
        approvalId: approval.approvalId,
        title: approval.title,
        description: approval.description,
        agentAction: approval.action,
        amount: approval.amount,
        requestedAt: approval.requestedAt,
        waitTimeHours: Math.round(waitHours * 10) / 10,
        severity: "critical",
      });
    } else if (waitMs >= SLA_THRESHOLD_MS) {
      breachedItems.push({
        approvalId: approval.approvalId,
        title: approval.title,
        description: approval.description,
        agentAction: approval.action,
        amount: approval.amount,
        requestedAt: approval.requestedAt,
        waitTimeHours: Math.round(waitHours * 10) / 10,
        severity: "warning",
      });
    }
  }

  const breachedSLA = breachedItems.filter((b) => b.severity === "warning").length;
  const criticalEscalation = breachedItems.filter((b) => b.severity === "critical").length;
  const withinSLA = pendingApprovals.length - breachedItems.length;
  const averageWaitTimeMinutes =
    pendingApprovals.length > 0
      ? Math.round((totalWaitMs / pendingApprovals.length) / (1000 * 60))
      : 0;

  const status: ApprovalSLAReport["status"] =
    criticalEscalation > 0 ? "critical" : breachedSLA > 0 ? "warning" : "healthy";

  const report: ApprovalSLAReport = {
    timestamp,
    totalPending: pendingApprovals.length,
    withinSLA,
    breachedSLA,
    criticalEscalation,
    breachedItems,
    averageWaitTimeMinutes,
    status,
  };

  // Log to audit trail
  await logAgentActionSafe({
    timestamp,
    agent: "HemuHemu/OWL",
    action: "Approval SLA Check",
    target: "Agent_Approvals",
    status: status === "healthy" ? "success" : "partial",
    humanApproved: "n/a",
    notes: `Pending: ${pendingApprovals.length}, Within SLA: ${withinSLA}, Breached: ${breachedSLA}, Critical: ${criticalEscalation}, Avg wait: ${averageWaitTimeMinutes}min`,
  });

  return report;
}

// ── Send escalation alerts via Telegram ──
export async function sendSLAEscalationAlerts(report: ApprovalSLAReport): Promise<void> {
  if (!isTelegramConfigured()) return;

  // Send critical escalations first
  for (const item of report.breachedItems.filter((b) => b.severity === "critical")) {
    await sendTelegramAlert({
      title: `🚨 SLA CRITICAL: ${item.title}`,
      detail: `Approval ID: ${item.approvalId}\nAction: ${item.agentAction}\nAmount: ${item.amount}\nRequested: ${item.requestedAt}\nWait time: ${item.waitTimeHours} hours\n\n⚠️ Escalation required —超过 4 hours unanswered`,
      severity: "critical",
      category: "approval",
    });
  }

  // Send warning-level breaches
  for (const item of report.breachedItems.filter((b) => b.severity === "warning")) {
    await sendTelegramAlert({
      title: `⚠️ SLA Warning: ${item.title}`,
      detail: `Approval ID: ${item.approvalId}\nAction: ${item.agentAction}\nAmount: ${item.amount}\nRequested: ${item.requestedAt}\nWait time: ${item.waitTimeHours} hours\n\nPlease approve or reject within 2 hours`,
      severity: "high",
      category: "approval",
    });
  }

  // Send summary if there are breaches
  if (report.breachedItems.length > 0) {
    const summaryText = `📊 <b>Approval SLA Summary</b>\n\n⏱ Average wait: ${report.averageWaitTimeMinutes} minutes\n📋 Total pending: ${report.totalPending}\n✅ Within SLA: ${report.withinSLA}\n⚠️ Warning (>2h): ${report.breachedSLA}\n🚨 Critical (>4h): ${report.criticalEscalation}`;
    await sendTelegramMessage(summaryText);
  }
}

// ── Format report for dashboard display ──
export function formatSLAReportForDashboard(report: ApprovalSLAReport): string {
  const statusEmoji = { healthy: "🟢", warning: "🟡", critical: "🔴" }[report.status];
  let text = `${statusEmoji} <b>Approval SLA Monitor</b>\n\n`;
  text += `📋 Pending: ${report.totalPending}\n`;
  text += `✅ Within SLA: ${report.withinSLA}\n`;
  text += `⚠️ Warning (>2h): ${report.breachedSLA}\n`;
  text += `🚨 Critical (>4h): ${report.criticalEscalation}\n`;
  text += `⏱ Avg wait: ${report.averageWaitTimeMinutes} min\n`;

  if (report.breachedItems.length > 0) {
    text += `\n<b>Breached Items:</b>\n`;
    for (const item of report.breachedItems.slice(0, 5)) {
      text += `${item.severity === "critical" ? "🚨" : "⚠️"} ${item.title} — ${item.waitTimeHours}h\n`;
    }
  }

  return text;
}

// ── Full SLA monitoring run (check + escalate) ──
export async function runApprovalSLAMonitor(): Promise<ApprovalSLAReport> {
  const report = await checkApprovalSLA();

  if (report.breachedItems.length > 0) {
    await sendSLAEscalationAlerts(report);
  }

  return report;
}
