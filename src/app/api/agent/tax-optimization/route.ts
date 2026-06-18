// Phase 3.5 — Tax Optimization Analysis API
import { NextResponse } from "next/server";
import { analyzeTaxOptimization } from "@/lib/agent/tax-optimization";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await analyzeTaxOptimization();
    return NextResponse.json({
      success: true,
      data: {
        totalCurrentTax: result.totalCurrentTax,
        totalOptimizedTax: result.totalOptimizedTax,
        totalPotentialSaving: result.totalPotentialSaving,
        effectiveTaxRate: result.effectiveTaxRate,
        recommendations: result.recommendations,
        highPriorityItems: result.items
          .filter((i) => i.priority === "high")
          .slice(0, 10)
          .map((i) => ({
            name: i.accountName,
            category: i.category,
            current: i.currentAmount,
            optimized: i.optimizedAmount,
            saving: i.potentialSaving,
            recommendation: i.recommendation,
          })),
        generatedAt: result.generatedAt,
      },
    });
  } catch (error) {
    console.error("[API] Tax optimization error:", error);
    return NextResponse.json(
      { success: false, error: "Tax optimization analysis failed" },
      { status: 500 }
    );
  }
}
