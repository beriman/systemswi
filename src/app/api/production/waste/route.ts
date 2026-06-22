import { NextRequest, NextResponse } from "next/server";
import { readRange, appendRows } from "@/lib/sheets/sheets-real";

// Production_Waste column indices:
// 0: Waste ID, 1: Date, 2: Production ID, 3: Batch Code, 4: Brand,
// 5: Product, 6: Qty Rejected, 7: Reason, 8: Disposition, 9: Cost Impact, 10: Notes

export async function GET() {
  try {
    const rows = await readRange("Production_Waste!A1:K1000");
    if (rows.length < 2) {
      return NextResponse.json({ wasteEvents: [] });
    }

    const dataRows = rows.slice(1);
    const wasteEvents = dataRows.map((row) => ({
      wasteId: row[0] || "",
      date: row[1] || "",
      productionId: row[2] || "",
      batchCode: row[3] || "",
      brand: row[4] || "",
      product: row[5] || "",
      qtyRejected: parseInt(row[6], 10) || 0,
      reason: row[7] || "",
      disposition: row[8] || "",
      costImpact: parseFloat(row[9]) || 0,
      notes: row[10] || "",
    }));

    return NextResponse.json({ wasteEvents });
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
    const now = new Date().toISOString().slice(0, 10);
    const wasteId = `W-${Date.now()}`;

    const row = [
      wasteId,
      body.date || now,
      body.productionId || "",
      body.batchCode || "",
      body.brand || "",
      body.product || "",
      body.qtyRejected || 0,
      body.reason || "",
      body.disposition || "Scrap",
      body.costImpact || 0,
      body.notes || "",
    ];

    await appendRows("ProductionWaste", [row]);

    return NextResponse.json({ success: true, wasteId });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to log waste event" },
      { status: 500 }
    );
  }
}
