// Phase 3.1 — Cashflow Forecast
// Reads 8 months of Rekap_Rekening data, applies trend analysis + seasonal adjustment,
// and projects 3 months of cashflow. Writes results to Cashflow_Forecast sheet.

import { readRange, appendRows, writeRange } from "@/lib/sheets/sheets-real";
import { logAgentActionSafe } from "./audit";
import { sendTelegramMessage, isTelegramConfigured } from "./telegram";

// ── Types ──────────────────────────────────────────────────────────
export interface MonthlyCashflow {
  month: string; // "YYYY-MM"
  income: number;
  expense: number;
  netCashflow: number;
  cumulativeCashflow: number;
}

export interface CashflowForecastResult {
  historical: MonthlyCashflow[];
  forecast: MonthlyCashflow[];
  trendSlopeIncome: number;
  trendSlopeExpense: number;
  avgMonthlyIncome: number;
  avgMonthlyExpense: number;
  seasonalFactors: number[]; // 12 monthly multipliers
  confidence: "high" | "medium" | "low";
  generatedAt: string;
}

// ── Main function ──────────────────────────────────────────────────
export async function generateCashflowForecast(): Promise<CashflowForecastResult> {
  const timestamp = new Date().toISOString();

  // 1. Read historical data from Rekap_Rekening (8 months, 2 accounts)
  const rows = await readRange("Rekap_Rekening!A1:H40");

  const historical = parseRekapRekening(rows);

  if (historical.length < 3) {
    // Not enough data — return minimal result with low confidence
    const result: CashflowForecastResult = {
      historical,
      forecast: [],
      trendSlopeIncome: 0,
      trendSlopeExpense: 0,
      avgMonthlyIncome: 0,
      avgMonthlyExpense: 0,
      seasonalFactors: Array(12).fill(1),
      confidence: "low",
      generatedAt: timestamp,
    };
    await logAgentActionSafe({
      timestamp,
      agent: "HemuHemu/OWL",
      action: "Cashflow Forecast",
      target: "Rekap_Rekening",
      status: "success",
      humanApproved: "n/a",
      notes: `Insufficient data: ${historical.length} months found, need ≥3`,
    });
    return result;
  }

  // 2. Calculate trend (simple linear regression)
  const incomes = historical.map((h) => h.income);
  const expenses = historical.map((h) => h.expense);
  const n = historical.length;

  const xMean = (n - 1) / 2;
  const incomeMean = incomes.reduce((a, b) => a + b, 0) / n;
  const expenseMean = expenses.reduce((a, b) => a + b, 0) / n;

  let numIncome = 0, denIncome = 0;
  let numExpense = 0, denExpense = 0;
  for (let i = 0; i < n; i++) {
    numIncome += (i - xMean) * (incomes[i] - incomeMean);
    denIncome += (i - xMean) ** 2;
    numExpense += (i - xMean) * (expenses[i] - expenseMean);
    denExpense += (i - xMean) ** 2;
  }

  const trendSlopeIncome = denIncome > 0 ? numIncome / denIncome : 0;
  const trendSlopeExpense = denExpense > 0 ? numExpense / denExpense : 0;

  // 3. Calculate seasonal factors from month-of-year patterns
  const monthlyIncomeTotals = Array(12).fill(0);
  const monthlyExpenseTotals = Array(12).fill(0);
  const monthlyCounts = Array(12).fill(0);

  for (const h of historical) {
    const monthIdx = new Date(h.month + "-01").getMonth();
    monthlyIncomeTotals[monthIdx] += h.income;
    monthlyExpenseTotals[monthIdx] += h.expense;
    monthlyCounts[monthIdx]++;
  }

  const avgMonthlyIncome = incomeMean;
  const avgMonthlyExpense = expenseMean;

  const seasonalFactors = Array(12).fill(1);
  for (let m = 0; m < 12; m++) {
    if (monthlyCounts[m] > 0 && avgMonthlyIncome > 0) {
      const monthAvgIncome = monthlyIncomeTotals[m] / monthlyCounts[m];
      seasonalFactors[m] = monthAvgIncome / avgMonthlyIncome;
    }
    // Clamp seasonal factor to reasonable range
    seasonalFactors[m] = Math.max(0.5, Math.min(2.0, seasonalFactors[m]));
  }

  // 4. Generate 3-month forecast
  const lastMonth = historical[historical.length - 1];
  let cumulative = lastMonth.cumulativeCashflow;
  const forecast: MonthlyCashflow[] = [];

  for (let i = 1; i <= 3; i++) {
    const nextDate = new Date(lastMonth.month + "-01");
    nextDate.setMonth(nextDate.getMonth() + i);
    const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;

    const monthIdx = nextDate.getMonth();

    // Trend projection + seasonal adjustment
    const trendIncome = incomeMean + trendSlopeIncome * (n - 1 + i - xMean);
    const trendExpense = expenseMean + trendSlopeExpense * (n - 1 + i - xMean);

    const projectedIncome = Math.max(0, trendIncome * seasonalFactors[monthIdx]);
    const projectedExpense = Math.max(0, trendExpense * seasonalFactors[monthIdx]);

    const netCashflow = projectedIncome - projectedExpense;
    cumulative += netCashflow;

    forecast.push({
      month: nextMonth,
      income: Math.round(projectedIncome),
      expense: Math.round(projectedExpense),
      netCashflow: Math.round(netCashflow),
      cumulativeCashflow: Math.round(cumulative),
    });
  }

  // 5. Determine confidence based on data quality
  const confidence: "high" | "medium" | "low" =
    n >= 6 ? "high" : n >= 4 ? "medium" : "low";

  const result: CashflowForecastResult = {
    historical,
    forecast,
    trendSlopeIncome,
    trendSlopeExpense,
    avgMonthlyIncome,
    avgMonthlyExpense,
    seasonalFactors,
    confidence,
    generatedAt: timestamp,
  };

  // 6. Write forecast to Cashflow_Forecast sheet
  await writeForecastToSheet(result);

  // 7. Log & notify
  await logAgentActionSafe({
    timestamp,
    agent: "HemuHemu/OWL",
    action: "Cashflow Forecast",
    target: "Rekap_Rekening → Cashflow_Forecast",
    status: "success",
    humanApproved: "n/a",
    notes: `${historical.length} months analyzed, 3-month forecast generated. Confidence: ${confidence}. Next month: Rp ${forecast[0].netCashflow.toLocaleString("id-ID")}`,
  });

  if (isTelegramConfigured()) {
    await sendTelegramMessage(formatForecastForTelegram(result));
  }

  return result;
}

