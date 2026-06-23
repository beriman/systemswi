// GET /api/qc — List QC results (filter: batch, status)
// POST /api/qc — Submit QC result or seed data
import { NextRequest, NextResponse } from "next/server";
import {
  readQcSheet,
  parseQcRows,
  appendQcRow,
  calcOverallScore,
  calcStatus,
  generateId,
  seedQcData,
  computeSummary,
  type QcResult,
} from "@/lib/qc/sheets";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

const SOURCE = "Google Sheets: QC_Results";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const batch = url.searchParams.get("batch") || "";
    const status = url.searchParams.get("status") || "";

    const rows = await readQcSheet();
    let results = parseQcRows(rows);

    // Apply filters
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

    const summary = computeSummary(results);

    return NextResponse.json({
      source: SOURCE,
      sourceStatus: "live",
      results,
      summary,
      total: results.length,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        results: [],
        summary: { total: 0, passed: 0, failed: 0, conditional: 0, passRate: 0 },
        total: 0,
      });
    }
    return NextResponse.json(
      { error: "Failed to fetch QC results", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Seed action
    if (body.action === "seed") {
      const seeded = await seedQcData();
      return NextResponse.json({
        success: true,
        seeded,
        message: `${seeded} QC results seeded successfully.`,
      }, { status: 201 });
    }

    // Submit QC
    const id = generateId();
    const date = body.date || today();
    const batchCode = body.batchCode || "";
    const productionId = body.productionId || "";
    const inspector = body.inspector || "HemuHemu/OWL";
    const aromaScore = Math.min(10, Math.max(1, Number(body.aromaScore) || 5));
    const warnaScore = Math.min(10, Math.max(1, Number(body.warnaScore) || 5));
    const kejernihanScore = Math.min(10, Math.max(1, Number(body.kejernihanScore) || 5));
    const packagingScore = Math.min(10, Math.max(1, Number(body.packagingScore) || 5));
    const sealIntegrityScore = Math.min(10, Math.max(1, Number(body.sealIntegrityScore) || 5));
    const notes = body.notes || "";

    const overallScore = calcOverallScore(
      aromaScore, warnaScore, kejernihanScore, packagingScore, sealIntegrityScore
    );
    const status = calcStatus(overallScore);
    const followUpRequired: "Yes" | "No" = status !== "Pass" ? "Yes" : "No";

    const result: Omit<QcResult, "row"> = {
      id,
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
    };

    await appendQcRow(result);

    return NextResponse.json({
      success: true,
      result,
      message: `QC submitted: ${id} — Overall: ${overallScore} (${status})`,
    }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        sourceStatus: "blocked",
        source: SOURCE,
        error: "Google Workspace OAuth perlu re-auth sebelum bisa submit QC",
        details: String(error),
      }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Failed to submit QC result", details: String(error) },
      { status: 500 }
    );
  }
}
