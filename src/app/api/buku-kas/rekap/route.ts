// GET /api/buku-kas/rekap — Period rekap (monthly/weekly summary, by category)
import { NextRequest, NextResponse } from "next/server";
import { readSheet } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const SHEET_NAME = "BukuKas";

function rowToEntry(row: string[]) {
  return {
    entryId: row[0] || "",
    date: row[1] || "",
    type: row[2] || "",
    category: row[3] || "",
    description: row[4] || "",
    debit: Number(row[5]) || 0,
    credit: Number(row[6]) || 0,
    saldo: Number(row[7]) || 0,
    reference: row[8] || "",
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "monthly"; // monthly | weekly
    const month = searchParams.get("month") || ""; // YYYY-MM
    const year = searchParams.get("year") || ""; // YYYY

    const raw = await readSheet(SHEET_NAME);
    const hasHeader = raw.length > 0 && raw[0][0] === "EntryId";
    const dataRows = hasHeader ? raw.slice(1) : raw;

    const entries = dataRows
      .filter((row) => row && row[0])
      .map(rowToEntry);

    // Filter by year/month if specified
    let filtered = entries;
    if (year) {
      filtered = filtered.filter((e) => e.date.startsWith(year));
    }
    if (month) {
      filtered = filtered.filter((e) => e.date.startsWith(month));
    }

    // Group by period key
    const groups: Record<string, { debit: number; credit: number; count: number; entries: typeof entries }> = {};

    for (const e of filtered) {
      let key: string;
      if (period === "weekly") {
        // Get ISO week
        const d = new Date(e.date + "T00:00:00");
        const onejan = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
        key = `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
      } else {
        key = e.date.slice(0, 7); // YYYY-MM
      }
      if (!groups[key]) {
        groups[key] = { debit: 0, credit: 0, count: 0, entries: [] };
      }
      groups[key].debit += e.debit;
      groups[key].credit += e.credit;
      groups[key].count += 1;
      groups[key].entries.push(e);
    }

    // Category breakdown (for the filtered period)
    const byCategory: Record<string, { debit: number; credit: number; net: number; count: number }> = {};
    for (const e of filtered) {
      const cat = e.category || "Lain-lain";
      if (!byCategory[cat]) {
        byCategory[cat] = { debit: 0, credit: 0, net: 0, count: 0 };
      }
      byCategory[cat].debit += e.debit;
      byCategory[cat].credit += e.credit;
      byCategory[cat].net += e.debit - e.credit;
      byCategory[cat].count += 1;
    }

    const periodSummary = Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([periodKey, g]) => ({
        period: periodKey,
        debit: g.debit,
        credit: g.credit,
        net: g.debit - g.credit,
        count: g.count,
      }));

    const totalDebit = filtered.reduce((s, e) => s + e.debit, 0);
    const totalCredit = filtered.reduce((s, e) => s + e.credit, 0);

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      period,
      filter: { year, month },
      totals: { debit: totalDebit, credit: totalCredit, net: totalDebit - totalCredit, count: filtered.length },
      byCategory,
      periodSummary,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch rekap", details: String(error) },
      { status: 500 }
    );
  }
}
