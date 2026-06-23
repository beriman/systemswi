// POST /api/bep/what-if — What-if scenario analysis
import { NextRequest, NextResponse } from "next/server";
import {
  createWhatIfScenario,
  seedBEPData,
} from "@/lib/sheets/bep-sheets";
import { isGoogleWorkspaceAuthError, googleWorkspaceWriteBlockedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await seedBEPData();
    const body = await req.json();
    const brand = String(body.brand || "").trim();
    const product = String(body.product || "").trim();
    const fixedCost = Number(body.fixedCost) || 0;
    const variableCostPerUnit = Number(body.variableCostPerUnit) || 0;
    const sellingPricePerUnit = Number(body.sellingPricePerUnit) || 0;
    const currentSales = Number(body.currentSales) || 0;
    const priceChange = Number(body.priceChange) || 0;
    const volumeChange = Number(body.volumeChange) || 0;
    const costChange = Number(body.costChange) || 0;
    const baseCalculationId = String(body.baseCalculationId || "").trim();

    if (!brand || !product) {
      return NextResponse.json(
        { error: "brand and product are required" },
        { status: 400 }
      );
    }
    if (fixedCost <= 0) {
      return NextResponse.json(
        { error: "fixedCost must be greater than 0" },
        { status: 400 }
      );
    }
    if (sellingPricePerUnit <= 0) {
      return NextResponse.json(
        { error: "sellingPricePerUnit must be greater than 0" },
        { status: 400 }
      );
    }

    const scenario = await createWhatIfScenario({
      baseCalculationId,
      brand,
      product,
      fixedCost,
      variableCostPerUnit,
      sellingPricePerUnit,
      currentSales,
      priceChange,
      volumeChange,
      costChange,
    });

    return NextResponse.json({ success: true, scenario }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource("Google Sheets: BEP_Calculations", error),
      });
    }
    return NextResponse.json(
      { error: "Failed to create what-if scenario", details: String(error) },
      { status: 500 }
    );
  }
}
