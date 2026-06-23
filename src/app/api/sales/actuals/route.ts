// GET /api/sales/actuals — List actual sales (filter: year, brandId)
// POST /api/sales/actuals — Create an actual sale record
import { NextRequest, NextResponse } from "next/server";
import {
  getSalesActuals,
  createActual,
  recalculateAchievement,
  ensureSalesSheetsInitialized,
} from "@/lib/sheets/sales-sheets";
import { isGoogleWorkspaceAuthError, googleWorkspaceDegradedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const brandId = searchParams.get("brandId") || undefined;

    await ensureSalesSheetsInitialized();
    const actuals = await getSalesActuals(
      year ? Number(year) : undefined,
      brandId
    );

    return NextResponse.json({
      source: "Google Sheets: Sales_Actuals",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      filters: { year: year || undefined, brandId: brandId || undefined },
      count: actuals.length,
      actuals,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Sales_Actuals", error),
        actuals: [],
      });
    }
    return NextResponse.json(
      { error: "Failed to fetch sales actuals", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const date = String(body.date || "").trim();
    const brandId = String(body.brandId || "").trim();
    const brandName = String(body.brandName || "").trim();
    const productSku = String(body.productSku || "").trim();
    const qtySold = Number(body.qtySold) || 0;
    const unitPrice = Number(body.unitPrice) || 0;
    const channel = String(body.channel || "").trim();
    const notes = String(body.notes || "");

    if (!date || !brandId || !brandName) {
      return NextResponse.json(
        { error: "date, brandId, and brandName are required" },
        { status: 400 }
      );
    }
    if (qtySold <= 0 || unitPrice <= 0) {
      return NextResponse.json(
        { error: "qtySold and unitPrice must be greater than 0" },
        { status: 400 }
      );
    }

    await ensureSalesSheetsInitialized();
    const result = await createActual({
      date,
      brandId,
      brandName,
      productSku,
      qtySold,
      unitPrice,
      channel,
      notes,
    });

    // Recalculate achievement for the affected month
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    try {
      await recalculateAchievement(brandId, year, month);
    } catch {
      // Non-blocking: achievement recalc failure shouldn't fail the create
    }

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json(
        {
          sourceStatus: "blocked",
          source: "Google Sheets: Sales_Actuals",
          error: "Google Workspace OAuth perlu re-auth sebelum bisa menambah actual sales",
          details: String(error),
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create actual sale", details: String(error) },
      { status: 500 }
    );
  }
}
