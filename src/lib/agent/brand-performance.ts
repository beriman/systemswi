// Phase 3.2 — Brand Performance Analysis
// Reads Brand_Sales + Brand_Expenses, calculates profitability per brand,
// ranks brands, and writes results to Brand_Dashboard sheet.

import { readRange, writeRange } from "@/lib/sheets/sheets-real";
import { logAgentActionSafe } from "./audit";
import { sendTelegramMessage, isTelegramConfigured } from "./telegram";

// ── Types ──────────────────────────────────────────────────────────
export interface BrandPerformance {
  brandName: string;
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number; // percentage
  roi: number; // return on investment %
  salesCount: number;
  rank: number;
  tier: "star" | "profitable" | "breakeven" | "loss";
}

export interface BrandPerformanceResult {
  brands: BrandPerformance[];
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  avgMargin: number;
  topPerformer: string;
  worstPerformer: string;
  generatedAt: string;
}

// ── Main function ──────────────────────────────────────────────────
export async function analyzeBrandPerformance(): Promise<BrandPerformanceResult> {
  const timestamp = new Date().toISOString();

  // 1. Read Brand_Sales data
  const salesRows = await readRange("Brand_Sales!A1:N1000");

  // 2. Read Brand_Expenses data
  const expenseRows = await readRange("Brand_Expenses!A1:L1000");

  // 3. Parse and aggregate
  const brandRevenue = parseBrandSales(salesRows);
  const brandExpenses = parseBrandExpenses(expenseRows);

  // 4. Merge and calculate performance
  const allBrands = new Set<string>([...Array.from(brandRevenue.keys()), ...Array.from(brandExpenses.keys())]);
  const brands: BrandPerformance[] = [];

  Array.from(allBrands).forEach((brand) => {
    const revenue = brandRevenue.get(brand) || { total: 0, count: 0 };
    const expense = brandExpenses.get(brand) || { total: 0, count: 0 };
    const profit = revenue.total - expense.total;
    const profitMargin = revenue.total > 0 ? (profit / revenue.total) * 100 : 0;
    const roi = expense.total > 0 ? (profit / expense.total) * 100 : revenue.total > 0 ? 999 : 0;

    let tier: BrandPerformance["tier"];
    if (profitMargin >= 30) tier = "star";
    else if (profitMargin >= 10) tier = "profitable";
    else if (profitMargin >= 0) tier = "breakeven";
    else tier = "loss";

    brands.push({
      brandName: brand,
      totalRevenue: revenue.total,
      totalExpenses: expense.total,
      profit,
      profitMargin: Math.round(profitMargin * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      salesCount: revenue.count,
      rank: 0, // will be set after sorting
      tier,
    });
  });

  // 5. Sort by profit margin descending and assign ranks
  brands.sort((a, b) => b.profitMargin - a.profitMargin);
  brands.forEach((b, i) => { b.rank = i + 1; });

  // 6. Calculate totals
  const totalRevenue = brands.reduce((s, b) => s + b.totalRevenue, 0);
  const totalExpenses = brands.reduce((s, b) => s + b.totalExpenses, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const avgMargin = brands.length > 0
    ? brands.reduce((s, b) => s + b.profitMargin, 0) / brands.length
    : 0;

  const result: BrandPerformanceResult = {
    brands,
    totalRevenue,
    totalExpenses,
    totalProfit,
    avgMargin: Math.round(avgMargin * 100) / 100,
    topPerformer: brands.length > 0 ? brands[0].brandName : "N/A",
    worstPerformer: brands.length > 0 ? brands[brands.length - 1].brandName : "N/A",
    generatedAt: timestamp,
  };

  // 7. Write to Brand_Dashboard sheet
  await writeBrandDashboard(result);

  // 8. Log & notify
  await logAgentActionSafe({
    timestamp,
    agent: "HemuHemu/OWL",
    action: "Brand Performance Analysis",
    target: "Brand_Sales + Brand_Expenses → Brand_Dashboard",
    status: "success",
    humanApproved: "n/a",
    notes: `${brands.length} brands analyzed. Top: ${result.topPerformer} (${brands[0]?.profitMargin.toFixed(1)}% margin). Total profit: Rp ${totalProfit.toLocaleString("id-ID")}`,
  });

  if (isTelegramConfigured()) {
    await sendTelegramMessage(formatBrandPerformanceForTelegram(result));
  }

  return result;
}

// ── Parse Brand_Sales ──────────────────────────────────────────────
function parseBrandSales(rows: string[][]): Map<string, { total: number; count: number }> {
  const map = new Map<string, { total: number; count: number }>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 3) continue;

    const num = (v: unknown) => {
      if (typeof v === "number") return Number.isFinite(v) ? v : 0;
      if (typeof v !== "string") return 0;
      const p = Number(v.replace(/[^\d.-]/g, ""));
      return Number.isFinite(p) ? p : 0;
    };

    // Try to find brand name and amount columns
    // Common layouts:
    // [Date, Brand, Product, Qty, Unit_Price, Total, ...]
    // [Brand, Date, Amount, ...]
    // [No, Date, Brand, Product, Qty, Price, Total, ...]

    let brand = "";
    let amount = 0;

    // Scan for first non-numeric string column as brand
    for (let j = 0; j < Math.min(row.length, 4); j++) {
      const val = String(row[j] || "").trim();
      if (val && isNaN(Number(val.replace(/[^\d.-]/g, "")))) {
        brand = val;
        break;
      }
    }

    if (!brand) continue;

    // Find the last numeric column as amount (likely total/price)
    for (let j = row.length - 1; j >= 0; j--) {
      const n = num(row[j]);
      if (n > 0) {
        amount = n;
        break;
      }
    }

    if (amount === 0) continue;

    const existing = map.get(brand) || { total: 0, count: 0 };
    existing.total += amount;
    existing.count++;
    map.set(brand, existing);
  }

  return map;
}

