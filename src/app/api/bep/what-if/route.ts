// POST /api/bep/what-if — What-if scenario analysis
import { NextRequest, NextResponse } from "next/server";
import { calculateWhatIf, type WhatIfScenario } from "@/lib/bep/bep-calculations";

export const runtime = "nodejs";

function n(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function s(value: unknown): string {
  return String(value ?? "").trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const fixedCost = n(body.fixedCost);
    const variableCost = n(body.variableCostPerUnit);
    const sellingPrice = n(body.sellingPricePerUnit);
    const projectedSales = n(body.projectedSales);

    if (sellingPrice <= 0) {
      return NextResponse.json(
        { error: "Selling price must be greater than 0" },
        { status: 400 }
      );
    }

    if (variableCost < 0) {
      return NextResponse.json(
        { error: "Variable cost cannot be negative" },
        { status: 400 }
      );
    }

    const scenario = calculateWhatIf({
      name: s(body.name) || "What-If Scenario",
      fixedCost,
      variableCostPerUnit: variableCost,
      sellingPricePerUnit: sellingPrice,
      projectedSales,
    });

    // If baseCalculationId provided, include comparison
    let comparison = null;
    if (body.baseCalculationId) {
      comparison = {
        baseCalculationId: body.baseCalculationId,
        message: "Compare scenario against base calculation",
      };
    }

    return NextResponse.json({
      success: true,
      scenario,
      comparison,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to calculate what-if scenario", details: String(error) },
      { status: 500 }
    );
  }
}
