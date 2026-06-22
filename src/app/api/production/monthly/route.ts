import { NextRequest, NextResponse } from "next/server";
import { readRanges } from "@/lib/sheets/sheets-real";

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
      const brand = row[2] || "";
      const date = row[1] || "";
      const month = date.substring(0, 7);
      const qty = parseFloat(row[6]) || 0;
      const hpp = parseFloat(row[12]) || 0;
      const cost = parseFloat(row[13]) || 0;

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
