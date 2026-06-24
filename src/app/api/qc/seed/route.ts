// POST /api/qc/seed — Seed 5 QC results (3 Pass, 1 Fail, 1 Conditional) + checklist template
import { NextRequest, NextResponse } from "next/server";
import { readSheet, appendRows, SHEETS } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const SHEET_NAME = "QC_Results";

const HEADERS = [
  "Result ID", "Batch Code", "Production ID", "Date", "Inspector",
  "Aroma Score", "Warna Score", "Kejernihan Score",
  "Packaging Score", "Seal Integrity Score", "Overall Score",
  "Status", "Notes", "Follow-up Required",
];

const SEED_DATA = [
  // Pass 1 — Aura Bloom
  [
    "QC-2026-001", "BATCH-2026-06-01-AB100", "PROD-2026-001", "2026-06-02",
    "Rina Susanti", 8, 9, 8, 9, 8, 8.4, "Pass",
    "Aroma konsisten, packaging rapi", "No",
  ],
  // Pass 2 — Velvet Mist
  [
    "QC-2026-002", "BATCH-2026-06-03-VM200", "PROD-2026-002", "2026-06-04",
    "Budi Hartono", 9, 8, 9, 8, 9, 8.6, "Pass",
    "Semua parameter di atas standar", "No",
  ],
  // Pass 3 — Ocean Breeze
  [
    "QC-2026-003", "BATCH-2026-06-05-OB300", "PROD-2026-003", "2026-06-06",
    "Rina Susanti", 7, 8, 7, 8, 8, 7.6, "Pass",
    "Minor: sedikit warna lebih muda dari batch sebelumnya", "No",
  ],
  // Fail — Aura Bloom
  [
    "QC-2026-004", "BATCH-2026-06-07-AB400", "PROD-2026-004", "2026-06-08",
    "Budi Hartono", 4, 3, 4, 5, 4, 4.0, "Fail",
    "Aroma off-note, warna tidak sesuai formula, seal lemah", "Yes",
  ],
  // Conditional — Velvet Mist
  [
    "QC-2026-005", "BATCH-2026-06-09-VM500", "PROD-2026-005", "2026-06-10",
    "Rina Susanti", 6, 6, 5, 6, 6, 5.8, "Conditional",
    "Aroma sedikit di bawah standar, perlu review formula", "Yes",
  ],
];

export async function POST(request: NextRequest) {
  try {
    // Check if data already exists
    const raw = await readSheet(SHEET_NAME);
    const hasHeader = raw.length > 0 && raw[0][0] === "Result ID";
    const dataRows = hasHeader ? raw.slice(1) : raw;

    const existingIds = new Set(dataRows.filter((r) => r && r[0]).map((r) => r[0]));
    const newRows = SEED_DATA.filter((row) => !existingIds.has(row[0]));

    if (newRows.length === 0) {
      return NextResponse.json({
        source: `Google Sheets: ${SHEET_NAME}`,
        sourceStatus: "live",
        message: "Seed data already exists — nothing inserted",
        seeded: 0,
        total: SEED_DATA.length,
      });
    }

    // Ensure header exists
    if (!hasHeader) {
      await appendRows(SHEET_NAME, [HEADERS]);
    }

    await appendRows(SHEET_NAME, newRows);

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      message: `${newRows.length} QC results seeded successfully`,
      seeded: newRows.length,
      total: SEED_DATA.length,
      skipped: SEED_DATA.length - newRows.length,
      data: newRows.map((row) => ({
        resultId: row[0],
        batchCode: row[1],
        productionId: row[2],
        date: row[3],
        inspector: row[4],
        overallScore: row[10],
        status: row[11],
      })),
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to seed QC data", details: String(error) },
      { status: 500 }
    );
  }
}
