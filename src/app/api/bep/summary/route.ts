// GET /api/bep/summary — Overall profitability summary
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";
import { calculateBEP, calcSummary, type BEPCalculation } from "@/lib/bep/bep-calculations";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const BEP_RANGE = "Break_Even_Analysis!A1:J16";

function n(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function s(value: unknown): string {
  return String(value ?? "").trim();
}

function parseBEPRows(rows: string[][]): BEPCalculation[] {
  if (rows.length <= 1) return [];
  const headers = rows[0].map((h) => h.toLowerCase().replace(/[\s/_]/g, ""));

  return rows.slice(1)
    .filter((row) => row.some((cell) => s(cell) !== ""))
    .map((row, idx) => {
      const get = (colNames: string[]): string => {
        for (const name of colNames) {
          const normalized = name.toLowerCase().replace(/[\s/_]/g, "");
          const i = headers.indexOf(normalized);
          if (i >= 0 && i < row.length) return row[i];
        }
        return "";
      };

      const fixedCost = n(get(["fixedcost", "fixed cost", "biaya tetap"]));
      const variableCost = n(get(["variablecostperunit", "variable cost", "variablecost", "biaya variabel"]));
      const sellingPrice = n(get(["sellingpriceperunit", "selling price", "sellingprice", "harga jual"]));
      const currentSales = n(get(["currentsales", "current sales", "penjualan saat ini", "sales"]));

      return calculateBEP({
        id: s(get(["id", "calculationid", "calculation id"])) || `bep-${idx + 2}`,
        brand: s(get(["brand", "merek"])) || "Unknown",
        product: s(get(["product", "produk"])) || "Unknown",
        fixedCost,
        variableCostPerUnit: variableCost,
        sellingPricePerUnit: sellingPrice,
        currentSales,
      });
    });
}

export async function GET() {
  try {
    const rawRows = await readRange(BEP_RANGE);
    const calculations = parseBEPRows(rawRows);
    const summary = calcSummary(calculations);

    // Additional aggregate metrics
    const totalRevenue = calculations.reduce(
      (sum, c) => sum + c.currentSales * c.sellingPricePerUnit, 0
    );
    const totalContribution = calculations.reduce(
      (sum, c) => sum + c.currentSales * c.contributionMargin, 0
    );
    const overallMarginOfSafety =
      summary.totalCurrentSales > 0
        ? Math.round(
            ((summary.totalCurrentSales -
              calculations.reduce((s, c) => s + c.bepUnits, 0)) /
              summary.totalCurrentSales) *
              100 *
              100
          ) / 100
        : 0;

    return NextResponse.json({
      source: "Google Sheets: Break_Even_Analysis",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      summary: {
        ...summary,
        totalRevenue,
        totalContribution,
        overallMarginOfSafety,
        avgContributionMargin:
          calculations.length > 0
            ? Math.round(
                calculations.reduce((s, c) => s + c.contributionMargin, 0) /
                  calculations.length
              )
            : 0,
      },
      data: calculations,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Break_Even_Analysis", error),
        summary: { totalFixedCosts: 0, totalCurrentSales: 0, totalProfit: 0, brandsAtBEP: 0, brandsAboveBEP: 0, brandsBelowBEP: 0, brandSummaries: [], totalRevenue: 0, totalContribution: 0, overallMarginOfSafety: 0, avgContributionMargin: 0 },
        data: [],
      });
    }
    return NextResponse.json({ error: "Failed to fetch BEP summary", details: String(error) }, { status: 500 });
  }
}
