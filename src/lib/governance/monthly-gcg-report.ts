// Monthly GCG Report log — readiness snapshot for shareholder TARIF reporting
// Schema: Report ID | Period | Generated At | Created By | Status | Overall GCG Score | TARIF Exceptions | Expense Pending | Needs Proof | Shareholder Debt | Compliance Overdue | Vendor Exceptions | Governance Audit Rows | Notes/Source

import { google } from "googleapis";
import { appendRows, getAuth, SPREADSHEET_ID } from "@/lib/sheets/sheets-real";

export const MONTHLY_GCG_REPORT_SHEET = "Monthly_GCG_Report";
export const MONTHLY_GCG_REPORT_HEADERS = [
  "Report ID",
  "Period",
  "Generated At",
  "Created By",
  "Status",
  "Overall GCG Score",
  "TARIF Exceptions",
  "Expense Pending",
  "Needs Proof",
  "Shareholder Debt",
  "Compliance Overdue",
  "Vendor Exceptions",
  "Governance Audit Rows",
  "Notes/Source",
];

export type MonthlyGcgReportSnapshot = {
  period: string;
  generatedAt?: string;
  createdBy?: string;
  status?: string;
  overallGcgScore?: number;
  tarifExceptionCount?: number;
  expensePendingCount: number;
  expenseNeedsProofCount: number;
  shareholderDebtOutstanding: number;
  complianceOverdueCount: number;
  vendorExceptionCount: number;
  governanceAuditRows: number;
  notes?: string;
  sourceModule?: string;
};

function makeReportId(period: string): string {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const safePeriod = period.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24) || "period-tba";
  return `GCG-${ymd}-${safePeriod}-${Date.now().toString().slice(-5)}`;
}

export async function ensureMonthlyGcgReportSheet(): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const ss = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });

  const exists = ss.data.sheets?.some((sheet) => sheet.properties?.title === MONTHLY_GCG_REPORT_SHEET);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: MONTHLY_GCG_REPORT_SHEET } } }] },
    });
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${MONTHLY_GCG_REPORT_SHEET}!A1:N1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [MONTHLY_GCG_REPORT_HEADERS] },
  });
}

export function formatMonthlyGcgReportRow(snapshot: MonthlyGcgReportSnapshot): (string | number)[] {
  return [
    makeReportId(snapshot.period),
    snapshot.period || "TBA",
    snapshot.generatedAt || new Date().toISOString(),
    snapshot.createdBy || "systemswi",
    snapshot.status || "Draft - Needs Human Review",
    snapshot.overallGcgScore ?? 0,
    snapshot.tarifExceptionCount ?? 0,
    snapshot.expensePendingCount,
    snapshot.expenseNeedsProofCount,
    snapshot.shareholderDebtOutstanding,
    snapshot.complianceOverdueCount,
    snapshot.vendorExceptionCount,
    snapshot.governanceAuditRows,
    snapshot.notes || snapshot.sourceModule || "Generated from Google Sheets context; requires human review before shareholder distribution.",
  ];
}

export async function appendMonthlyGcgReportSnapshot(snapshot: MonthlyGcgReportSnapshot): Promise<(string | number)[]> {
  await ensureMonthlyGcgReportSheet();
  const row = formatMonthlyGcgReportRow(snapshot);
  await appendRows("MonthlyGcgReport", [row]);
  return row;
}
