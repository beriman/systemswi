// GET /api/bep/[brand] — BEP detail per brand
import { NextRequest, NextResponse } from "next/server";
import { getBEPByBrand } from "@/lib/sheets/bep-sheets";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ brand: string }> }
) {
  try {
    const { brand } = await params;
    const decodedBrand = decodeURIComponent(brand);
    const data = await getBEPByBrand(decodedBrand);

    if (data.length === 0) {
      return NextResponse.json(
        { error: `No BEP data found for brand: ${decodedBrand}` },
        { status: 404 }
      );
    }

    const totalFixedCost = data.reduce((s, r) => s + r.fixedCost, 0);
    const totalProfitLoss = data.reduce((s, r) => s + r.profitLoss, 0);
    const totalCurrentSales = data.reduce((s, r) => s + r.currentSales, 0);

    return NextResponse.json({
      source: "Google Sheets: BEP_Calculations",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      brand: decodedBrand,
      summary: {
        productCount: data.length,
        totalFixedCost,
        totalProfitLoss,
        totalCurrentSales,
        profitable: data.filter((r) => r.profitLoss > 0).length,
        loss: data.filter((r) => r.profitLoss < 0).length,
      },
      products: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch BEP by brand", details: String(error) },
      { status: 500 }
    );
  }
}
