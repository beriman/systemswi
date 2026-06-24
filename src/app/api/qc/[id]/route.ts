// GET /api/qc/[id] — Get QC result detail
// PUT /api/qc/[id] — Update QC result
import { NextRequest, NextResponse } from "next/server";
import { readSheet, updateRow } from "@/lib/sheets/sheets-real";
import { googleWorkspaceWriteBlockedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const SHEET_NAME = "QC_Results";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const data = rowToQC(dataRows[idx], idx + (hasHeader ? 2 : 1));
    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch QC result", details: String(error) },
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

    const aroma = body.aromaScore !== undefined ? Number(body.aromaScore) : Number(existing[5]) || 0;
    const warna = body.warnaScore !== undefined ? Number(body.warnaScore) : Number(existing[6]) || 0;
    const kejernihan = body.kejernihanScore !== undefined ? Number(body.kejernihanScore) : Number(existing[7]) || 0;
    const packaging = body.packagingScore !== undefined ? Number(body.packagingScore) : Number(existing[8]) || 0;
    const seal = body.sealIntegrityScore !== undefined ? Number(body.sealIntegrityScore) : Number(existing[9]) || 0;
    const overall = Math.round(((aroma + warna + kejernihan + packaging + seal) / 5) * 100) / 100;
    const status = computeStatus(overall);

    const updatedRow = [
      id,
      body.batchCode ?? existing[1] ?? "",
      body.productionId ?? existing[2] ?? "",
      body.date ?? existing[3] ?? "",
      body.inspector ?? existing[4] ?? "",
      aroma,
      warna,
      kejernihan,
      packaging,
      seal,
      overall,
      status,
      body.notes ?? existing[12] ?? "",
      body.followUpRequired === true || body.followUpRequired === "Yes" ? "Yes" : (existing[13] || "No"),
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
