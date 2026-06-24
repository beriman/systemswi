// POST /api/qc/seed — Seed sample QC data
import { NextResponse } from "next/server";
import { readRange, appendRows, writeRange } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const HEADER = [
  "Result ID", "Batch Code", "Production ID", "Date", "Inspector",
  "Aroma Score", "Warna Score", "Kejernihan Score",
  "Packaging Score", "Seal Integrity Score", "Overall Score",
  "Status", "Notes", "Follow-up Required",
];

const SEED_DATA = [
  ["QC-260624-A001", "BATCH-2026-06-01-AB100", "PROD-2026-001", "2026-06-15", "Budi Santoso", 9, 8, 9, 8, 9, 8.6, "Pass", "Batch pertama bulan Juni — semua parameter baik", "No"],
  ["QC-260624-A002", "BATCH-2026-06-02-CD200", "PROD-2026-002", "2026-06-16", "Siti Rahayu", 8, 9, 8, 9, 8, 8.4, "Pass", "Kualitas konsisten, aroma sangat baik", "No"],
  ["QC-260624-A003", "BATCH-2026-06-03-EF300", "PROD-2026-003", "2026-06-17", "Budi Santoso", 7, 7, 8, 7, 8, 7.4, "Pass", "Minor: warna sedikit lebih terang dari standar", "No"],
  ["QC-260624-A004", "BATCH-2026-06-04-GH400", "PROD-2026-004", "2026-06-18", "Dewi Lestari", 4, 5, 4, 6, 5, 4.8, "Fail", "Aroma terlalu lemah, kejernihan di bawah standar — perlu review formula", "Yes"],
  ["QC-260624-A005", "BATCH-2026-06-05-IJ500", "PROD-2026-005", "2026-06-19", "Siti Rahayu", 6, 6, 5, 7, 6, 6.0, "Conditional", "Seal integrity perlu perbaikan — botol agak longgar", "Yes"],
];

export async function POST() {
  try {
    const existing = await readRange("QC_Results!A1:N1000");
    const hasHeader = existing && existing.length > 0 && existing[0]?.[0] === "Result ID";
    const hasData = existing && existing.length > (hasHeader ? 1 : 0);

    let seeded = 0;
    let skipped = 0;

    if (!hasData) {
      await writeRange("QC_Results!A1:N1", [HEADER]);
      seeded = HEADER.length;
    }

    const existingIds = new Set<string>();
    if (existing) {
      const startIdx = hasHeader ? 1 : 0;
      for (let i = startIdx; i < existing.length; i++) {
        if (existing[i]?.[0]) existingIds.add(existing[i][0]);
      }
    }

    const newRows = SEED_DATA.filter((row) => {
      if (existingIds.has(row[0])) {
        skipped++;
        return false;
      }
      seeded++;
      return true;
    });

    if (newRows.length > 0) {
      await appendRows("QC_Results", newRows);
    }

    return NextResponse.json({
      success: true,
      seeded: newRows.length,
      skipped,
      message: `Seeded ${newRows.length} QC results (${skipped} already exist)`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to seed QC data", details: String(error) },
      { status: 500 }
    );
  }
}
