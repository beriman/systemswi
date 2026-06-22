import { NextRequest, NextResponse } from "next/server";
import { readRanges } from "@/lib/sheets/sheets-real";

// Brand_Production column indices (actual schema):
// 0: Production ID, 1: Date, 2: Brand ID, 3: Brand Name, 4: SKU,
// 5: Product Name, 6: Product Type, 7: Batch Code, 8: Qty Produced,
// 9: Unit, 10: Raw Material Cost, 11: Bottling Cost, 12: Packaging Cost,
// 13: Other Cost, 14: HPP/Unit, 15: Total Production Cost, 16: Status,
// 17: QC Status, 18: Stock Location, 19: Notes

export async function GET() {
  try {
    const data = await readRanges(["Brand_Production!A1:T1000"]);
    const rows = data["Brand_Production!A1:T1000"] || [];
    if (rows.length < 2) {
      return NextResponse.json({ batches: [] });
    }

    const dataRows = rows.slice(1);

    const batches = dataRows.map((row) => {
      const qty = parseFloat(row[8]) || 0;
      const hpp = parseFloat(row[14]) || 0;
      const totalCost = parseFloat(row[15]) || 0;
      const rawMaterial = parseFloat(row[10]) || 0;
      const bottling = parseFloat(row[11]) || 0;
      const packaging = parseFloat(row[12]) || 0;
      const other = parseFloat(row[13]) || 0;

      return {
        id: row[0] || "",
        date: row[1] || "",
        brand: row[3] || "",
        sku: row[4] || "",
        product: row[5] || "",
        batchCode: row[7] || "",
        qty,
        unit: row[9] || "ml",
        rawMaterialCost: rawMaterial,
        bottlingCost: bottling,
        packagingCost: packaging,
        otherCost: other,
        hppPerUnit: hpp,
        totalProductionCost: totalCost,
        status: row[16] || "",
        qcStatus: row[17] || "",
        stockLocation: row[18] || "",
      };
    });

    return NextResponse.json({ batches });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch yield data" },
      { status: 500 }
    );
  }
}
