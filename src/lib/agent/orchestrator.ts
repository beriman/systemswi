// Agent Orchestrator — Phase 1 + Phase 2 + Phase 3 Core
// Coordinates all agent tasks: health checks, audit logging, alerts, approvals,
// procurement, reconciliation, compliance, customer follow-up, event workflow,
// cashflow forecast, brand performance, event ROI, customer segmentation, tax optimization

import { logAgentActionSafe } from "./audit";
import { sendTelegramMessage, sendHealthReport, sendTelegramAlert, sendTelegramApproval, isTelegramConfigured } from "./telegram";
import { runHealthCheck } from "./health-check";
import { detectTransactions, formatTransactionForTelegram } from "./transaction-detection";
import { readRange, appendRows } from "@/lib/sheets/sheets-real";
import { runTaxReminderCheck } from "./tax-reminder";
import { runEventPipelineAnalysis, formatEventPipelineForTelegram } from "./event-pipeline";

// ── Phase 2 imports ────────────────────────────────────────────────
import { draftProcurementPOs, formatProcurementForTelegram } from "./procurement-auto";
import { runReconciliation, formatReconciliationForTelegram } from "./finance-reconciliation";
import { runComplianceCheck, formatComplianceForTelegram } from "./compliance-tracking";
import { runCustomerFollowUp, formatFollowUpForTelegram } from "./customer-follow-up";
import { runEventPipelineWorkflow, formatEventPipelineForTelegram as formatEventPipelineWorkflowForTelegram } from "./event-pipeline-workflow";

// ── Phase 3 imports ────────────────────────────────────────────────
import { generateCashflowForecast, formatForecastForTelegram } from "./cashflow-forecast";
import { analyzeBrandPerformance, formatBrandPerformanceForTelegram } from "./brand-performance";
import { analyzeEventROI, formatEventROIForTelegram } from "./event-roi";
import { performRFMSegmentation, formatSegmentationForTelegram } from "./customer-segmentation";
import { analyzeTaxOptimization, formatTaxOptimizationForTelegram } from "./tax-optimization";

// ── Phase 4 import ────────────────────────────────────────────────
import { runPhase4Checks } from "./phase4-scaffold";

export const APPROVAL_THRESHOLD = 10_000_000; // Rp 10 juta

