// Break-Even Point Analysis — Google Sheets data layer
// Uses BEP_Calculations and Break_Even_Analysis sheets

import { readRange, writeRange, appendRows } from "./sheets-real";

// ── Types ──────────────────────────────────────────────────────────

export interface BEPCalculation {
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
  createdAt: string;
  updatedAt: string;
}

export interface WhatIfScenario {
  scenarioId: string;
  baseCalculationId: string;
  brand: string;
  product: string;
  fixedCost: number;
  variableCostPerUnit: number;
  sellingPricePerUnit: number;
  currentSales: number;
  contributionMargin: number;
  bepUnits: number;
  bepRevenue: number;
  marginOfSafety: number;
  profitLoss: number;
  priceChange: number;
  volumeChange: number;
  costChange: number;
  createdAt: string;
}

export interface BEPSummary {
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
}

// ── Constants ───────────────────────────────────────────────────────

const BEP_HEADERS = [
  "Calculation ID", "Brand", "Product",
  "Fixed Cost", "Variable Cost/Unit", "Selling Price/Unit",
  "Contribution Margin", "BEP (units)", "BEP (revenue)",
  "Current Sales", "Margin of Safety %", "Profit/Loss",
  "Created At", "Updated At",
];

const WHAT_IF_HEADERS = [
  "Scenario ID", "Base Calculation ID", "Brand", "Product",
  "Fixed Cost", "Variable Cost/Unit", "Selling Price/Unit", "Current Sales",
  "Contribution Margin", "BEP (units)", "BEP (revenue)",
  "Margin of Safety %", "Profit/Loss",
  "Price Change %", "Volume Change %", "Cost Change %",
  "Created At",
];

// ── Helpers ─────────────────────────────────────────────────────────

function n(value: unknown): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  return Number(String(value).replace(/[^0-9.-]/g, "")) || 0;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function calcBEP(
  fixedCost: number,
  variableCostPerUnit: number,
  sellingPricePerUnit: number,
  currentSales: number = 0,
): {
  contributionMargin: number;
  bepUnits: number;
  bepRevenue: number;
  marginOfSafety: number;
  profitLoss: number;
} {
  const contributionMargin = sellingPricePerUnit - variableCostPerUnit;
  const bepUnits = contributionMargin > 0 ? Math.ceil(fixedCost / contributionMargin) : 0;
  const bepRevenue = bepUnits * sellingPricePerUnit;
  const marginOfSafety =
    currentSales > 0
      ? Math.round(((currentSales - bepUnits) / currentSales) * 100 * 100) / 100
      : 0;
  const profitLoss = currentSales * contributionMargin - fixedCost;

  return {
    contributionMargin,
    bepUnits,
    bepRevenue,
    marginOfSafety,
    profitLoss,
  };
}

// ── Initialize sheets ───────────────────────────────────────────────

export async function ensureBEPSheetsInitialized(): Promise<void> {
  try {
    const rows = await readRange("BEP_Calculations!A1:N1");
    if (!rows || rows.length === 0 || !rows[0][0]) {
      await writeRange("BEP_Calculations!A1:N1", [BEP_HEADERS]);
    }
  } catch {
    await writeRange("BEP_Calculations!A1:N1", [BEP_HEADERS]);
  }
}

// ── Read all BEP calculations ───────────────────────────────────────

export async function getAllBEPCalculations(): Promise<BEPCalculation[]> {
  try {
    const rows = await readRange("BEP_Calculations!A2:N1000");
    if (!rows || rows.length === 0) return [];

    return rows.filter((r) => r.some(Boolean)).map((row) => {
      const fixedCost = n(row[3]);
      const variableCost = n(row[4]);
      const sellingPrice = n(row[5]);
      const currentSales = n(row[9]);

      // Use stored values if available, otherwise recalculate
      const contributionMargin = n(row[6]) || sellingPrice - variableCost;
      const bepUnits = n(row[7]) || (contributionMargin > 0 ? Math.ceil(fixedCost / contributionMargin) : 0);
      const bepRevenue = n(row[8]) || bepUnits * sellingPrice;
      const marginOfSafety = n(row[10]) || (currentSales > 0 ? Math.round(((currentSales - bepUnits) / currentSales) * 100 * 100) / 100 : 0);
      const profitLoss = n(row[11]) || (currentSales * contributionMargin - fixedCost);

      return {
        calculationId: row[0] || "",
        brand: row[1] || "",
        product: row[2] || "",
        fixedCost,
        variableCostPerUnit: variableCost,
        sellingPricePerUnit: sellingPrice,
        contributionMargin,
        bepUnits,
        bepRevenue,
        currentSales,
        marginOfSafety,
        profitLoss,
        createdAt: row[12] || "",
        updatedAt: row[13] || "",
      };
    });
  } catch {
    return [];
  }
}

