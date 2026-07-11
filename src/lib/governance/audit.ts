// Governance Audit Log — human approval and GCG action trail
// Schema: Log ID | Timestamp | Actor | Role | Action | Entity Type | Entity ID | Amount | Division | Before | After | Reason/Notes | Proof URL | Source Module

import { appendRows, getAuth, SPREADSHEET_ID } from "@/lib/sheets/sheets-real";
import { google } from "googleapis";

export const GOVERNANCE_AUDIT_SHEET = "Governance_Audit_Log";
export const GOVERNANCE_AUDIT_HEADERS = [
  "Log ID",
  "Timestamp",
  "Actor",
  "Role",
  "Action",
  "Entity Type",
  "Entity ID",
  "Amount",
  "Division",
  "Before",
  "After",
  "Reason/Notes",
  "Proof URL",
  "Source Module",
];

export type GovernanceAuditEntry = {
  actor: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  amount?: number;
  division?: string;
  before?: string;
  after?: string;
  reason?: string;
  proofUrl?: string;
  sourceModule: string;
};

function timestamp() {
  return new Date().toISOString();
}

function makeLogId() {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, "");
  return `GOV-${ymd}-${d.getTime().toString().slice(-6)}`;
}

export async function ensureGovernanceAuditSheet(): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const ss = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });

  const exists = ss.data.sheets?.some((sheet) => sheet.properties?.title === GOVERNANCE_AUDIT_SHEET);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: GOVERNANCE_AUDIT_SHEET } } }] },
    });
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${GOVERNANCE_AUDIT_SHEET}!A1:N1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [GOVERNANCE_AUDIT_HEADERS] },
  });
}

export function formatGovernanceAuditRow(entry: GovernanceAuditEntry): (string | number)[] {
  return [
    makeLogId(),
    timestamp(),
    entry.actor || "System",
    entry.role || "TBA",
    entry.action,
    entry.entityType,
    entry.entityId,
    entry.amount || 0,
    entry.division || "Belum dicatat",
    entry.before || "",
    entry.after || "",
    entry.reason || "",
    entry.proofUrl || "",
    entry.sourceModule,
  ];
}

export async function logGovernanceAction(entry: GovernanceAuditEntry): Promise<void> {
  await ensureGovernanceAuditSheet();
  await appendRows("GovernanceAuditLog", [formatGovernanceAuditRow(entry)]);
}

export async function logGovernanceActionSafe(entry: GovernanceAuditEntry): Promise<void> {
  try {
    await logGovernanceAction(entry);
  } catch (error) {
    console.error("[GovernanceAudit] Failed to write audit log:", error);
  }
}
