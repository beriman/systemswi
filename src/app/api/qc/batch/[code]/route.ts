// GET /api/qc/batch/[code] — Get QC history per batch
import { NextRequest, NextResponse } from "next/server";
import { readSheet } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const SHEET_NAME = "QC_Results";

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
    status: row[11] || (overall >= 7 ? "Pass" : overall >= 5 ? "Conditional" : "Fail"),
    notes: row[12] || "",
    followUpRequired: row[13] || "No",
    rowNumber,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const raw = await readSheet(SHEET_NAME);
    const hasHeader = raw.length > 0 && raw[0][0] === "Result ID";
    const dataRows = hasHeader ? raw.slice(1) : raw;

    const results = dataRows
      .filter((row) => row && row[0] && row[1] === code)
      .map((row, i) => rowToQC(row, i + (hasHeader ? 2 : 1)));

    // Sort by date descending
    results.sort((a, b) => b.date.localeCompare(a.date));

    const total = results.length;
    const passed = results.filter((r) => r.status === "Pass").length;
    const failed = results.filter((r) => r.status === "Fail").length;
    const conditional = results.filter((r) => r.status === "Conditional").length;
    const avgOverall = total > 0 ? Math.round((results.reduce((s, r) => s + r.overallScore, 0) / total) * 100) / 100 : 0;
    const latestStatus = results.length > 0 ? results[0].status : "N/A";

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      batchCode: code,
      summary: { total, passed, failed, conditional, avgOverall, latestStatus },
      count: results.length,
      data: results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch batch QC history", details: String(error) },
      { status: 500 }
    );
  }
}
