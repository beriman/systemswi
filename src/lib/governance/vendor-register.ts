// Vendor Register — supplier, benchmark, and conflict-of-interest governance register
// Schema: Vendor ID | Vendor Name | Category | Contact | Related Party? | Relationship Detail | Price Benchmark 1 | Price Benchmark 2 | Selected Reason | Payment Term | Status | Last Review

import { appendRows, getAuth, readSheet, SPREADSHEET_ID, updateRow } from "@/lib/sheets/sheets-real";
import { google } from "googleapis";

export const VENDOR_REGISTER_SHEET = "Vendor_Register";
export const VENDOR_REGISTER_HEADERS = [
  "Vendor ID",
  "Vendor Name",
  "Category",
  "Contact",
  "Related Party?",
  "Relationship Detail",
  "Price Benchmark 1",
  "Price Benchmark 2",
  "Selected Reason",
  "Payment Term",
  "Status",
  "Last Review",
];

export type VendorRegisterEntry = {
  id: string;
  name: string;
  category: string;
  contact: string;
  relatedParty: string;
  relationshipDetail: string;
  priceBenchmark1: string;
  priceBenchmark2: string;
  selectedReason: string;
  paymentTerm: string;
  status: string;
  lastReview: string;
  riskFlags: string[];
  approvalRequirement: string;
};

export type NewVendorRegisterEntry = Omit<VendorRegisterEntry, "riskFlags" | "approvalRequirement">;

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function makeVendorId(category: string): string {
  const prefix = (category || "VND").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 10) || "VND";
  return `VND-${prefix}-${Date.now().toString().slice(-6)}`;
}

function isYes(value: string): boolean {
  return ["yes", "ya", "true", "1"].includes(value.toLowerCase());
}

function classifyVendor(entry: Omit<VendorRegisterEntry, "riskFlags" | "approvalRequirement">) {
  const riskFlags: string[] = [];
  if (isYes(entry.relatedParty)) riskFlags.push("RELATED_PARTY");
  if (isYes(entry.relatedParty) && !entry.relationshipDetail) riskFlags.push("MISSING_RELATIONSHIP_DETAIL");
  if (!entry.priceBenchmark1 || !entry.priceBenchmark2) riskFlags.push("BENCHMARK_INCOMPLETE");
  if (!entry.selectedReason) riskFlags.push("MISSING_SELECTED_REASON");
  if (!entry.paymentTerm || ["tba", "belum dicatat"].includes(entry.paymentTerm.toLowerCase())) riskFlags.push("MISSING_PAYMENT_TERM");
  if (!entry.lastReview) riskFlags.push("NEEDS_REVIEW_DATE");

  const approvalRequirement = isYes(entry.relatedParty)
    ? "Direktur approve + catatan konflik kepentingan + minimal 2 pembanding"
    : (!entry.paymentTerm || ["tba", "belum dicatat"].includes(entry.paymentTerm.toLowerCase()))
      ? "Lengkapi payment term (DP/Lunas/Net 7/dll) sebelum PO/expense material"
    : (!entry.priceBenchmark1 || !entry.priceBenchmark2)
      ? "Lengkapi minimal 2 pembanding sebelum transaksi besar (> Rp2.000.000)"
      : "Normal procurement approval";

  return { riskFlags, approvalRequirement };
}

function parseRow(row: string[]): VendorRegisterEntry {
  const base = {
    id: text(row[0]),
    name: text(row[1]) || "Belum dicatat",
    category: text(row[2]) || "TBA",
    contact: text(row[3]) || "TBA",
    relatedParty: text(row[4]) || "No",
    relationshipDetail: text(row[5]),
    priceBenchmark1: text(row[6]),
    priceBenchmark2: text(row[7]),
    selectedReason: text(row[8]),
    paymentTerm: text(row[9]) || "TBA",
    status: text(row[10]) || "Trial",
    lastReview: text(row[11]),
  };
  return { ...base, ...classifyVendor(base) };
}

export function parseVendorRegisterRows(rows: string[][]): VendorRegisterEntry[] {
  return rows.slice(1).filter((row) => row.some((cell) => text(cell))).map(parseRow);
}

