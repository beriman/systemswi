// GET /api/sales/achievement — Achievement summary per brand
// Reads Sales_Targets and Sales_Actuals, computes achievement %
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";

function n(value: unknown): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  return Number(cleaned) || 0;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") || String(new Date().getFullYear());

    // Read targets
    const targetRows = await readRange("Sales_Targets!A1:K1000");
    // Read actuals
    const actualRows = await readRange("Sales_Actuals!A1:J1000");

    // Parse targets for the requested year
    const targets: Record<string, { brandId: string; brandName: string; year: number; month: number; targetAmount: number }> = {};
    if (targetRows && targetRows.length > 1) {
      for (let i = 1; i < targetRows.length; i++) {
        const r = targetRows[i];
        if (!r[0]) continue;
        const y = Number(r[3]);
        if (y !== Number(year)) continue;
        const key = `${r[1]}_${r[3]}_${r[4]}`; // brandId_year_month
        targets[key] = {
          brandId: r[1] || "",
          brandName: r[2] || "",
          year: y,
          month: Number(r[4]) || 0,
          targetAmount: n(r[5]),
        };
      }
    }

    // Aggregate actuals by brand/year/month
    const actualsAgg: Record<string, number> = {};
    if (actualRows && actualRows.length > 1) {
      for (let i = 1; i < actualRows.length; i++) {
        const r = actualRows[i];
        if (!r[0]) continue;
        const date = r[1] || "";
        const parts = date.split("-");
        if (parts.length < 2) continue;
        const y = parts[0];
        const m = parts[1];
        if (y !== year) continue;
        const key = `${r[2]}_${y}_${m}`;
        actualsAgg[key] = (actualsAgg[key] || 0) + n(r[7]);
      }
    }

    // Build achievement summary per brand
    const brandSummary: Record<string, {
      brandId: string;
      brandName: string;
      totalTarget: number;
      totalActual: number;
      achievementPct: number;
      months: { month: number; target: number; actual: number; achievementPct: number }[];
    }> = {};

    for (const [key, target] of Object.entries(targets)) {
      const actual = actualsAgg[key] || 0;
      const pct = target.targetAmount > 0
        ? Math.round((actual / target.targetAmount) * 10000) / 100
        : 0;

      if (!brandSummary[target.brandId]) {
        brandSummary[target.brandId] = {
          brandId: target.brandId,
          brandName: target.brandName,
          totalTarget: 0,
          totalActual: 0,
          achievementPct: 0,
          months: [],
        };
      }
      brandSummary[target.brandId].totalTarget += target.targetAmount;
      brandSummary[target.brandId].totalActual += actual;
      brandSummary[target.brandId].months.push({
        month: target.month,
        target: target.targetAmount,
        actual,
        achievementPct: pct,
      });
    }

    // Calculate overall achievement per brand
    for (const brand of Object.values(brandSummary)) {
      brand.achievementPct = brand.totalTarget > 0
        ? Math.round((brand.totalActual / brand.totalTarget) * 10000) / 100
        : 0;
      brand.months.sort((a, b) => a.month - b.month);
    }

    const summary = Object.values(brandSummary).sort((a, b) => b.achievementPct - a.achievementPct);

    // Grand totals
    const grandTotalTarget = summary.reduce((s, b) => s + b.totalTarget, 0);
    const grandTotalActual = summary.reduce((s, b) => s + b.totalActual, 0);
    const grandAchievementPct = grandTotalTarget > 0
      ? Math.round((grandTotalActual / grandTotalTarget) * 10000) / 100
      : 0;

    return NextResponse.json({
      year: Number(year),
      brands: summary,
      grandTotal: {
        target: grandTotalTarget,
        actual: grandTotalActual,
        achievementPct: grandAchievementPct,
      },
      source: "sheets",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to compute achievement", details: String(error) },
      { status: 500 }
    );
  }
}
