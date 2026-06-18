// Agent Orchestrator — Phase 1 Core
// Coordinates all agent tasks: health checks, audit logging, alerts, approvals

import { logAgentActionSafe } from "./audit";
import { sendTelegramMessage, sendHealthReport, sendTelegramAlert, sendTelegramApproval, isTelegramConfigured } from "./telegram";
import { runHealthCheck } from "./health-check";
import { detectTransactions, formatTransactionForTelegram } from "./transaction-detection";
import { readRange, appendRows } from "@/lib/sheets/sheets-real";
import { runTaxReminderCheck } from "./tax-reminder";
import { runEventPipelineAnalysis, formatEventPipelineForTelegram } from "./event-pipeline";

export const APPROVAL_THRESHOLD = 10_000_000; // Rp 10 juta

// ── Daily Health Check (Task 1.1) ──
export async function dailyHealthCheck(): Promise<void> {
  const report = await runHealthCheck();

  await logAgentActionSafe({
    timestamp: report.timestamp,
    agent: "HemuHemu/OWL",
    action: "Daily Health Check",
    target: "All SWI Systems",
    status: report.status === "healthy" ? "success" : report.status === "critical" ? "failed" : "success",
    humanApproved: "n/a",
    notes: `Status: ${report.status}, ${report.checks.length} checks, ${report.totalResponseTimeMs}ms`,
  });

  if (isTelegramConfigured()) {
    await sendHealthReport(report);
  }
}

// ── Transaction Detection (Task 1.2) ──
export async function dailyTransactionDetection(): Promise<void> {
  const result = await detectTransactions();

  await logAgentActionSafe({
    timestamp: new Date().toISOString(),
    agent: "HemuHemu/OWL",
    action: "Transaction Detection",
    target: "Rekening_Koran",
    status: "success",
    humanApproved: "n/a",
    notes: `Detected ${result.transactions.length} transactions, ${result.summary.needsReview} need review`,
  });

  if (isTelegramConfigured()) {
    // Send high-priority transactions (large amounts)
    const highValueTx = result.transactions.filter(
      (t) => t.debit > APPROVAL_THRESHOLD || t.credit > APPROVAL_THRESHOLD
    );

    if (highValueTx.length > 0) {
      for (const tx of highValueTx.slice(0, 5)) {
        await sendTelegramAlert({
          title: `High Value Transaction: ${tx.suggestedCategory}`,
          detail: formatTransactionForTelegram(tx),
          severity: "high",
          category: "finance",
        });
      }
    }

    // Send summary of transactions needing review
    if (result.summary.needsReview > 0) {
      const reviewTx = result.transactions.filter((t) => t.confidence === "low");
      const text = `⚠️ <b>${result.summary.needsReview} Transaksi Perlu Review</b>

${reviewTx.slice(0, 5).map((t) => `❓ ${t.date} — ${t.description}\n   💰 ${t.debit > 0 ? `Debit Rp ${t.debit.toLocaleString("id-ID")}` : `Kredit Rp ${t.credit.toLocaleString("id-ID")}`}`).join("\n\n")}`;
      await sendTelegramMessage(text);
    }
  }
}

// ── Stock Alert (Task 1.5) ──
export async function dailyStockAlert(): Promise<void> {
  const rows = await readRange("Inventory_Master!A1:O1000");
  const alerts: { name: string; qty: number; min: number; unit: string; status: string }[] = [];

  const text = (v: unknown) => String(v ?? "").trim();
  const num = (v: unknown) => {
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    if (typeof v !== "string") return 0;
    const p = Number(v.replace(/[^\d.-]/g, ""));
    return Number.isFinite(p) ? p : 0;
  };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row.some((c) => c && c.trim())) continue;
    const name = text(row[2]);
    if (!name) continue;
    const qty = num(row[5]);
    const min = num(row[6]);
    const unit = text(row[4]) || "unit";
    let status = "ok";
    if (qty <= 0) status = "empty";
    else if (qty <= min * 0.5) status = "critical";
    else if (qty <= min) status = "low";
    if (status !== "ok") alerts.push({ name, qty, min, unit, status });
  }

  await logAgentActionSafe({
    timestamp: new Date().toISOString(),
    agent: "HemuHemu/OWL",
    action: "Stock Alert Check",
    target: "Inventory_Master",
    status: "success",
    humanApproved: "n/a",
    notes: `${alerts.length} items below minimum stock`,
  });

  if (isTelegramConfigured() && alerts.length > 0) {
    const critical = alerts.filter((a) => a.status === "empty" || a.status === "critical");
    if (critical.length > 0) {
      for (const item of critical.slice(0, 5)) {
        await sendTelegramAlert({
          title: `Stok ${item.status === "empty" ? "HABIS" : "KRITIS"}: ${item.name}`,
          detail: `Sisa: ${item.qty} ${item.unit} | Minimum: ${item.min} ${item.unit}`,
          severity: "critical",
          category: "inventory",
        });
      }
    }
  }
}

