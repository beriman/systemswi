// Governance Audit Log — human approval and GCG action trail
// Schema: Log ID | Timestamp | Actor | Role | Action | Entity Type | Entity ID | Amount | Division | Before | After | Reason/Notes | Proof URL | Source Module

import { appendRows, getAuth, readSheet, SPREADSHEET_ID } from "@/lib/sheets/sheets-real";
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

export type GovernanceAuditLogRow = {
  logId: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  amount: number;
  division: string;
  before: string;
  after: string;
  reason: string;
  proofUrl: string;
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

function text(row: string[], idx: number): string {
  return String(row[idx] ?? "").trim();
}

function amount(value: unknown): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  return Number(cleaned) || 0;
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

export function parseGovernanceAuditRows(rows: string[][]): GovernanceAuditLogRow[] {
  return rows
    .slice(1)
    .filter((row) => text(row, 0))
    .map((row) => ({
      logId: text(row, 0),
      timestamp: text(row, 1),
      actor: text(row, 2) || "TBA",
      role: text(row, 3) || "TBA",
      action: text(row, 4) || "TBA",
      entityType: text(row, 5) || "TBA",
      entityId: text(row, 6) || "TBA",
      amount: amount(row[7]),
      division: text(row, 8) || "Belum dicatat",
      before: text(row, 9),
      after: text(row, 10),
      reason: text(row, 11),
      proofUrl: text(row, 12),
      sourceModule: text(row, 13),
    }));
}

export async function listGovernanceAuditLog(): Promise<GovernanceAuditLogRow[]> {
  const rows = await readSheet("GovernanceAuditLog");
  return parseGovernanceAuditRows(rows);
}

export function summarizeGovernanceAuditLog(entries: GovernanceAuditLogRow[]) {
  const approvals = entries.filter((entry) => entry.action.toUpperCase().includes("APPROVE"));
  const rejections = entries.filter((entry) => entry.action.toUpperCase().includes("REJECT"));
  const expenses = entries.filter((entry) => entry.entityType.toLowerCase() === "expense");
  const withoutProof = expenses.filter((entry) => entry.amount > 0 && !entry.proofUrl);
  const byAction = entries.reduce<Record<string, number>>((acc, entry) => {
    const key = entry.action || "TBA";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    totalRows: entries.length,
    approvals: approvals.length,
    rejections: rejections.length,
    expenseActions: expenses.length,
    expenseAuditWithoutProof: withoutProof.length,
    latestTimestamp: entries[entries.length - 1]?.timestamp || "TBA",
    byAction,
  };
}

export async function logGovernanceAction(entry: GovernanceAuditEntry): Promise<GovernanceAuditLogRow> {
  await ensureGovernanceAuditSheet();
  const row = formatGovernanceAuditRow(entry);
  await appendRows("GovernanceAuditLog", [row]);
  return parseGovernanceAuditRows([GOVERNANCE_AUDIT_HEADERS, row.map(String)])[0];
}

export async function logGovernanceActionSafe(entry: GovernanceAuditEntry): Promise<void> {
  try {
    await logGovernanceAction(entry);
  } catch (error) {
    console.error("[GovernanceAudit] Failed to write audit log:", error);
  }
}
