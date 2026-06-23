// QC / Quality Control — Google Sheets helpers
// QC_Results sheet: A1:N1000
// Cols:
//   A = Result ID
//   B = Batch Code
//   C = Production ID
//   D = Date
//   E = Inspector
//   F = Aroma Score
//   G = Warna Score
//   H = Kejernihan Score
//   I = Packaging Score
//   J = Seal Integrity Score
//   K = Overall Score
//   L = Status (Pass / Conditional / Fail)
//   M = Notes
//   N = Follow-up Required (Yes / No)
import { readRange, writeRange, appendRows } from "@/lib/sheets/sheets-real";

const SHEET_NAME = "QC_Results";
const HEADER_ROW = 1;
const DATA_START_ROW = 2;
const RANGE = `${SHEET_NAME}!A1:N1000`;

export interface QcResult {
  id: string;
  batchCode: string;
  productionId: string;
  date: string;          // YYYY-MM-DD
  inspector: string;
  aromaScore: number;
  warnaScore: number;
  kejernihanScore: number;
  packagingScore: number;
  sealIntegrityScore: number;
  overallScore: number;
  status: "Pass" | "Conditional" | "Fail";
  notes: string;
  followUpRequired: "Yes" | "No";
  row: number;           // 1-indexed sheet row
}

// ── Helpers ────────────────────────────────────────────────────────

function s(row: string[], idx: number): string {
  return row[idx] || "";
}

function n(value: unknown): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  return Number(value) || 0;
}

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

export function generateId(): string {
  return `QC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// ── Read ──────────────────────────────────────────────────────────

export async function readQcSheet(): Promise<string[][]> {
  return readRange(RANGE);
}

export function parseQcRows(rows: string[][]): QcResult[] {
  // rows[0] is header row (row 1)
  // data starts from rows[1] (row 2)
  const dataRows = rows.slice(1);
  const results: QcResult[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const id = s(row, 0);
    if (!id) continue;

    const aromaScore = n(row[5]);
    const warnaScore = n(row[6]);
    const kejernihanScore = n(row[7]);
    const packagingScore = n(row[8]);
    const sealIntegrityScore = n(row[9]);
    const overallScore = n(row[10]) || calcOverallScore(aromaScore, warnaScore, kejernihanScore, packagingScore, sealIntegrityScore);
    const status = (s(row, 11) || calcStatus(overallScore)) as QcResult["status"];

    results.push({
      id,
      batchCode: s(row, 1),
      productionId: s(row, 2),
      date: s(row, 3),
      inspector: s(row, 4),
      aromaScore,
      warnaScore,
      kejernihanScore,
      packagingScore,
      sealIntegrityScore,
      overallScore,
      status,
      notes: s(row, 12),
      followUpRequired: s(row, 13) === "Yes" ? "Yes" : "No",
      row: i + DATA_START_ROW,  // +2 because data starts at row 2
    });
  }

  return results;
}

// ── Write ─────────────────────────────────────────────────────────

export async function appendQcRow(result: Omit<QcResult, "row">): Promise<number> {
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
  await appendRows(SHEET_NAME, [row]);
  return 0; // row number unknown after append
}

export async function updateQcRow(rowNumber: number, result: Omit<QcResult, "row">): Promise<void> {
  const range = `${SHEET_NAME}!A${rowNumber}:N${rowNumber}`;
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

// ── Seed data ─────────────────────────────────────────────────────

export function buildSeedData(): Omit<QcResult, "row">[] {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);

  const seeds: Omit<QcResult, "row">[] = [
    // 3 Pass
    {
      id: "QC-SEED-001",
      batchCode: "BATCH-2026-001",
      productionId: "PROD-001",
      date: today,
      inspector: "HemuHemu/OWL",
      aromaScore: 9,
      warnaScore: 8,
      kejernihanScore: 9,
      packagingScore: 8,
      sealIntegrityScore: 9,
      overallScore: 8.6,
      status: "Pass",
      notes: "Batch pertama — semua parameter excellent.",
      followUpRequired: "No",
    },
    {
      id: "QC-SEED-002",
      batchCode: "BATCH-2026-002",
      productionId: "PROD-002",
      date: yesterday,
      inspector: "HemuHemu/OWL",
      aromaScore: 8,
      warnaScore: 7,
      kejernihanScore: 8,
      packagingScore: 7,
      sealIntegrityScore: 8,
      overallScore: 7.6,
      status: "Pass",
      notes: "Konsistensi baik, minor deviation pada warna.",
      followUpRequired: "No",
    },
    {
      id: "QC-SEED-003",
      batchCode: "BATCH-2026-003",
      productionId: "PROD-003",
      date: twoDaysAgo,
      inspector: "HemuHemu/OWL",
      aromaScore: 7,
      warnaScore: 7,
      kejernihanScore: 7,
      packagingScore: 7,
      sealIntegrityScore: 7,
      overallScore: 7.0,
      status: "Pass",
      notes: "Pass dengan skor minimum. Monitor batch berikutnya.",
      followUpRequired: "No",
    },
    // 1 Fail
    {
      id: "QC-SEED-004",
      batchCode: "BATCH-2026-004",
      productionId: "PROD-004",
      date: yesterday,
      inspector: "HemuHemu/OWL",
      aromaScore: 4,
      warnaScore: 3,
      kejernihanScore: 5,
      packagingScore: 4,
      sealIntegrityScore: 3,
      overallScore: 3.8,
      status: "Fail",
      notes: "Aroma off-spec, warna tidak konsisten, seal lemah. Batch di-reject.",
      followUpRequired: "Yes",
    },
    // 1 Conditional
    {
      id: "QC-SEED-005",
      batchCode: "BATCH-2026-005",
      productionId: "PROD-005",
      date: today,
      inspector: "HemuHemu/OWL",
      aromaScore: 6,
      warnaScore: 5,
      kejernihanScore: 6,
      packagingScore: 5,
      sealIntegrityScore: 6,
      overallScore: 5.6,
      status: "Conditional",
      notes: "Conditional pass — perlu rework pada packaging sebelum release.",
      followUpRequired: "Yes",
    },
  ];

  return seeds;
}

export async function seedQcData(): Promise<number> {
  const seeds = buildSeedData();
  for (const seed of seeds) {
    await appendQcRow(seed);
  }
  return seeds.length;
}

// ── Summary ───────────────────────────────────────────────────────

export interface QcSummary {
  total: number;
  passed: number;
  failed: number;
  conditional: number;
  passRate: number;
}

export function computeSummary(results: QcResult[]): QcSummary {
  const total = results.length;
  const passed = results.filter((r) => r.status === "Pass").length;
  const failed = results.filter((r) => r.status === "Fail").length;
  const conditional = results.filter((r) => r.status === "Conditional").length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  return { total, passed, failed, conditional, passRate };
}
