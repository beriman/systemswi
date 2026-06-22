import { NextRequest, NextResponse } from "next/server";
import { getSalesActuals, createActual, recalculateAchievement } from "@/lib/sheets/sales-sheets";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") ? Number(searchParams.get("year")) : undefined;
    const brandId = searchParams.get("brandId") || undefined;

    const actuals = await getSalesActuals(year, brandId);
    return NextResponse.json({ actuals });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch actuals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, brandId, brandName, productSku, qtySold, unitPrice, channel, notes } = body;

    if (!date || !brandId || !productSku || !qtySold || !unitPrice) {
      return NextResponse.json(
        { error: "date, brandId, productSku, qtySold, and unitPrice are required" },
        { status: 400 }
      );
    }

    const result = await createActual({
      date,
      brandId,
      brandName: brandName || brandId,
      productSku,
      qtySold: Number(qtySold),
      unitPrice: Number(unitPrice),
      channel: channel || "Direct",
      notes,
    });

    // Recalculate achievement for the target month
    try {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      await recalculateAchievement(brandId, year, month);
    } catch {
      // Non-blocking: achievement recalculation failure shouldn't fail the request
    }

    return NextResponse.json({ actual: result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create actual sale" },
      { status: 500 }
    );
  }
}
