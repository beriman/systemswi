// Sales Target vs Actual — Google Sheets data layer
// Uses Sales_Targets and Sales_Actuals sheets

import { readRange, appendRows, writeRange } from "./sheets-real";

// Re-export for use in API routes
export { readRange, writeRange };

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

// ── Write: Create/Update target ────────────────────────────────────

export async function createTarget(data: {
  brandId: string;
  brandName: string;
  year: number;
  month: number;
  targetAmount: number;
  notes?: string;
}): Promise<SalesTarget> {
  await ensureSalesSheetsInitialized();

  const targets = await getSalesTargets();
  // Check if target already exists for this brand+year+month
  const existing = targets.find(
    (t) => t.brandId === data.brandId && t.year === data.year && t.month === data.month
  );

  const today = todayDate();
  const targetId = existing?.targetId || `TGT-${Date.now()}`;
  const achievementPct = existing ? existing.achievementPct : 0;

  if (existing) {
    // Update existing row — read all targets to find row index
    const allRows = await readRange("Sales_Targets!A2:K1000");
    const rowIndex = allRows.findIndex(
      (r) => r[1] === data.brandId && Number(r[3]) === data.year && Number(r[4]) === data.month
    );
    if (rowIndex >= 0) {
      const rowNum = rowIndex + 2; // +1 for header, +1 for 1-based
      await writeRange(`Sales_Targets!A${rowNum}:K${rowNum}`, [[
        targetId, data.brandId, data.brandName, data.year, data.month,
        data.targetAmount, existing.actualAmount, achievementPct,
        data.notes || existing.notes || "", existing.createdDate || today, today
      ]]);
    }
  } else {
    // Append new row
    await appendRows("SalesTargets", [[
      targetId, data.brandId, data.brandName, data.year, data.month,
      data.targetAmount, 0, 0, data.notes || "", today, today
    ]]);
  }

  return {
    targetId,
    brandId: data.brandId,
    brandName: data.brandName,
    year: data.year,
    month: data.month,
    targetAmount: data.targetAmount,
    actualAmount: existing?.actualAmount || 0,
    achievementPct,
    notes: data.notes || existing?.notes || "",
    createdDate: existing?.createdDate || today,
    updatedDate: today,
  };
}

// ── Write: Create actual sale ──────────────────────────────────────

export async function createActual(data: {
  date: string;
  brandId: string;
  brandName: string;
  productSku: string;
  qtySold: number;
  unitPrice: number;
  channel: string;
  notes?: string;
}): Promise<SalesActual> {
  await ensureSalesSheetsInitialized();

  const actualId = `ACT-${Date.now()}`;
  const totalRevenue = data.qtySold * data.unitPrice;

  await appendRows("SalesActuals", [[
    actualId, data.date, data.brandId, data.brandName,
    data.productSku, data.qtySold, data.unitPrice, totalRevenue,
    data.channel, data.notes || ""
  ]]);

  return {
    actualId,
    date: data.date,
    brandId: data.brandId,
    brandName: data.brandName,
    productSku: data.productSku,
    qtySold: data.qtySold,
    unitPrice: data.unitPrice,
    totalRevenue,
    channel: data.channel,
    notes: data.notes || "",
  };
}

// ── Recalculate achievement for a target ───────────────────────────

export async function recalculateAchievement(
  brandId: string, year: number, month: number
): Promise<void> {
  // Get total actuals for this brand+month
  const actuals = await getSalesActuals(year, brandId);
  const monthActuals = actuals.filter((a) => {
    const d = new Date(a.date);
    return d.getMonth() + 1 === month;
  });
  const totalActual = monthActuals.reduce((sum, a) => sum + a.totalRevenue, 0);

  // Find the target and update
  const targets = await getSalesTargets(year, brandId);
  const target = targets.find((t) => t.month === month);
  if (!target) return;

  const achievementPct = target.targetAmount > 0
    ? Math.round((totalActual / target.targetAmount) * 100 * 100) / 100
    : 0;

  // Read all rows to find the row index
  const allRows = await readRange("Sales_Targets!A2:K1000");
  const rowIndex = allRows.findIndex(
    (r) => r[1] === brandId && Number(r[3]) === year && Number(r[4]) === month
  );
  if (rowIndex >= 0) {
    const rowNum = rowIndex + 2;
    await writeRange(`Sales_Targets!F${rowNum}:H${rowNum}`, [[
      target.targetAmount, totalActual, achievementPct
    ]]);
  }
}

