// Compliance Register — LKPM, BPJS, tax, legal, BPOM/Halal governance obligations
// Schema: Compliance ID | Area | Obligation | Period | Due Date | Status | Owner | Source Proof | Risk Level | Notes

import { appendRows, getAuth, readSheet, SPREADSHEET_ID } from "@/lib/sheets/sheets-real";
import { google } from "googleapis";

export const COMPLIANCE_REGISTER_SHEET = "Compliance_Register";
export const COMPLIANCE_REGISTER_HEADERS = [
  "Compliance ID",
  "Area",
  "Obligation",
  "Period",
  "Due Date",
  "Status",
  "Owner",
  "Source Proof",
  "Risk Level",
  "Notes",
];

export type ComplianceRegisterStatus = "Not Started" | "In Progress" | "Submitted" | "Paid" | "Overdue" | "TBA";

export type ComplianceRegisterEntry = {
  id: string;
  area: string;
  obligation: string;
  period: string;
  dueDate: string;
  status: string;
  owner: string;
  sourceProof: string;
  riskLevel: string;
  notes: string;
  daysUntilDue: number | null;
  riskBadge: "green" | "yellow" | "red" | "gray";
};

export type NewComplianceRegisterEntry = Omit<ComplianceRegisterEntry, "daysUntilDue" | "riskBadge">;

const DEFAULT_KNOWN_ITEMS: NewComplianceRegisterEntry[] = [
  {
    id: "CMP-LKPM-Q2-2026",
    area: "LKPM",
    obligation: "LKPM Q2 2026",
    period: "Q2 2026",
    dueDate: "2026-07-15",
    status: "Not Started",
    owner: "Beriman / Finance",
    sourceProof: "",
    riskLevel: "High",
    notes: "Deadline LKPM Q2: 1–15 Juli 2026. Status harus diverifikasi dengan bukti lapor sebelum ditandai Submitted.",
  },
  {
    id: "CMP-BPJSKT-BERIMAN-2026-06",
    area: "BPJSKT",
    obligation: "BPJS Ketenagakerjaan Beriman — paid-through 25 Juni 2026",
    period: "Juni 2026",
    dueDate: "2026-06-25",
    status: "Paid",
    owner: "Beriman",
    sourceProof: "",
    riskLevel: "Medium",
    notes: "Dibayar pribadi; bukti pembayaran perlu di-link jika tersedia dan biaya pribadi dicatat ke Shareholder_Ledger bila menjadi hutang perusahaan.",
  },
  {
    id: "CMP-BPJSKS-SETUP",
    area: "BPJSKS",
    obligation: "Setup/penyelesaian BPJS Kesehatan perusahaan",
    period: "TBA",
    dueDate: "",
    status: "Not Started",
    owner: "Beriman / Finance",
    sourceProof: "",
    riskLevel: "High",
    notes: "Belum selesai/masih perlu ditindaklanjuti. Jangan isi nomor/status fiktif sebelum ada dokumen.",
  },
];

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function makeComplianceId(area: string): string {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, "");
  return `CMP-${area.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "GCG"}-${ymd}-${d.getTime().toString().slice(-5)}`;
}

function daysUntil(date: string): number | null {
  if (!date) return null;
  const due = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(due.getTime())) return null;
  const today = new Date(`${todayIso()}T00:00:00Z`);
  return Math.ceil((due.getTime() - today.getTime()) / 86400000);
}

function badgeFor(status: string, days: number | null): ComplianceRegisterEntry["riskBadge"] {
  const normalized = status.toLowerCase();
  if (["submitted", "paid", "complete", "completed"].includes(normalized)) return "green";
  if (normalized === "tba") return "gray";
  if (normalized === "overdue") return "red";
  if (days !== null && days < 0) return "red";
  if (days !== null && days <= 7) return "yellow";
  return "gray";
}

