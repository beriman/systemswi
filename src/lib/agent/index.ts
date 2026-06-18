// Agent Index — exports all agent modules (Phase 1 + Phase 2)
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

// ── Phase 1 Orchestrator ───────────────────────────────────────────
export { dailyHealthCheck, dailyTransactionDetection, dailyStockAlert, requestApproval, runFullDailyAgent, APPROVAL_THRESHOLD } from "./orchestrator";
