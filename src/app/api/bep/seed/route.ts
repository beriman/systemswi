// POST /api/bep/seed — Seed BEP calculations for 3 brands
import { NextRequest, NextResponse } from "next/server";
import { appendRows, readRange } from "@/lib/sheets/sheets-real";
import { calculateBEP, SEED_BEP_CALCULATIONS } from "@/lib/bep/bep-calculations";
import { isGoogleWorkspaceAuthError, googleWorkspaceWriteBlockedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Check if data already exists
    const existing = await readRange("Break_Even_Analysis!A1:J16");
    const hasData = existing.length > 1 && existing.slice(1).some((row) => row.some((cell) => String(cell).trim() !== ""));

    if (hasData) {
      return NextResponse.json({
        success: false,
        message: "BEP data already exists. Clear the sheet first to re-seed.",
        count: existing.length - 1,
      }, { status: 409 });
    }

    const results = [];

    for (const calc of SEED_BEP_CALCULATIONS) {
      const row = [
        calc.id,
        calc.brand,
        calc.product,
        calc.fixedCost,
        calc.variableCostPerUnit,
        calc.sellingPricePerUnit,
        calc.contributionMargin,
        calc.bepUnits,
        calc.bepRevenue,
        calc.currentSales,
        calc.marginOfSafety,
        calc.profit,
        new Date().toISOString().split("T")[0],
      ];

      await appendRows("BreakEven", [row]);
      results.push(calc);
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${results.length} BEP calculations`,
      data: results,
    }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource("Google Sheets: Break_Even_Analysis", error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to seed BEP data", details: String(error) }, { status: 500 });
  }
}
