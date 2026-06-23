// GET /api/sales/targets — List sales targets (filter: year, brandId)
// POST /api/sales/targets — Create or update a target
import { NextRequest, NextResponse } from "next/server";
import {
  getSalesTargets,
  createTarget,
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
    const targets = await getSalesTargets(
      year ? Number(year) : undefined,
      brandId
    );

    return NextResponse.json({
      source: "Google Sheets: Sales_Targets",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      filters: { year: year || undefined, brandId: brandId || undefined },
      count: targets.length,
      targets,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Sales_Targets", error),
        targets: [],
      });
    }
    return NextResponse.json(
      { error: "Failed to fetch sales targets", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const brandId = String(body.brandId || "").trim();
    const brandName = String(body.brandName || "").trim();
    const year = Number(body.year) || new Date().getFullYear();
    const month = Number(body.month) || 1;
    const targetAmount = Number(body.targetAmount) || 0;
    const notes = String(body.notes || "");

    if (!brandId || !brandName) {
      return NextResponse.json(
        { error: "brandId and brandName are required" },
        { status: 400 }
      );
    }
    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: "month must be between 1 and 12" },
        { status: 400 }
      );
    }
    if (targetAmount <= 0) {
      return NextResponse.json(
        { error: "targetAmount must be greater than 0" },
        { status: 400 }
      );
    }

    await ensureSalesSheetsInitialized();
    const result = await createTarget({
      brandId,
      brandName,
      year,
      month,
      targetAmount,
      notes,
    });

    return NextResponse.json({ success: true, target: result }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json(
        {
          sourceStatus: "blocked",
          source: "Google Sheets: Sales_Targets",
          error: "Google Workspace OAuth perlu re-auth sebelum bisa menambah target",
          details: String(error),
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create sales target", details: String(error) },
      { status: 500 }
    );
  }
}
