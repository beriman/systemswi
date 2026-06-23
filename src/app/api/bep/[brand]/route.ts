// GET /api/bep/[brand] — Get BEP detail per brand
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const money = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const text = (value: unknown): string => String(value ?? "").trim();

function calcBEP(fixedCost: number, variableCost: number, sellingPrice: number) {
  const contributionMargin = sellingPrice - variableCost;
  if (contributionMargin <= 0) {
    return { contributionMargin: 0, bepUnits: 0, bepRevenue: 0 };
  }
  const bepUnits = Math.ceil(fixedCost / contributionMargin);
  const bepRevenue = bepUnits * sellingPrice;
  return { contributionMargin, bepUnits, bepRevenue };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brand: string }> }
) {
  try {
    const { brand } = await params;
    const decodedBrand = decodeURIComponent(brand);

    const rawRows = await readRange("BEP_Calculations!A1:L1000");
    if (rawRows.length <= 1) {
      return NextResponse.json({
        source: "Google Sheets: BEP_Calculations",
        sourceStatus: "live",
        brand: decodedBrand,
        count: 0,
        data: [],
      });
    }

    const headers = rawRows[0].map((h) => h.toLowerCase().replace(/[\s/]/g, ""));
    const getColIndex = (names: string[]): number => {
      for (const name of names) {
        const i = headers.indexOf(name.toLowerCase().replace(/[\s/]/g, ""));
        if (i >= 0) return i;
      }
      return -1;
    };

    const brandIdx = getColIndex(["brand", "merek"]);
    const fixedCostIdx = getColIndex(["fixedcost", "fixed cost", "biaya tetap"]);
    const varCostIdx = getColIndex(["variablecostperunit", "variable cost/unit", "variable cost"]);
    const priceIdx = getColIndex(["sellingpriceperunit", "selling price/unit", "selling price"]);
    const salesIdx = getColIndex(["currentsales", "current sales", "penjualan saat ini"]);

    const brandRows = rawRows.slice(1).filter((row) => {
      const rowBrand = brandIdx >= 0 ? text(row[brandIdx]) : "";
      return rowBrand.toLowerCase() === decodedBrand.toLowerCase();
    });

    const data = brandRows.map((row, idx) => {
      const fixedCost = fixedCostIdx >= 0 ? money(row[fixedCostIdx]) : 0;
      const variableCost = varCostIdx >= 0 ? money(row[varCostIdx]) : 0;
      const sellingPrice = priceIdx >= 0 ? money(row[priceIdx]) : 0;
      const currentSales = salesIdx >= 0 ? money(row[salesIdx]) : 0;
      const { contributionMargin, bepUnits, bepRevenue } = calcBEP(fixedCost, variableCost, sellingPrice);
      const marginOfSafety = currentSales > 0 ? Math.round(((currentSales - bepUnits) / currentSales) * 100) : 0;
      const profitLoss = (currentSales * contributionMargin) - fixedCost;

      return {
        id: `bep-${idx + 2}`,
        brand: decodedBrand,
        product: text(row[getColIndex(["product", "produk"])]) || "Unknown",
        fixedCost,
        variableCostPerUnit: variableCost,
        sellingPricePerUnit: sellingPrice,
        contributionMargin,
        bepUnits,
        bepRevenue,
        currentSales,
        marginOfSafety,
        profitLoss,
      };
    });

    // Aggregate brand summary
    const totalFixedCost = data.reduce((s, r) => s + r.fixedCost, 0);
    const totalCurrentSales = data.reduce((s, r) => s + r.currentSales, 0);
    const totalProfitLoss = data.reduce((s, r) => s + r.profitLoss, 0);
    const avgMarginOfSafety = data.length > 0 ? Math.round(data.reduce((s, r) => s + r.marginOfSafety, 0) / data.length) : 0;

    return NextResponse.json({
      source: "Google Sheets: BEP_Calculations",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      brand: decodedBrand,
      count: data.length,
      summary: {
        totalFixedCost,
        totalCurrentSales,
        totalProfitLoss,
        avgMarginOfSafety,
        productCount: data.length,
      },
      data,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: BEP_Calculations", error),
        data: [],
      });
    }
    return NextResponse.json({ error: "Failed to fetch brand BEP data", details: String(error) }, { status: 500 });
  }
}
