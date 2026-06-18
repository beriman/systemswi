// Agent Audit Log — writes to Google Sheets Agent_Audit_Log tab
// Schema: Timestamp | Agent | Action | Target | Status | Human Approved | Notes | Approval ID

import { appendRows } from "@/lib/sheets/sheets-real";

export type AuditEntry = {
  timestamp: string;
  agent: string;
  action: string;
  target: string;
  status: "success" | "failed" | "pending_approval" | "approved" | "rejected" | "partial";
  humanApproved: string; // "yes" | "no" | "n/a" | approver name
  notes: string;
  approvalId?: string;
  details?: string; // optional additional detail
};

const SHEET_NAME = "AgentAuditLog";

export function formatAuditRow(entry: AuditEntry): (string | number)[] {
  return [
    entry.timestamp,
    entry.agent,
    entry.action,
    entry.target,
    entry.status,
    entry.humanApproved,
    entry.notes,
    entry.approvalId || "",
  ];
}

export async function logAgentAction(entry: AuditEntry): Promise<void> {
  const row = formatAuditRow(entry);
  await appendRows(SHEET_NAME, [row]);
}

export async function logAgentActionSafe(entry: AuditEntry): Promise<void> {
  try {
    await logAgentAction(entry);
  } catch (error) {
    console.error("[AgentAudit] Failed to write audit log:", error);
    // Don't throw — audit failure should not break the main flow
  }
}
