// POST /api/bep/what-if — What-if scenario analysis
import { NextRequest, NextResponse } from "next/server";
import { createWhatIfScenario } from "@/lib/sheets/bep-sheets";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand, product, fixedCost, variableCostPerUnit, sellingPricePerUnit, currentSales, priceChange, volumeChange, costChange } = body;

    if (!brand || fixedCost === undefined || variableCostPerUnit === undefined || sellingPricePerUnit === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: brand, fixedCost, variableCostPerUnit, sellingPricePerUnit" },
        { status: 400 }
      );
    }

    const scenario = await createWhatIfScenario({
      brand,
      product: product || "Scenario",
      fixedCost: Number(fixedCost),
      variableCostPerUnit: Number(variableCostPerUnit),
      sellingPricePerUnit: Number(sellingPricePerUnit),
      currentSales: Number(currentSales) || 0,
      priceChange: Number(priceChange) || 0,
      volumeChange: Number(volumeChange) || 0,
      costChange: Number(costChange) || 0,
    });

    return NextResponse.json({
      source: "Google Sheets: BEP_Calculations",
      sourceStatus: "live",
      message: "What-if scenario calculated",
      scenario,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to calculate what-if scenario", details: String(error) },
      { status: 500 }
    );
  }
}
