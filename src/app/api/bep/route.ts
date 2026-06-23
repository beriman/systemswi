// GET /api/bep — List all BEP calculations
// POST /api/bep — Calculate and store a new BEP
import { NextRequest, NextResponse } from "next/server";
import {
  getAllBEPCalculations,
  createBEPCalculation,
  seedBEPData,
} from "@/lib/sheets/bep-sheets";
import { isGoogleWorkspaceAuthError, googleWorkspaceDegradedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

export async function GET() {
  try {
    await seedBEPData(); // Auto-seed if empty
    const calculations = await getAllBEPCalculations();
    return NextResponse.json({
      source: "Google Sheets: BEP_Calculations",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      count: calculations.length,
      calculations,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: BEP_Calculations", error),
        calculations: [],
      });
    }
    return NextResponse.json(
      { error: "Failed to fetch BEP calculations", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const brand = String(body.brand || "").trim();
    const product = String(body.product || "").trim();
    const fixedCost = Number(body.fixedCost) || 0;
    const variableCostPerUnit = Number(body.variableCostPerUnit) || 0;
    const sellingPricePerUnit = Number(body.sellingPricePerUnit) || 0;
    const currentSales = Number(body.currentSales) || 0;

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
    if (variableCostPerUnit <= 0) {
      return NextResponse.json(
        { error: "variableCostPerUnit must be greater than 0" },
        { status: 400 }
      );
    }
    if (sellingPricePerUnit <= variableCostPerUnit) {
      return NextResponse.json(
        { error: "sellingPricePerUnit must be greater than variableCostPerUnit" },
        { status: 400 }
      );
    }

    const result = await createBEPCalculation({
      brand,
      product,
      fixedCost,
      variableCostPerUnit,
      sellingPricePerUnit,
      currentSales,
    });

    return NextResponse.json({ success: true, calculation: result }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json(
        {
          sourceStatus: "blocked",
          source: "Google Sheets: BEP_Calculations",
          error: "Google Workspace OAuth perlu re-auth sebelum bisa menambah kalkulasi BEP",
          details: String(error),
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create BEP calculation", details: String(error) },
      { status: 500 }
    );
  }
}
