// Break-Even Analysis calculation engine
// Pure functions — no I/O, no Google Sheets dependency

export interface BEPCalculation {
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
  profit: number;
  createdAt: string;
}

export interface WhatIfScenario {
  id: string;
  name: string;
  baseCalculationId?: string;
  fixedCost: number;
  variableCostPerUnit: number;
  sellingPricePerUnit: number;
  projectedSales: number;
  contributionMargin: number;
  bepUnits: number;
  bepRevenue: number;
  marginOfSafety: number;
  profit: number;
  createdAt: string;
}

export interface BEPSummary {
  totalFixedCosts: number;
  totalCurrentSales: number;
  totalProfit: number;
  brandsAtBEP: number;
  brandsAboveBEP: number;
  brandsBelowBEP: number;
  brandSummaries: BrandBEPSummary[];
}

export interface BrandBEPSummary {
  brand: string;
  product: string;
  fixedCost: number;
  contributionMargin: number;
  bepUnits: number;
  bepRevenue: number;
  currentSales: number;
  marginOfSafety: number;
  profit: number;
  status: "profit" | "breakeven" | "loss";
}

// ── Core formulas ──────────────────────────────────────────────────

export function calcContributionMargin(sellingPrice: number, variableCost: number): number {
  return sellingPrice - variableCost;
}

export function calcBEPUnits(fixedCost: number, contributionMargin: number): number {
  if (contributionMargin <= 0) return Infinity;
  return Math.ceil(fixedCost / contributionMargin);
}

export function calcBEPRevenue(bepUnits: number, sellingPrice: number): number {
  return bepUnits * sellingPrice;
}

export function calcMarginOfSafety(currentSales: number, bepUnits: number): number {
  if (currentSales <= 0) return 0;
  return Math.round(((currentSales - bepUnits) / currentSales) * 100 * 100) / 100;
}

export function calcProfit(currentSales: number, contributionMargin: number, fixedCost: number): number {
  return currentSales * contributionMargin - fixedCost;
}

// ── Full BEP calculation ───────────────────────────────────────────

export function calculateBEP(params: {
  id?: string;
  brand: string;
  product: string;
  fixedCost: number;
  variableCostPerUnit: number;
  sellingPricePerUnit: number;
  currentSales?: number;
  createdAt?: string;
}): BEPCalculation {
  const {
    id = `bep-${Date.now()}`,
    brand,
    product,
    fixedCost,
    variableCostPerUnit,
    sellingPricePerUnit,
    currentSales = 0,
    createdAt = new Date().toISOString(),
  } = params;

  const contributionMargin = calcContributionMargin(sellingPricePerUnit, variableCostPerUnit);
  const bepUnits = calcBEPUnits(fixedCost, contributionMargin);
  const bepRevenue = calcBEPRevenue(bepUnits, sellingPricePerUnit);
  const marginOfSafety = calcMarginOfSafety(currentSales, bepUnits);
  const profit = calcProfit(currentSales, contributionMargin, fixedCost);

  return {
    id,
    brand,
    product,
    fixedCost,
    variableCostPerUnit,
    sellingPricePerUnit,
    contributionMargin,
    bepUnits,
    bepRevenue,
    currentSales,
    marginOfSafety,
    profit,
    createdAt,
  };
}

// ── What-If scenario ───────────────────────────────────────────────

