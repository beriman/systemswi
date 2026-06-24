// Weekly Agent Report — Phase 5.4
// Auto-generated weekly summary: tasks run, failures, approvals, time saved
// Sent every Monday via Telegram
// Compliance: All data sourced from Agent_Audit_Log sheet (audit trail)

import { readRange } from "@/lib/sheets/sheets-real";
import { logAgentActionSafe } from "./audit";
import { sendTelegramMessage, isTelegramConfigured } from "./telegram";

const AUDIT_SHEET = "Agent_Audit_Log";
const APPROVAL_SHEET = "Agent_Approvals";

export interface WeeklyAgentReport {
  weekStart: string;
  weekEnd: string;
  generatedAt: string;
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  pendingApprovals: number;
  approvedThisWeek: number;
  rejectedThisWeek: number;
  moduleBreakdown: Record<string, { success: number; failed: number; pending: number }>;
  topActions: { action: string; count: number }[];
  healthCheckSummary: {
    totalHealthChecks: number;
    healthyCount: number;
    degradedCount: number;
    criticalCount: number;
  };
  dailyActivity: { date: string; count: number }[];
  averageResponseTimeMs: number;
  complianceNotes: string[];
}

// ── Get start and end of current week (Monday to Sunday) ──
function getWeekBoundaries(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

// ── Generate weekly report from audit log ──
export async function generateWeeklyReport(): Promise<WeeklyAgentReport> {
  const generatedAt = new Date().toISOString();
  const { start: weekStart, end: weekEnd } = getWeekBoundaries();

  // Read audit log
  let auditRows: string[][] = [];
  try {
    auditRows = await readRange(`${AUDIT_SHEET}!A1:H5000`);
  } catch (error) {
    console.error("[Weekly Report] Failed to read audit log:", error);
  }

  // Read approvals
  let approvalRows: string[][] = [];
  try {
    approvalRows = await readRange(`${APPROVAL_SHEET}!A1:J500`);
  } catch (error) {
    console.error("[Weekly Report] Failed to read approvals:", error);
  }

  // Parse audit entries within the week
  const weekStartMs = weekStart.getTime();
  const weekEndMs = weekEnd.getTime();

  const moduleBreakdown: Record<string, { success: number; failed: number; pending: number }> = {};
  const actionCounts: Record<string, number> = {};
  const dailyCounts: Record<string, number> = {};

  let totalActions = 0;
  let successfulActions = 0;
  let failedActions = 0;
  let pendingApprovalsCount = 0;
  let totalResponseTime = 0;
  let responseTimeCount = 0;

  // Health check tracking
  let healthCheckTotal = 0;
  let healthCheckHealthy = 0;
  let healthCheckDegraded = 0;
  let healthCheckCritical = 0;

  // Process audit rows
  for (let i = 1; i < auditRows.length; i++) {
    const row = auditRows[i];
    if (!row || !row[0]) continue;

    const timestamp = row[0];
    const action = row[1] || "";
    const status = (row[4] || "").toLowerCase();
    const notes = row[6] || "";

    // Parse timestamp and check if within the week
    const ts = new Date(timestamp);
    if (isNaN(ts.getTime())) continue;
    const tsMs = ts.getTime();

    // Include "Full Daily Agent Run" entries from this week for overall stats
    if (action === "Full Daily Agent Run" && tsMs >= weekStartMs && tsMs <= weekEndMs) {
      totalActions++;
      if (status === "success") successfulActions++;
      else if (status === "failed") failedActions++;
      else if (status === "partial") successfulActions++; // partial = mostly successful

      // Track daily activity
      const dateKey = timestamp.split("T")[0];
      dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;

      continue;
    }

    // Only count detailed agent actions within the week
    if (tsMs < weekStartMs || tsMs > weekEndMs) continue;

    // Skip "Full Daily Agent Run" as individual action (already counted above)
    if (action === "Full Daily Agent Run") continue;

    totalActions++;

    // Module breakdown
    const moduleName = action.split(" ")[0] || "Unknown";
    if (!moduleBreakdown[moduleName]) {
      moduleBreakdown[moduleName] = { success: 0, failed: 0, pending: 0 };
    }

    if (status === "success" || status === "approved") {
      successfulActions++;
      moduleBreakdown[moduleName].success++;
    } else if (status === "failed") {
      failedActions++;
      moduleBreakdown[moduleName].failed++;
    } else if (status === "pending_approval") {
      pendingApprovalsCount++;
      moduleBreakdown[moduleName].pending++;
    } else if (status === "partial") {
      successfulActions++;
      moduleBreakdown[moduleName].success++;
    }

    // Action counts
    actionCounts[action] = (actionCounts[action] || 0) + 1;

    // Health check specific tracking
    if (action === "Daily" && notes.includes("Health")) {
      healthCheckTotal++;
      if (notes.includes("healthy")) healthCheckHealthy++;
      else if (notes.includes("degraded")) healthCheckDegraded++;
      else if (notes.includes("critical")) healthCheckCritical++;
    }

    // Extract response time from notes if available
    const responseTimeMatch = notes.match(/(\d+)ms/);
    if (responseTimeMatch) {
      totalResponseTime += parseInt(responseTimeMatch[1]);
      responseTimeCount++;
    }
  }

  // Count approvals this week
  let approvedThisWeek = 0;
  let rejectedThisWeek = 0;

  for (let i = 1; i < approvalRows.length; i++) {
    const row = approvalRows[i];
    if (!row || !row[0]) continue;

    const status = (row[5] || "").toLowerCase();
    const approvedAt = row[7] || ""; // approvedAt column

    if (status === "approved" || status === "rejected") {
      if (approvedAt) {
        const approvedDate = new Date(approvedAt);
        if (!isNaN(approvedDate.getTime()) && approvedDate.getTime() >= weekStartMs && approvedDate.getTime() <= weekEndMs) {
          if (status === "approved") approvedThisWeek++;
          else rejectedThisWeek++;
        }
      }
    }
  }

  // Sort actions by count
  const topActions = Object.entries(actionCounts)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Daily activity sorted
  const dailyActivity = Object.entries(dailyCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const averageResponseTimeMs = responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : 0;

  // Compliance notes
  const complianceNotes: string[] = [];
  complianceNotes.push("Audit trail lengkap tersimpan di Agent_Audit_Log (UU ITE/PP PST)");
  if (failedActions > 0) {
    complianceNotes.push(`⚠️ ${failedActions} action(s) gagal — perlu review`);
  }
  if (pendingApprovalsCount > 0) {
    complianceNotes.push(`⏳ ${pendingApprovalsCount} pending approval — perlu follow-up`);
  }
  complianceNotes.push("Semua agent actions logged untuk compliance audit");

  const report: WeeklyAgentReport = {
    weekStart: weekStart.toISOString().split("T")[0],
    weekEnd: weekEnd.toISOString().split("T")[0],
    generatedAt,
    totalActions,
    successfulActions,
    failedActions,
    pendingApprovals: pendingApprovalsCount,
    approvedThisWeek,
    rejectedThisWeek,
    moduleBreakdown,
    topActions,
    healthCheckSummary: {
      totalHealthChecks: healthCheckTotal,
      healthyCount: healthCheckHealthy,
      degradedCount: healthCheckDegraded,
      criticalCount: healthCheckCritical,
    },
    dailyActivity,
    averageResponseTimeMs,
    complianceNotes,
  };

  // Log report generation to audit trail
  await logAgentActionSafe({
    timestamp: generatedAt,
    agent: "HemuHemu/OWL",
    action: "Weekly Agent Report",
    target: "Agent_Audit_Log",
    status: "success",
    humanApproved: "n/a",
    notes: `Week ${report.weekStart} to ${report.weekEnd}: ${totalActions} actions, ${successfulActions} success, ${failedActions} failed`,
  });

  return report;
}

// ── Format report for Telegram message ──
export function formatWeeklyReportForTelegram(report: WeeklyAgentReport): string {
  const successRate = report.totalActions > 0
    ? Math.round((report.successfulActions / report.totalActions) * 100)
    : 0;

  let text = `📊 <b>SWI Agent Weekly Report</b>\n`;
  text += `📅 ${report.weekStart} → ${report.weekEnd}\n\n`;

  text += `<b>📈 Summary</b>\n`;
  text += `• Total Actions: ${report.totalActions}\n`;
  text += `• Success: ${report.successfulActions} (${successRate}%)\n`;
  text += `• Failed: ${report.failedActions}\n`;
  text += `• Pending Approvals: ${report.pendingApprovals}\n`;
  text += `• Approved this week: ${report.approvedThisWeek}\n`;
  text += `• Rejected this week: ${report.rejectedThisWeek}\n\n`;

  // Health check summary
  if (report.healthCheckSummary.totalHealthChecks > 0) {
    text += `<b>💓 Health Check Summary</b>\n`;
    text += `• Total: ${report.healthCheckSummary.totalHealthChecks}\n`;
    text += `• Healthy: ${report.healthCheckSummary.healthyCount} ✅\n`;
    text += `• Degraded: ${report.healthCheckSummary.degradedCount} ⚠️\n`;
    text += `• Critical: ${report.healthCheckSummary.criticalCount} ❌\n\n`;
  }

  // Top actions
  if (report.topActions.length > 0) {
    text += `<b>🏆 Top Actions</b>\n`;
    for (const action of report.topActions.slice(0, 5)) {
      text += `• ${action.action}: ${action.count}x\n`;
    }
    text += `\n`;
  }

  // Daily activity
  if (report.dailyActivity.length > 0) {
    text += `<b>📅 Daily Activity</b>\n`;
    for (const day of report.dailyActivity) {
      const date = new Date(day.date);
      const dayName = date.toLocaleDateString("id-ID", { weekday: "short" });
      const bar = "█".repeat(Math.min(day.count, 20));
      text += `${dayName} ${day.date}: ${bar} (${day.count})\n`;
    }
    text += `\n`;
  }

  // Compliance
  text += `<b>🔒 Compliance</b>\n`;
  for (const note of report.complianceNotes) {
    text += `• ${note}\n`;
  }

  text += `\n🤖 Generated by HemuHemu/OWL`;
  return text;
}

// ── Full weekly report run (generate + send) ──
export async function runWeeklyReport(): Promise<WeeklyAgentReport> {
  const report = await generateWeeklyReport();

  if (isTelegramConfigured()) {
    const text = formatWeeklyReportForTelegram(report);
    await sendTelegramMessage(text);
  }

  return report;
}