// ── Parse Rekap_Rekening data ──────────────────────────────────────
function parseRekapRekening(rows: string[][]): MonthlyCashflow[] {
  const data: MonthlyCashflow[] = [];

  // Expected format: rows[0] = headers, rows[1..N] = data
  // Columns: Month, Account1_Income, Account1_Expense, Account1_Net, Account2_Income, Account2_Expense, Account2_Net, Total_Net
  // Or simpler: Month, Income, Expense, Net, Cumulative

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 4) continue;

    const monthRaw = String(row[0] || "").trim();
    if (!monthRaw) continue;

    // Parse month — handle various formats
    let month: string;
    if (/^\d{4}-\d{2}/.test(monthRaw)) {
      month = monthRaw.slice(0, 7);
    } else if (/^\d{2}\/\d{4}/.test(monthRaw)) {
      // MM/YYYY format
      const [mm, yyyy] = monthRaw.split("/");
      month = `${yyyy}-${mm}`;
    } else {
      // Try to parse as date
      const d = new Date(monthRaw);
      if (isNaN(d.getTime())) continue;
      month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }

    // Try to extract income/expense from various column layouts
    const num = (v: unknown) => {
      if (typeof v === "number") return Number.isFinite(v) ? v : 0;
      if (typeof v !== "string") return 0;
      const p = Number(v.replace(/[^\d.-]/g, ""));
      return Number.isFinite(p) ? p : 0;
    };

    // Layout A: [Month, Income, Expense, Net, Cumulative] (5+ cols)
    // Layout B: [Month, Acc1_Income, Acc1_Expense, Acc1_Net, Acc2_Income, Acc2_Expense, Acc2_Net, Total_Net] (8 cols)
    let income = 0, expense = 0, net = 0, cumulative = 0;

    if (row.length >= 7) {
      // Layout B — sum both accounts
      income = num(row[1]) + num(row[4]);
      expense = num(row[2]) + num(row[5]);
      net = num(row[3]) + num(row[6]);
      cumulative = num(row[7]);
    } else if (row.length >= 4) {
      // Layout A
      income = num(row[1]);
      expense = num(row[2]);
      net = num(row[3]);
      cumulative = row.length >= 5 ? num(row[4]) : 0;
    }

    if (income === 0 && expense === 0 && net === 0) continue;

    data.push({ month, income, expense, netCashflow: net, cumulativeCashflow: cumulative });
  }

  // Sort by month
  data.sort((a, b) => a.month.localeCompare(b.month));

  // Recalculate cumulative if not provided
  if (data.length > 0 && data.every((d) => d.cumulativeCashflow === 0)) {
    let running = 0;
    for (const d of data) {
      running += d.netCashflow;
      d.cumulativeCashflow = running;
    }
  }

  return data;
}

