// GET /api/bep — List all BEP calculations
// POST /api/bep — Calculate BEP and save
import { NextRequest, NextResponse } from "next/server";
import { readRange, appendRows } from "@/lib/sheets/sheets-real";
import { googleWorkspaceDegradedSource, googleWorkspaceWriteBlockedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const money = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const text = (value: unknown): string => String(value ?? "").trim();

export interface BEPRow {
  id: string;
  brand: string;
  product: string;
  fixedCost: number;
  variableCostPerUnit: number;
  sellingPricePerUnit: number;
  contributionMargin: number;
  bepUnits: number;
  bepRevenue: number;
  currentSales: number;
  marginOfSafety: number;
  profitLoss: number;
  createdAt: string;
}

function calcBEP(fixedCost: number, variableCost: number, sellingPrice: number) {
  const contributionMargin = sellingPrice - variableCost;
  if (contributionMargin <= 0) {
    return { contributionMargin: 0, bepUnits: 0, bepRevenue: 0 };
  }
  const bepUnits = Math.ceil(fixedCost / contributionMargin);
  const bepRevenue = bepUnits * sellingPrice;
  return { contributionMargin, bepUnits, bepRevenue };
}

function parseBEPRows(rows: string[][]): BEPRow[] {
  if (rows.length <= 1) return [];
  const headers = rows[0].map((h) => h.toLowerCase().replace(/[\s/]/g, ""));

  return rows.slice(1)
    .filter((row) => row.some((cell) => text(cell) !== ""))
    .map((row, idx) => {
      const get = (colNames: string[]): string => {
        for (const name of colNames) {
          const i = headers.indexOf(name.toLowerCase().replace(/[\s/]/g, ""));
          if (i >= 0 && i < row.length) return row[i];
        }
        return "";
      };

      const fixedCost = money(get(["fixedcost", "fixed cost", "biaya tetap"]));
      const variableCost = money(get(["variablecostperunit", "variable cost/unit", "variable cost", "biaya variabel"]));
      const sellingPrice = money(get(["sellingpriceperunit", "selling price/unit", "selling price", "harga jual"]));
      const currentSales = money(get(["currentsales", "current sales", "penjualan saat ini", "sales"]));

      const { contributionMargin, bepUnits, bepRevenue } = calcBEP(fixedCost, variableCost, sellingPrice);
      const marginOfSafety = currentSales > 0 ? Math.round(((currentSales - bepUnits) / currentSales) * 100) : 0;
      const profitLoss = (currentSales * contributionMargin) - fixedCost;

      return {
        id: text(get(["id", "calculation id", "calc id"])) || `bep-${idx + 2}`,
        brand: text(get(["brand", "merek"])) || "Unknown",
        product: text(get(["product", "produk"])) || "Unknown",
        fixedCost,
        variableCostPerUnit: variableCost,
        sellingPricePerUnit: sellingPrice,
        contributionMargin,
        bepUnits,
        bepRevenue,
        currentSales,
        marginOfSafety,
        profitLoss,
        createdAt: text(get(["createdat", "created at", "date", "tanggal"])) || new Date().toISOString().split("T")[0],
      };
    });
}

export async function GET() {
  try {
    const rawRows = await readRange("BEP_Calculations!A1:L1000");
    const rows = parseBEPRows(rawRows);

    return NextResponse.json({
      source: "Google Sheets: BEP_Calculations",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: BEP_Calculations", error),
        data: [],
      });
    }
    return NextResponse.json({ error: "Failed to fetch BEP data", details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = new Date();
    const id = `bep-${Date.now()}`;

    const fixedCost = Number(body.fixedCost) || 0;
    const variableCost = Number(body.variableCostPerUnit) || 0;
    const sellingPrice = Number(body.sellingPricePerUnit) || 0;
    const currentSales = Number(body.currentSales) || 0;

    const { contributionMargin, bepUnits, bepRevenue } = calcBEP(fixedCost, variableCost, sellingPrice);
    const marginOfSafety = currentSales > 0 ? Math.round(((currentSales - bepUnits) / currentSales) * 100) : 0;
    const profitLoss = (currentSales * contributionMargin) - fixedCost;

    const row = [
      id,
      body.brand || "Unknown",
      body.product || "Unknown",
      fixedCost,
      variableCost,
      sellingPrice,
      contributionMargin,
      bepUnits,
      bepRevenue,
      currentSales,
      marginOfSafety,
      profitLoss,
      now.toISOString().split("T")[0],
    ];

    await appendRows("BEP_Calculations", [row]);

    return NextResponse.json({
      success: true,
      id,
      data: {
        id,
        brand: body.brand || "Unknown",
        product: body.product || "Unknown",
        fixedCost,
        variableCostPerUnit: variableCost,
        sellingPricePerUnit: sellingPrice,
        contributionMargin,
        bepUnits,
        bepRevenue,
        currentSales,
        marginOfSafety,
        profitLoss,
        createdAt: now.toISOString().split("T")[0],
      },
    }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource("Google Sheets: BEP_Calculations", error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to calculate BEP", details: String(error) }, { status: 500 });
  }
}
