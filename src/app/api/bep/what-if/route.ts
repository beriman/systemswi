// POST /api/bep/what-if — What-if scenario analysis
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function parseNum(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v !== "string") return 0;
  const n = Number(v.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

interface ScenarioInput {
  brand?: string;
  product?: string;
  fixedCost: number;
  variableCost: number;
  sellingPrice: number;
  currentSales: number;
  // What-if adjustments (percentage or absolute)
  priceAdjustment?: number;       // percentage e.g. +10 = +10%
  volumeAdjustment?: number;      // percentage
  costAdjustment?: number;        // percentage (applies to variable cost)
  fixedCostAdjustment?: number;   // percentage
}

interface ScenarioResult {
  base: {
    contributionMargin: number;
    bepUnits: number;
    bepRevenue: number;
    marginOfSafety: number;
    profit: number;
  };
  scenario: {
    sellingPrice: number;
    variableCost: number;
    fixedCost: number;
    currentSales: number;
    contributionMargin: number;
    bepUnits: number;
    bepRevenue: number;
    marginOfSafety: number;
    profit: number;
  };
  delta: {
    bepUnits: number;
    bepRevenue: number;
    marginOfSafety: number;
    profit: number;
  };
}

function calcBEP(fixedCost: number, variableCost: number, sellingPrice: number, currentSales: number) {
  const contributionMargin = sellingPrice - variableCost;
  const bepUnits = contributionMargin > 0 ? fixedCost / contributionMargin : 0;
  const bepRevenue = bepUnits * sellingPrice;
  const marginOfSafety = currentSales > 0 ? ((currentSales - bepUnits) / currentSales) * 100 : 0;
  const profit = (currentSales * contributionMargin) - fixedCost;
  return { contributionMargin, bepUnits, bepRevenue, marginOfSafety, profit };
}

export async function POST(request: NextRequest) {
  try {
    const body: ScenarioInput = await request.json();
    const {
      brand = "What-If",
      product = "Scenario",
      priceAdjustment = 0,
      volumeAdjustment = 0,
      costAdjustment = 0,
      fixedCostAdjustment = 0,
    } = body;

    const baseFixedCost = parseNum(body.fixedCost);
    const baseVariableCost = parseNum(body.variableCost);
    const baseSellingPrice = parseNum(body.sellingPrice);
    const baseCurrentSales = parseNum(body.currentSales);

    if (baseSellingPrice <= 0) {
      return NextResponse.json(
        { error: "Selling price must be greater than 0" },
        { status: 400 }
      );
    }

    // Base calculation
    const base = calcBEP(baseFixedCost, baseVariableCost, baseSellingPrice, baseCurrentSales);

    // Scenario adjustments
    const adjSellingPrice = baseSellingPrice * (1 + priceAdjustment / 100);
    const adjVariableCost = baseVariableCost * (1 + costAdjustment / 100);
    const adjFixedCost = baseFixedCost * (1 + fixedCostAdjustment / 100);
    const adjCurrentSales = baseCurrentSales * (1 + volumeAdjustment / 100);

    const scenario = calcBEP(adjFixedCost, adjVariableCost, adjSellingPrice, adjCurrentSales);

    const result: ScenarioResult = {
      base: {
        contributionMargin: Math.round(base.contributionMargin * 100) / 100,
        bepUnits: Math.round(base.bepUnits * 100) / 100,
        bepRevenue: Math.round(base.bepRevenue),
        marginOfSafety: Math.round(base.marginOfSafety * 100) / 100,
        profit: Math.round(base.profit),
      },
      scenario: {
        sellingPrice: Math.round(adjSellingPrice * 100) / 100,
        variableCost: Math.round(adjVariableCost * 100) / 100,
        fixedCost: Math.round(adjFixedCost),
        currentSales: Math.round(adjCurrentSales),
        contributionMargin: Math.round(scenario.contributionMargin * 100) / 100,
        bepUnits: Math.round(scenario.bepUnits * 100) / 100,
        bepRevenue: Math.round(scenario.bepRevenue),
        marginOfSafety: Math.round(scenario.marginOfSafety * 100) / 100,
        profit: Math.round(scenario.profit),
      },
      delta: {
        bepUnits: Math.round((scenario.bepUnits - base.bepUnits) * 100) / 100,
        bepRevenue: Math.round(scenario.bepRevenue - base.bepRevenue),
        marginOfSafety: Math.round((scenario.marginOfSafety - base.marginOfSafety) * 100) / 100,
        profit: Math.round(scenario.profit - base.profit),
      },
    };

    return NextResponse.json({
      brand,
      product,
      adjustments: { priceAdjustment, volumeAdjustment, costAdjustment, fixedCostAdjustment },
      ...result,
      source: "calculated",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to run what-if scenario", details: String(error) },
      { status: 500 }
    );
  }
}
