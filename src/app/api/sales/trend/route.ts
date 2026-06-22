// GET /api/sales/trend — Month-over-month trend analysis
// Returns target vs actual per month with MoM growth %
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";

function n(value: unknown): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  return Number(cleaned) || 0;
}

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") || String(new Date().getFullYear());
    const brandId = searchParams.get("brandId") || "";

    // Read targets
    const targetRows = await readRange("Sales_Targets!A1:K1000");
    // Read actuals
    const actualRows = await readRange("Sales_Actuals!A1:J1000");

    // Monthly aggregation
    const monthlyData: Record<string, Record<number, { target: number; actual: number }>> = {};

    // Process targets
    if (targetRows && targetRows.length > 1) {
      for (let i = 1; i < targetRows.length; i++) {
        const r = targetRows[i];
        if (!r[0]) continue;
        if (String(r[3]) !== year) continue;
        const bId = r[1] || "";
        if (brandId && bId !== brandId) continue;
        const month = Number(r[4]) || 0;
        if (month < 1 || month > 12) continue;
        if (!monthlyData[bId]) monthlyData[bId] = {};
        if (!monthlyData[bId][month]) monthlyData[bId][month] = { target: 0, actual: 0 };
        monthlyData[bId][month].target += n(r[5]);
      }
    }

    // Process actuals
    if (actualRows && actualRows.length > 1) {
      for (let i = 1; i < actualRows.length; i++) {
        const r = actualRows[i];
        if (!r[0]) continue;
        const date = r[1] || "";
        const parts = date.split("-");
        if (parts.length < 2) continue;
        if (parts[0] !== year) continue;
        const bId = r[2] || "";
        if (brandId && bId !== brandId) continue;
        const month = Number(parts[1]) || 0;
        if (month < 1 || month > 12) continue;
        if (!monthlyData[bId]) monthlyData[bId] = {};
        if (!monthlyData[bId][month]) monthlyData[bId][month] = { target: 0, actual: 0 };
        monthlyData[bId][month].actual += n(r[7]);
      }
    }

    // Build trend data per brand
    const brandTrends: Record<string, {
      brandId: string;
      brandName: string;
      monthly: {
        month: number;
        monthName: string;
        target: number;
        actual: number;
        achievementPct: number;
        momGrowthPct: number | null;
      }[];
      totalTarget: number;
      totalActual: number;
      overallAchievementPct: number;
    }> = {};

    // Get brand names from targets
    const brandNames: Record<string, string> = {};
    if (targetRows && targetRows.length > 1) {
      for (let i = 1; i < targetRows.length; i++) {
        if (targetRows[i][1] && targetRows[i][2]) {
          brandNames[targetRows[i][1]] = targetRows[i][2];
        }
      }
    }

    for (const [bId, months] of Object.entries(monthlyData)) {
      const monthly = [];
      let totalTarget = 0;
      let totalActual = 0;
      let prevActual: number | null = null;

      for (let m = 1; m <= 12; m++) {
        const data = months[m] || { target: 0, actual: 0 };
        const achievementPct = data.target > 0
          ? Math.round((data.actual / data.target) * 10000) / 100
          : 0;
        let momGrowthPct: number | null = null;
        if (prevActual !== null && prevActual > 0 && data.actual > 0) {
          momGrowthPct = Math.round(((data.actual - prevActual) / prevActual) * 10000) / 100;
        }
        if (data.actual > 0) prevActual = data.actual;

        monthly.push({
          month: m,
          monthName: MONTH_NAMES[m],
          target: data.target,
          actual: data.actual,
          achievementPct,
          momGrowthPct,
        });
        totalTarget += data.target;
        totalActual += data.actual;
      }

      brandTrends[bId] = {
        brandId: bId,
        brandName: brandNames[bId] || bId,
        monthly,
        totalTarget,
        totalActual,
        overallAchievementPct: totalTarget > 0
          ? Math.round((totalActual / totalTarget) * 10000) / 100
          : 0,
      };
    }

    // Aggregate all brands for combined trend
    const combinedMonthly: { month: number; monthName: string; target: number; actual: number; achievementPct: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      let tTarget = 0;
      let tActual = 0;
      for (const brand of Object.values(brandTrends)) {
        const bm = brand.monthly.find((x) => x.month === m);
        if (bm) {
          tTarget += bm.target;
          tActual += bm.actual;
        }
      }
      combinedMonthly.push({
        month: m,
        monthName: MONTH_NAMES[m],
        target: tTarget,
        actual: tActual,
        achievementPct: tTarget > 0 ? Math.round((tActual / tTarget) * 10000) / 100 : 0,
      });
    }

    return NextResponse.json({
      year: Number(year),
      brandTrends: Object.values(brandTrends),
      combinedMonthly,
      source: "sheets",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to compute trend", details: String(error) },
      { status: 500 }
    );
  }
}
