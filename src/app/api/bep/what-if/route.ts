// POST /api/bep/what-if — What-if scenario analysis
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const money = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

function calcBEP(fixedCost: number, variableCost: number, sellingPrice: number) {
  const contributionMargin = sellingPrice - variableCost;
  if (contributionMargin <= 0) {
    return { contributionMargin: 0, bepUnits: 0, bepRevenue: 0 };
  }
  const bepUnits = Math.ceil(fixedCost / contributionMargin);
  const bepRevenue = bepUnits * sellingPrice;
  return { contributionMargin, bepUnits, bepRevenue };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const baseFixedCost = money(body.baseFixedCost) || money(body.fixedCost) || 0;
    const baseVariableCost = money(body.baseVariableCost) || money(body.variableCostPerUnit) || 0;
    const baseSellingPrice = money(body.baseSellingPrice) || money(body.sellingPricePerUnit) || 0;
    const baseCurrentSales = money(body.baseCurrentSales) || money(body.currentSales) || 0;

    // Scenario adjustments (percentage changes)
    const priceAdjustment = Number(body.priceAdjustment) || 0; // e.g. +10 means +10%
    const volumeAdjustment = Number(body.volumeAdjustment) || 0;
    const costAdjustment = Number(body.costAdjustment) || 0;

    // Base scenario
    const baseCM = calcBEP(baseFixedCost, baseVariableCost, baseSellingPrice);
    const baseMarginOfSafety = baseCurrentSales > 0 ? Math.round(((baseCurrentSales - baseCM.bepUnits) / baseCurrentSales) * 100) : 0;
    const baseProfit = (baseCurrentSales * baseCM.contributionMargin) - baseFixedCost;

    // Adjusted scenario
    const adjSellingPrice = baseSellingPrice * (1 + priceAdjustment / 100);
    const adjCurrentSales = baseCurrentSales * (1 + volumeAdjustment / 100);
    const adjVariableCost = baseVariableCost * (1 + costAdjustment / 100);
    const adjFixedCost = baseFixedCost * (1 + costAdjustment / 100);

    const adjCM = calcBEP(adjFixedCost, adjVariableCost, adjSellingPrice);
    const adjMarginOfSafety = adjCurrentSales > 0 ? Math.round(((adjCurrentSales - adjCM.bepUnits) / adjCurrentSales) * 100) : 0;
    const adjProfit = (adjCurrentSales * adjCM.contributionMargin) - adjFixedCost;

    // Optimistic scenario (+10% price, +15% volume, -5% cost)
    const optCM = calcBEP(
      baseFixedCost * 0.95,
      baseVariableCost * 0.95,
      baseSellingPrice * 1.10
    );
    const optSales = baseCurrentSales * 1.15;
    const optMarginOfSafety = optSales > 0 ? Math.round(((optSales - optCM.bepUnits) / optSales) * 100) : 0;
    const optProfit = (optSales * optCM.contributionMargin) - baseFixedCost * 0.95;

    // Pessimistic scenario (-10% price, -15% volume, +10% cost)
    const pesCM = calcBEP(
      baseFixedCost * 1.10,
      baseVariableCost * 1.10,
      baseSellingPrice * 0.90
    );
    const pesSales = baseCurrentSales * 0.85;
    const pesMarginOfSafety = pesSales > 0 ? Math.round(((pesSales - pesCM.bepUnits) / pesSales) * 100) : 0;
    const pesProfit = (pesSales * pesCM.contributionMargin) - baseFixedCost * 1.10;

    return NextResponse.json({
      source: "computed",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      input: {
        fixedCost: baseFixedCost,
        variableCostPerUnit: baseVariableCost,
        sellingPricePerUnit: baseSellingPrice,
        currentSales: baseCurrentSales,
        priceAdjustment,
        volumeAdjustment,
        costAdjustment,
      },
      scenarios: {
        base: {
          label: "Base Case",
          fixedCost: baseFixedCost,
          variableCostPerUnit: baseVariableCost,
          sellingPricePerUnit: baseSellingPrice,
          contributionMargin: baseCM.contributionMargin,
          bepUnits: baseCM.bepUnits,
          bepRevenue: baseCM.bepRevenue,
          currentSales: baseCurrentSales,
          marginOfSafety: baseMarginOfSafety,
          profitLoss: baseProfit,
        },
        adjusted: {
          label: priceAdjustment !== 0 || volumeAdjustment !== 0 || costAdjustment !== 0 ? "Your Scenario" : "Base Case",
          fixedCost: adjFixedCost,
          variableCostPerUnit: adjVariableCost,
          sellingPricePerUnit: adjSellingPrice,
          contributionMargin: adjCM.contributionMargin,
          bepUnits: adjCM.bepUnits,
          bepRevenue: adjCM.bepRevenue,
          currentSales: adjCurrentSales,
          marginOfSafety: adjMarginOfSafety,
          profitLoss: adjProfit,
        },
        optimistic: {
          label: "Optimistic (+10% price, +15% volume, -5% cost)",
          fixedCost: baseFixedCost * 0.95,
          variableCostPerUnit: baseVariableCost * 0.95,
          sellingPricePerUnit: baseSellingPrice * 1.10,
          contributionMargin: optCM.contributionMargin,
          bepUnits: optCM.bepUnits,
          bepRevenue: optCM.bepRevenue,
          currentSales: optSales,
          marginOfSafety: optMarginOfSafety,
          profitLoss: optProfit,
        },
        pessimistic: {
          label: "Pessimistic (-10% price, -15% volume, +10% cost)",
          fixedCost: baseFixedCost * 1.10,
          variableCostPerUnit: baseVariableCost * 1.10,
          sellingPricePerUnit: baseSellingPrice * 0.90,
          contributionMargin: pesCM.contributionMargin,
          bepUnits: pesCM.bepUnits,
          bepRevenue: pesCM.bepRevenue,
          currentSales: pesSales,
          marginOfSafety: pesMarginOfSafety,
          profitLoss: pesProfit,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to compute what-if scenario", details: String(error) }, { status: 500 });
  }
}
