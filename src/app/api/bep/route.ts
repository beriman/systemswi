// GET /api/bep — List all BEP calculations
// POST /api/bep — Calculate and store new BEP
import { NextRequest, NextResponse } from "next/server";
import { getAllBEPCalculations, createBEPCalculation, calcBEP } from "@/lib/sheets/bep-sheets";
import { googleWorkspaceWriteBlockedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getAllBEPCalculations();
    return NextResponse.json({
      source: "Google Sheets: BEP_Calculations",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      count: data.length,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch BEP calculations", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand, product, fixedCost, variableCostPerUnit, sellingPricePerUnit, currentSales } = body;

    if (!brand || !product || fixedCost === undefined || variableCostPerUnit === undefined || sellingPricePerUnit === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: brand, product, fixedCost, variableCostPerUnit, sellingPricePerUnit" },
        { status: 400 }
      );
    }

    const fc = Number(fixedCost);
    const vc = Number(variableCostPerUnit);
    const sp = Number(sellingPricePerUnit);
    const cs = Number(currentSales) || 0;

    if (fc <= 0 || vc < 0 || sp <= 0) {
      return NextResponse.json(
        { error: "fixedCost and sellingPricePerUnit must be > 0, variableCostPerUnit must be >= 0" },
        { status: 400 }
      );
    }

    // Calculate locally first for immediate response
    const calc = calcBEP(fc, vc, sp, cs);

    // Persist to sheet
    const row = await createBEPCalculation({
      brand,
      product,
      fixedCost: fc,
      variableCostPerUnit: vc,
      sellingPricePerUnit: sp,
      currentSales: cs,
    });

    return NextResponse.json({
      source: "Google Sheets: BEP_Calculations",
      sourceStatus: "live",
      message: "BEP calculated and stored successfully",
      data: row,
      calculated: calc,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      googleWorkspaceWriteBlockedSource("BEP_Calculations", error),
      { status: 500 }
    );
  }
}
