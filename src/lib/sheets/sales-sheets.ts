// Sales Target vs Actual — Google Sheets data layer
// Uses Sales_Targets and Sales_Actuals sheets

import { readRange, appendRows, writeRange } from "./sheets-real";

// ── Types ──────────────────────────────────────────────────────────

export interface SalesTarget {
  targetId: string;
  brandId: string;
  brandName: string;
  year: number;
  month: number;
  targetAmount: number;
  actualAmount: number;
  achievementPct: number;
  notes: string;
  createdDate: string;
  updatedDate: string;
}

export interface SalesActual {
  actualId: string;
  date: string;
  brandId: string;
  brandName: string;
  productSku: string;
  qtySold: number;
  unitPrice: number;
  totalRevenue: number;
  channel: string;
  notes: string;
}

export interface AchievementSummary {
  brandId: string;
  brandName: string;
  totalTarget: number;
  totalActual: number;
  achievementPct: number;
  months: {
    month: number;
    monthName: string;
    target: number;
    actual: number;
    achievementPct: number;
  }[];
}

export interface TrendData {
  brandId: string;
  brandName: string;
  monthly: {
    month: number;
    monthName: string;
    target: number;
    actual: number;
    achievementPct: number;
    momGrowthPct: number | null;
  }[];
  totalTarget: number;
  totalActual: number;
  overallAchievementPct: number;
}

// ── Brand master (from Brand_Master sheet) ────────────────────────

export interface BrandInfo {
  id: string;
  name: string;
  category: string;
  status: string;
}

const TARGET_HEADERS = [
  "Target ID", "Brand ID", "Brand Name", "Year", "Month",
  "Target Amount", "Actual Amount", "Achievement %",
  "Notes", "Created Date", "Updated Date"
];

const ACTUAL_HEADERS = [
  "Actual ID", "Date", "Brand ID", "Brand Name",
  "Product/SKU", "Qty Sold", "Unit Price", "Total Revenue",
  "Channel", "Notes"
];

// ── Helper ─────────────────────────────────────────────────────────

function n(value: unknown): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  return Number(String(value).replace(/[^0-9.-]/g, "")) || 0;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// ── Initialize sheets with headers ─────────────────────────────────

export async function ensureSalesSheetsInitialized(): Promise<void> {
  try {
    // Check if Sales_Targets has headers
    const targetRows = await readRange("Sales_Targets!A1:K1");
    if (!targetRows || targetRows.length === 0 || !targetRows[0][0]) {
      await writeRange("Sales_Targets!A1:K1", [TARGET_HEADERS]);
    }
  } catch {
    await writeRange("Sales_Targets!A1:K1", [TARGET_HEADERS]);
  }

  try {
    // Check if Sales_Actuals has headers
    const actualRows = await readRange("Sales_Actuals!A1:J1");
    if (!actualRows || actualRows.length === 0 || !actualRows[0][0]) {
      await writeRange("Sales_Actuals!A1:J1", [ACTUAL_HEADERS]);
    }
  } catch {
    await writeRange("Sales_Actuals!A1:J1", [ACTUAL_HEADERS]);
  }
}

// ── Read targets ───────────────────────────────────────────────────

export async function getSalesTargets(year?: number, brandId?: string): Promise<SalesTarget[]> {
  try {
    const rows = await readRange("Sales_Targets!A2:K1000");
    if (!rows || rows.length === 0) return [];

    let targets = rows.filter((r) => r.some(Boolean)).map((row) => ({
      targetId: row[0] || "",
      brandId: row[1] || "",
      brandName: row[2] || "",
      year: Number(row[3]) || 0,
      month: Number(row[4]) || 0,
      targetAmount: n(row[5]),
      actualAmount: n(row[6]),
      achievementPct: n(row[7]),
      notes: row[8] || "",
      createdDate: row[9] || "",
      updatedDate: row[10] || "",
    }));

    if (year) {
      targets = targets.filter((t) => t.year === year);
    }
    if (brandId) {
      targets = targets.filter((t) => t.brandId === brandId);
    }

    return targets.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.month !== b.month) return a.month - b.month;
      return a.brandName.localeCompare(b.brandName);
    });
  } catch {
    return [];
  }
}

// ── Read actuals ───────────────────────────────────────────────────

export async function getSalesActuals(year?: number, brandId?: string): Promise<SalesActual[]> {
  try {
    const rows = await readRange("Sales_Actuals!A2:J1000");
    if (!rows || rows.length === 0) return [];

    let actuals = rows.filter((r) => r.some(Boolean)).map((row) => ({
      actualId: row[0] || "",
      date: row[1] || "",
      brandId: row[2] || "",
      brandName: row[3] || "",
      productSku: row[4] || "",
      qtySold: n(row[5]),
      unitPrice: n(row[6]),
      totalRevenue: n(row[7]),
      channel: row[8] || "",
      notes: row[9] || "",
    }));

    if (year) {
      actuals = actuals.filter((a) => a.date.startsWith(String(year)));
    }
    if (brandId) {
      actuals = actuals.filter((a) => a.brandId === brandId);
    }

    return actuals.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  } catch {
    return [];
  }
}

// ── Get brands from Brand_Master ───────────────────────────────────

export async function getBrands(): Promise<BrandInfo[]> {
  try {
    const rows = await readRange("Brand_Master!A1:K200");
    if (!rows || rows.length <= 1) return [];
    return rows.slice(1).filter((r) => r[0] || r[1]).map((row) => ({
      id: row[0] || "",
      name: row[1] || "",
      category: row[2] || "Perfume",
      status: row[3] || "Active",
    }));
  } catch {
    return [];
  }
}

// ── Get brand name by ID ───────────────────────────────────────────

export async function getBrandNameById(brandId: string): Promise<string> {
  const brands = await getBrands();
  const brand = brands.find((b) => b.id === brandId);
  return brand?.name || brandId;
}
