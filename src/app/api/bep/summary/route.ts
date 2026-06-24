// GET /api/bep/summary — Overall profitability summary
import { NextRequest, NextResponse } from "next/server";
import { getBEPSummary } from "@/lib/sheets/bep-sheets";

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
    return NextResponse.json(
      { error: "Failed to fetch BEP summary", details: String(error) },
      { status: 500 }
    );
  }
}
