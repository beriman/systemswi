// QC Sheets helper — read/write QC_Results sheet
import { readRange, writeRange, appendRows, readSheet } from "@/lib/sheets/sheets-real";

export const QC_SHEET = "QC_Results";
export const QC_RANGE = "QC_Results!A1:N1000";

// Column mapping (0-indexed in the row array):
// 0 A: Result ID
// 1 B: Batch Code
// 2 C: Production ID
// 3 D: Date
// 4 E: Inspector
// 5 F: Aroma Score
// 6 G: Warna Score
// 7 H: Kejernihan Score
// 8 I: Packaging Score
// 9 J: Seal Integrity Score
// 10 K: Overall Score
// 11 L: Status
// 12 M: Notes
// 13 N: Follow-up Required

export const QC_HEADERS = [
  "Result ID", "Batch Code", "Production ID", "Date", "Inspector",
  "Aroma Score", "Warna Score", "Kejernihan Score", "Packaging Score",
  "Seal Integrity Score", "Overall Score", "Status", "Notes", "Follow-up Required",
];

export interface QcResult {
  id: string;
  batchCode: string;
  productionId: string;
  date: string;
  inspector: string;
  aromaScore: number;
  warnaScore: number;
  kejernihanScore: number;
  packagingScore: number;
  sealIntegrityScore: number;
  overallScore: number;
  status: string;
  notes: string;
  followUpRequired: string;
  row: number; // 1-indexed row number in the sheet
}

export interface QcSummary {
  total: number;
  passed: number;
  failed: number;
  conditional: number;
  passRate: number;
}

// ── ID generation ──────────────────────────────────────────────────
let counter = 0;
export function generateId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  counter += 1;
  return `QC-${y}${m}${d}-${String(counter).padStart(4, "0")}`;
}

// ── Score calculations ─────────────────────────────────────────────
export function calcOverallScore(
  aroma: number,
  warna: number,
  kejernihan: number,
  packaging: number,
  seal: number
): number {
  const avg = (aroma + warna + kejernihan + packaging + seal) / 5;
  return Math.round(avg * 100) / 100;
}

export function calcStatus(overallScore: number): "Pass" | "Conditional" | "Fail" {
  if (overallScore >= 7) return "Pass";
  if (overallScore >= 5) return "Conditional";
  return "Fail";
}

// ── Read ───────────────────────────────────────────────────────────
export async function readQcSheet(): Promise<string[][]> {
  return readRange(QC_RANGE);
}

export function parseQcRows(rows: string[][]): QcResult[] {
  const results: QcResult[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // Skip header row
    if (i === 0 && row[0] === "Result ID") continue;
    if (!row[0]) continue; // skip empty rows

    const aroma = Number(row[5]) || 0;
    const warna = Number(row[6]) || 0;
    const kejernihan = Number(row[7]) || 0;
    const packaging = Number(row[8]) || 0;
    const seal = Number(row[9]) || 0;
    const overall = Number(row[10]) || calcOverallScore(aroma, warna, kejernihan, packaging, seal);

    results.push({
      id: row[0] || "",
      batchCode: row[1] || "",
      productionId: row[2] || "",
      date: row[3] || "",
      inspector: row[4] || "",
      aromaScore: aroma,
      warnaScore: warna,
      kejernihanScore: kejernihan,
      packagingScore: packaging,
      sealIntegrityScore: seal,
      overallScore: overall,
      status: row[11] || calcStatus(overall),
      notes: row[12] || "",
      followUpRequired: row[13] || "No",
      row: i + 1, // 1-indexed
    });
  }
  return results;
}

// ── Write ──────────────────────────────────────────────────────────
export async function ensureQcHeaders(): Promise<void> {
  try {
    const existing = await readRange("QC_Results!A1:N1");
    if (!existing || existing.length === 0 || !existing[0]?.[0]) {
      await writeRange("QC_Results!A1:N1", [QC_HEADERS]);
    }
  } catch {
    // Sheet may not exist yet — try to create headers
    try {
      await writeRange("QC_Results!A1:N1", [QC_HEADERS]);
    } catch {
      // ignore — sheet will be created on first append
    }
  }
}

export async function appendQcRow(result: Omit<QcResult, "row">): Promise<void> {
  await ensureQcHeaders();
  const row = [
    result.id,
    result.batchCode,
    result.productionId,
    result.date,
    result.inspector,
    result.aromaScore,
    result.warnaScore,
    result.kejernihanScore,
    result.packagingScore,
    result.sealIntegrityScore,
    result.overallScore,
    result.status,
    result.notes,
    result.followUpRequired,
  ];
  await appendRows(QC_SHEET, [row]);
}

export async function updateQcRow(
  rowNumber: number,
  result: Omit<QcResult, "row">
): Promise<void> {
  const range = `QC_Results!A${rowNumber}:N${rowNumber}`;
  const row = [
    result.id,
    result.batchCode,
    result.productionId,
    result.date,
    result.inspector,
    result.aromaScore,
    result.warnaScore,
    result.kejernihanScore,
    result.packagingScore,
    result.sealIntegrityScore,
    result.overallScore,
    result.status,
    result.notes,
    result.followUpRequired,
  ];
  await writeRange(range, [row]);
}

// ── Summary ────────────────────────────────────────────────────────
export function computeSummary(results: QcResult[]): QcSummary {
  const total = results.length;
  const passed = results.filter((r) => r.status === "Pass").length;
  const failed = results.filter((r) => r.status === "Fail").length;
  const conditional = results.filter((r) => r.status === "Conditional").length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  return { total, passed, failed, conditional, passRate };
}

// ── Seed data ──────────────────────────────────────────────────────
export async function seedQcData(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const seeds: (string | number)[][] = [
    // Pass — Aura Bloom
    ["QC-20260624-0001", "BATCH-2026-01-15-1001", "PROD-2026-001", "2026-01-15", "HemuHemu/OWL",
     9, 8, 9, 8, 9, 8.6, "Pass", "First batch of the year — excellent quality", "No"],
    // Pass — Lumière
    ["QC-20260624-0002", "BATCH-2026-02-10-2001", "PROD-2026-002", "2026-02-10", "HemuHemu/OWL",
     8, 9, 8, 9, 8, 8.4, "Pass", "Valentine edition — all parameters within spec", "No"],
    // Pass — Noir Essence
    ["QC-20260624-0003", "BATCH-2026-03-20-3001", "PROD-2026-003", "2026-03-20", "HemuHemu/OWL",
     9, 9, 8, 9, 9, 8.8, "Pass", "Premium line — superior aroma and packaging", "No"],
    // Fail — Velvet Cloud (seal issue)
    ["QC-20260624-0004", "BATCH-2026-05-18-5001", "PROD-2026-005", "2026-05-18", "HemuHemu/OWL",
     6, 5, 5, 4, 3, 4.6, "Fail", "Seal integrity below threshold — bottle crack on filling detected", "Yes"],
    // Conditional — Aura Bloom (second batch)
    ["QC-20260624-0005", "BATCH-2026-04-05-4001", "PROD-2026-004", "2026-04-05", "HemuHemu/OWL",
     7, 6, 6, 7, 5, 6.2, "Conditional", "Travel size — seal integrity marginal, rework recommended", "Yes"],
  ];

  await ensureQcHeaders();
  await appendRows(QC_SHEET, seeds);
  return seeds.length;
}
