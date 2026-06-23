// GET /api/bep/summary — Overall profitability summary across all brands
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const RANGE = "BEP_Calculations!A1:L1000";

function parseNum(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v !== "string") return 0;
  const n = Number(v.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function calcBEP(fixedCost: number, variableCost: number, sellingPrice: number, currentSales: number) {
  const contributionMargin = sellingPrice - variableCost;
  const bepUnits = contributionMargin > 0 ? fixedCost / contributionMargin : 0;
  const bepRevenue = bepUnits * sellingPrice;
  const marginOfSafety = currentSales > 0 ? ((currentSales - bepUnits) / currentSales) * 100 : 0;
  const profit = (currentSales * contributionMargin) - fixedCost;
  return { contributionMargin, bepUnits, bepRevenue, marginOfSafety, profit };
}

export async function GET() {
  try {
    const rows = await readRange(RANGE);
    if (!rows || rows.length === 0) {
      return NextResponse.json({
        summary: {
          totalBrands: 0,
          totalProducts: 0,
          totalFixedCosts: 0,
          totalProfit: 0,
          avgMarginOfSafety: 0,
          profitableBrands: 0,
          lossBrands: 0,
        },
        brands: [],
        source: "sheets",
      });
    }

    const dataRows = rows[0]?.[0] === "Calculation ID" ? rows.slice(1) : rows;
    const bepItems = dataRows
      .filter((r) => r && r[0])
      .map((row) => {
        const fixedCost = parseNum(row[3]);
        const variableCost = parseNum(row[4]);
        const sellingPrice = parseNum(row[5]);
        const currentSales = parseNum(row[9]);
        const calc = calcBEP(fixedCost, variableCost, sellingPrice, currentSales);
        return {
          calculationId: row[0] || "",
          brand: row[1] || "",
          product: row[2] || "",
          fixedCost,
          variableCost,
          sellingPrice,
          contributionMargin: parseNum(row[6]) || calc.contributionMargin,
          bepUnits: parseNum(row[7]) || calc.bepUnits,
          bepRevenue: parseNum(row[8]) || calc.bepRevenue,
          currentSales,
          marginOfSafety: parseNum(row[10]) || calc.marginOfSafety,
          profit: parseNum(row[11]) || calc.profit,
        };
      });

    // Group by brand
    const brandMap = new Map<string, typeof bepItems>();
    for (const item of bepItems) {
      const existing = brandMap.get(item.brand) || [];
      existing.push(item);
      brandMap.set(item.brand, existing);
    }

    const brands = Array.from(brandMap.entries()).map(([brand, items]) => {
      const totalFixedCosts = items.reduce((s, i) => s + i.fixedCost, 0);
      const totalProfit = items.reduce((s, i) => s + i.profit, 0);
      const avgMoS = items.length > 0 ? items.reduce((s, i) => s + i.marginOfSafety, 0) / items.length : 0;
      const totalBEPRevenue = items.reduce((s, i) => s + i.bepRevenue, 0);
      const totalCurrentRevenue = items.reduce((s, i) => s + (i.currentSales * i.sellingPrice), 0);
      return {
        brand,
        productCount: items.length,
        totalFixedCosts,
        totalProfit,
        avgMarginOfSafety: Math.round(avgMoS * 100) / 100,
        totalBEPRevenue: Math.round(totalBEPRevenue),
        totalCurrentRevenue: Math.round(totalCurrentRevenue),
        profitable: totalProfit > 0,
        products: items,
      };
    });

    const totalFixedCosts = brands.reduce((s, b) => s + b.totalFixedCosts, 0);
    const totalProfit = brands.reduce((s, b) => s + b.totalProfit, 0);
    const avgMoS = brands.length > 0 ? brands.reduce((s, b) => s + b.avgMarginOfSafety, 0) / brands.length : 0;
    const profitableBrands = brands.filter((b) => b.profitable).length;
    const lossBrands = brands.filter((b) => !b.profitable).length;

    return NextResponse.json({
      summary: {
        totalBrands: brands.length,
        totalProducts: bepItems.length,
        totalFixedCosts,
        totalProfit,
        avgMarginOfSafety: Math.round(avgMoS * 100) / 100,
        profitableBrands,
        lossBrands,
      },
      brands,
      source: "sheets",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch BEP summary", details: String(error) },
      { status: 500 }
    );
  }
}
