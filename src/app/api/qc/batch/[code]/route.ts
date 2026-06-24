// GET /api/qc/batch/[code] — QC history per batch code
import { NextRequest, NextResponse } from "next/server";
import { readSheet, SHEETS } from "@/lib/sheets/sheets-real";

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

    // Also try to get batch info from ProductBatches
    let batchInfo: Record<string, string> = {};
    try {
      const pbRaw = await readSheet("ProductBatches");
      const pbHasHeader = pbRaw.length > 0;
      const pbData = pbHasHeader ? pbRaw.slice(1) : pbRaw;
      const batchRow = pbData.find((row: string[]) => row && row[0] === code);
      if (batchRow) {
        batchInfo = {
          batchCode: batchRow[0] || "",
          product: batchRow[1] || batchRow[2] || "",
          brand: batchRow[3] || "",
          productionDate: batchRow[4] || "",
          quantity: batchRow[5] || "",
        };
      }
    } catch {
      // ProductBatches lookup is optional
    }

    // Summary
    const total = results.length;
    const passed = results.filter((r) => r.status === "Pass").length;
    const failed = results.filter((r) => r.status === "Fail").length;
    const conditional = results.filter((r) => r.status === "Conditional").length;
    const avgOverall = total > 0
      ? Math.round(results.reduce((s, r) => s + r.overallScore, 0) / total * 100) / 100
      : 0;
    const latestStatus = results.length > 0 ? results[0].status : "Not Tested";

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      batchCode: code,
      batchInfo,
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
