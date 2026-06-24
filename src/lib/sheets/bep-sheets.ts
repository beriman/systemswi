// BEP Sheets helper — read/write BEP_Calculations sheet
// Provides functions consumed by /api/bep/* routes
import { readRange, writeRange, appendRows } from "@/lib/sheets/sheets-real";

export const BEP_SHEET = "BEP_Calculations";

export interface BEPRow {
  calculationId: string;
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
}

export interface WhatIfInput {
  brand: string;
  product: string;
  fixedCost: number;
  variableCostPerUnit: number;
  sellingPricePerUnit: number;
  currentSales: number;
  priceChange: number;
  volumeChange: number;
  costChange: number;
}

const text = (v: unknown): string => String(v ?? "").trim();
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// ── Pure BEP formula ────────────────────────────────────────────────
export function calcBEP(
  fixedCost: number,
  variableCostPerUnit: number,
  sellingPricePerUnit: number,
  currentSales: number = 0,
) {
  const contributionMargin = sellingPricePerUnit - variableCostPerUnit;
  if (contributionMargin <= 0) {
    return { contributionMargin: 0, bepUnits: 0, bepRevenue: 0, marginOfSafety: 0, profitLoss: 0 };
  }
  const bepUnits = Math.ceil(fixedCost / contributionMargin);
  const bepRevenue = bepUnits * sellingPricePerUnit;
  const marginOfSafety =
    currentSales > 0
      ? Math.round(((currentSales - bepUnits) / currentSales) * 100 * 100) / 100
      : 0;
  const profitLoss = currentSales * contributionMargin - fixedCost;
  return { contributionMargin, bepUnits, bepRevenue, marginOfSafety, profitLoss };
}

// ── Parse sheet row to BEPRow ───────────────────────────────────────
function parseRow(row: string[]): BEPRow {
  return {
    calculationId: text(row[0]),
    brand: text(row[1]),
    product: text(row[2]),
    fixedCost: num(row[3]),
    variableCostPerUnit: num(row[4]),
    sellingPricePerUnit: num(row[5]),
    contributionMargin: num(row[6]),
    bepUnits: num(row[7]),
    bepRevenue: num(row[8]),
    currentSales: num(row[9]),
    marginOfSafety: num(row[10]),
    profitLoss: num(row[11]),
  };
}

// ── Public functions ────────────────────────────────────────────────

export async function getAllBEPCalculations(): Promise<BEPRow[]> {
  const rows = await readRange("BEP_Calculations!A1:L1000");
  if (rows.length <= 1) return [];
  return rows
    .slice(1)
    .filter((r) => r.some((c) => text(c) !== ""))
    .map(parseRow);
}

export async function getBEPByBrand(brand: string): Promise<BEPRow[]> {
  const all = await getAllBEPCalculations();
  return all.filter(
    (r) => r.brand.toLowerCase() === brand.toLowerCase()
  );
}

export async function createBEPCalculation(data: {
  brand: string;
  product: string;
  fixedCost: number;
  variableCostPerUnit: number;
  sellingPricePerUnit: number;
  currentSales: number;
}): Promise<BEPRow> {
  const calc = calcBEP(
    data.fixedCost,
    data.variableCostPerUnit,
    data.sellingPricePerUnit,
    data.currentSales
  );

  // Read existing to determine next ID
  const rows = await readRange("BEP_Calculations!A1:L1000");
  const dataRows = rows.slice(1).filter((r) => r.some((c) => text(c) !== ""));
  const nextId = dataRows.length + 1;

  const row: BEPRow = {
    calculationId: `bep-${String(nextId).padStart(4, "0")}`,
    brand: data.brand,
    product: data.product,
    fixedCost: data.fixedCost,
    variableCostPerUnit: data.variableCostPerUnit,
    sellingPricePerUnit: data.sellingPricePerUnit,
    contributionMargin: calc.contributionMargin,
    bepUnits: calc.bepUnits,
    bepRevenue: calc.bepRevenue,
    currentSales: data.currentSales,
    marginOfSafety: calc.marginOfSafety,
    profitLoss: calc.profitLoss,
  };

  // Append row to sheet
  await appendRows(BEP_SHEET, [[
    row.calculationId,
    row.brand,
    row.product,
    row.fixedCost,
    row.variableCostPerUnit,
    row.sellingPricePerUnit,
    row.contributionMargin,
    row.bepUnits,
    row.bepRevenue,
    row.currentSales,
    row.marginOfSafety,
    row.profitLoss,
  ]]);

  return row;
}

export async function createWhatIfScenario(input: WhatIfInput) {
  const base = calcBEP(
    input.fixedCost,
    input.variableCostPerUnit,
    input.sellingPricePerUnit,
    input.currentSales
  );

  const priceMult = 1 + input.priceChange / 100;
  const volMult = 1 + input.volumeChange / 100;
  const costMult = 1 + input.costChange / 100;

  const scenario = calcBEP(
    input.fixedCost * costMult,
    input.variableCostPerUnit * costMult,
    input.sellingPricePerUnit * priceMult,
    input.currentSales * volMult
  );

  return {
    scenarioId: `whatif-${Date.now()}`,
    brand: input.brand,
    product: input.product,
    fixedCost: input.fixedCost * costMult,
    variableCostPerUnit: input.variableCostPerUnit * costMult,
    sellingPricePerUnit: input.sellingPricePerUnit * priceMult,
    currentSales: input.currentSales * volMult,
    contributionMargin: scenario.contributionMargin,
    bepUnits: scenario.bepUnits,
    bepRevenue: scenario.bepRevenue,
    marginOfSafety: scenario.marginOfSafety,
    profitLoss: scenario.profitLoss,
    priceChange: input.priceChange,
    volumeChange: input.volumeChange,
    costChange: input.costChange,
  };
}