export function calculateWhatIf(params: {
  id?: string;
  name: string;
  fixedCost: number;
  variableCostPerUnit: number;
  sellingPricePerUnit: number;
  projectedSales?: number;
}): WhatIfScenario {
  const {
    id = `whatif-${Date.now()}`,
    name,
    fixedCost,
    variableCostPerUnit,
    sellingPricePerUnit,
    projectedSales = 0,
  } = params;

  const contributionMargin = calcContributionMargin(sellingPricePerUnit, variableCostPerUnit);
  const bepUnits = calcBEPUnits(fixedCost, contributionMargin);
  const bepRevenue = calcBEPRevenue(bepUnits, sellingPricePerUnit);
  const marginOfSafety = calcMarginOfSafety(projectedSales, bepUnits);
  const profit = calcProfit(projectedSales, contributionMargin, fixedCost);

  return {
    id,
    name,
    fixedCost,
    variableCostPerUnit,
    sellingPricePerUnit,
    projectedSales,
    contributionMargin,
    bepUnits,
    bepRevenue,
    marginOfSafety,
    profit,
    createdAt: new Date().toISOString(),
  };
}

// ── Summary from multiple calculations ─────────────────────────────

export function calcSummary(calculations: BEPCalculation[]): BEPSummary {
  const brandSummaries: BrandBEPSummary[] = calculations.map((c) => ({
    brand: c.brand,
    product: c.product,
    fixedCost: c.fixedCost,
    contributionMargin: c.contributionMargin,
    bepUnits: c.bepUnits,
    bepRevenue: c.bepRevenue,
    currentSales: c.currentSales,
    marginOfSafety: c.marginOfSafety,
    profit: c.profit,
    status: c.profit > 0 ? "profit" : c.profit === 0 ? "breakeven" : "loss",
  }));

  return {
    totalFixedCosts: brandSummaries.reduce((s, b) => s + b.fixedCost, 0),
    totalCurrentSales: brandSummaries.reduce((s, b) => s + b.currentSales, 0),
    totalProfit: brandSummaries.reduce((s, b) => s + b.profit, 0),
    brandsAtBEP: brandSummaries.filter((b) => b.status === "breakeven").length,
    brandsAboveBEP: brandSummaries.filter((b) => b.status === "profit").length,
    brandsBelowBEP: brandSummaries.filter((b) => b.status === "loss").length,
    brandSummaries,
  };
}

// ── Seed data ──────────────────────────────────────────────────────

export const SEED_BEP_CALCULATIONS: BEPCalculation[] = [
  calculateBEP({
    id: "bep-001",
    brand: "Sensasi Wangi",
    product: "Eau de Parfum 50ml",
    fixedCost: 15_000_000,
    variableCostPerUnit: 35_000,
    sellingPricePerUnit: 85_000,
    currentSales: 400,
    createdAt: "2026-06-24T00:00:00Z",
  }),
  calculateBEP({
    id: "bep-002",
    brand: "Aroma Nusantara",
    product: "Body Mist 100ml",
    fixedCost: 8_000_000,
    variableCostPerUnit: 18_000,
    sellingPricePerUnit: 45_000,
    currentSales: 350,
    createdAt: "2026-06-24T00:00:00Z",
  }),
  calculateBEP({
    id: "bep-003",
    brand: "Fragrance TIM",
    product: "Mini Perfume 15ml",
    fixedCost: 5_000_000,
    variableCostPerUnit: 12_000,
    sellingPricePerUnit: 30_000,
    currentSales: 280,
    createdAt: "2026-06-24T00:00:00Z",
  }),
];

export const SEED_WHAT_IF_SCENARIOS: WhatIfScenario[] = [
  calculateWhatIf({
    id: "whatif-001",
    name: "Naikkan harga 10%",
    fixedCost: 15_000_000,
    variableCostPerUnit: 35_000,
    sellingPricePerUnit: 93_500,
    projectedSales: 380,
  }),
  calculateWhatIf({
    id: "whatif-002",
    name: "Turunkan biaya produksi 15%",
    fixedCost: 15_000_000,
    variableCostPerUnit: 29_750,
    sellingPricePerUnit: 85_000,
    projectedSales: 400,
  }),
  calculateWhatIf({
    id: "whatif-003",
    name: "Naikkan volume 20%",
    fixedCost: 15_000_000,
    variableCostPerUnit: 35_000,
    sellingPricePerUnit: 85_000,
    projectedSales: 480,
  }),
];
