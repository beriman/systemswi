// GET /api/bep/[brand] — Get BEP detail per brand
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ brand: string }> }
) {
  try {
    const { brand } = await params;
    const decodedBrand = decodeURIComponent(brand);

    const rows = await readRange(RANGE);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ brand: decodedBrand, bep: [], source: "sheets" });
    }

    const dataRows = rows[0]?.[0] === "Calculation ID" ? rows.slice(1) : rows;
    const bep = dataRows
      .filter((r) => r && r[0] && r[1]?.toLowerCase() === decodedBrand.toLowerCase())
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

    // Aggregate brand summary
    const totalFixedCosts = bep.reduce((s, b) => s + b.fixedCost, 0);
    const totalProfit = bep.reduce((s, b) => s + b.profit, 0);
    const avgMarginOfSafety = bep.length > 0 ? bep.reduce((s, b) => s + b.marginOfSafety, 0) / bep.length : 0;
    const totalBEPRevenue = bep.reduce((s, b) => s + b.bepRevenue, 0);
    const totalCurrentRevenue = bep.reduce((s, b) => s + (b.currentSales * b.sellingPrice), 0);

    return NextResponse.json({
      brand: decodedBrand,
      summary: {
        totalProducts: bep.length,
        totalFixedCosts,
        totalProfit,
        avgMarginOfSafety: Math.round(avgMarginOfSafety * 100) / 100,
        totalBEPRevenue: Math.round(totalBEPRevenue),
        totalCurrentRevenue: Math.round(totalCurrentRevenue),
        profitable: totalProfit > 0,
      },
      bep,
      source: "sheets",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch brand BEP", details: String(error) },
      { status: 500 }
    );
  }
}