// ── Read BEP by brand ───────────────────────────────────────────────

export async function getBEPByBrand(brand: string): Promise<BEPCalculation[]> {
  const all = await getAllBEPCalculations();
  return all.filter(
    (b) => b.brand.toLowerCase() === brand.toLowerCase()
  );
}

// ── Create BEP calculation ──────────────────────────────────────────

export async function createBEPCalculation(data: {
  brand: string;
  product: string;
  fixedCost: number;
  variableCostPerUnit: number;
  sellingPricePerUnit: number;
  currentSales?: number;
}): Promise<BEPCalculation> {
  await ensureBEPSheetsInitialized();

  const calc = calcBEP(
    data.fixedCost,
    data.variableCostPerUnit,
    data.sellingPricePerUnit,
    data.currentSales || 0,
  );

  const calculationId = generateId("BEP");
  const now = today();

  const row = [
    calculationId,
    data.brand,
    data.product,
    data.fixedCost,
    data.variableCostPerUnit,
    data.sellingPricePerUnit,
    calc.contributionMargin,
    calc.bepUnits,
    calc.bepRevenue,
    data.currentSales || 0,
    calc.marginOfSafety,
    calc.profitLoss,
    now,
    now,
  ];

  await appendRows("BEP_Calculations", [row]);

  return {
    calculationId,
    brand: data.brand,
    product: data.product,
    fixedCost: data.fixedCost,
    variableCostPerUnit: data.variableCostPerUnit,
    sellingPricePerUnit: data.sellingPricePerUnit,
    contributionMargin: calc.contributionMargin,
    bepUnits: calc.bepUnits,
    bepRevenue: calc.bepRevenue,
    currentSales: data.currentSales || 0,
    marginOfSafety: calc.marginOfSafety,
    profitLoss: calc.profitLoss,
    createdAt: now,
    updatedAt: now,
  };
}

// ── What-if scenario ────────────────────────────────────────────────

export async function createWhatIfScenario(data: {
  baseCalculationId?: string;
  brand: string;
  product: string;
  fixedCost: number;
  variableCostPerUnit: number;
  sellingPricePerUnit: number;
  currentSales: number;
  priceChange?: number;
  volumeChange?: number;
  costChange?: number;
}): Promise<WhatIfScenario> {
  await ensureBEPSheetsInitialized();

  // Apply change factors
  const priceMultiplier = 1 + (data.priceChange || 0) / 100;
  const volumeMultiplier = 1 + (data.volumeChange || 0) / 100;
  const costMultiplier = 1 + (data.costChange || 0) / 100;

  const adjustedPrice = data.sellingPricePerUnit * priceMultiplier;
  const adjustedCurrentSales = data.currentSales * volumeMultiplier;
  const adjustedVariableCost = data.variableCostPerUnit * costMultiplier;
  const adjustedFixedCost = data.fixedCost * costMultiplier;

  const calc = calcBEP(
    adjustedFixedCost,
    adjustedVariableCost,
    adjustedPrice,
    adjustedCurrentSales,
  );

  const scenarioId = generateId("WIF");
  const now = today();

  const row = [
    scenarioId,
    data.baseCalculationId || "",
    data.brand,
    data.product,
    Math.round(adjustedFixedCost),
    Math.round(adjustedVariableCost * 100) / 100,
    Math.round(adjustedPrice * 100) / 100,
    Math.round(adjustedCurrentSales),
    calc.contributionMargin,
    calc.bepUnits,
    calc.bepRevenue,
    calc.marginOfSafety,
    calc.profitLoss,
    data.priceChange || 0,
    data.volumeChange || 0,
    data.costChange || 0,
    now,
  ];

  await appendRows("BEP_Calculations", [row]);

  return {
    scenarioId,
    baseCalculationId: data.baseCalculationId || "",
    brand: data.brand,
    product: data.product,
    fixedCost: adjustedFixedCost,
    variableCostPerUnit: adjustedVariableCost,
    sellingPricePerUnit: adjustedPrice,
    currentSales: adjustedCurrentSales,
    contributionMargin: calc.contributionMargin,
    bepUnits: calc.bepUnits,
    bepRevenue: calc.bepRevenue,
    marginOfSafety: calc.marginOfSafety,
    profitLoss: calc.profitLoss,
    priceChange: data.priceChange || 0,
    volumeChange: data.volumeChange || 0,
    costChange: data.costChange || 0,
    createdAt: now,
  };
}

// ── Summary ─────────────────────────────────────────────────────────

