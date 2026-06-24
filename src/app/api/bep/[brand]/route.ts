// GET /api/bep/[brand] — Get BEP detail for a specific brand
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";
import { calculateBEP, calcSummary, type BEPCalculation } from "@/lib/bep/bep-calculations";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const BEP_RANGE = "Break_Even_Analysis!A1:J16";

function n(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function s(value: unknown): string {
  return String(value ?? "").trim();
}

function parseBEPRows(rows: string[][]): BEPCalculation[] {
  if (rows.length <= 1) return [];
  const headers = rows[0].map((h) => h.toLowerCase().replace(/[\s/_]/g, ""));

  return rows.slice(1)
    .filter((row) => row.some((cell) => s(cell) !== ""))
    .map((row, idx) => {
      const get = (colNames: string[]): string => {
        for (const name of colNames) {
          const normalized = name.toLowerCase().replace(/[\s/_]/g, "");
          const i = headers.indexOf(normalized);
          if (i >= 0 && i < row.length) return row[i];
        }
        return "";
      };

      const fixedCost = n(get(["fixedcost", "fixed cost", "biaya tetap"]));
      const variableCost = n(get(["variablecostperunit", "variable cost", "variablecost", "biaya variabel"]));
      const sellingPrice = n(get(["sellingpriceperunit", "selling price", "sellingprice", "harga jual"]));
      const currentSales = n(get(["currentsales", "current sales", "penjualan saat ini", "sales"]));

      return calculateBEP({
        id: s(get(["id", "calculationid", "calculation id"])) || `bep-${idx + 2}`,
        brand: s(get(["brand", "merek"])) || "Unknown",
        product: s(get(["product", "produk"])) || "Unknown",
        fixedCost,
        variableCostPerUnit: variableCost,
        sellingPricePerUnit: sellingPrice,
        currentSales,
      });
    });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brand: string }> }
) {
  try {
    const { brand } = await params;
    const decodedBrand = decodeURIComponent(brand);

    const rawRows = await readRange(BEP_RANGE);
    const allCalculations = parseBEPRows(rawRows);
    const brandCalculations = allCalculations.filter(
      (c) => c.brand.toLowerCase() === decodedBrand.toLowerCase()
    );

    if (brandCalculations.length === 0) {
      return NextResponse.json(
        { error: `No BEP data found for brand: ${decodedBrand}` },
        { status: 404 }
      );
    }

    const summary = calcSummary(brandCalculations);

    return NextResponse.json({
      source: "Google Sheets: Break_Even_Analysis",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      brand: decodedBrand,
      count: brandCalculations.length,
      summary,
      data: brandCalculations,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Break_Even_Analysis", error),
        data: [],
      });
    }
    return NextResponse.json({ error: "Failed to fetch brand BEP data", details: String(error) }, { status: 500 });
  }
}
