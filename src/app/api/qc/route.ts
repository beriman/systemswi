import { NextRequest, NextResponse } from "next/server";
import { appendRows, readRange, readSheet } from "@/lib/sheets/sheets-real";
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

function makeQcId(existing: string[][]) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const sameDay = existing.filter((row) => row[0]?.startsWith(`QC-${today}`)).length + 1;
  return `QC-${today}-${String(sameDay).padStart(3, "0")}`;
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

export async function GET(request: NextRequest) {
  try {
    const rows = await readSheet("QC_Results");
    const results = parseQcRows(rows);

    // Optional filters
    const { searchParams } = new URL(request.url);
    const batch = searchParams.get("batch");
    const status = searchParams.get("status");

    let filtered = results;
    if (batch) filtered = filtered.filter((r) => r.batchCode.toLowerCase().includes(batch.toLowerCase()));
    if (status) filtered = filtered.filter((r) => r.status.toLowerCase() === status.toLowerCase());

    const total = results.length;
    const passed = results.filter((r) => r.status === "Pass").length;
    const failed = results.filter((r) => r.status === "Fail").length;
    const conditional = results.filter((r) => r.status === "Conditional").length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    return NextResponse.json({
      source: "Google Sheets: QC_Results",
      results: filtered,
      summary: { total, passed, failed, conditional, passRate },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: QC_Results", error),
        results: [],
        summary: { total: 0, passed: 0, failed: 0, conditional: 0, passRate: 0 },
      });
    }
    return NextResponse.json({ error: "Gagal membaca QC results", details: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = text(body.action);

    if (action === "submit-qc") {
      const batchCode = text(body.batchCode);
      const productionId = text(body.productionId);
      const inspector = text(body.inspector) || "HemuHemu/OWL";
      const aromaScore = numberValue(body.aromaScore);
      const warnaScore = numberValue(body.warnaScore);
      const kejernihanScore = numberValue(body.kejernihanScore);
      const packagingScore = numberValue(body.packagingScore);
      const sealIntegrityScore = numberValue(body.sealIntegrityScore);
      const notes = text(body.notes);

      if (!batchCode) return NextResponse.json({ error: "batchCode wajib diisi" }, { status: 400 });
      if (aromaScore < 1 || aromaScore > 10) return NextResponse.json({ error: "aromaScore harus 1-10" }, { status: 400 });
      if (warnaScore < 1 || warnaScore > 10) return NextResponse.json({ error: "warnaScore harus 1-10" }, { status: 400 });
      if (kejernihanScore < 1 || kejernihanScore > 10) return NextResponse.json({ error: "kejernihanScore harus 1-10" }, { status: 400 });
      if (packagingScore < 1 || packagingScore > 10) return NextResponse.json({ error: "packagingScore harus 1-10" }, { status: 400 });
      if (sealIntegrityScore < 1 || sealIntegrityScore > 10) return NextResponse.json({ error: "sealIntegrityScore harus 1-10" }, { status: 400 });

      const overallScore = calcOverall([aromaScore, warnaScore, kejernihanScore, packagingScore, sealIntegrityScore]);
      const status = calcStatus(overallScore);
      const followUpRequired = status !== "Pass" ? "Yes" : "No";

      // Generate ID
      const existingRows = await readSheet("QC_Results");
      const qcId = makeQcId(existingRows);
      const date = text(body.date) || new Date().toISOString().slice(0, 10);

      const row = [
        qcId,
        batchCode,
        productionId,
        date,
        inspector,
        aromaScore,
        warnaScore,
        kejernihanScore,
        packagingScore,
        sealIntegrityScore,
        overallScore,
        status,
        notes,
        followUpRequired,
      ];

      await appendRows("QC_Results", [row]);

      return NextResponse.json({
        success: true,
        action,
        result: { id: qcId, batchCode, overallScore, status, followUpRequired },
        syncedSheets: ["QC_Results"],
      }, { status: 201 });
    }

    if (action === "seed") {
      // Seed 5 QC results
      const existingRows = await readSheet("QC_Results");
      const seedData = [
        ["QC-20260623-001", "BATCH-001", "PROD-001", "2026-06-20", "Ahmad QC", 8, 9, 8, 7, 8, 8, "Pass", "Batch pertama — semua parameter baik", "No"],
        ["QC-20260623-002", "BATCH-002", "PROD-002", "2026-06-21", "Siti QC", 9, 8, 9, 8, 9, 8.6, "Pass", "Aroma sangat baik, warna konsisten", "No"],
        ["QC-20260623-003", "BATCH-003", "PROD-003", "2026-06-22", "Budi QC", 7, 7, 8, 6, 7, 7, "Pass", "Minor issue pada packaging seal", "No"],
        ["QC-20260623-004", "BATCH-004", "PROD-004", "2026-06-22", "Ahmad QC", 4, 5, 4, 5, 4, 4.4, "Fail", "Aroma tidak standar, warna tidak konsisten — perlu rework", "Yes"],
        ["QC-20260623-005", "BATCH-005", "PROD-005", "2026-06-23", "Siti QC", 6, 6, 5, 6, 5, 5.6, "Conditional", "Kejernihan perlu improvement, packaging minor defect", "Yes"],
      ];

      // Check if already seeded
      const existingIds = new Set(existingRows.slice(1).map((r) => text(r[0])));
      const newRows = seedData.filter((r) => !existingIds.has(r[0]));

      if (newRows.length > 0) {
        await appendRows("QC_Results", newRows);
      }

      return NextResponse.json({
        success: true,
        action: "seed",
        seeded: newRows.length,
        total: seedData.length,
        syncedSheets: ["QC_Results"],
      }, { status: 201 });
    }

    return NextResponse.json({ error: "action tidak valid. Pilih: submit-qc, seed" }, { status: 400 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource("Google Sheets: QC_Results", error),
        error: "Google Workspace OAuth perlu re-auth sebelum bisa menyimpan QC result.",
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Gagal menyimpan QC result", details: String(error) }, { status: 500 });
  }
}