// ── Request Approval (Human-in-the-Loop) ──
export async function requestApproval(params: {
  title: string;
  description: string;
  agentAction: string;
  amount?: number;
}): Promise<string> {
  const approvalId = `APR-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const timestamp = new Date().toISOString();

  // Write to Agent_Approvals sheet
  await appendRows("AgentApprovals", [[
    approvalId,
    params.title,
    params.description,
    "HemuHemu/OWL",
    params.agentAction,
    "pending_approval",
    "", // approvedBy
    "", // approvedAt
    `Amount: ${params.amount ? `Rp ${params.amount.toLocaleString("id-ID")}` : "N/A"}`,
    timestamp,
  ]]);

  await logAgentActionSafe({
    timestamp,
    agent: "HemuHemu/OWL",
    action: "Approval Requested",
    target: `Agent_Approvals:${approvalId}`,
    status: "pending_approval",
    humanApproved: "pending",
    notes: params.title,
    approvalId,
  });

  if (isTelegramConfigured()) {
    await sendTelegramApproval({
      approvalId,
      title: params.title,
      description: params.description,
      amount: params.amount,
      agentAction: params.agentAction,
    });
  }

  return approvalId;
}

// ── Full Daily Run — executes all Phase 1 tasks ──
export async function runFullDailyAgent(): Promise<{
  health: boolean;
  transactions: boolean;
  stockAlerts: boolean;
  invoices: boolean;
  taxReminders: boolean;
  eventPipeline: boolean;
}> {
  const results = { health: false, transactions: false, stockAlerts: false, invoices: false, taxReminders: false, eventPipeline: false };
  const timestamp = new Date().toISOString();

  try {
    await dailyHealthCheck();
    results.health = true;
  } catch (error) {
    console.error("[Agent] Health check failed:", error);
  }

  try {
    await dailyTransactionDetection();
    results.transactions = true;
  } catch (error) {
    console.error("[Agent] Transaction detection failed:", error);
  }

  try {
    await dailyStockAlert();
    results.stockAlerts = true;
  } catch (error) {
    console.error("[Agent] Stock alert failed:", error);
  }

  try {
    const { generateInvoices, formatInvoiceSummaryForTelegram } = await import("./invoice-generation");
    const invResult = await generateInvoices();
    results.invoices = true;

    if (isTelegramConfigured() && invResult.invoices.length > 0) {
      await sendTelegramMessage(formatInvoiceSummaryForTelegram(invResult));
    }

    await logAgentActionSafe({
      timestamp,
      agent: "HemuHemu/OWL",
      action: "Invoice Generation",
      target: "Purchase_Orders + Supplier_Master + Customer_Master",
      status: "success",
      humanApproved: "pending",
      notes: `Generated ${invResult.summary.totalDrafted} invoices, ${invResult.summary.pendingApproval} pending approval`,
    });
  } catch (error) {
    console.error("[Agent] Invoice generation failed:", error);
  }

  try {
    const taxResult = await runTaxReminderCheck();
    results.taxReminders = true;

    await logAgentActionSafe({
      timestamp,
      agent: "HemuHemu/OWL",
      action: "Tax Reminder Check",
      target: "Tax_Calendar + Pajak_Tracking",
      status: "success",
      humanApproved: "n/a",
      notes: `Overdue: ${taxResult.report.totalOverdue}, Upcoming H-3: ${taxResult.report.totalUpcoming}, Sent: ${taxResult.sent}`,
    });
  } catch (error) {
    console.error("[Agent] Tax reminder check failed:", error);
  }

  try {
    const pipelineResult = await runEventPipelineAnalysis();
    results.eventPipeline = true;

    if (isTelegramConfigured()) {
      await sendTelegramMessage(formatEventPipelineForTelegram(pipelineResult));
    }

    await logAgentActionSafe({
      timestamp,
      agent: "HemuHemu/OWL",
      action: "Event Pipeline Update",
      target: "Event_Tenants + Event_Sponsors + Customer_Interactions",
      status: "success",
      humanApproved: "n/a",
      notes: `Tenants: ${pipelineResult.tenants.total}, Sponsors: ${pipelineResult.sponsors.total}, Suggestions: ${pipelineResult.suggestions.length}`,
    });
  } catch (error) {
    console.error("[Agent] Event pipeline update failed:", error);
  }

  await logAgentActionSafe({
    timestamp,
    agent: "HemuHemu/OWL",
    action: "Full Daily Agent Run",
    target: "All SWI Systems",
    status: results.health && results.transactions && results.stockAlerts && results.invoices && results.taxReminders ? "success" : "failed",
    humanApproved: "n/a",
    notes: `Health: ${results.health}, Transactions: ${results.transactions}, Stock: ${results.stockAlerts}, Invoices: ${results.invoices}, TaxReminders: ${results.taxReminders}, EventPipeline: ${results.eventPipeline}`,
  });

  return results;
}
