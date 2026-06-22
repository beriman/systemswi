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
      return NextResponse.json({ monthlySummary: [] });
    }

    const dataRows = rows.slice(1);

    // Group by month + brand
    const summaryMap: Record<
      string,
      {
        month: string;
        brand: string;
        batches: number;
        totalQty: number;
        totalCost: number;
        hppWeightedSum: number;
        qtySum: number;
      }
    > = {};

    for (const row of dataRows) {
      const brand = row[3] || "";
      const date = row[1] || "";
      const month = date.substring(0, 7);
      const qty = parseFloat(row[8]) || 0;
      const hpp = parseFloat(row[14]) || 0;
      const cost = parseFloat(row[15]) || 0;

      const key = `${month}|${brand}`;
      if (!summaryMap[key]) {
        summaryMap[key] = {
          month,
          brand,
          batches: 0,
          totalQty: 0,
          totalCost: 0,
          hppWeightedSum: 0,
          qtySum: 0,
        };
      }

      summaryMap[key].batches += 1;
      summaryMap[key].totalQty += qty;
      summaryMap[key].totalCost += cost;
      summaryMap[key].hppWeightedSum += hpp * qty;
      summaryMap[key].qtySum += qty;
    }

    const monthlySummary = Object.values(summaryMap).map((entry) => ({
      month: entry.month,
      brand: entry.brand,
      batches: entry.batches,
      totalQty: entry.totalQty,
      avgHpp:
        entry.qtySum > 0
          ? Math.round((entry.hppWeightedSum / entry.qtySum) * 100) / 100
          : 0,
      totalCost: Math.round(entry.totalCost * 100) / 100,
    }));

    monthlySummary.sort((a, b) => {
      if (a.month !== b.month) return a.month.localeCompare(b.month);
      return a.brand.localeCompare(b.brand);
    });

    return NextResponse.json({ monthlySummary });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch monthly summary" },
      { status: 500 }
    );
  }
}
