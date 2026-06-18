// Phase 3.2 — Brand Performance API
import { NextResponse } from "next/server";
import { analyzeBrandPerformance } from "@/lib/agent/brand-performance";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await analyzeBrandPerformance();
    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: result.totalRevenue,
        totalExpenses: result.totalExpenses,
        totalProfit: result.totalProfit,
        avgMargin: result.avgMargin,
        topPerformer: result.topPerformer,
        worstPerformer: result.worstPerformer,
        brandCount: result.brands.length,
        topBrands: result.brands.slice(0, 10).map((b) => ({
          name: b.brandName,
          revenue: b.totalRevenue,
          profit: b.profit,
          margin: b.profitMargin,
          roi: b.roi,
          tier: b.tier,
          rank: b.rank,
        })),
        generatedAt: result.generatedAt,
      },
    });
  } catch (error) {
    console.error("[API] Brand performance error:", error);
    return NextResponse.json(
      { success: false, error: "Brand performance analysis failed" },
      { status: 500 }
    );
  }
}
