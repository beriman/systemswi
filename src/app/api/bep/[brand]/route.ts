// GET /api/bep/[brand] — Get BEP detail per brand
import { NextRequest, NextResponse } from "next/server";
import {
  getBEPByBrand,
  seedBEPData,
} from "@/lib/sheets/bep-sheets";
import { isGoogleWorkspaceAuthError, googleWorkspaceDegradedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brand: string }> }
) {
  try {
    await seedBEPData();
    const { brand: brandParam } = await params;
    const brand = decodeURIComponent(brandParam);
    const calculations = await getBEPByBrand(brand);

    if (calculations.length === 0) {
      return NextResponse.json(
        { error: `No BEP calculations found for brand: ${brand}` },
        { status: 404 }
      );
    }

    // Aggregate brand totals
    const totalFixedCost = calculations.reduce((s, c) => s + c.fixedCost, 0);
    const totalCurrentSales = calculations.reduce((s, c) => s + c.currentSales, 0);
    const totalProfitLoss = calculations.reduce((s, c) => s + c.profitLoss, 0);

    return NextResponse.json({
      source: "Google Sheets: BEP_Calculations",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      brand,
      products: calculations,
      summary: {
        totalFixedCost,
        totalCurrentSales,
        totalProfitLoss,
        productCount: calculations.length,
      },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: BEP_Calculations", error),
        brand: params.brand,
        products: [],
      });
    }
    return NextResponse.json(
      { error: "Failed to fetch BEP by brand", details: String(error) },
      { status: 500 }
    );
  }
}
