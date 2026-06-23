// GET /api/cash-harian/summary — Period summary
import { NextRequest, NextResponse } from "next/server";
import { getPeriodSummary, ensureCashHarianInitialized } from "@/lib/sheets/cash-harian-sheets";
import { isGoogleWorkspaceAuthError, googleWorkspaceDegradedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    await ensureCashHarianInitialized();
    const summary = await getPeriodSummary(startDate, endDate);

    return NextResponse.json({
      source: "Google Sheets: Cash_Harian",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      data: summary,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Cash_Harian", error),
        data: null,
      });
    }
    return NextResponse.json(
      { error: "Failed to fetch cash harian summary", details: String(error) },
      { status: 500 }
    );
  }
}
