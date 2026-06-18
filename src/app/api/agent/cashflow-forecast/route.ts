// Phase 3.1 — Cashflow Forecast API
import { NextResponse } from "next/server";
import { generateCashflowForecast } from "@/lib/agent/cashflow-forecast";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await generateCashflowForecast();
    return NextResponse.json({
      success: true,
      data: {
        forecastMonths: result.forecast.map((f) => ({
          month: f.month,
          income: f.income,
          expense: f.expense,
          netCashflow: f.netCashflow,
          cumulativeCashflow: f.cumulativeCashflow,
        })),
        confidence: result.confidence,
        avgMonthlyIncome: result.avgMonthlyIncome,
        avgMonthlyExpense: result.avgMonthlyExpense,
        trendSlopeIncome: result.trendSlopeIncome,
        trendSlopeExpense: result.trendSlopeExpense,
        historicalMonths: result.historical.length,
        generatedAt: result.generatedAt,
      },
    });
  } catch (error) {
    console.error("[API] Cashflow forecast error:", error);
    return NextResponse.json(
      { success: false, error: "Cashflow forecast failed" },
      { status: 500 }
    );
  }
}