function parseRow(row: string[]): ComplianceRegisterEntry {
  const dueDate = text(row[4]);
  const status = text(row[5]) || "TBA";
  const days = daysUntil(dueDate);
  return {
    id: text(row[0]),
    area: text(row[1]) || "TBA",
    obligation: text(row[2]) || "Belum dicatat",
    period: text(row[3]) || "TBA",
    dueDate,
    status,
    owner: text(row[6]) || "Belum dicatat",
    sourceProof: text(row[7]),
    riskLevel: text(row[8]) || "TBA",
    notes: text(row[9]),
    daysUntilDue: days,
    riskBadge: badgeFor(status, days),
  };
}

export function parseComplianceRegisterRows(rows: string[][]): ComplianceRegisterEntry[] {
  return rows.slice(1).filter((row) => row.some((cell) => text(cell))).map(parseRow);
}

export async function ensureComplianceRegisterSheet(): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const ss = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });

  const exists = ss.data.sheets?.some((sheet) => sheet.properties?.title === COMPLIANCE_REGISTER_SHEET);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: COMPLIANCE_REGISTER_SHEET } } }] },
    });
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${COMPLIANCE_REGISTER_SHEET}!A1:J1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [COMPLIANCE_REGISTER_HEADERS] },
  });
}

export async function listComplianceRegister(): Promise<ComplianceRegisterEntry[]> {
  await ensureComplianceRegisterSheet();
  return parseComplianceRegisterRows(await readSheet("ComplianceRegister"));
}

export async function appendComplianceRegisterEntry(entry: Partial<NewComplianceRegisterEntry>): Promise<ComplianceRegisterEntry> {
  await ensureComplianceRegisterSheet();
  const area = text(entry.area) || "GCG";
  const row = [
    text(entry.id) || makeComplianceId(area),
    area,
    text(entry.obligation) || "Belum dicatat",
    text(entry.period) || "TBA",
    text(entry.dueDate),
    text(entry.status) || "Not Started",
    text(entry.owner) || "Belum dicatat",
    text(entry.sourceProof),
    text(entry.riskLevel) || "Medium",
    text(entry.notes),
  ];
  await appendRows("ComplianceRegister", [row]);
  return parseComplianceRegisterRows([COMPLIANCE_REGISTER_HEADERS, row])[0];
}

export async function seedKnownComplianceRegisterItems(): Promise<{ seeded: number; skipped: number; entries: ComplianceRegisterEntry[] }> {
  await ensureComplianceRegisterSheet();
  const existing = parseComplianceRegisterRows(await readSheet("ComplianceRegister"));
  const existingIds = new Set(existing.map((entry) => entry.id));
  const rows = DEFAULT_KNOWN_ITEMS
    .filter((entry) => !existingIds.has(entry.id))
    .map((entry) => [
      entry.id,
      entry.area,
      entry.obligation,
      entry.period,
      entry.dueDate,
      entry.status,
      entry.owner,
      entry.sourceProof,
      entry.riskLevel,
      entry.notes,
    ]);

  if (rows.length) await appendRows("ComplianceRegister", rows);
  const entries = parseComplianceRegisterRows(await readSheet("ComplianceRegister"));
  return { seeded: rows.length, skipped: DEFAULT_KNOWN_ITEMS.length - rows.length, entries };
}

export function summarizeComplianceRegister(entries: ComplianceRegisterEntry[]) {
  const open = entries.filter((entry) => !["submitted", "paid", "complete", "completed"].includes(entry.status.toLowerCase()));
  return {
    total: entries.length,
    open: open.length,
    overdue: entries.filter((entry) => entry.riskBadge === "red").length,
    dueSoon: entries.filter((entry) => entry.riskBadge === "yellow").length,
    completed: entries.filter((entry) => entry.riskBadge === "green").length,
    missingProof: entries.filter((entry) => !entry.sourceProof && ["Submitted", "Paid"].includes(entry.status)).length,
  };
}
