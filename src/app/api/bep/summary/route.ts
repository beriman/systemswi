// GET /api/bep/summary — Get overall profitability summary
import { NextRequest, NextResponse } from "next/server";
import { getBEPSummary } from "@/lib/sheets/bep-sheets";
import { isGoogleWorkspaceAuthError, googleWorkspaceDegradedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

export async function GET() {
  try {
    const summary = await getBEPSummary();

    return NextResponse.json({
      source: "Google Sheets: BEP_Calculations",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      ...summary,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: BEP_Calculations", error),
        brands: [],
        totalFixedCosts: 0,
        totalProfitLoss: 0,
        profitableCount: 0,
        lossCount: 0,
      });
    }
    return NextResponse.json(
      { error: "Failed to fetch BEP summary", details: String(error) },
      { status: 500 }
    );
  }
}
