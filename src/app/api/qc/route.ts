// GET /api/qc — List QC results (filter: batch, status)
// POST /api/qc — Submit new QC result
import { NextRequest, NextResponse } from "next/server";
import { readSheet, appendRows, SHEETS } from "@/lib/sheets/sheets-real";
import { googleWorkspaceWriteBlockedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const SHEET_NAME = "QC_Results";

// Column order per plan:
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

function rowToQC(row: string[], rowNumber: number) {
  const aroma = Number(row[5]) || 0;
  const warna = Number(row[6]) || 0;
  const kejernihan = Number(row[7]) || 0;
  const packaging = Number(row[8]) || 0;
  const seal = Number(row[9]) || 0;
  const overall = Number(row[10]) || 0;
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
    status: row[11] || "",
    notes: row[12] || "",
    followUpRequired: row[13] || "",
    rowNumber,
  };
}

function calcOverall(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round((sum / scores.length) * 100) / 100;
}

function calcStatus(overall: number): string {
  if (overall >= 7) return "Pass";
  if (overall >= 5) return "Conditional";
  return "Fail";
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
    const batchCode = searchParams.get("batchCode") || "";
    const status = searchParams.get("status") || "";
    const brand = searchParams.get("brand") || "";

    const raw = await readSheet(SHEET_NAME);
    // First row is header if present
    const hasHeader = raw.length > 0 && raw[0][0] === "Result ID";
    const dataRows = hasHeader ? raw.slice(1) : raw;

    let results = dataRows
      .filter((row) => row && row[0])
      .map((row, i) => rowToQC(row, i + (hasHeader ? 2 : 1)));

    if (batchCode) {
      results = results.filter((r) =>
        r.batchCode.toLowerCase().includes(batchCode.toLowerCase())
      );
    }
    if (status) {
      results = results.filter(
        (r) => r.status.toLowerCase() === status.toLowerCase()
      );
    }
    if (brand) {
      // Brand info comes from ProductBatches join — for now filter by batchCode prefix
      results = results.filter((r) =>
        r.batchCode.toLowerCase().includes(brand.toLowerCase())
      );
    }

    // Sort by date descending (newest first)
    results.sort((a, b) => b.date.localeCompare(a.date));

    // Compute summary stats
    const total = results.length;
    const passed = results.filter((r) => r.status === "Pass").length;
    const failed = results.filter((r) => r.status === "Fail").length;
    const conditional = results.filter((r) => r.status === "Conditional").length;
    const passRate = total > 0 ? Math.round((passed / total) * 10000) / 100 : 0;

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
    const {
      batchCode,
      productionId,
      date,
      inspector,
      aromaScore,
      warnaScore,
      kejernihanScore,
      packagingScore,
      sealIntegrityScore,
      notes,
      followUpRequired,
    } = body;

    if (!batchCode) {
      return NextResponse.json(
        { error: "Missing required field: batchCode" },
        { status: 400 }
      );
    }

    // Validate scores (1-10)
    const scores = [aromaScore, warnaScore, kejernihanScore, packagingScore, sealIntegrityScore]
      .map((s) => Number(s) || 0);
    for (const s of scores) {
      if (s < 0 || s > 10) {
        return NextResponse.json(
          { error: "All scores must be between 0 and 10" },
          { status: 400 }
        );
      }
    }

    const overall = calcOverall(scores);
    const status = calcStatus(overall);
    const resultId = `QC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const qcDate = date || new Date().toISOString().slice(0, 10);

    await ensureHeader();

    const newRow = [
      resultId,
      batchCode,
      productionId || "",
      qcDate,
      inspector || "system",
      scores[0],
      scores[1],
      scores[2],
      scores[3],
      scores[4],
      overall,
      status,
      notes || "",
      followUpRequired ? "Yes" : "No",
    ];

    await appendRows(SHEET_NAME, [newRow]);

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      message: "QC result submitted successfully",
      data: rowToQC(newRow, 0),
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      googleWorkspaceWriteBlockedSource(SHEET_NAME, error),
      { status: 500 }
    );
  }
}
