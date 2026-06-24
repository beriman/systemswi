// Agent Index — exports all agent modules (Phase 1 + Phase 2 + Phase 3)
export { logAgentAction, logAgentActionSafe } from "./audit";
export type { AuditEntry } from "./audit";
export {
  sendTelegramMessage,
  sendTelegramAlert,
  sendTelegramApproval,
  sendHealthReport,
  isTelegramConfigured,
} from "./telegram";
export { runHealthCheck } from "./health-check";
export type { HealthReport, HealthCheck, HealthStatus, CheckStatus } from "./health-check";
export { detectTransactions, formatTransactionForTelegram } from "./transaction-detection";
export type { DetectedTransaction, TransactionType } from "./transaction-detection";
export { generateInvoices, formatInvoiceForTelegram, formatInvoiceSummaryForTelegram } from "./invoice-generation";
export type { InvoiceDraft, InvoiceGenerationResult, InvoiceType, InvoiceStatus } from "./invoice-generation";
export { runEventPipelineAnalysis, formatEventPipelineForTelegram } from "./event-pipeline";

// ── Phase 2: Agent Automation ──────────────────────────────────────
export { draftProcurementPOs, formatProcurementForTelegram } from "./procurement-auto";
export type { ProcurementReport, PODraft, LowStockItem } from "./procurement-auto";
export { runReconciliation, formatReconciliationForTelegram } from "./finance-reconciliation";
export type { ReconciliationReport, Discrepancy } from "./finance-reconciliation";
export { runComplianceCheck, formatComplianceForTelegram } from "./compliance-tracking";
export type { ComplianceReport } from "./compliance-tracking";
export { runCustomerFollowUp, formatFollowUpForTelegram } from "./customer-follow-up";
export type { FollowUpReport, FollowUpDraft } from "./customer-follow-up";
export { runEventPipelineWorkflow, formatEventPipelineForTelegram as formatEventPipelineWorkflowForTelegram } from "./event-pipeline-workflow";
export type { EventPipelineReport, AgreementDraft } from "./event-pipeline-workflow";

// ── Phase 3: Agent Intelligence ────────────────────────────────────
export { generateCashflowForecast, formatForecastForTelegram } from "./cashflow-forecast";
export type { CashflowForecastResult, MonthlyCashflow } from "./cashflow-forecast";
export { analyzeBrandPerformance, formatBrandPerformanceForTelegram } from "./brand-performance";
export type { BrandPerformance, BrandPerformanceResult } from "./brand-performance";
export { analyzeEventROI, formatEventROIForTelegram } from "./event-roi";
export type { EventROI, EventROIResult } from "./event-roi";
export { performRFMSegmentation, formatSegmentationForTelegram } from "./customer-segmentation";
export type { CustomerRFM, CustomerSegment, SegmentationResult } from "./customer-segmentation";
export { analyzeTaxOptimization, formatTaxOptimizationForTelegram } from "./tax-optimization";
export type { TaxAnalysisItem, TaxOptimizationResult } from "./tax-optimization";

// ── Phase 4: External Integration Scaffolds ────────────────────────
export { runPhase4Checks, isEFakturConfigured, isBPOMConfigured, isBRIConfigured, isWhatsAppConfigured, isSukukConfigured } from "./phase4-scaffold";
export type { EFakturDraft, BPOMStatus, BRITransaction, WhatsAppMessage, SukukPayment } from "./phase4-scaffold";

// ── Phase 5: Agent Reliability ─────────────────────────────────────
export { checkApprovalSLA, runApprovalSLAMonitor, formatSLAReportForDashboard } from "./approval-sla-monitor";
export type { ApprovalSLAReport, BreachedApproval } from "./approval-sla-monitor";
export { executeWithRetry, agentHealthTracker, sheetsCircuitBreaker, telegramCircuitBreaker } from "./error-recovery";
export type { RetryConfig, ExecutionResult } from "./error-recovery";

// ── Phase 1+2+3+4+5 Orchestrator ───────────────────────────────────
export { dailyHealthCheck, dailyTransactionDetection, dailyStockAlert, requestApproval, runFullDailyAgent, APPROVAL_THRESHOLD } from "./orchestrator";
