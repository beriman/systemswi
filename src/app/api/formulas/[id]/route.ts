// GET /api/formulas/[id] — formula detail with ingredients
// PUT /api/formulas/[id] — update formula
// DELETE /api/formulas/[id] — delete formula
import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, googleWorkspaceWriteBlockedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { appendRows, readRange, updateRow, deleteRow, readRanges } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const num = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(/[^\d.-]/g, "")) || 0;
  return 0;
};

const text = (value: unknown): string => String(value ?? "").trim();

function parseMasterRows(rows: string[][]) {
  if (!rows || rows.length <= 1) return [];
  return rows.slice(1).map((row, i) => ({
    formulaId: text(row[0]) || `F-${i + 1}`,
    brandId: text(row[1]), brandName: text(row[2]), productName: text(row[3]),
    sku: text(row[4]), productType: text(row[5]), batchSize: num(row[6]),
    unit: text(row[7]) || "ml", version: text(row[8]) || "v1.0",
    status: text(row[9]) || "Active", created: text(row[10]), updated: text(row[11]),
    rowNumber: i + 2,
  })).filter((f) => f.formulaId && f.productName);
}

function parseIngredientRows(rows: string[][]) {
  if (!rows || rows.length <= 1) return [];
  return rows.slice(1).map((row, i) => ({
    formulaId: text(row[0]), ingredientId: text(row[1]), ingredientName: text(row[2]),
    category: text(row[3]), qty: num(row[4]), percent: num(row[5]),
    unitCost: num(row[6]), totalCost: num(row[7]), supplier: text(row[8]),
    notes: text(row[9]), rowNumber: i + 2,
  })).filter((r) => r.formulaId && r.ingredientName);
}

function parseCostSummaryRows(rows: string[][]) {
  if (!rows || rows.length <= 1) return [];
  return rows.slice(1).map((row, i) => ({
    formulaId: text(row[0]), ingredientCost: num(row[1]), bottlingCost: num(row[2]),
    packagingCost: num(row[3]), otherCost: num(row[4]), totalHppPerUnit: num(row[5]),
    marginPercent: num(row[6]), suggestedPrice: num(row[7]), created: text(row[8]),
    rowNumber: i + 2,
  })).filter((r) => r.formulaId);
}

function calcCosts(
  ingredients: Array<{ qty: number; unitCost: number }>,
  bottlingCost: number, packagingCost: number, otherCost: number,
  batchSize: number, marginPercent: number
) {
  const ingredientCost = ingredients.reduce((sum, ing) => sum + ing.qty * ing.unitCost, 0);
  const totalProductionCost = ingredientCost + bottlingCost + packagingCost + otherCost;
  const hppPerUnit = batchSize > 0 ? totalProductionCost / batchSize : 0;
  const margin = marginPercent / 100;
  const suggestedPrice = margin < 1 ? hppPerUnit / (1 - margin) : hppPerUnit;
  return { ingredientCost, totalProductionCost, hppPerUnit, suggestedPrice };
}

// ── GET formula detail ──

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: formulaId } = await params;
    const rangeResults = await readRanges([
      "Formula_Master!A1:L1000",
      "Formula_Ingredients!A1:J1000",
      "Formula_Cost_Summary!A1:I1000",
    ]);

    const formulas = parseMasterRows(rangeResults["Formula_Master!A1:L1000"] || []);
    const formula = formulas.find((f) => f.formulaId.toLowerCase() === formulaId.toLowerCase());

    if (!formula) {
      return NextResponse.json({ error: `Formula ${formulaId} tidak ditemukan` }, { status: 404 });
    }

    const allIngredients = parseIngredientRows(rangeResults["Formula_Ingredients!A1:J1000"] || []);
    const ingredients = allIngredients.filter(
      (ing) => ing.formulaId.toLowerCase() === formulaId.toLowerCase()
    );

    const costSummaries = parseCostSummaryRows(rangeResults["Formula_Cost_Summary!A1:I1000"] || []);
    const costSummary = costSummaries.find(
      (c) => c.formulaId.toLowerCase() === formulaId.toLowerCase()
    ) || null;

    return NextResponse.json({
      source: "Google Sheets: Formula_Master + Formula_Ingredients + Formula_Cost_Summary",
      formula: { ...formula, ingredients, costSummary },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Formula_Master", error),
        formula: null,
      });
    }
    return NextResponse.json(
      { error: "Gagal membaca formula detail", details: String(error) },
      { status: 500 }
    );
  }
}

