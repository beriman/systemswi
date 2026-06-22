import { NextRequest, NextResponse } from "next/server";
import { readRanges } from "@/lib/sheets/sheets-real";

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

    // Build target map: key = "Brand|Month" -> target HPP
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
      const brand = row[2] || "";
      const date = row[1] || "";
      const month = date.substring(0, 7); // YYYY-MM
      const actualHpp = parseFloat(row[12]) || 0;
      const totalCost = parseFloat(row[13]) || 0;
      const qty = parseFloat(row[6]) || 0;

      const targetKey = `${brand}|${month}`;
      const targetHpp = targetMap[targetKey] || 0;
      const variancePct =
        targetHpp > 0
          ? ((actualHpp - targetHpp) / targetHpp) * 100
          : 0;

      return {
        id: row[0] || "",
        batchCode: row[5] || "",
        brand,
        product: row[4] || "",
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