// ── Parse Brand_Expenses ───────────────────────────────────────────
function parseBrandExpenses(rows: string[][]): Map<string, { total: number; count: number }> {
  // Same parsing logic as sales
  return parseBrandSales(rows);
}

// ── Write to Brand_Dashboard ───────────────────────────────────────
async function writeBrandDashboard(result: BrandPerformanceResult): Promise<void> {
  const rows: (string | number)[][] = [];

  // Header
  rows.push(["BRAND PERFORMANCE ANALYSIS", "", "", "", "", "", "", ""]);
  rows.push(["Generated", result.generatedAt, "", "", "", "", "", ""]);
  rows.push(["", "", "", "", "", "", "", ""]);

  // Summary
  rows.push(["SUMMARY", "", "", "", "", "", "", ""]);
  rows.push(["Total Revenue", result.totalRevenue, "", "", "", "", "", ""]);
  rows.push(["Total Expenses", result.totalExpenses, "", "", "", "", "", ""]);
  rows.push(["Total Profit", result.totalProfit, "", "", "", "", "", ""]);
  rows.push(["Avg Margin %", result.avgMargin, "", "", "", "", "", ""]);
  rows.push(["Top Performer", result.topPerformer, "", "", "", "", "", ""]);
  rows.push(["Needs Attention", result.worstPerformer, "", "", "", "", "", ""]);
  rows.push(["", "", "", "", "", "", "", ""]);

  // Brand ranking table
  rows.push(["Rank", "Brand", "Revenue", "Expenses", "Profit", "Margin %", "ROI %", "Tier"]);

  for (const b of result.brands.slice(0, 50)) {
    rows.push([
      b.rank,
      b.brandName,
      b.totalRevenue,
      b.totalExpenses,
      b.profit,
      b.profitMargin,
      b.roi,
      b.tier.toUpperCase(),
    ]);
  }

  try {
    await writeRange("Brand_Dashboard!A1:H60", rows);
  } catch (e) {
    console.error("[BrandPerformance] Failed to write to sheet:", e);
  }
}

// ── Format for Telegram ────────────────────────────────────────────
export function formatBrandPerformanceForTelegram(result: BrandPerformanceResult): string {
  const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  let text = `🏷️ <b>Brand Performance Analysis</b>\n`;
  text += `📅 ${new Date(result.generatedAt).toLocaleDateString("id-ID")}\n\n`;

  // Summary
  const profitEmoji = result.totalProfit >= 0 ? "🟢" : "🔴";
  text += `📊 <b>Summary:</b>\n`;
  text += `  Revenue: ${fmt(result.totalRevenue)}\n`;
  text += `  Expenses: ${fmt(result.totalExpenses)}\n`;
  text += `  ${profitEmoji} Profit: <b>${fmt(result.totalProfit)}</b>\n`;
  text += `  Avg Margin: ${result.avgMargin.toFixed(1)}%\n\n`;

  // Top 5
  text += `🏆 <b>Top 5 Brands (by margin):</b>\n`;
  for (const b of result.brands.slice(0, 5)) {
    const tierEmoji = b.tier === "star" ? "⭐" : b.tier === "profitable" ? "✅" : b.tier === "breakeven" ? "⚠️" : "🔴";
    text += `  ${tierEmoji} <b>${b.brandName}</b> (#${b.rank})\n`;
    text += `    Profit: ${fmt(b.profit)} | Margin: ${b.profitMargin.toFixed(1)}% | ROI: ${b.roi.toFixed(1)}%\n`;
  }

  // Loss makers
  const lossBrands = result.brands.filter((b) => b.tier === "loss");
  if (lossBrands.length > 0) {
    text += `\n🔴 <b>Brands Rugi (${lossBrands.length}):</b>\n`;
    for (const b of lossBrands.slice(0, 5)) {
      text += `  ❌ ${b.brandName}: ${fmt(b.profit)} (${b.profitMargin.toFixed(1)}%)\n`;
    }
    text += `\n💡 <i>Review pricing, COGS, atau evaluasi brand portfolio</i>\n`;
  }

  text += `\n📋 Data lengkap di sheet <b>Brand_Dashboard</b>`;
  return text;
}