// ── Write forecast to Google Sheets ────────────────────────────────
async function writeForecastToSheet(result: CashflowForecastResult): Promise<void> {
  // Write to Cashflow_Forecast sheet
  // Layout: Section | Month | Income | Expense | Net | Cumulative | Type
  const rows: (string | number)[][] = [];

  // Header
  rows.push(["HISTORICAL", "", "", "", "", ""]);
  rows.push(["Month", "Income", "Expense", "Net Cashflow", "Cumulative", "Type"]);

  for (const h of result.historical) {
    rows.push([h.month, h.income, h.expense, h.netCashflow, h.cumulativeCashflow, "actual"]);
  }

  // Blank row + forecast header
  rows.push(["", "", "", "", "", ""]);
  rows.push(["FORECAST", "", "", "", "", ""]);
  rows.push(["Month", "Income", "Expense", "Net Cashflow", "Cumulative", "Type"]);

  for (const f of result.forecast) {
    rows.push([f.month, f.income, f.expense, f.netCashflow, f.cumulativeCashflow, "forecast"]);
  }

  // Summary
  rows.push(["", "", "", "", "", ""]);
  rows.push(["SUMMARY", "", "", "", "", ""]);
  rows.push(["Metric", "Value", "", "", "", ""]);
  rows.push(["Confidence", result.confidence.toUpperCase(), "", "", "", ""]);
  rows.push(["Avg Monthly Income", result.avgMonthlyIncome, "", "", "", ""]);
  rows.push(["Avg Monthly Expense", result.avgMonthlyExpense, "", "", "", ""]);
  rows.push(["Income Trend (slope/month)", result.trendSlopeIncome, "", "", "", ""]);
  rows.push(["Expense Trend (slope/month)", result.trendSlopeExpense, "", "", "", ""]);
  rows.push(["Generated At", result.generatedAt, "", "", "", ""]);

  try {
    await writeRange("Cashflow_Forecast!A1:F30", rows);
  } catch (e) {
    console.error("[CashflowForecast] Failed to write to sheet:", e);
  }
}

// ── Format for Telegram ────────────────────────────────────────────
export function formatForecastForTelegram(result: CashflowForecastResult): string {
  const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  let text = `📊 <b>Cashflow Forecast — 3 Bulan Ke Depan</b>\n`;
  text += `📅 Generated: ${new Date(result.generatedAt).toLocaleDateString("id-ID")}\n`;
  text += `🎯 Confidence: <b>${result.confidence.toUpperCase()}</b>\n\n`;

  // Historical summary
  if (result.historical.length > 0) {
    const last3 = result.historical.slice(-3);
    text += `📈 <b>3 Bulan Terakhir:</b>\n`;
    for (const h of last3) {
      const netEmoji = h.netCashflow >= 0 ? "🟢" : "🔴";
      text += `  ${netEmoji} ${h.month}: ${fmt(h.netCashflow)} (cum: ${fmt(h.cumulativeCashflow)})\n`;
    }
    text += `\n`;
  }

  // Forecast
  if (result.forecast.length > 0) {
    text += `🔮 <b>Proyeksi 3 Bulan:</b>\n`;
    for (const f of result.forecast) {
      const netEmoji = f.netCashflow >= 0 ? "🟢" : "🔴";
      text += `  ${netEmoji} <b>${f.month}</b>\n`;
      text += `    Income: ${fmt(f.income)} | Expense: ${fmt(f.expense)}\n`;
      text += `    Net: <b>${fmt(f.netCashflow)}</b> | Cumulative: ${fmt(f.cumulativeCashflow)}\n`;
    }
    text += `\n`;
  }

  // Trend
  const incomeTrend = result.trendSlopeIncome >= 0 ? "📈 Naik" : "📉 Turun";
  const expenseTrend = result.trendSlopeExpense >= 0 ? "📈 Naik" : "📉 Turun";
  text += `📊 <b>Tren:</b>\n`;
  text += `  Income: ${incomeTrend} (${fmt(Math.abs(result.trendSlopeIncome))}/bulan)\n`;
  text += `  Expense: ${expenseTrend} (${fmt(Math.abs(result.trendSlopeExpense))}/bulan)\n`;

  // Risk warning
  const negativeMonths = result.forecast.filter((f) => f.netCashflow < 0);
  if (negativeMonths.length > 0) {
    text += `\n⚠️ <b>PERINGATAN:</b> ${negativeMonths.length} bulan proyeksi negatif!\n`;
    text += `  Bulan: ${negativeMonths.map((f) => f.month).join(", ")}\n`;
    text += `  💡 Siapkan dana cadangan atau review pengeluaran.\n`;
  }

  text += `\n📋 Data lengkap tersimpan di sheet <b>Cashflow_Forecast</b>`;

  return text;
}
