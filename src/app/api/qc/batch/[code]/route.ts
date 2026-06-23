// GET /api/qc/batch/[code] — Get QC history per batch
import { NextRequest, NextResponse } from "next/server";
import {
  readQcSheet,
  parseQcRows,
} from "@/lib/qc/sheets";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

const SOURCE = "Google Sheets: QC_Results";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const rows = await readQcSheet();
    const results = parseQcRows(rows);
    const batchResults = results.filter(
      (r) => r.batchCode.toLowerCase() === code.toLowerCase()
    );

    return NextResponse.json({
      source: SOURCE,
      sourceStatus: "live",
      batchCode: code,
      results: batchResults,
      total: batchResults.length,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        results: [],
        total: 0,
      });
    }
    return NextResponse.json(
      { error: "Failed to fetch batch QC history", details: String(error) },
      { status: 500 }
    );
  }
}