// ── PUT update formula ──

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: formulaId } = await params;
    const body = await request.json();
    const {
      brandId, brandName, productName, sku, productType,
      batchSize, unit, version, status,
      ingredients, bottlingCost, packagingCost, otherCost, marginPercent,
    } = body;

    // Find existing formula
    const masterRows = await readRange("Formula_Master!A1:L1000");
    const formulas = parseMasterRows(masterRows);
    const existing = formulas.find((f) => f.formulaId.toLowerCase() === formulaId.toLowerCase());

    if (!existing) {
      return NextResponse.json({ error: `Formula ${formulaId} tidak ditemukan` }, { status: 404 });
    }

    const date = new Date().toISOString().slice(0, 10);
    const ingList = Array.isArray(ingredients) ? ingredients : [];
    const margin = num(marginPercent) || 60;

    const { ingredientCost, hppPerUnit, suggestedPrice } = calcCosts(
      ingList, num(bottlingCost), num(packagingCost), num(otherCost),
      num(batchSize || existing.batchSize), margin
    );

    // Update Formula_Master
    await updateRow("Formula_Master", existing.rowNumber, [
      formulaId, brandId || existing.brandId, brandName || existing.brandName,
      productName || existing.productName, sku || existing.sku,
      productType || existing.productType, num(batchSize || existing.batchSize),
      unit || existing.unit, version || existing.version, status || existing.status,
      existing.created, date,
    ]);

    // Delete old ingredients and re-append
    const ingRows = await readRange("Formula_Ingredients!A1:J1000");
    const allIngredients = parseIngredientRows(ingRows);
    const toDelete = allIngredients
      .filter((ing) => ing.formulaId.toLowerCase() === formulaId.toLowerCase())
      .sort((a, b) => b.rowNumber - a.rowNumber);

    for (const ing of toDelete) {
      await deleteRow("FormulaIngredients", ing.rowNumber);
    await deleteRow("Formula_Ingredients", ing.rowNumber);
    }
    if (ingList.length > 0) {
    const newIngRows = ingList.map((ing: Record<string, unknown>) => {
      const qty = num(ing.qty);
      const unitCost = num(ing.unitCost);
      const bs = num(batchSize || existing.batchSize);
      const pct = bs > 0 ? (qty / bs) * 100 : 0;
      return [
        formulaId, text(ing.ingredientId) || "", text(ing.ingredientName) || "",
        text(ing.category) || "", qty, Math.round(pct * 100) / 100,
        unitCost, qty * unitCost, text(ing.supplier) || "TBA", text(ing.notes) || "",
      ];
    });
    await appendRows("Formula_Ingredients", newIngRows);
    }

    // Update or append cost summary
    const costRows = await readRange("Formula_Cost_Summary!A1:I1000");
    const costSummaries = parseCostSummaryRows(costRows);
    const existingCost = costSummaries.find((c) => c.formulaId.toLowerCase() === formulaId.toLowerCase());

    if (existingCost) {
    await updateRow("Formula_Cost_Summary", existingCost.rowNumber, [
      formulaId, Math.round(ingredientCost), num(bottlingCost), num(packagingCost),
      num(otherCost), Math.round(hppPerUnit), margin, Math.round(suggestedPrice), existingCost.created,
    ]);
    } else {
    await appendRows("Formula_Cost_Summary", [[
      formulaId, Math.round(ingredientCost), num(bottlingCost), num(packagingCost),
      num(otherCost), Math.round(hppPerUnit), margin, Math.round(suggestedPrice), date,
    ]]);
    }

    return NextResponse.json({
    success: true, source: "Google Sheets",
    formula: { formulaId, hppPerUnit: Math.round(hppPerUnit), suggestedPrice: Math.round(suggestedPrice), ingredientCost: Math.round(ingredientCost) },
    syncedSheets: ["Formula_Master", "Formula_Ingredients", "Formula_Cost_Summary"],
    });
    } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
    return NextResponse.json({
      ...googleWorkspaceWriteBlockedSource("Google Sheets: Formula sheets", error),
      error: "Google OAuth perlu re-auth",
    }, { status: 503 });
    }
    return NextResponse.json(
    { error: "Gagal update formula", details: String(error) },
    { status: 500 }
    );
    }
    }

    // ── DELETE formula ──

    export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
    const { id: formulaId } = await params;

    const masterRows = await readRange("Formula_Master!A1:L1000");
    const formulas = parseMasterRows(masterRows);
    const existing = formulas.find((f) => f.formulaId.toLowerCase() === formulaId.toLowerCase());

    if (!existing) {
    return NextResponse.json({ error: `Formula ${formulaId} tidak ditemukan` }, { status: 404 });
    }

    await deleteRow("Formula_Master", existing.rowNumber);

    // Delete ingredients
    const ingRows = await readRange("Formula_Ingredients!A1:J1000");
    const allIngredients = parseIngredientRows(ingRows);
    const toDelete = allIngredients
    .filter((ing) => ing.formulaId.toLowerCase() === formulaId.toLowerCase())
    .sort((a, b) => b.rowNumber - a.rowNumber);

    for (const ing of toDelete) {
    await deleteRow("Formula_Ingredients", ing.rowNumber);
    }

    // Delete cost summary
    const costRows = await readRange("Formula_Cost_Summary!A1:I1000");
    const costSummaries = parseCostSummaryRows(costRows);
    const existingCost = costSummaries.find((c) => c.formulaId.toLowerCase() === formulaId.toLowerCase());
    if (existingCost) {
    await deleteRow("Formula_Cost_Summary", existingCost.rowNumber);
    }

    return NextResponse.json({
      success: true, action: "delete", formulaId,
      deletedIngredients: toDelete.length,
      syncedSheets: ["Formula_Master", "Formula_Ingredients", "Formula_Cost_Summary"],
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource("Google Sheets: Formula sheets", error),
        error: "Google OAuth perlu re-auth",
      }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Gagal hapus formula", details: String(error) },
      { status: 500 }
    );
  }
}