// ── Daily Health Check (Task 1.1) ──
export async function dailyHealthCheck(): Promise<void> {
  const result = await executeWithRetry(
    "dailyHealthCheck",
    async () => {
      const report = await runHealthCheck();
      return report;
    },
    { maxRetries: 2, baseDelayMs: 2000 }
  );

  const report = result.success ? (result.data as Awaited<ReturnType<typeof runHealthCheck>>) : await runHealthCheck();
  agentHealthTracker.record("dailyHealthCheck", result as any);

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

// ── Phase 2: Procurement Auto (Task 2.1) ──
export async function dailyProcurementCheck(): Promise<void> {
  const report = await draftProcurementPOs();

  await logAgentActionSafe({
    timestamp: new Date().toISOString(),
    agent: "HemuHemu/OWL",
    action: "Procurement Auto Check",
    target: "Inventory_Master + Supplier_Master",
    status: "success",
    humanApproved: "pending",
    notes: `${report.totalDrafts} PO drafts, ${report.lowStockItems.length} low stock, Rp ${report.totalValue.toLocaleString("id-ID")}`,
  });

  if (isTelegramConfigured() && report.totalDrafts > 0) {
    await sendTelegramMessage(formatProcurementForTelegram(report));
  }
}

// ── Phase 2: Finance Reconciliation (Task 2.3) ──
export async function dailyReconciliation(): Promise<void> {
  const report = await runReconciliation();

  await logAgentActionSafe({
    timestamp: new Date().toISOString(),
    agent: "HemuHemu/OWL",
    action: "Finance Reconciliation",
    target: "Cash_Harian + Rekening_Koran",
    status: "success",
    humanApproved: "n/a",
    notes: `${report.discrepancies.length} discrepancies, net Rp ${report.netDifference.toLocaleString("id-ID")}`,
  });

  if (isTelegramConfigured() && report.discrepancies.length > 0) {
    await sendTelegramMessage(formatReconciliationForTelegram(report));
  }
}

// ── Phase 2: Compliance Tracking (Task 2.4) ──
export async function dailyComplianceCheck(): Promise<void> {
  const report = await runComplianceCheck();

  await logAgentActionSafe({
    timestamp: new Date().toISOString(),
    agent: "HemuHemu/OWL",
    action: "Compliance Check",
    target: "Compliance_Checks + Legal_Compliance",
    status: "success",
    humanApproved: "n/a",
    notes: `Expired: ${report.expired}, Expiring: ${report.expiringSoon}, Valid: ${report.valid}`,
  });

  if (isTelegramConfigured() && report.totalAlerts > 0) {
    await sendTelegramMessage(formatComplianceForTelegram(report));
  }
}

// ── Phase 2: Customer Follow-up (Task 2.5) ──
export async function dailyCustomerFollowUp(): Promise<void> {
  const report = await runCustomerFollowUp();

  await logAgentActionSafe({
    timestamp: new Date().toISOString(),
    agent: "HemuHemu/OWL",
    action: "Customer Follow-up",
    target: "Customer_Master + Customer_Interactions",
    status: "success",
    humanApproved: "pending",
    notes: `${report.totalDrafts} drafts, ${report.churnedCount} churned, ${report.dormantCount} dormant`,
  });

  if (isTelegramConfigured() && report.totalDrafts > 0) {
    await sendTelegramMessage(formatFollowUpForTelegram(report));
  }
}

// ── Phase 2: Event Pipeline Workflow (Task 2.2) ──
export async function dailyEventWorkflow(): Promise<void> {
  const report = await runEventPipelineWorkflow();

  await logAgentActionSafe({
    timestamp: new Date().toISOString(),
    agent: "HemuHemu/OWL",
    action: "Event Pipeline Workflow",
    target: "Event_Tenants + Event_Sponsors",
    status: "success",
    humanApproved: "pending",
    notes: `${report.totalAgreementDrafts} drafts, ${report.totalOverdue} overdue, ${report.followUpNeeded.length} follow-up`,
  });

  if (isTelegramConfigured() && (report.totalAgreementDrafts > 0 || report.totalOverdue > 0 || report.followUpNeeded.length > 0)) {
    await sendTelegramMessage(formatEventPipelineWorkflowForTelegram(report));
  }
}

// ── Full Daily Run — executes all Phase 1 + Phase 2 + Phase 3 + Phase 4 tasks ──
export async function runFullDailyAgent(): Promise<{
  health: boolean;
  transactions: boolean;
  stockAlerts: boolean;
  invoices: boolean;
  taxReminders: boolean;
  eventPipeline: boolean;
  procurement: boolean;
  reconciliation: boolean;
  compliance: boolean;
  customerFollowUp: boolean;
  eventWorkflow: boolean;
  cashflowForecast: boolean;
  brandPerformance: boolean;
  eventROI: boolean;
  customerSegmentation: boolean;
  taxOptimization: boolean;
  phase4: boolean;
}> {
  const results = {
    health: false,
    transactions: false,
    stockAlerts: false,
    invoices: false,
    taxReminders: false,
    eventPipeline: false,
    procurement: false,
    reconciliation: false,
    compliance: false,
    customerFollowUp: false,
    eventWorkflow: false,
    cashflowForecast: false,
    brandPerformance: false,
    eventROI: false,
    customerSegmentation: false,
    taxOptimization: false,
    phase4: false,
  };
  const timestamp = new Date().toISOString();

  // ── Phase 1 tasks ──
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

  // ── Phase 2 tasks ──
  try {
    await dailyProcurementCheck();
    results.procurement = true;
  } catch (error) {
    console.error("[Agent] Procurement check failed:", error);
  }

  try {
    await dailyReconciliation();
    results.reconciliation = true;
  } catch (error) {
    console.error("[Agent] Reconciliation failed:", error);
  }

  try {
    await dailyComplianceCheck();
    results.compliance = true;
  } catch (error) {
    console.error("[Agent] Compliance check failed:", error);
  }

  try {
    await dailyCustomerFollowUp();
    results.customerFollowUp = true;
  } catch (error) {
    console.error("[Agent] Customer follow-up failed:", error);
  }

  try {
    await dailyEventWorkflow();
    results.eventWorkflow = true;
  } catch (error) {
    console.error("[Agent] Event workflow failed:", error);
  }

  // ── Phase 3 tasks (Intelligence & Analysis) ──
  try {
    const forecastResult = await generateCashflowForecast();
    results.cashflowForecast = true;

    await logAgentActionSafe({
      timestamp,
      agent: "HemuHemu/OWL",
      action: "Cashflow Forecast",
      target: "Rekap_Rekening → Cashflow_Forecast",
      status: "success",
      humanApproved: "n/a",
      notes: `${forecastResult.historical.length} months analyzed, 3-month forecast. Confidence: ${forecastResult.confidence}`,
    });
  } catch (error) {
    console.error("[Agent] Cashflow forecast failed:", error);
  }

  try {
    const brandResult = await analyzeBrandPerformance();
    results.brandPerformance = true;

    await logAgentActionSafe({
      timestamp,
      agent: "HemuHemu/OWL",
      action: "Brand Performance Analysis",
      target: "Brand_Sales + Brand_Expenses → Brand_Dashboard",
      status: "success",
      humanApproved: "n/a",
      notes: `${brandResult.brands.length} brands. Top: ${brandResult.topPerformer}. Profit: Rp ${brandResult.totalProfit.toLocaleString("id-ID")}`,
    });
  } catch (error) {
    console.error("[Agent] Brand performance analysis failed:", error);
  }

  try {
    const roiResult = await analyzeEventROI();
    results.eventROI = true;

    await logAgentActionSafe({
      timestamp,
      agent: "HemuHemu/OWL",
      action: "Event ROI Analysis",
      target: "Event_Tenants + Event_Sponsors",
      status: "success",
      humanApproved: "n/a",
      notes: `${roiResult.events.length} events. Overall ROI: ${roiResult.overallROI}%. Best: ${roiResult.bestEvent}`,
    });
  } catch (error) {
    console.error("[Agent] Event ROI analysis failed:", error);
  }

  try {
    const segResult = await performRFMSegmentation();
    results.customerSegmentation = true;

    await logAgentActionSafe({
      timestamp,
      agent: "HemuHemu/OWL",
      action: "Customer RFM Segmentation",
      target: "Customer_Master + Customer_Interactions",
      status: "success",
      humanApproved: "n/a",
      notes: `${segResult.totalCustomers} customers segmented. Champions: ${segResult.segmentCounts["Champions"]}. At Risk: ${segResult.segmentCounts["At Risk"]}`,
    });
  } catch (error) {
    console.error("[Agent] Customer segmentation failed:", error);
  }

  try {
    const taxOptResult = await analyzeTaxOptimization();
    results.taxOptimization = true;

    await logAgentActionSafe({
      timestamp,
      agent: "HemuHemu/OWL",
      action: "Tax Optimization Analysis",
      target: "COA + Pajak_Tracking",
      status: "success",
      humanApproved: "n/a",
      notes: `${taxOptResult.items.length} items. Potential saving: Rp ${taxOptResult.totalPotentialSaving.toLocaleString("id-ID")}`,
    });
  } catch (error) {
    console.error("[Agent] Tax optimization analysis failed:", error);
  }

  // ── Phase 4 tasks (External Integrations) ──
  try {
    const phase4Result = await runPhase4Checks();
    results.phase4 = true;

    await logAgentActionSafe({
      timestamp,
      agent: "HemuHemu/OWL",
      action: "Phase 4 Integration Run",
      target: "All External APIs",
      status: "success",
      humanApproved: "pending",
      notes: `eFaktur=${phase4Result.eFaktur} BPOM=${phase4Result.bpom} BRI=${phase4Result.bri} WA=${phase4Result.whatsApp} Sukuk=${phase4Result.sukuk}`,
    });
  } catch (error) {
    console.error("[Agent] Phase 4 integration run failed:", error);
  }

  // ── Summary ──
  const phase1Complete = results.health && results.transactions && results.stockAlerts && results.invoices && results.taxReminders && results.eventPipeline;
  const phase2Complete = results.procurement && results.reconciliation && results.compliance && results.customerFollowUp && results.eventWorkflow;
  const phase3Complete = results.cashflowForecast && results.brandPerformance && results.eventROI && results.customerSegmentation && results.taxOptimization;

  await logAgentActionSafe({
    timestamp,
    agent: "HemuHemu/OWL",
    action: "Full Daily Agent Run",
    target: "All SWI Systems",
    status: phase1Complete && phase2Complete && phase3Complete ? "success" : "partial",
    humanApproved: "n/a",
    notes: `Phase1: H=${results.health} T=${results.transactions} S=${results.stockAlerts} I=${results.invoices} Tax=${results.taxReminders} E=${results.eventPipeline} | Phase2: P=${results.procurement} R=${results.reconciliation} C=${results.compliance} CF=${results.customerFollowUp} EW=${results.eventWorkflow} | Phase3: CF=${results.cashflowForecast} BP=${results.brandPerformance} ROI=${results.eventROI} CS=${results.customerSegmentation} TO=${results.taxOptimization} | Phase4: ${results.phase4}`,
  });

  return results;
}
