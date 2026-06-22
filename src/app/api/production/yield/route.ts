import { NextRequest, NextResponse } from "next/server";
import { readRanges } from "@/lib/sheets/sheets-real";

export async function GET() {
  try {
    const data = await readRanges(["Brand_Production!A1:T1000"]);
    const rows = data["Brand_Production!A1:T1000"] || [];
    if (rows.length < 2) {
      return NextResponse.json({ batches: [] });
    }

    const dataRows = rows.slice(1);

    const batches = dataRows.map((row) => {
      const qty = parseFloat(row[6]) || 0;
      const hpp = parseFloat(row[12]) || 0;
      const totalCost = parseFloat(row[13]) || 0;
      const rawMaterial = parseFloat(row[8]) || 0;
      const bottling = parseFloat(row[9]) || 0;
      const packaging = parseFloat(row[10]) || 0;
      const other = parseFloat(row[11]) || 0;

      return {
        id: row[0] || "",
        date: row[1] || "",
        brand: row[2] || "",
        sku: row[3] || "",
        product: row[4] || "",
        batchCode: row[5] || "",
        qty,
        unit: row[7] || "ml",
        rawMaterialCost: rawMaterial,
        bottlingCost: bottling,
        packagingCost: packaging,
        otherCost: other,
        hppPerUnit: hpp,
        totalProductionCost: totalCost,
        status: row[14] || "",
        qcStatus: row[15] || "",
        stockLocation: row[16] || "",
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
