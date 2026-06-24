// GET /api/bep — List all BEP calculations
// POST /api/bep — Calculate BEP and store
import { NextRequest, NextResponse } from "next/server";
import { readRange, appendRows } from "@/lib/sheets/sheets-real";
import {
  calculateBEP,
  calcSummary,
  type BEPCalculation,
} from "@/lib/bep/bep-calculations";
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

export async function GET() {
  try {
    const rawRows = await readRange(BEP_RANGE);
    const calculations = parseBEPRows(rawRows);
    const summary = calcSummary(calculations);

    return NextResponse.json({
      source: "Google Sheets: Break_Even_Analysis",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      count: calculations.length,
      summary,
      data: calculations,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Break_Even_Analysis", error),
        summary: { totalFixedCosts: 0, totalCurrentSales: 0, totalProfit: 0, brandsAtBEP: 0, brandsAboveBEP: 0, brandsBelowBEP: 0, brandSummaries: [] },
        data: [],
      });
    }
    return NextResponse.json({ error: "Failed to fetch BEP data", details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = new Date().toISOString().split("T")[0];

    const fixedCost = n(body.fixedCost);
    const variableCost = n(body.variableCostPerUnit);
    const sellingPrice = n(body.sellingPricePerUnit);
    const currentSales = n(body.currentSales);

    if (sellingPrice <= variableCost) {
      return NextResponse.json(
        { error: "Selling price must be greater than variable cost per unit" },
        { status: 400 }
      );
    }

    const calc = calculateBEP({
      brand: s(body.brand) || "Unnamed Brand",
      product: s(body.product) || "Unnamed Product",
      fixedCost,
      variableCostPerUnit: variableCost,
      sellingPricePerUnit: sellingPrice,
      currentSales,
    });

    const row = [
      calc.id,
      calc.brand,
      calc.product,
      calc.fixedCost,
      calc.variableCostPerUnit,
      calc.sellingPricePerUnit,
      calc.contributionMargin,
      calc.bepUnits,
      calc.bepRevenue,
      calc.currentSales,
      calc.marginOfSafety,
      calc.profit,
      now,
    ];

    await appendRows("BreakEven", [row]);

    return NextResponse.json({ success: true, data: calc }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        sourceStatus: "blocked",
        source: "Google Sheets: Break_Even_Analysis",
        error: "Google Workspace OAuth perlu re-auth sebelum bisa menambah BEP calculation",
        details: String(error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to calculate BEP", details: String(error) }, { status: 500 });
  }
}
