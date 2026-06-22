import { NextRequest, NextResponse } from "next/server";
import { getSalesTargets, createTarget } from "@/lib/sheets/sales-sheets";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") ? Number(searchParams.get("year")) : undefined;
    const brandId = searchParams.get("brandId") || undefined;

    const targets = await getSalesTargets(year, brandId);
    return NextResponse.json({ targets });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch targets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, brandName, year, month, targetAmount, notes } = body;

    if (!brandId || !year || !month || !targetAmount) {
      return NextResponse.json(
        { error: "brandId, year, month, and targetAmount are required" },
        { status: 400 }
      );
    }

    const result = await createTarget({
      brandId,
      brandName: brandName || brandId,
      year: Number(year),
      month: Number(month),
      targetAmount: Number(targetAmount),
      notes,
    });

    return NextResponse.json({ target: result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create target" },
      { status: 500 }
    );
  }
}
