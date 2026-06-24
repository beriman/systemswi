// GET /api/qc — List QC results (filter: batch, status, brand)
// POST /api/qc — Submit new QC result
// POST /api/qc (action=seed) — Seed sample QC data
import { NextRequest, NextResponse } from "next/server";
import { readSheet, appendRows } from "@/lib/sheets/sheets-real";
import { googleWorkspaceWriteBlockedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const SHEET_NAME = "QC_Results";

// Column order:
// A: Result ID, B: Batch Code, C: Production ID, D: Date, E: Inspector
// F: Aroma Score, G: Warna Score, H: Kejernihan Score
// I: Packaging Score, J: Seal Integrity Score, K: Overall Score
// L: Status, M: Notes, N: Follow-up Required
const HEADERS = [
  "Result ID", "Batch Code", "Production ID", "Date", "Inspector",
  "Aroma Score", "Warna Score", "Kejernihan Score",
  "Packaging Score", "Seal Integrity Score", "Overall Score",
  "Status", "Notes", "Follow-up Required",
];

function computeStatus(overall: number): string {
  if (overall >= 7) return "Pass";
  if (overall >= 5) return "Conditional";
  return "Fail";
}

function rowToQC(row: string[], rowNumber: number) {
  const aroma = Number(row[5]) || 0;
  const warna = Number(row[6]) || 0;
  const kejernihan = Number(row[7]) || 0;
  const packaging = Number(row[8]) || 0;
  const seal = Number(row[9]) || 0;
  const overall = Number(row[10]) || Math.round(((aroma + warna + kejernihan + packaging + seal) / 5) * 100) / 100;
  return {
    resultId: row[0] || "",
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
    status: row[11] || computeStatus(overall),
    notes: row[12] || "",
    followUpRequired: row[13] || "No",
    rowNumber,
  };
}

async function ensureHeader() {
  const raw = await readSheet(SHEET_NAME);
  if (raw.length === 0 || raw[0][0] !== "Result ID") {
    await appendRows(SHEET_NAME, [HEADERS]);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batch = searchParams.get("batch") || "";
    const status = searchParams.get("status") || "";
    const limit = searchParams.get("limit") || "";

    const raw = await readSheet(SHEET_NAME);
    const hasHeader = raw.length > 0 && raw[0][0] === "Result ID";
    const dataRows = hasHeader ? raw.slice(1) : raw;

    let results = dataRows
      .filter((row) => row && row[0])
      .map((row, i) => rowToQC(row, i + (hasHeader ? 2 : 1)));

    if (batch) {
      results = results.filter((r) =>
        r.batchCode.toLowerCase().includes(batch.toLowerCase())
      );
    }
    if (status) {
      results = results.filter(
        (r) => r.status.toLowerCase() === status.toLowerCase()
      );
    }

    // Sort by date descending (newest first)
    results.sort((a, b) => b.date.localeCompare(a.date));

    const total = results.length;
    const passed = results.filter((r) => r.status === "Pass").length;
    const failed = results.filter((r) => r.status === "Fail").length;
    const conditional = results.filter((r) => r.status === "Conditional").length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    if (limit) {
      const lim = parseInt(limit, 10);
      if (!isNaN(lim) && lim > 0) {
        results = results.slice(0, lim);
      }
    }

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      summary: { total, passed, failed, conditional, passRate },
      count: results.length,
      data: results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch QC results", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Seed action
    if (body.action === "seed") {
      return handleSeed();
    }

    // Submit QC
    const {
      batchCode, productionId, date, inspector,
      aromaScore, warnaScore, kejernihanScore,
      packagingScore, sealIntegrityScore,
      notes, followUpRequired,
    } = body;

    if (!batchCode) {
      return NextResponse.json(
        { error: "Missing required field: batchCode" },
        { status: 400 }
      );
    }

    const aroma = Number(aromaScore) || 0;
    const warna = Number(warnaScore) || 0;
    const kejernihan = Number(kejernihanScore) || 0;
    const packaging = Number(packagingScore) || 0;
    const seal = Number(sealIntegrityScore) || 0;

    if ([aroma, warna, kejernihan, packaging, seal].some((s) => s < 1 || s > 10)) {
      return NextResponse.json(
        { error: "All scores must be between 1 and 10" },
        { status: 400 }
      );
    }

    const overall = Math.round(((aroma + warna + kejernihan + packaging + seal) / 5) * 100) / 100;
    const status = computeStatus(overall);

    await ensureHeader();

    const resultId = `QC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const now = date || new Date().toISOString().slice(0, 10);
    const followUp = followUpRequired === true || followUpRequired === "Yes" ? "Yes" : "No";

    const row: (string | number)[] = [
      resultId,
      batchCode,
      productionId || "",
      now,
      inspector || "system",
      aroma,
      warna,
      kejernihan,
      packaging,
      seal,
      overall,
      status,
      notes || "",
      followUp,
    ];

    await appendRows(SHEET_NAME, [row]);

    return NextResponse.json(
      {
        source: `Google Sheets: ${SHEET_NAME}`,
        sourceStatus: "live",
        message: "QC result submitted successfully",
        data: rowToQC(row as string[], 0),
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      googleWorkspaceWriteBlockedSource(SHEET_NAME, error),
      { status: 500 }
    );
  }
}

async function handleSeed() {
  try {
    await ensureHeader();

    const raw = await readSheet(SHEET_NAME);
    const hasHeader = raw.length > 0 && raw[0][0] === "Result ID";
    const dataRows = hasHeader ? raw.slice(1) : raw;
    const existing = dataRows.filter((r) => r && r[0]);

    // Check existing to avoid duplicates
    const existingBatchCodes = new Set(existing.map((r) => r[1]));

    const seedData: (string | number)[][] = [
      // Pass 1
      [
        "QC-2026-001-PASS",
        "BATCH-2026-06-01-AB100",
        "PROD-2026-001",
        "2026-06-15",
        "Ahmad Rizki",
        8, 9, 8, 7, 8,
        8.0, "Pass",
        "Aroma sesuai spec, warna konsisten",
        "No",
      ],
      // Pass 2
      [
        "QC-2026-002-PASS",
        "BATCH-2026-06-02-CD200",
        "PROD-2026-002",
        "2026-06-16",
        "Siti Nurhaliza",
        9, 8, 9, 8, 9,
        8.6, "Pass",
        "Semua parameter excellent",
        "No",
      ],
      // Pass 3
      [
        "QC-2026-003-PASS",
        "BATCH-2026-06-03-EF300",
        "PROD-2026-003",
        "2026-06-17",
        "Budi Santoso",
        7, 7, 8, 7, 7,
        7.2, "Pass",
        "Minor note: label agak miring",
        "No",
      ],
      // Fail
      [
        "QC-2026-004-FAIL",
        "BATCH-2026-06-04-GH400",
        "PROD-2026-004",
        "2026-06-18",
        "Ahmad Rizki",
        4, 3, 4, 5, 3,
        3.8, "Fail",
        "Aroma off-note, warna tidak sesuai, seal bocor",
        "Yes",
      ],
      // Conditional
      [
        "QC-2026-005-COND",
        "BATCH-2026-06-05-IJ500",
        "PROD-2026-005",
        "2026-06-19",
        "Dewi Lestari",
        6, 5, 6, 5, 6,
        5.6, "Conditional",
        "Kejernihan perlu improvement, packaging OK",
        "Yes",
      ],
    ];

    let seeded = 0;
    let skipped = 0;

    for (const row of seedData) {
      const batchCode = String(row[1]);
      if (existingBatchCodes.has(batchCode)) {
        skipped++;
        continue;
      }
      await appendRows(SHEET_NAME, [row]);
      seeded++;
    }

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      message: `Seed complete: ${seeded} added, ${skipped} skipped (already exist)`,
      seeded,
      skipped,
    });
  } catch (error) {
    return NextResponse.json(
      googleWorkspaceWriteBlockedSource(SHEET_NAME, error),
      { status: 500 }
    );
  }
}
