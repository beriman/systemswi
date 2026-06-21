// GET /api/formulas — list all formulas
// POST /api/formulas — create new formula
import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, googleWorkspaceWriteBlockedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { appendRows, readRanges } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

type FormulaMaster = {
  formulaId: string;
  brandId: string;
  brandName: string;
  productName: string;
  sku: string;
  productType: string;
  batchSize: number;
  unit: string;
  version: string;
  status: string;
  created: string;
  updated: string;
  rowNumber: number;
};

type CostSummary = {
  formulaId: string;
  ingredientCost: number;
  bottlingCost: number;
  packagingCost: number;
  otherCost: number;
  totalHppPerUnit: number;
  marginPercent: number;
  suggestedPrice: number;
  created: string;
  rowNumber: number;
};

const num = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(/[^\d.-]/g, "")) || 0;
  return 0;
};

const text = (value: unknown): string => String(value ?? "").trim();

function parseMasterRows(rows: string[][]): FormulaMaster[] {
  if (!rows || rows.length <= 1) return [];
  return rows.slice(1).map((row, i) => ({
    formulaId: text(row[0]) || `F-${i + 1}`,
    brandId: text(row[1]),
    brandName: text(row[2]),
    productName: text(row[3]),
    sku: text(row[4]),
    productType: text(row[5]),
    batchSize: num(row[6]),
    unit: text(row[7]) || "ml",
    version: text(row[8]) || "v1.0",
    status: text(row[9]) || "Active",
    created: text(row[10]),
    updated: text(row[11]),
    rowNumber: i + 2,
  })).filter((f) => f.formulaId && f.productName);
}

function parseCostSummaryRows(rows: string[][]): CostSummary[] {
  if (!rows || rows.length <= 1) return [];
  return rows.slice(1).map((row, i) => ({
    formulaId: text(row[0]),
    ingredientCost: num(row[1]),
    bottlingCost: num(row[2]),
    packagingCost: num(row[3]),
    otherCost: num(row[4]),
    totalHppPerUnit: num(row[5]),
    marginPercent: num(row[6]),
    suggestedPrice: num(row[7]),
    created: text(row[8]),
    rowNumber: i + 2,
  })).filter((r) => r.formulaId);
}

function calcCosts(
  ingredients: Array<{ qty: number; unitCost: number }>,
  bottlingCost: number,
  packagingCost: number,
  otherCost: number,
  batchSize: number,
  marginPercent: number
) {
  const ingredientCost = ingredients.reduce((sum, ing) => sum + ing.qty * ing.unitCost, 0);
  const totalProductionCost = ingredientCost + bottlingCost + packagingCost + otherCost;
  const hppPerUnit = batchSize > 0 ? totalProductionCost / batchSize : 0;
  const margin = marginPercent / 100;
  const suggestedPrice = margin < 1 ? hppPerUnit / (1 - margin) : hppPerUnit;
  return { ingredientCost, totalProductionCost, hppPerUnit, suggestedPrice };
}

// ── GET list all formulas ──

export async function GET() {
  try {
    const rangeResults = await readRanges([
      "Formula_Master!A1:L1000",
      "Formula_Cost_Summary!A1:I1000",
    ]);

    const formulas = parseMasterRows(rangeResults["Formula_Master!A1:L1000"] || []);
    const costSummaries = parseCostSummaryRows(rangeResults["Formula_Cost_Summary!A1:I1000"] || []);

    const costMap = new Map(costSummaries.map((c) => [c.formulaId, c]));

    const list = formulas.map((f) => ({
      ...f,
      costSummary: costMap.get(f.formulaId) || null,
    }));

    return NextResponse.json({
      source: "Google Sheets: Formula_Master + Formula_Cost_Summary",
      formulas: list,
      total: list.length,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Formula_Master", error),
        formulas: [],
        total: 0,
      });
    }
    return NextResponse.json(
      { error: "Gagal membaca formulas", details: String(error) },
      { status: 500 }
    );
  }
}

// ── POST create formula ──

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      formulaId, brandId, brandName, productName, sku, productType,
      batchSize, unit, version, status,
      ingredients, bottlingCost, packagingCost, otherCost, marginPercent,
    } = body;

    if (!formulaId) return NextResponse.json({ error: "formulaId wajib diisi" }, { status: 400 });
    if (!productName) return NextResponse.json({ error: "productName wajib diisi" }, { status: 400 });
    if (!brandName) return NextResponse.json({ error: "brandName wajib diisi" }, { status: 400 });
    if (!brandId) return NextResponse.json({ error: "brandId wajib diisi" }, { status: 400 });
    if (!batchSize || batchSize <= 0) return NextResponse.json({ error: "batchSize wajib > 0" }, { status: 400 });

    const date = new Date().toISOString().slice(0, 10);
    const ingList = Array.isArray(ingredients) ? ingredients : [];
    const margin = num(marginPercent) || 60;

    const { ingredientCost, hppPerUnit, suggestedPrice } = calcCosts(
      ingList, num(bottlingCost), num(packagingCost), num(otherCost), num(batchSize), margin
    );

    // 1. Append to Formula_Master
    await appendRows("Formula_Master", [[
      formulaId, brandId || "", brandName, productName, sku || "",
      productType || "Perfume", num(batchSize), unit || "ml",
      version || "v1.0", status || "Active", date, date,
    ]]);

    // 2. Append ingredients
    if (ingList.length > 0) {
      const ingRows = ingList.map((ing: Record<string, unknown>) => {
        const qty = num(ing.qty);
        const unitCost = num(ing.unitCost);
        const pct = num(batchSize) > 0 ? (qty / num(batchSize)) * 100 : 0;
        return [
          formulaId, text(ing.ingredientId) || "", text(ing.ingredientName) || "",
          text(ing.category) || "", qty, Math.round(pct * 100) / 100,
          unitCost, qty * unitCost, text(ing.supplier) || "TBA", text(ing.notes) || "",
        ];
      });
      await appendRows("Formula_Ingredients", ingRows);
    }

    // 3. Append cost summary
    await appendRows("Formula_Cost_Summary", [[
      formulaId, Math.round(ingredientCost), num(bottlingCost), num(packagingCost),
      num(otherCost), Math.round(hppPerUnit), margin, Math.round(suggestedPrice), date,
    ]]);

    return NextResponse.json({
      success: true, source: "Google Sheets",
      formula: {
        formulaId, brandId, brandName, productName, sku, productType,
        batchSize: num(batchSize), unit: unit || "ml", version: version || "v1.0",
        status: status || "Active", ingredientCost: Math.round(ingredientCost),
        hppPerUnit: Math.round(hppPerUnit), suggestedPrice: Math.round(suggestedPrice),
        marginPercent: margin, ingredientCount: ingList.length,
      },
      syncedSheets: ["Formula_Master", "Formula_Ingredients", "Formula_Cost_Summary"],
    }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource("Google Sheets: Formula sheets", error),
        error: "Google OAuth perlu re-auth",
      }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Gagal membuat formula", details: String(error) },
      { status: 500 }
    );
  }
}
