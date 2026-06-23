// GET /api/bep — List all BEP calculations
// POST /api/bep — Calculate and store BEP
import { NextRequest, NextResponse } from "next/server";
import { readRange, appendRows } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const SHEET_NAME = "BEP_Calculations";
const RANGE = "BEP_Calculations!A1:L1000";

// Column order:
// Calculation ID | Brand | Product | Fixed Cost | Variable Cost/Unit |
// Selling Price/Unit | Contribution Margin | BEP (units) | BEP (revenue) |
// Current Sales | Margin of Safety | Profit/Loss

function parseNum(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v !== "string") return 0;
  const n = Number(v.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function calcBEP(fixedCost: number, variableCost: number, sellingPrice: number, currentSales: number) {
  const contributionMargin = sellingPrice - variableCost;
  const bepUnits = contributionMargin > 0 ? fixedCost / contributionMargin : 0;
  const bepRevenue = bepUnits * sellingPrice;
  const marginOfSafety = currentSales > 0 ? ((currentSales - bepUnits) / currentSales) * 100 : 0;
  const profit = (currentSales * contributionMargin) - fixedCost;
  return { contributionMargin, bepUnits, bepRevenue, marginOfSafety, profit };
}

function rowToBEP(row: string[]) {
  const fixedCost = parseNum(row[3]);
  const variableCost = parseNum(row[4]);
  const sellingPrice = parseNum(row[5]);
  const currentSales = parseNum(row[9]);
  const calc = calcBEP(fixedCost, variableCost, sellingPrice, currentSales);
  return {
    calculationId: row[0] || "",
    brand: row[1] || "",
    product: row[2] || "",
    fixedCost,
    variableCost,
    sellingPrice,
    contributionMargin: parseNum(row[6]) || calc.contributionMargin,
    bepUnits: parseNum(row[7]) || calc.bepUnits,
    bepRevenue: parseNum(row[8]) || calc.bepRevenue,
    currentSales,
    marginOfSafety: parseNum(row[10]) || calc.marginOfSafety,
    profit: parseNum(row[11]) || calc.profit,
  };
}

export async function GET() {
  try {
    const rows = await readRange(RANGE);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ bep: [], source: "sheets" });
    }
    const dataRows = rows[0]?.[0] === "Calculation ID" ? rows.slice(1) : rows;
    const bep = dataRows
      .filter((r) => r && r[0])
      .map(rowToBEP);
    return NextResponse.json({ bep, source: "sheets" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch BEP calculations", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand, product, fixedCost: fc, variableCost: vc, sellingPrice: sp, currentSales: cs } = body;

    if (!brand || !product || fc == null || vc == null || sp == null) {
      return NextResponse.json(
        { error: "Missing required fields: brand, product, fixedCost, variableCost, sellingPrice" },
        { status: 400 }
      );
    }

    const fixedCost = parseNum(fc);
    const variableCost = parseNum(vc);
    const sellingPrice = parseNum(sp);
    const currentSales = parseNum(cs) || 0;

    if (sellingPrice <= variableCost) {
      return NextResponse.json(
        { error: "Selling price must be greater than variable cost per unit" },
        { status: 400 }
      );
    }

    const calc = calcBEP(fixedCost, variableCost, sellingPrice, currentSales);
    const calculationId = `BEP-${Date.now()}`;

    const row = [
      calculationId,
      brand,
      product,
      fixedCost,
      variableCost,
      sellingPrice,
      calc.contributionMargin,
      Math.round(calc.bepUnits * 100) / 100,
      Math.round(calc.bepRevenue),
      currentSales,
      Math.round(calc.marginOfSafety * 100) / 100,
      Math.round(calc.profit),
    ];

    await appendRows(SHEET_NAME, [row]);

    return NextResponse.json({
      bep: {
        calculationId,
        brand,
        product,
        fixedCost,
        variableCost,
        sellingPrice,
        ...calc,
        currentSales,
      },
      source: "sheets",
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to calculate BEP", details: String(error) },
      { status: 500 }
    );
  }
}
