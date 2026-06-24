// GET /api/sales/achievement?year=YYYY — Target vs actual achievement per brand
import { NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readRanges } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const SOURCE = "Google Sheets: Sales_Targets + Sales_Actuals";

const text = (v: unknown) => String(v ?? "").trim();
const num = (v: unknown) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v !== "string") return 0;
  return Number(v.replace(/[^\d.-]/g, "")) || 0;
};

export async function GET() {
  try {
    const [targetRows, actualRows] = await Promise.all([
      readRanges(["Sales_Targets!A1:K1000", "Sales_Actuals!A1:J1000"]),
    ]);

    const targets = targetRows["Sales_Targets!A1:K1000"] || [];
    const actuals = actualRows["Sales_Actuals!A1:J1000"] || [];

    // Aggregate targets by brandId
    const targetByBrand: Record<string, { brandName: string; total: number }> = {};
    for (const row of targets.slice(1)) {
      if (!row.some(Boolean)) continue;
      const brandId = text(row[1]) || "unknown";
      const brandName = text(row[2]) || brandId;
      const amount = num(row[5]);
      if (!targetByBrand[brandId]) targetByBrand[brandId] = { brandName, total: 0 };
      targetByBrand[brandId].total += amount;
      targetByBrand[brandId].brandName = brandName;
    }

    // Aggregate actuals by brandId
    const actualByBrand: Record<string, { brandName: string; total: number; units: number }> = {};
    for (const row of actuals.slice(1)) {
      if (!row.some(Boolean)) continue;
      const brandId = text(row[2]) || "unknown";
      const brandName = text(row[3]) || brandId;
      const revenue = num(row[8]);
      const qty = num(row[6]);
      if (!actualByBrand[brandId]) actualByBrand[brandId] = { brandName, total: 0, units: 0 };
      actualByBrand[brandId].total += revenue;
      actualByBrand[brandId].units += qty;
      actualByBrand[brandId].brandName = brandName;
    }

    // Build achievement list
    const allBrandIds = new Set([...Object.keys(targetByBrand), ...Object.keys(actualByBrand)]);
    const brands = Array.from(allBrandIds).map((brandId) => {
      const target = targetByBrand[brandId] || { brandName: brandId, total: 0 };
      const actual = actualByBrand[brandId] || { brandName: target.brandName, total: 0, units: 0 };
      const achievementPct = target.total > 0 ? Math.round((actual.total / target.total) * 100) : 0;
      return {
        brandId,
        brandName: actual.brandName || target.brandName,
        totalTarget: target.total,
        totalActual: actual.total,
        achievementPct,
        totalUnits: actual.units,
        gap: actual.total - target.total,
      };
    }).sort((a, b) => b.achievementPct - a.achievementPct);

    const totalTarget = brands.reduce((s, b) => s + b.totalTarget, 0);
    const totalActual = brands.reduce((s, b) => s + b.totalActual, 0);
    const overallAchievement = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

    return NextResponse.json({
      source: SOURCE,
      sourceStatus: "live",
      summary: {
        totalTarget,
        totalActual,
        overallAchievement,
        brandCount: brands.length,
      },
      brands,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        summary: { totalTarget: 0, totalActual: 0, overallAchievement: 0, brandCount: 0 },
        brands: [],
      });
    }
    return NextResponse.json({ error: "Gagal menghitung achievement", details: String(error) }, { status: 500 });
  }
}
