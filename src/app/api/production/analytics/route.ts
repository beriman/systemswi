import { NextRequest, NextResponse } from "next/server";
import { readRanges } from "@/lib/sheets/sheets-real";

export async function GET() {
  try {
    const data = await readRanges(["Brand_Production!A1:T1000"]);
    const rows = data["Brand_Production!A1:T1000"] || [];
    if (rows.length < 2) {
      return NextResponse.json({
        totalBatches: 0,
        totalUnits: 0,
        avgHpp: 0,
        totalCost: 0,
      });
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    // Column indices based on Brand_Production schema:
    // A: Production ID, B: Date, C: Brand, D: SKU, E: Product,
    // F: Batch Code, G: Qty, H: Unit, I: Raw Material Cost, J: Bottling Cost,
    // K: Packaging Cost, L: Other Cost, M: HPP/Unit, N: Total Production Cost,
    // O: Status, P: QC Status, Q: Stock Location, R: Notes, S: ?, T: ?

    const totalBatches = dataRows.length;
    let totalUnits = 0;
    let totalCost = 0;
    let weightedHppSum = 0;
    let qtySum = 0;

    for (const row of dataRows) {
      const qty = parseFloat(row[6]) || 0;
      const hpp = parseFloat(row[12]) || 0;
      const cost = parseFloat(row[13]) || 0;

      totalUnits += qty;
      totalCost += cost;
      weightedHppSum += hpp * qty;
      qtySum += qty;
    }

    const avgHpp = qtySum > 0 ? weightedHppSum / qtySum : 0;

    return NextResponse.json({
      totalBatches,
      totalUnits,
      avgHpp: Math.round(avgHpp * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
