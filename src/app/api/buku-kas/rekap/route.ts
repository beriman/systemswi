// GET /api/buku-kas/rekap — Period rekap (monthly/weekly summary, by category)
import { NextRequest, NextResponse } from "next/server";
import { readSheet } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const SHEET_NAME = "BukuKas";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "monthly"; // monthly | weekly
    const month = searchParams.get("month") || ""; // YYYY-MM
    const year = searchParams.get("year") || ""; // YYYY

    const raw = await readSheet(SHEET_NAME);
    const dataRows = raw.slice(1).filter((row) => row && row[0]);

    // Filter by month/year
    let filtered = dataRows;
    if (month) {
      filtered = filtered.filter((row) => row[1]?.startsWith(month));
    } else if (year) {
      filtered = filtered.filter((row) => row[1]?.startsWith(year));
    }

    // Summary by category
    const byCategory: Record<string, { debit: number; credit: number; count: number }> = {};
    for (const row of filtered) {
      const cat = row[3] || "Lain-lain";
      if (!byCategory[cat]) byCategory[cat] = { debit: 0, credit: 0, count: 0 };
      byCategory[cat].debit += Number(row[5]) || 0;
      byCategory[cat].credit += Number(row[6]) || 0;
      byCategory[cat].count += 1;
    }

    // Summary by date (for weekly/monthly grouping)
    const byDate: Record<string, { debit: number; credit: number; count: number }> = {};
    for (const row of filtered) {
      const dateKey = row[1] || "";
      if (!byDate[dateKey]) byDate[dateKey] = { debit: 0, credit: 0, count: 0 };
      byDate[dateKey].debit += Number(row[5]) || 0;
      byDate[dateKey].credit += Number(row[6]) || 0;
      byDate[dateKey].count += 1;
    }

    // Totals
    const totalDebit = filtered.reduce((s, r) => s + (Number(r[5]) || 0), 0);
    const totalKredit = filtered.reduce((s, r) => s + (Number(r[6]) || 0), 0);
    const netChange = totalDebit - totalKredit;

    // Monthly summary — aggregate by YYYY-MM
    const byMonth: Record<string, { debit: number; kredit: number; net: number }> = {};
    for (const row of filtered) {
      const dateKey = row[1] || "";
      const monthKey = dateKey.slice(0, 7); // YYYY-MM
      if (!byMonth[monthKey]) byMonth[monthKey] = { debit: 0, kredit: 0, net: 0 };
      byMonth[monthKey].debit += Number(row[5]) || 0;
      byMonth[monthKey].kredit += Number(row[6]) || 0;
      byMonth[monthKey].net = byMonth[monthKey].debit - byMonth[monthKey].kredit;
    }
    const monthlySummary: Array<{ period: string; debit: number; kredit: number; net: number }> = [];
    const monthKeys = Object.keys(byMonth).sort();
    for (const m of monthKeys) {
      const d = byMonth[m];
      monthlySummary.push({
        period: m,
        debit: d.debit,
        kredit: d.kredit,
        net: d.net,
      });
    }

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      period,
      filter: { month, year },
      summary: {
        totalDebit,
        totalKredit,
        netChange,
        entryCount: filtered.length,
      },
      byCategory,
      byDate,
      monthlySummary,
      netChange,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch rekap", details: String(error) },
      { status: 500 }
    );
  }
}
