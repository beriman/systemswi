// POST /api/bep/what-if — Run a what-if scenario analysis
import { NextRequest, NextResponse } from "next/server";
import { createWhatIfScenario } from "@/lib/sheets/bep-sheets";
import { isGoogleWorkspaceAuthError, googleWorkspaceWriteBlockedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const brand = String(body.brand || "").trim();
    const product = String(body.product || "Scenario").trim();
    const fixedCost = Number(body.fixedCost) || 0;
    const variableCostPerUnit = Number(body.variableCostPerUnit) || 0;
    const sellingPricePerUnit = Number(body.sellingPricePerUnit) || 0;
    const currentSales = Number(body.currentSales) || 0;
    const priceChange = Number(body.priceChange) || 0;
    const volumeChange = Number(body.volumeChange) || 0;
    const costChange = Number(body.costChange) || 0;

    if (!brand) {
      return NextResponse.json(
        { error: "brand is required" },
        { status: 400 }
      );
    }
    if (fixedCost <= 0) {
      return NextResponse.json(
        { error: "fixedCost must be greater than 0" },
        { status: 400 }
      );
    }
    if (variableCostPerUnit <= 0) {
      return NextResponse.json(
        { error: "variableCostPerUnit must be greater than 0" },
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
      return NextResponse.json(
        googleWorkspaceWriteBlockedSource("Google Sheets: BEP_Calculations", error),
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create what-if scenario", details: String(error) },
      { status: 500 }
    );
  }
}