// ── Achievement summary ────────────────────────────────────────────

export async function getAchievementSummary(year: number): Promise<{
  year: number;
  brands: AchievementSummary[];
  grandTotal: { target: number; actual: number; achievementPct: number };
}> {
  const targets = await getSalesTargets(year);
  const actuals = await getSalesActuals(year);

  // Aggregate actuals per brand+month
  const actualMap: Record<string, Record<number, number>> = {};
  for (const a of actuals) {
    const d = new Date(a.date);
    const m = d.getMonth() + 1;
    if (!actualMap[a.brandId]) actualMap[a.brandId] = {};
    actualMap[a.brandId][m] = (actualMap[a.brandId][m] || 0) + a.totalRevenue;
  }

  // Build per-brand achievement
  const brandMap: Record<string, AchievementSummary> = {};
  for (const t of targets) {
    if (!brandMap[t.brandId]) {
      brandMap[t.brandId] = {
        brandId: t.brandId,
        brandName: t.brandName,
        totalTarget: 0,
        totalActual: 0,
        achievementPct: 0,
        months: [],
      };
    }
    const b = brandMap[t.brandId];
    const actual = actualMap[t.brandId]?.[t.month] || 0;
    const ach = t.targetAmount > 0 ? Math.round((actual / t.targetAmount) * 100 * 100) / 100 : 0;
    b.totalTarget += t.targetAmount;
    b.totalActual += actual;
    b.months.push({
      month: t.month,
      monthName: MONTH_NAMES[t.month],
      target: t.targetAmount,
      actual,
      achievementPct: ach,
    });
  }

  const brands = Object.values(brandMap).map((b) => ({
    ...b,
    achievementPct: b.totalTarget > 0
      ? Math.round((b.totalActual / b.totalTarget) * 100 * 100) / 100
      : 0,
  }));

  const grandTarget = brands.reduce((s, b) => s + b.totalTarget, 0);
  const grandActual = brands.reduce((s, b) => s + b.totalActual, 0);
  const grandAchievement = grandTarget > 0
    ? Math.round((grandActual / grandTarget) * 100 * 100) / 100
    : 0;

  return {
    year,
    brands,
    grandTotal: { target: grandTarget, actual: grandActual, achievementPct: grandAchievement },
  };
}

// ── Trend analysis ─────────────────────────────────────────────────

export async function getTrendAnalysis(year: number): Promise<{
  brandTrends: TrendData[];
}> {
  const targets = await getSalesTargets(year);
  const actuals = await getSalesActuals(year);

  // Aggregate actuals per brand+month
  const actualMap: Record<string, Record<number, number>> = {};
  for (const a of actuals) {
    const d = new Date(a.date);
    const m = d.getMonth() + 1;
    if (!actualMap[a.brandId]) actualMap[a.brandId] = {};
    actualMap[a.brandId][m] = (actualMap[a.brandId][m] || 0) + a.totalRevenue;
  }

  // Build per-brand trend
  const brandTrends: TrendData[] = [];
  const brandIds = [...new Set(targets.map((t) => t.brandId))];

  for (const brandId of brandIds) {
    const brandTargets = targets.filter((t) => t.brandId === brandId);
    const brandName = brandTargets[0]?.brandName || brandId;
    const monthly: TrendData["monthly"] = [];
    let prevActual: number | null = null;

    for (let m = 1; m <= 12; m++) {
      const target = brandTargets.find((t) => t.month === m)?.targetAmount || 0;
      const actual = actualMap[brandId]?.[m] || 0;
      const ach = target > 0 ? Math.round((actual / target) * 100 * 100) / 100 : 0;
      const momGrowth = prevActual !== null && prevActual > 0
        ? Math.round(((actual - prevActual) / prevActual) * 100 * 100) / 100
        : null;

      monthly.push({
        month: m,
        monthName: MONTH_NAMES[m],
        target,
        actual,
        achievementPct: ach,
        momGrowthPct: momGrowth,
      });
      prevActual = actual;
    }

    const totalTarget = monthly.reduce((s, m) => s + m.target, 0);
    const totalActual = monthly.reduce((s, m) => s + m.actual, 0);
    const overallAchievementPct = totalTarget > 0
      ? Math.round((totalActual / totalTarget) * 100 * 100) / 100
      : 0;

    brandTrends.push({
      brandId,
      brandName,
      monthly,
      totalTarget,
      totalActual,
      overallAchievementPct,
    });
  }

  return { brandTrends };
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}
