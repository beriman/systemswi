import { NextRequest, NextResponse } from "next/server";
import { readRanges } from "@/lib/sheets/sheets-real";

// Brand_Production column indices (actual schema):
// 0: Production ID, 1: Date, 2: Brand ID, 3: Brand Name, 4: SKU,
// 5: Product Name, 6: Product Type, 7: Batch Code, 8: Qty Produced,
// 9: Unit, 10: Raw Material Cost, 11: Bottling Cost, 12: Packaging Cost,
// 13: Other Cost, 14: HPP/Unit, 15: Total Production Cost, 16: Status,
// 17: QC Status, 18: Stock Location, 19: Notes

// Production_Targets column indices:
// 0: Target ID, 1: Brand, 2: Month, 3: Target Qty, 4: Actual Qty, 5: Achievement %

export async function GET() {
  try {
    const data = await readRanges([
      "Brand_Production!A1:T1000",
      "Production_Targets!A1:F1000",
    ]);
    const prodRows = data["Brand_Production!A1:T1000"] || [];
    const targetRows = data["Production_Targets!A1:F1000"] || [];

    if (prodRows.length < 2) {
      return NextResponse.json({ variances: [] });
    }

    const prodData = prodRows.slice(1);

    // Build target map: key = "Brand|Month" -> target qty
    const targetMap: Record<string, number> = {};
    if (targetRows.length > 1) {
      for (const row of targetRows.slice(1)) {
        const brand = row[1] || "";
        const month = row[2] || "";
        const targetQty = parseFloat(row[3]) || 0;
        if (brand && month) {
          targetMap[`${brand}|${month}`] = targetQty;
        }
      }
    }

    const variances = prodData.map((row) => {
      const brand = row[3] || "";
      const date = row[1] || "";
      const month = date.substring(0, 7); // YYYY-MM
      const actualHpp = parseFloat(row[14]) || 0;
      const totalCost = parseFloat(row[15]) || 0;
      const qty = parseFloat(row[8]) || 0;

      const targetKey = `${brand}|${month}`;
      const targetHpp = targetMap[targetKey] || 0;
      const variancePct =
        targetHpp > 0
          ? ((actualHpp - targetHpp) / targetHpp) * 100
          : 0;

      return {
        id: row[0] || "",
        batchCode: row[7] || "",
        brand,
        product: row[5] || "",
        date,
        month,
        qty,
        totalCost,
        actualHpp,
        targetHpp,
        variancePct: Math.round(variancePct * 100) / 100,
      };
    });

    return NextResponse.json({ variances });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch cost variance" },
      { status: 500 }
    );
  }
}