export async function getBEPSummary(): Promise<{
  brands: BEPSummary[];
  totalFixedCosts: number;
  totalProfitLoss: number;
  profitableCount: number;
  lossCount: number;
}> {
  const all = await getAllBEPCalculations();

  const brandMap = new Map<string, BEPSummary>();

  for (const calc of all) {
    const existing = brandMap.get(calc.brand);
    if (existing) {
      existing.fixedCost += calc.fixedCost;
      existing.currentSales += calc.currentSales;
      existing.profitLoss += calc.profitLoss;
      // Weighted average for per-unit metrics
      const totalWeight = existing.currentSales + calc.currentSales;
      if (totalWeight > 0) {
        existing.sellingPricePerUnit =
          (existing.sellingPricePerUnit * existing.currentSales +
            calc.sellingPricePerUnit * calc.currentSales) / totalWeight;
        existing.variableCostPerUnit =
          (existing.variableCostPerUnit * existing.currentSales +
            calc.variableCostPerUnit * calc.currentSales) / totalWeight;
      }
    } else {
      brandMap.set(calc.brand, {
        brand: calc.brand,
        product: calc.product,
        fixedCost: calc.fixedCost,
        variableCostPerUnit: calc.variableCostPerUnit,
        sellingPricePerUnit: calc.sellingPricePerUnit,
        contributionMargin: calc.contributionMargin,
        bepUnits: calc.bepUnits,
        bepRevenue: calc.bepRevenue,
        currentSales: calc.currentSales,
        marginOfSafety: calc.marginOfSafety,
        profitLoss: calc.profitLoss,
        status: calc.profitLoss > 0 ? "profit" : calc.profitLoss < 0 ? "loss" : "break-even",
      });
    }
  }

  const brands = Array.from(brandMap.values()).map((b) => {
    // Recalculate BEP with aggregated values
    const aggCalc = calcBEP(b.fixedCost, b.variableCostPerUnit, b.sellingPricePerUnit, b.currentSales);
    return {
      ...b,
      contributionMargin: aggCalc.contributionMargin,
      bepUnits: aggCalc.bepUnits,
      bepRevenue: aggCalc.bepRevenue,
      marginOfSafety: aggCalc.marginOfSafety,
      status: b.profitLoss > 0 ? "profit" as const : b.profitLoss < 0 ? "loss" as const : "break-even" as const,
    };
  });

  const totalFixedCosts = brands.reduce((s, b) => s + b.fixedCost, 0);
  const totalProfitLoss = brands.reduce((s, b) => s + b.profitLoss, 0);
  const profitableCount = brands.filter((b) => b.status === "profit").length;
  const lossCount = brands.filter((b) => b.status === "loss").length;

  return { brands, totalFixedCosts, totalProfitLoss, profitableCount, lossCount };
}

// ── Seed data ───────────────────────────────────────────────────────

export async function seedBEPData(): Promise<void> {
  await ensureBEPSheetsInitialized();

  const existing = await getAllBEPCalculations();
  if (existing.length > 0) return; // Already seeded

  const seedData: Array<{
    brand: string;
    product: string;
    fixedCost: number;
    variableCostPerUnit: number;
    sellingPricePerUnit: number;
    currentSales: number;
  }> = [
    // Brand 1: MABRUK
    {
      brand: "MABRUK",
      product: "Mabruk Classic 100ml",
      fixedCost: 150_000_000,
      variableCostPerUnit: 45_000,
      sellingPricePerUnit: 120_000,
      currentSales: 2_500,
    },
    {
      brand: "MABRUK",
      product: "Mabruk Premium 50ml",
      fixedCost: 80_000_000,
      variableCostPerUnit: 28_000,
      sellingPricePerUnit: 75_000,
      currentSales: 3_200,
    },
    // Brand 2: ALMONDZ
    {
      brand: "ALMONDZ",
      product: "Almondz Oud 100ml",
      fixedCost: 200_000_000,
      variableCostPerUnit: 60_000,
      sellingPricePerUnit: 180_000,
      currentSales: 2_000,
    },
    {
      brand: "ALMONDZ",
      product: "Almondz Rose 50ml",
      fixedCost: 90_000_000,
      variableCostPerUnit: 32_000,
      sellingPricePerUnit: 85_000,
      currentSales: 4_500,
    },
    // Brand 3: KAYA
    {
      brand: "KAYA",
      product: "Kaya Signature 100ml",
      fixedCost: 120_000_000,
      variableCostPerUnit: 38_000,
      sellingPricePerUnit: 95_000,
      currentSales: 1_800,
    },
    {
      brand: "KAYA",
      product: "Kaya Travel Size 30ml",
      fixedCost: 50_000_000,
      variableCostPerUnit: 15_000,
      sellingPricePerUnit: 40_000,
      currentSales: 6_000,
    },
  ];

  for (const data of seedData) {
    await createBEPCalculation(data);
  }
}
