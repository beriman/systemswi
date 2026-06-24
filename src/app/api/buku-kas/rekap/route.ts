// GET /api/buku-kas/rekap — Period rekap (monthly/weekly summary, by category)
import { NextRequest, NextResponse } from "next/server";
import { readSheet } from "@/lib/sheets/sheets-real";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const SHEET_NAME = "BukuKas";

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
      .map((row) => ({
        entryId: row[0] || "",
        date: row[1] || "",
        type: row[2] || "",
        category: row[3] || "Lain-lain",
        description: row[4] || "",
        debit: Number(row[5]) || 0,
        credit: Number(row[6]) || 0,
        saldo: Number(row[7]) || 0,
      }));

    // Filter by month if specified
    let filtered = entries;
    if (month) {
      filtered = entries.filter((e) => e.date.startsWith(month));
    } else if (year) {
      filtered = entries.filter((e) => e.date.startsWith(year));
    }

    // By category
    const byCategory: Record<string, { debit: number; credit: number; net: number; count: number }> = {};
    for (const e of filtered) {
      if (!byCategory[e.category]) {
        byCategory[e.category] = { debit: 0, credit: 0, net: 0, count: 0 };
      }
      byCategory[e.category].debit += e.debit;
      byCategory[e.category].credit += e.credit;
      byCategory[e.category].net += e.debit - e.credit;
      byCategory[e.category].count += 1;
    }

    // Period breakdown
    const periodMap: Record<string, { debit: number; credit: number; net: number; count: number }> = {};
    for (const e of filtered) {
      let key: string;
      if (period === "weekly") {
        const d = new Date(e.date + "T00:00:00");
        const week = getWeekNumber(d);
        key = `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
      } else {
        key = e.date.slice(0, 7); // YYYY-MM
      }
      if (!periodMap[key]) {
        periodMap[key] = { debit: 0, credit: 0, net: 0, count: 0 };
      }
      periodMap[key].debit += e.debit;
      periodMap[key].credit += e.credit;
      periodMap[key].net += e.debit - e.credit;
      periodMap[key].count += 1;
    }

    const totalDebit = filtered.reduce((s, e) => s + e.debit, 0);
    const totalCredit = filtered.reduce((s, e) => s + e.credit, 0);

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      period,
      filter: { month, year },
      summary: {
        totalDebit,
        totalCredit,
        netCash: totalDebit - totalCredit,
        entryCount: filtered.length,
      },
      byCategory,
      byPeriod: periodMap,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json(googleWorkspaceDegradedSource(SHEET_NAME, error), { status: 200 });
    }
    return NextResponse.json(
      { error: "Failed to fetch rekap", details: String(error) },
      { status: 500 }
    );
  }
}

function getWeekNumber(d: Date): number {
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
}
