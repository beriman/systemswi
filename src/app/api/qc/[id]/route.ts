import { NextRequest, NextResponse } from "next/server";
import { readSheet, writeRange } from "@/lib/sheets/sheets-real";
import { isGoogleWorkspaceAuthError, googleWorkspaceDegradedSource, googleWorkspaceWriteBlockedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const text = (value: unknown) => String(value ?? "").trim();
const numberValue = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(/[^\d.-]/g, "")) || 0;
  return 0;
};

function calcOverall(scores: number[]) {
  if (scores.length === 0) return 0;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
}

function calcStatus(overall: number) {
  if (overall >= 7) return "Pass";
  if (overall >= 5) return "Conditional";
  return "Fail";
}

function parseQcRows(rows: string[][]) {
  if (!rows || rows.length <= 1) return [];
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row, index) => ({
    id: text(row[0]),
    batchCode: text(row[1]),
    productionId: text(row[2]),
    date: text(row[3]),
    inspector: text(row[4]),
    aromaScore: numberValue(row[5]),
    warnaScore: numberValue(row[6]),
    kejernihanScore: numberValue(row[7]),
    packagingScore: numberValue(row[8]),
    sealIntegrityScore: numberValue(row[9]),
    overallScore: numberValue(row[10]),
    status: text(row[11]),
    notes: text(row[12]),
    followUpRequired: text(row[13]),
    rowNumber: index + 2,
  }));
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await readSheet("QC_Results");
    const results = parseQcRows(rows);
    const found = results.find((r) => r.id.toLowerCase() === id.toLowerCase());

    if (!found) {
      return NextResponse.json({ error: `QC result dengan ID ${id} tidak ditemukan` }, { status: 404 });
    }

    return NextResponse.json({
      source: "Google Sheets: QC_Results",
      result: found,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: QC_Results", error),
      });
    }
    return NextResponse.json({ error: "Gagal membaca QC detail", details: String(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const rows = await readSheet("QC_Results");
    const results = parseQcRows(rows);
    const found = results.find((r) => r.id.toLowerCase() === id.toLowerCase());

    if (!found) {
      return NextResponse.json({ error: `QC result dengan ID ${id} tidak ditemukan` }, { status: 404 });
    }

    const aromaScore = body.aromaScore !== undefined ? numberValue(body.aromaScore) : found.aromaScore;
    const warnaScore = body.warnaScore !== undefined ? numberValue(body.warnaScore) : found.warnaScore;
    const kejernihanScore = body.kejernihanScore !== undefined ? numberValue(body.kejernihanScore) : found.kejernihanScore;
    const packagingScore = body.packagingScore !== undefined ? numberValue(body.packagingScore) : found.packagingScore;
    const sealIntegrityScore = body.sealIntegrityScore !== undefined ? numberValue(body.sealIntegrityScore) : found.sealIntegrityScore;
    const overallScore = calcOverall([aromaScore, warnaScore, kejernihanScore, packagingScore, sealIntegrityScore]);
    const status = calcStatus(overallScore);

    const row = [
      found.id,
      text(body.batchCode) || found.batchCode,
      text(body.productionId) || found.productionId,
      text(body.date) || found.date,
      text(body.inspector) || found.inspector,
      aromaScore,
      warnaScore,
      kejernihanScore,
      packagingScore,
      sealIntegrityScore,
      overallScore,
      status,
      text(body.notes) || found.notes,
      status !== "Pass" ? "Yes" : "No",
    ];

    await writeRange(`QC_Results!A${found.rowNumber}:N${found.rowNumber}`, [row]);

    return NextResponse.json({
      success: true,
      result: { id: found.id, overallScore, status },
      syncedSheets: ["QC_Results"],
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource("Google Sheets: QC_Results", error),
        error: "Google Workspace OAuth perlu re-auth sebelum bisa update QC result.",
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Gagal update QC result", details: String(error) }, { status: 500 });
  }
}
