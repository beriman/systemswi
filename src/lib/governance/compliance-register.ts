// Compliance Register — LKPM, BPJS, tax, legal, BPOM/Halal governance obligations
// Schema: Compliance ID | Area | Obligation | Period | Due Date | Status | Owner | Source Proof | Risk Level | Notes

import { appendRows, getAuth, readSheet, SPREADSHEET_ID, updateRow } from "@/lib/sheets/sheets-real";
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

export type ComplianceRegisterReminder = {
  id: string;
  area: string;
  obligation: string;
  dueDate: string;
  owner: string;
  status: string;
  level: "overdue" | "h-1" | "h-3" | "h-7";
  message: string;
};

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

function isCompletedStatus(status: string): boolean {
  return ["submitted", "paid", "complete", "completed"].includes(status.toLowerCase());
}

function badgeFor(status: string, days: number | null): ComplianceRegisterEntry["riskBadge"] {
  const normalized = status.toLowerCase();
  if (isCompletedStatus(normalized)) return "green";
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
  const status = text(entry.status) || "Not Started";
  const sourceProof = text(entry.sourceProof);

  if (isCompletedStatus(status) && !sourceProof) {
    throw new Error("Source Proof wajib diisi sebelum compliance ditandai Submitted/Paid/Complete.");
  }

  const row = [
    text(entry.id) || makeComplianceId(area),
    area,
    text(entry.obligation) || "Belum dicatat",
    text(entry.period) || "TBA",
    text(entry.dueDate),
    status,
    text(entry.owner) || "Belum dicatat",
    sourceProof,
    text(entry.riskLevel) || "Medium",
    text(entry.notes),
  ];
  await appendRows("ComplianceRegister", [row]);
  return parseComplianceRegisterRows([COMPLIANCE_REGISTER_HEADERS, row])[0];
}

export async function updateComplianceRegisterEntry(
  id: string,
  patch: Partial<NewComplianceRegisterEntry>,
): Promise<{ before: ComplianceRegisterEntry; after: ComplianceRegisterEntry }> {
  await ensureComplianceRegisterSheet();
  const rows = await readSheet("ComplianceRegister");
  const rowIndex = rows.findIndex((row, index) => index > 0 && text(row[0]) === id);
  if (rowIndex === -1) throw new Error(`Compliance item not found: ${id}`);

  const existingRow = rows[rowIndex];
  const before = parseComplianceRegisterRows([COMPLIANCE_REGISTER_HEADERS, existingRow])[0];
  const nextStatus = text(patch.status) || before.status || "Not Started";
  const nextProof = patch.sourceProof !== undefined ? text(patch.sourceProof) : before.sourceProof;

  if (isCompletedStatus(nextStatus) && !nextProof) {
    throw new Error("Source Proof wajib diisi sebelum compliance ditandai Submitted/Paid/Complete.");
  }

  const row = [
    before.id,
    patch.area !== undefined ? text(patch.area) || "TBA" : before.area,
    patch.obligation !== undefined ? text(patch.obligation) || "Belum dicatat" : before.obligation,
    patch.period !== undefined ? text(patch.period) || "TBA" : before.period,
    patch.dueDate !== undefined ? text(patch.dueDate) : before.dueDate,
    nextStatus,
    patch.owner !== undefined ? text(patch.owner) || "Belum dicatat" : before.owner,
    nextProof,
    patch.riskLevel !== undefined ? text(patch.riskLevel) || "Medium" : before.riskLevel,
    patch.notes !== undefined ? text(patch.notes) : before.notes,
  ];

  await updateRow("ComplianceRegister", rowIndex + 1, row);
  const after = parseComplianceRegisterRows([COMPLIANCE_REGISTER_HEADERS, row])[0];
  return { before, after };
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
  const open = entries.filter((entry) => !isCompletedStatus(entry.status));
  return {
    total: entries.length,
    open: open.length,
    overdue: entries.filter((entry) => entry.riskBadge === "red").length,
    dueSoon: entries.filter((entry) => entry.riskBadge === "yellow").length,
    completed: entries.filter((entry) => entry.riskBadge === "green").length,
    missingProof: entries.filter((entry) => !entry.sourceProof && isCompletedStatus(entry.status)).length,
  };
}

function reminderLevel(daysUntilDue: number | null): ComplianceRegisterReminder["level"] | null {
  if (daysUntilDue === null) return null;
  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= 1) return "h-1";
  if (daysUntilDue <= 3) return "h-3";
  if (daysUntilDue <= 7) return "h-7";
  return null;
}

export function buildComplianceRegisterReminders(entries: ComplianceRegisterEntry[]): ComplianceRegisterReminder[] {
  return entries
    .filter((entry) => !isCompletedStatus(entry.status))
    .map((entry) => {
      const level = reminderLevel(entry.daysUntilDue);
      if (!level) return null;
      const timing = level === "overdue"
        ? `overdue ${Math.abs(entry.daysUntilDue || 0)} hari`
        : level.toUpperCase();
      return {
        id: entry.id,
        area: entry.area,
        obligation: entry.obligation,
        dueDate: entry.dueDate,
        owner: entry.owner,
        status: entry.status,
        level,
        message: `${entry.area} — ${entry.obligation} ${timing}; owner ${entry.owner || "Belum dicatat"}. Jangan tandai selesai tanpa Source Proof.`,
      };
    })
    .filter((reminder): reminder is ComplianceRegisterReminder => Boolean(reminder))
    .sort((a, b) => {
      const order = { overdue: 0, "h-1": 1, "h-3": 2, "h-7": 3 } as const;
      return order[a.level] - order[b.level] || a.dueDate.localeCompare(b.dueDate);
    });
}