export async function getBEPSummary() {
  const all = await getAllBEPCalculations();

  const brandMap = new Map<string, {
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
    status: "profit" | "loss" | "break-even";
  }>();

  for (const row of all) {
    const existing = brandMap.get(row.brand);
    const status = row.profitLoss > 0 ? "profit" : row.profitLoss < 0 ? "loss" : "break-even";
    if (!existing) {
      brandMap.set(row.brand, {
        brand: row.brand,
        product: row.product,
        fixedCost: row.fixedCost,
        variableCostPerUnit: row.variableCostPerUnit,
        sellingPricePerUnit: row.sellingPricePerUnit,
        contributionMargin: row.contributionMargin,
        bepUnits: row.bepUnits,
        bepRevenue: row.bepRevenue,
        currentSales: row.currentSales,
        marginOfSafety: row.marginOfSafety,
        profitLoss: row.profitLoss,
        status,
      });
    } else {
      // Aggregate: sum fixed costs, weighted avg for rest
      existing.fixedCost += row.fixedCost;
      existing.profitLoss += row.profitLoss;
      existing.currentSales += row.currentSales;
      existing.bepUnits += row.bepUnits;
      existing.bepRevenue += row.bepRevenue;
      if (existing.profitLoss < 0) existing.status = "loss";
    }
  }

  const brands = Array.from(brandMap.values());
  const totalFixedCosts = brands.reduce((s, b) => s + b.fixedCost, 0);
  const totalProfitLoss = brands.reduce((s, b) => s + b.profitLoss, 0);
  const profitableCount = brands.filter((b) => b.status === "profit").length;
  const lossCount = brands.filter((b) => b.status === "loss").length;

  return { brands, totalFixedCosts, totalProfitLoss, profitableCount, lossCount };
}

export async function seedBEPData(): Promise<BEPRow[]> {
  const rows = await readRange("BEP_Calculations!A1:L1000");
  const hasData = rows.length > 1 && rows.slice(1).some((r) => r.some((c) => text(c) !== ""));
  if (hasData) return getAllBEPCalculations();

  // No data — seed from seed route data
  const seedData = [
    { brand: "Wangi Signature", product: "Eau de Parfum 50ml", fixedCost: 45_000_000, variableCostPerUnit: 85_000, sellingPricePerUnit: 180_000, currentSales: 320 },
    { brand: "Wangi Signature", product: "Eau de Toilette 30ml", fixedCost: 30_000_000, variableCostPerUnit: 45_000, sellingPricePerUnit: 95_000, currentSales: 480 },
    { brand: "Wangi Signature", product: "Body Mist 100ml", fixedCost: 20_000_000, variableCostPerUnit: 22_000, sellingPricePerUnit: 55_000, currentSales: 650 },
    { brand: "Aroma Nusantara", product: "Eau de Parfum 30ml", fixedCost: 35_000_000, variableCostPerUnit: 55_000, sellingPricePerUnit: 120_000, currentSales: 380 },
    { brand: "Aroma Nusantara", product: "Roll-On 10ml", fixedCost: 15_000_000, variableCostPerUnit: 12_000, sellingPricePerUnit: 35_000, currentSales: 720 },
    { brand: "Aroma Nusantara", product: "Hair Mist 50ml", fixedCost: 18_000_000, variableCostPerUnit: 18_000, sellingPricePerUnit: 45_000, currentSales: 550 },
    { brand: "Scent of SWI", product: "Mini Discovery Set", fixedCost: 25_000_000, variableCostPerUnit: 35_000, sellingPricePerUnit: 80_000, currentSales: 420 },
    { brand: "Scent of SWI", product: "Travel Size 15ml", fixedCost: 12_000_000, variableCostPerUnit: 20_000, sellingPricePerUnit: 48_000, currentSales: 380 },
    { brand: "Scent of SWI", product: "Gift Box Set", fixedCost: 40_000_000, variableCostPerUnit: 120_000, sellingPricePerUnit: 280_000, currentSales: 180 },
  ];

  const newRows: (string | number)[][] = [];
  let idCounter = 1;

  for (const item of seedData) {
    const calc = calcBEP(item.fixedCost, item.variableCostPerUnit, item.sellingPricePerUnit, item.currentSales);
    const id = `bep-${String(idCounter).padStart(4, "0")}`;
    newRows.push([
      id, item.brand, item.product, item.fixedCost, item.variableCostPerUnit,
      item.sellingPricePerUnit, calc.contributionMargin, calc.bepUnits, calc.bepRevenue,
      item.currentSales, calc.marginOfSafety, calc.profitLoss,
    ]);
    idCounter++;
  }

  const headers = ["ID", "Brand", "Product", "Fixed Cost", "Variable Cost/Unit", "Selling Price/Unit", "Contribution Margin", "BEP (units)", "BEP (revenue)", "Current Sales", "Margin of Safety", "Profit/Loss"];
  const allRows: (string | number)[][] = [headers, ...newRows];

  // Pad
  const paddedRows = allRows.map((row) => {
    const padded = [...row];
    while (padded.length < 12) padded.push("");
    return padded;
  });
  while (paddedRows.length < 1000) paddedRows.push(Array(12).fill(""));

  await writeRange("BEP_Calculations!A1:L1000", paddedRows);

  return getAllBEPCalculations();
}
