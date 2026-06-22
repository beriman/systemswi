import { NextRequest, NextResponse } from "next/server";
import { readRanges, appendRows } from "@/lib/sheets/sheets-real";

export async function GET() {
  try {
    const data = await readRanges(["Production_Waste!A1:K1000"]);
    const rows = data["Production_Waste!A1:K1000"] || [];
    if (rows.length < 2) {
      return NextResponse.json({ wasteEvents: [], totalWasteCost: 0 });
    }

    const dataRows = rows.slice(1);
    let totalWasteCost = 0;

    const wasteEvents = dataRows.map((row) => {
      const costImpact = parseFloat(row[9]) || 0;
      totalWasteCost += costImpact;

      return {
        id: row[0] || "",
        date: row[1] || "",
        productionId: row[2] || "",
        batchCode: row[3] || "",
        brand: row[4] || "",
        product: row[5] || "",
        qtyRejected: parseFloat(row[6]) || 0,
        reason: row[7] || "",
        disposition: row[8] || "",
        costImpact,
        notes: row[10] || "",
      };
    });

    return NextResponse.json({
      wasteEvents,
      totalWasteCost: Math.round(totalWasteCost * 100) / 100,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch waste events" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productionId,
      batchCode,
      brand,
      product,
      qtyRejected,
      reason,
      disposition,
      costImpact,
      notes,
    } = body;

    if (!batchCode || !brand || !product) {
      return NextResponse.json(
        { error: "Missing required fields: batchCode, brand, product" },
        { status: 400 }
      );
    }

    const wasteId = `W-${Date.now()}`;
    const date = new Date().toISOString().split("T")[0];

    await appendRows("ProductionWaste", [
      [
        wasteId,
        date,
        productionId || "",
        batchCode,
        brand,
        product,
        qtyRejected || 0,
        reason || "",
        disposition || "Scrap",
        costImpact || 0,
        notes || "",
      ],
    ]);

    return NextResponse.json({
      success: true,
      wasteId,
      message: "Waste event logged successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to log waste event" },
      { status: 500 }
    );
  }
}
