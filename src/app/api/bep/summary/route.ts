// GET /api/bep/summary — Overall profitability summary across all brands
import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    const rawRows = await readRange("BEP_Calculations!A1:L1000");

    if (rawRows.length <= 1) {
      return NextResponse.json({
        source: "Google Sheets: BEP_Calculations",
        sourceStatus: "live",
        generatedAt: new Date().toISOString(),
        summary: {
          totalFixedCosts: 0,
          totalProfitLoss: 0,
          totalCurrentSales: 0,
          overallMarginOfSafety: 0,
          brandCount: 0,
          profitableCount: 0,
          atRiskCount: 0,
        },
        brands: [],
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
    const fixedCostIdx = getColIndex(["fixedcost", "fixed cost"]);
    const varCostIdx = getColIndex(["variablecostperunit", "variable cost/unit"]);
    const priceIdx = getColIndex(["sellingpriceperunit", "selling price/unit"]);
    const salesIdx = getColIndex(["currentsales", "current sales"]);
    const profitIdx = getColIndex(["profitloss", "profit/loss", "profit"]);
    const bepUnitsIdx = getColIndex(["bepunits", "bep (units)"]);
    const mosIdx = getColIndex(["marginofsafety", "margin of safety", "mos"]);

    // Aggregate by brand
    const brandMap = new Map<string, {
      fixedCost: number;
      currentSales: number;
      profitLoss: number;
      bepUnits: number;
      marginOfSafety: number;
      productCount: number;
    }>();

    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row.some((cell) => text(cell) !== "")) continue;

      const brand = brandIdx >= 0 ? text(row[brandIdx]) : "Unknown";
      const fixedCost = fixedCostIdx >= 0 ? money(row[fixedCostIdx]) : 0;
      const variableCost = varCostIdx >= 0 ? money(row[varCostIdx]) : 0;
      const sellingPrice = priceIdx >= 0 ? money(row[priceIdx]) : 0;
      const currentSales = salesIdx >= 0 ? money(row[salesIdx]) : 0;
      const { bepUnits } = calcBEP(fixedCost, variableCost, sellingPrice);
      const profitLoss = profitIdx >= 0 ? money(row[profitIdx]) : (currentSales * (sellingPrice - variableCost)) - fixedCost;
      const mos = mosIdx >= 0 ? money(row[mosIdx]) : (currentSales > 0 ? ((currentSales - bepUnits) / currentSales) * 100 : 0);

      const existing = brandMap.get(brand);
      if (existing) {
        existing.fixedCost += fixedCost;
        existing.currentSales += currentSales;
        existing.profitLoss += profitLoss;
        existing.bepUnits += bepUnits;
        existing.marginOfSafety = existing.productCount > 0
          ? Math.round((existing.marginOfSafety * existing.productCount + mos) / (existing.productCount + 1))
          : Math.round(mos);
        existing.productCount += 1;
      } else {
        brandMap.set(brand, {
          fixedCost,
          currentSales,
          profitLoss,
          bepUnits,
          marginOfSafety: Math.round(mos),
          productCount: 1,
        });
      }
    }

    const brands = Array.from(brandMap.entries()).map(([brand, v]) => ({
      brand,
      ...v,
      status: v.profitLoss >= 0 ? "profitable" : "at-risk",
    }));

    const totalFixedCosts = brands.reduce((s, b) => s + b.fixedCost, 0);
    const totalProfitLoss = brands.reduce((s, b) => s + b.profitLoss, 0);
    const totalCurrentSales = brands.reduce((s, b) => s + b.currentSales, 0);
    const profitableCount = brands.filter((b) => b.profitLoss >= 0).length;
    const atRiskCount = brands.filter((b) => b.profitLoss < 0).length;
    const overallMarginOfSafety = brands.length > 0
      ? Math.round(brands.reduce((s, b) => s + b.marginOfSafety, 0) / brands.length)
      : 0;

    return NextResponse.json({
      source: "Google Sheets: BEP_Calculations",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      summary: {
        totalFixedCosts,
        totalProfitLoss,
        totalCurrentSales,
        overallMarginOfSafety,
        brandCount: brands.length,
        profitableCount,
        atRiskCount,
      },
      brands,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: BEP_Calculations", error),
        summary: {
          totalFixedCosts: 0,
          totalProfitLoss: 0,
          totalCurrentSales: 0,
          overallMarginOfSafety: 0,
          brandCount: 0,
          profitableCount: 0,
          atRiskCount: 0,
        },
        brands: [],
      });
    }
    return NextResponse.json({ error: "Failed to fetch BEP summary", details: String(error) }, { status: 500 });
  }
}
