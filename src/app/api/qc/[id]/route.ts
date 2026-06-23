// GET /api/qc/[id] — Get QC result detail
// PUT /api/qc/[id] — Update QC result
import { NextRequest, NextResponse } from "next/server";
import {
  readQcSheet,
  parseQcRows,
  updateQcRow,
  calcOverallScore,
  calcStatus,
  type QcResult,
} from "@/lib/qc/sheets";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

const SOURCE = "Google Sheets: QC_Results";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await readQcSheet();
    const results = parseQcRows(rows);
    const result = results.find((r) => r.id === id);

    if (!result) {
      return NextResponse.json({ error: "QC result not found" }, { status: 404 });
    }

    return NextResponse.json({ source: SOURCE, sourceStatus: "live", result });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        result: null,
      });
    }
    return NextResponse.json(
      { error: "Failed to fetch QC detail", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const rows = await readQcSheet();
    const results = parseQcRows(rows);
    const existing = results.find((r) => r.id === id);

    if (!existing) {
      return NextResponse.json({ error: "QC result not found" }, { status: 404 });
    }

    const aromaScore = body.aromaScore !== undefined
      ? Math.min(10, Math.max(1, Number(body.aromaScore)))
      : existing.aromaScore;
    const warnaScore = body.warnaScore !== undefined
      ? Math.min(10, Math.max(1, Number(body.warnaScore)))
      : existing.warnaScore;
    const kejernihanScore = body.kejernihanScore !== undefined
      ? Math.min(10, Math.max(1, Number(body.kejernihanScore)))
      : existing.kejernihanScore;
    const packagingScore = body.packagingScore !== undefined
      ? Math.min(10, Math.max(1, Number(body.packagingScore)))
      : existing.packagingScore;
    const sealIntegrityScore = body.sealIntegrityScore !== undefined
      ? Math.min(10, Math.max(1, Number(body.sealIntegrityScore)))
      : existing.sealIntegrityScore;

    const overallScore = calcOverallScore(
      aromaScore, warnaScore, kejernihanScore, packagingScore, sealIntegrityScore
    );
    const status = calcStatus(overallScore);
    const followUpRequired: "Yes" | "No" = status !== "Pass" ? "Yes" : "No";

    const updated: Omit<QcResult, "row"> = {
      id,
      batchCode: body.batchCode || existing.batchCode,
      productionId: body.productionId || existing.productionId,
      date: body.date || existing.date,
      inspector: body.inspector || existing.inspector,
      aromaScore,
      warnaScore,
      kejernihanScore,
      packagingScore,
      sealIntegrityScore,
      overallScore,
      status,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      followUpRequired,
    };

    await updateQcRow(existing.row, updated);

    return NextResponse.json({
      success: true,
      result: { ...updated, row: existing.row },
      message: "QC result updated successfully.",
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        sourceStatus: "blocked",
        source: SOURCE,
        error: "Google Workspace OAuth perlu re-auth sebelum bisa update QC",
        details: String(error),
      }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Failed to update QC result", details: String(error) },
      { status: 500 }
    );
  }
}
