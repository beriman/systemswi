// GET /api/bep/[brand] — Get BEP detail for a specific brand
import { NextRequest, NextResponse } from "next/server";
import { getBEPByBrand } from "@/lib/sheets/bep-sheets";
import { isGoogleWorkspaceAuthError, googleWorkspaceDegradedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brand: string }> }
) {
  try {
    const { brand } = await params;
    const decodedBrand = decodeURIComponent(brand);

    const calculations = await getBEPByBrand(decodedBrand);

    if (calculations.length === 0) {
      return NextResponse.json({
        source: "Google Sheets: BEP_Calculations",
        sourceStatus: "live",
        generatedAt: new Date().toISOString(),
        brand: decodedBrand,
        count: 0,
        calculations: [],
        message: `No BEP calculations found for brand: ${decodedBrand}`,
      });
    }

    return NextResponse.json({
      source: "Google Sheets: BEP_Calculations",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      brand: decodedBrand,
      count: calculations.length,
      calculations,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: BEP_Calculations", error),
        calculations: [],
      });
    }
    return NextResponse.json(
      { error: "Failed to fetch BEP by brand", details: String(error) },
      { status: 500 }
    );
  }
}
