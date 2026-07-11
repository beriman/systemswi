// Shareholder Ledger — separation of personal-paid expenses and company obligations
// Schema: Entry ID | Date | Shareholder | Type | Division | Description | Debit | Credit | Balance | Approval Status | Approved By | Proof URL | Notes

import { appendRows, getAuth, readSheet, SPREADSHEET_ID } from "@/lib/sheets/sheets-real";
import { google } from "googleapis";

export const SHAREHOLDER_LEDGER_SHEET = "Shareholder_Ledger";
export const SHAREHOLDER_LEDGER_HEADERS = [
  "Entry ID",
  "Date",
  "Shareholder",
  "Type",
  "Division",
  "Description",
  "Debit",
  "Credit",
  "Balance",
  "Approval Status",
  "Approved By",
  "Proof URL",
  "Notes",
];

export type ShareholderLedgerEntry = {
  id: string;
  date: string;
  shareholder: string;
  type: string;
  division: string;
  description: string;
  debit: number;
  credit: number;
  balance: string;
  approvalStatus: string;
  approvedBy: string;
  proofUrl: string;
  notes: string;
};

export type NewShareholderLedgerEntry = Omit<ShareholderLedgerEntry, "id" | "balance"> & {
  id?: string;
  balance?: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function makeEntryId() {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, "");
  return `SHL-${ymd}-${d.getTime().toString().slice(-6)}`;
}

function n(value: unknown): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  return Number(cleaned) || 0;
}

function s(row: string[], idx: number): string {
  return row[idx] || "";
}

export function parseShareholderLedgerRows(rows: string[][]): ShareholderLedgerEntry[] {
  return rows.slice(1).filter((row) => s(row, 0)).map((row) => ({
    id: s(row, 0),
    date: s(row, 1),
    shareholder: s(row, 2),
    type: s(row, 3),
    division: s(row, 4),
    description: s(row, 5),
    debit: n(row[6]),
    credit: n(row[7]),
    balance: s(row, 8),
    approvalStatus: s(row, 9),
    approvedBy: s(row, 10),
    proofUrl: s(row, 11),
    notes: s(row, 12),
  }));
}

export async function ensureShareholderLedgerSheet(): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const ss = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });

  const exists = ss.data.sheets?.some((sheet) => sheet.properties?.title === SHAREHOLDER_LEDGER_SHEET);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: SHAREHOLDER_LEDGER_SHEET } } }] },
    });
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHAREHOLDER_LEDGER_SHEET}!A1:M1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [SHAREHOLDER_LEDGER_HEADERS] },
  });
}

export async function listShareholderLedger(): Promise<ShareholderLedgerEntry[]> {
  await ensureShareholderLedgerSheet();
  return parseShareholderLedgerRows(await readSheet("ShareholderLedger"));
}

export async function appendShareholderLedgerEntry(entry: NewShareholderLedgerEntry): Promise<ShareholderLedgerEntry> {
  await ensureShareholderLedgerSheet();
  const id = entry.id || makeEntryId();
  const row = [
    id,
    entry.date || today(),
    entry.shareholder || "Belum dicatat",
    entry.type || "Hutang Pemegang Saham",
    entry.division || "Belum dicatat",
    entry.description || "Belum dicatat",
    entry.debit || 0,
    entry.credit || 0,
    entry.balance || "",
    entry.approvalStatus || "Draft",
    entry.approvedBy || "",
    entry.proofUrl || "",
    entry.notes || "",
  ];
  await appendRows("ShareholderLedger", [row]);
  return parseShareholderLedgerRows([SHAREHOLDER_LEDGER_HEADERS, row.map(String)])[0];
}

export async function appendShareholderLedgerEntryOnce(
  sourceKey: string,
  entry: NewShareholderLedgerEntry
): Promise<{ entry: ShareholderLedgerEntry | null; created: boolean }> {
  await ensureShareholderLedgerSheet();
  const existing = parseShareholderLedgerRows(await readSheet("ShareholderLedger"));
  const duplicate = existing.find((row) => row.notes.includes(sourceKey) || row.description.includes(sourceKey));
  if (duplicate) return { entry: duplicate, created: false };
  return { entry: await appendShareholderLedgerEntry(entry), created: true };
}
