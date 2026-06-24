// GET /api/qc/[id] — QC detail by resultId
// PUT /api/qc/[id] — Update QC result
import { NextRequest, NextResponse } from "next/server";
import { readSheet, updateRow, SHEETS } from "@/lib/sheets/sheets-real";
import { googleWorkspaceWriteBlockedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const SHEET_NAME = "QC_Results";

function rowToQC(row: string[], rowNumber: number) {
  return {
    resultId: row[0] || "",
    batchCode: row[1] || "",
    productionId: row[2] || "",
    date: row[3] || "",
    inspector: row[4] || "",
    aromaScore: Number(row[5]) || 0,
    warnaScore: Number(row[6]) || 0,
    kejernihanScore: Number(row[7]) || 0,
    packagingScore: Number(row[8]) || 0,
    sealIntegrityScore: Number(row[9]) || 0,
    overallScore: Number(row[10]) || 0,
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const raw = await readSheet(SHEET_NAME);
    const hasHeader = raw.length > 0 && raw[0][0] === "Result ID";
    const dataRows = hasHeader ? raw.slice(1) : raw;

    const found = dataRows.find((row) => row && row[0] === id);
    if (!found) {
      return NextResponse.json(
        { error: `QC result not found: ${id}` },
        { status: 404 }
      );
    }

    const rowNum = dataRows.indexOf(found) + (hasHeader ? 2 : 1);
    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      data: rowToQC(found, rowNum),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch QC detail", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const raw = await readSheet(SHEET_NAME);
    const hasHeader = raw.length > 0 && raw[0][0] === "Result ID";
    const dataRows = hasHeader ? raw.slice(1) : raw;

    const idx = dataRows.findIndex((row) => row && row[0] === id);
    if (idx === -1) {
      return NextResponse.json(
        { error: `QC result not found: ${id}` },
        { status: 404 }
      );
    }

    const rowNum = idx + (hasHeader ? 2 : 1);
    const existing = dataRows[idx];

    // Build updated row — keep existing values for fields not provided
    const aromaScore = body.aromaScore !== undefined ? Number(body.aromaScore) : (Number(existing[5]) || 0);
    const warnaScore = body.warnaScore !== undefined ? Number(body.warnaScore) : (Number(existing[6]) || 0);
    const kejernihanScore = body.kejernihanScore !== undefined ? Number(body.kejernihanScore) : (Number(existing[7]) || 0);
    const packagingScore = body.packagingScore !== undefined ? Number(body.packagingScore) : (Number(existing[8]) || 0);
    const sealIntegrityScore = body.sealIntegrityScore !== undefined ? Number(body.sealIntegrityScore) : (Number(existing[9]) || 0);

    const overall = calcOverall([aromaScore, warnaScore, kejernihanScore, packagingScore, sealIntegrityScore]);
    const status = calcStatus(overall);

    const updatedRow = [
      id,
      body.batchCode ?? existing[1] ?? "",
      body.productionId ?? existing[2] ?? "",
      body.date ?? existing[3] ?? "",
      body.inspector ?? existing[4] ?? "",
      aromaScore,
      warnaScore,
      kejernihanScore,
      packagingScore,
      sealIntegrityScore,
      overall,
      status,
      body.notes ?? existing[12] ?? "",
      body.followUpRequired ? "Yes" : (existing[13] ?? "No"),
    ];

    await updateRow(SHEET_NAME, rowNum, updatedRow);

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      message: "QC result updated successfully",
      data: rowToQC(updatedRow, rowNum),
    });
  } catch (error) {
    return NextResponse.json(
      googleWorkspaceWriteBlockedSource(SHEET_NAME, error),
      { status: 500 }
    );
  }
}
