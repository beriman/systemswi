// Phase 3.3 — Event ROI Analysis API
import { NextResponse } from "next/server";
import { analyzeEventROI } from "@/lib/agent/event-roi";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await analyzeEventROI();
    return NextResponse.json({
      success: true,
      data: {
        totalBudget: result.totalBudget,
        totalRevenue: result.totalRevenue,
        overallROI: result.overallROI,
        avgPerformanceScore: result.avgPerformanceScore,
        bestEvent: result.bestEvent,
        worstEvent: result.worstEvent,
        eventCount: result.events.length,
        topEvents: result.events.slice(0, 10).map((e) => ({
          name: e.eventName,
          budget: e.budget,
          revenue: e.actualRevenue,
          roi: e.roi,
          score: e.performanceScore,
          grade: e.grade,
          status: e.status,
        })),
        generatedAt: result.generatedAt,
      },
    });
  } catch (error) {
    console.error("[API] Event ROI error:", error);
    return NextResponse.json(
      { success: false, error: "Event ROI analysis failed" },
      { status: 500 }
    );
  }
}