export async function ensureVendorRegisterSheet(): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const ss = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });

  const exists = ss.data.sheets?.some((sheet) => sheet.properties?.title === VENDOR_REGISTER_SHEET);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: VENDOR_REGISTER_SHEET } } }] },
    });
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${VENDOR_REGISTER_SHEET}!A1:L1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [VENDOR_REGISTER_HEADERS] },
  });
}

export async function listVendorRegister(): Promise<VendorRegisterEntry[]> {
  await ensureVendorRegisterSheet();
  return parseVendorRegisterRows(await readSheet("VendorRegister"));
}

export async function appendVendorRegisterEntry(entry: Partial<NewVendorRegisterEntry>): Promise<VendorRegisterEntry> {
  await ensureVendorRegisterSheet();
  const category = text(entry.category) || "TBA";
  const relatedParty = text(entry.relatedParty) || "No";
  const row = [
    text(entry.id) || makeVendorId(category),
    text(entry.name) || "Belum dicatat",
    category,
    text(entry.contact) || "TBA",
    isYes(relatedParty) ? "Yes" : "No",
    text(entry.relationshipDetail),
    text(entry.priceBenchmark1),
    text(entry.priceBenchmark2),
    text(entry.selectedReason),
    text(entry.paymentTerm) || "TBA",
    text(entry.status) || "Trial",
    text(entry.lastReview) || todayIso(),
  ];
  await appendRows("VendorRegister", [row]);
  return parseVendorRegisterRows([VENDOR_REGISTER_HEADERS, row])[0];
}

export async function updateVendorRegisterEntry(
  id: string,
  patch: Partial<NewVendorRegisterEntry>,
): Promise<{ before: VendorRegisterEntry; after: VendorRegisterEntry }> {
  await ensureVendorRegisterSheet();
  const rows = await readSheet("VendorRegister");
  const rowIndex = rows.findIndex((row, index) => index > 0 && text(row[0]) === id);
  if (rowIndex === -1) throw new Error(`Vendor not found: ${id}`);

  const existingRow = rows[rowIndex];
  const before = parseVendorRegisterRows([VENDOR_REGISTER_HEADERS, existingRow])[0];
  const nextRelatedParty = patch.relatedParty !== undefined ? text(patch.relatedParty) : before.relatedParty;
  const row = [
    before.id,
    patch.name !== undefined ? text(patch.name) || "Belum dicatat" : before.name,
    patch.category !== undefined ? text(patch.category) || "TBA" : before.category,
    patch.contact !== undefined ? text(patch.contact) || "TBA" : before.contact,
    isYes(nextRelatedParty) ? "Yes" : "No",
    patch.relationshipDetail !== undefined ? text(patch.relationshipDetail) : before.relationshipDetail,
    patch.priceBenchmark1 !== undefined ? text(patch.priceBenchmark1) : before.priceBenchmark1,
    patch.priceBenchmark2 !== undefined ? text(patch.priceBenchmark2) : before.priceBenchmark2,
    patch.selectedReason !== undefined ? text(patch.selectedReason) : before.selectedReason,
    patch.paymentTerm !== undefined ? text(patch.paymentTerm) || "TBA" : before.paymentTerm,
    patch.status !== undefined ? text(patch.status) || "Trial" : before.status,
    patch.lastReview !== undefined ? text(patch.lastReview) : before.lastReview || todayIso(),
  ];

  await updateRow("VendorRegister", rowIndex + 1, row);
  const after = parseVendorRegisterRows([VENDOR_REGISTER_HEADERS, row])[0];
  return { before, after };
}

export function summarizeVendorRegister(entries: VendorRegisterEntry[]) {
  return {
    total: entries.length,
    active: entries.filter((entry) => entry.status.toLowerCase() === "active").length,
    trial: entries.filter((entry) => entry.status.toLowerCase() === "trial").length,
    relatedParty: entries.filter((entry) => isYes(entry.relatedParty)).length,
    benchmarkIncomplete: entries.filter((entry) => entry.riskFlags.includes("BENCHMARK_INCOMPLETE")).length,
    missingPaymentTerm: entries.filter((entry) => entry.riskFlags.includes("MISSING_PAYMENT_TERM")).length,
    needsReview: entries.filter((entry) => entry.riskFlags.includes("NEEDS_REVIEW_DATE")).length,
    exceptions: entries.filter((entry) => entry.riskFlags.length > 0).length,
  };
}
