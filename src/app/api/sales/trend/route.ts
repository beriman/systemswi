// GET /api/sales/trend?year=YYYY — Monthly revenue trend
import { NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readRange } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const SOURCE = "Google Sheets: Sales_Actuals";

const text = (v: unknown) => String(v ?? "").trim();
const num = (v: unknown) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v !== "string") return 0;
  return Number(v.replace(/[^\d.-]/g, "")) || 0;
};

export async function GET() {
  try {
    const rows = await readRange("Sales_Actuals!A1:J1000");

    // Aggregate by month
    const monthly: Record<string, { revenue: number; units: number; transactions: number }> = {};
    for (const row of rows.slice(1)) {
      if (!row.some(Boolean)) continue;
      const date = text(row[1]);
      if (date.length < 7) continue;
      const monthKey = date.slice(0, 7); // YYYY-MM
      const revenue = num(row[8]);
      const qty = num(row[6]);
      if (!monthly[monthKey]) monthly[monthKey] = { revenue: 0, units: 0, transactions: 0 };
      monthly[monthKey].revenue += revenue;
      monthly[monthKey].units += qty;
      monthly[monthKey].transactions += 1;
    }

    const trend = Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        ...data,
      }));

    const totalRevenue = trend.reduce((s, t) => s + t.revenue, 0);
    const totalUnits = trend.reduce((s, t) => s + t.units, 0);
    const avgMonthly = trend.length > 0 ? Math.round(totalRevenue / trend.length) : 0;

    return NextResponse.json({
      source: SOURCE,
      sourceStatus: "live",
      trend,
      totalRevenue,
      totalUnits,
      avgMonthly,
      monthCount: trend.length,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        trend: [],
        totalRevenue: 0,
        totalUnits: 0,
        avgMonthly: 0,
        monthCount: 0,
      });
    }
    return NextResponse.json({ error: "Gagal mengambil trend sales", details: String(error) }, { status: 500 });
  }
}
