import { NextResponse } from "next/server";
import { readSheet } from "@/lib/sheets/sheets-real";
import { isGoogleWorkspaceAuthError, googleWorkspaceDegradedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const text = (value: unknown) => String(value ?? "").trim();
const numberValue = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(/[^\d.-]/g, "")) || 0;
  return 0;
};

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

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const rows = await readSheet("QC_Results");
    const results = parseQcRows(rows);
    const batchResults = results.filter(
      (r) => r.batchCode.toLowerCase() === code.toLowerCase()
    );

    if (batchResults.length === 0) {
      return NextResponse.json({
        source: "Google Sheets: QC_Results",
        batchCode: code,
        results: [],
        message: `Tidak ada QC history untuk batch ${code}`,
      });
    }

    const latest = batchResults[batchResults.length - 1];
    const avgOverall = Math.round(
      (batchResults.reduce((s, r) => s + r.overallScore, 0) / batchResults.length) * 100
    ) / 100;

    return NextResponse.json({
      source: "Google Sheets: QC_Results",
      batchCode: code,
      results: batchResults,
      latest,
      avgOverall,
      totalInspections: batchResults.length,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: QC_Results", error),
        results: [],
      });
    }
    return NextResponse.json({ error: "Gagal membaca QC batch history", details: String(error) }, { status: 500 });
  }
}
