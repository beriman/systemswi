import { NextRequest, NextResponse } from "next/server";
import { readRange, writeRange, appendRows } from "@/lib/sheets/sheets-real";

const WASTE_HEADERS = [
  "Waste ID", "Date", "Production ID", "Batch Code", "Brand",
  "Product", "Qty Rejected", "Reason", "Disposition", "Cost Impact", "Notes"
];

async function ensureHeaders() {
  try {
    const existing = await readRange("Production_Waste!A1:K1");
    if (!existing || existing.length === 0 || !existing[0]?.[0]) {
      await writeRange("Production_Waste!A1:K1", [WASTE_HEADERS]);
    }
  } catch {
    await writeRange("Production_Waste!A1:K1", [WASTE_HEADERS]);
  }
}

// GET — list all waste events
export async function GET() {
  try {
    await ensureHeaders();
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
      qtyRejected: parseInt(row[6] || "0", 10) || 0,
      reason: row[7] || "",
      disposition: row[8] || "",
      costImpact: parseFloat(row[9] || "0") || 0,
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

// POST — log a new waste event
export async function POST(req: NextRequest) {
  try {
    await ensureHeaders();

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

    if (!brand || !product || !qtyRejected) {
      return NextResponse.json(
        { error: "Missing required fields: brand, product, qtyRejected" },
        { status: 400 }
      );
    }

    const wasteId = `W-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const date = new Date().toISOString().slice(0, 10);

    const newRow: (string | number)[] = [
      wasteId,
      date,
      productionId || "",
      batchCode || "",
      brand,
      product,
      qtyRejected,
      reason || "Unspecified",
      disposition || "Scrap",
      costImpact || 0,
      notes || "",
    ];

    await appendRows("ProductionWaste", [newRow]);

    return NextResponse.json({
      success: true,
      waste: {
        wasteId,
        date,
        productionId: productionId || "",
        batchCode: batchCode || "",
        brand,
        product,
        qtyRejected,
        reason: reason || "Unspecified",
        disposition: disposition || "Scrap",
        costImpact: costImpact || 0,
        notes: notes || "",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to log waste event" },
      { status: 500 }
    );
  }
}
