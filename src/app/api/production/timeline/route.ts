import { NextRequest, NextResponse } from "next/server";
import { readRanges } from "@/lib/sheets/sheets-real";

// Brand_Production column indices (actual schema):
// 0: Production ID, 1: Date, 2: Brand ID, 3: Brand Name, 4: SKU,
// 5: Product Name, 6: Product Type, 7: Batch Code, 8: Qty Produced,
// 9: Unit, 10: Raw Material Cost, 11: Bottling Cost, 12: Packaging Cost,
// 13: Other Cost, 14: HPP/Unit, 15: Total Production Cost, 16: Status,
// 17: QC Status, 18: Stock Location, 19: Notes

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brand = searchParams.get("brand") || "";
    const month = searchParams.get("month") || "";

    const data = await readRanges(["Brand_Production!A1:T1000"]);
    const rows = data["Brand_Production!A1:T1000"] || [];
    if (rows.length < 2) {
      return NextResponse.json({ timeline: [] });
    }

    const dataRows = rows.slice(1);

    // Group by brand + month
    const timelineMap: Record<
      string,
      { brand: string; month: string; batches: number; totalQty: number; totalCost: number; avgHpp: number; hppWeightedSum: number; qtySum: number }
    > = {};

    for (const row of dataRows) {
      const rowBrand = row[3] || "";
      const date = row[1] || "";
      const rowMonth = date.substring(0, 7);

      if (brand && rowBrand !== brand) continue;
      if (month && rowMonth !== month) continue;

      const key = `${rowBrand}|${rowMonth}`;
      const qty = parseFloat(row[8]) || 0;
      const hpp = parseFloat(row[14]) || 0;
      const cost = parseFloat(row[15]) || 0;

      if (!timelineMap[key]) {
        timelineMap[key] = {
          brand: rowBrand,
          month: rowMonth,
          batches: 0,
          totalQty: 0,
          totalCost: 0,
          avgHpp: 0,
          hppWeightedSum: 0,
          qtySum: 0,
        };
      }

      timelineMap[key].batches += 1;
      timelineMap[key].totalQty += qty;
      timelineMap[key].totalCost += cost;
      timelineMap[key].hppWeightedSum += hpp * qty;
      timelineMap[key].qtySum += qty;
    }

    const timeline = Object.values(timelineMap).map((entry) => ({
      brand: entry.brand,
      month: entry.month,
      batches: entry.batches,
      totalQty: entry.totalQty,
      totalCost: Math.round(entry.totalCost * 100) / 100,
      avgHpp:
        entry.qtySum > 0
          ? Math.round((entry.hppWeightedSum / entry.qtySum) * 100) / 100
          : 0,
    }));

    timeline.sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({ timeline });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch timeline" },
      { status: 500 }
    );
  }
}
