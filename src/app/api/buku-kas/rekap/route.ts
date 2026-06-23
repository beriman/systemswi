// GET /api/buku-kas/rekap — Period rekap
// Query: ?period=monthly|weekly&year=2025&month=06
import { NextRequest, NextResponse } from "next/server";
import {
  readBukuKasSheet,
  parseBukuKasRows,
  calculateRunningBalance,
  CATEGORIES,
} from "@/lib/buku-kas/sheets";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

const SOURCE = "Google Sheets: Buku_Kas";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "monthly";
    const year = url.searchParams.get("year") || String(new Date().getFullYear());
    const month = url.searchParams.get("month") || "";

    const rows = await readBukuKasSheet();
    const entries = parseBukuKasRows(rows);
    const balanced = calculateRunningBalance(entries);

    // Filter by year/month
    let filtered = balanced.filter((e) => e.date.startsWith(year));
    if (month) {
      const monthStr = `${year}-${month.padStart(2, "0")}`;
      filtered = filtered.filter((e) => e.date.startsWith(monthStr));
    }

    // Category breakdown
    const byCategory: Record<string, { debit: number; kredit: number; net: number }> = {};
    for (const cat of CATEGORIES) {
      byCategory[cat] = { debit: 0, kredit: 0, net: 0 };
    }
    for (const entry of filtered) {
      const cat = byCategory[entry.category] || (byCategory[entry.category] = { debit: 0, kredit: 0, net: 0 });
      if (entry.type === "D") {
        cat.debit += entry.amount;
        cat.net += entry.amount;
      } else {
        cat.kredit += entry.amount;
        cat.net -= entry.amount;
      }
    }

    // Monthly summary
    const monthlyMap: Record<string, { debit: number; kredit: number; net: number }> = {};
    for (const entry of filtered) {
      const key = entry.date.slice(0, 7); // YYYY-MM
      if (!monthlyMap[key]) monthlyMap[key] = { debit: 0, kredit: 0, net: 0 };
      if (entry.type === "D") {
        monthlyMap[key].debit += entry.amount;
        monthlyMap[key].net += entry.amount;
      } else {
        monthlyMap[key].kredit += entry.amount;
        monthlyMap[key].net -= entry.amount;
      }
    }

    const monthlySummary = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([periodKey, data]) => ({ period: periodKey, ...data }));

    const totalDebit = filtered.filter((e) => e.type === "D").reduce((s, e) => s + e.amount, 0);
    const totalKredit = filtered.filter((e) => e.type === "K").reduce((s, e) => s + e.amount, 0);

    return NextResponse.json({
      source: SOURCE,
      sourceStatus: "live",
      period,
      year,
      month,
      totalDebit,
      totalKredit,
      netChange: totalDebit - totalKredit,
      byCategory,
      monthlySummary,
      entryCount: filtered.length,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        totalDebit: 0,
        totalKredit: 0,
        netChange: 0,
        byCategory: {},
        monthlySummary: [],
        entryCount: 0,
      });
    }
    return NextResponse.json({ error: "Failed to fetch rekap", details: String(error) }, { status: 500 });
  }
}
