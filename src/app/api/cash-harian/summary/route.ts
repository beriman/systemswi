// GET /api/cash-harian/summary — Period summary (total masuk, keluar, net, daily breakdown)
import { NextRequest, NextResponse } from "next/server";
import { readSheet } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const SHEET_NAME = "CashHarian";

function parseAmount(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const normalized = value.replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const raw = await readSheet(SHEET_NAME);
    const dataRows = raw.slice(1).filter((row) => row && row[0]);

    let entries = dataRows.map((row, i) => ({
      entryId: row[0] || "",
      date: row[1] || "",
      type: (row[2] || "Masuk") as "Masuk" | "Keluar",
      category: row[3] || "",
      description: row[4] || "",
      amount: parseAmount(row[5]),
      saldo: parseAmount(row[6]),
      inputBy: row[7] || "",
      inputDate: row[8] || "",
      rowNumber: i + 6,
    }));

    // Filter by date range
    if (startDate) {
      entries = entries.filter((e) => e.date >= startDate);
    }
    if (endDate) {
      entries = entries.filter((e) => e.date <= endDate);
    }

    // Sort by date
    entries.sort((a, b) => a.date.localeCompare(b.date));

    // Aggregates
    const totalMasuk = entries
      .filter((e) => e.type === "Masuk")
      .reduce((sum, e) => sum + e.amount, 0);

    const totalKeluar = entries
      .filter((e) => e.type === "Keluar")
      .reduce((sum, e) => sum + e.amount, 0);

    const netCash = totalMasuk - totalKeluar;

    // Daily breakdown
    const daily: Record<string, { masuk: number; keluar: number; net: number }> = {};
    for (const e of entries) {
      if (!daily[e.date]) daily[e.date] = { masuk: 0, keluar: 0, net: 0 };
      if (e.type === "Masuk") daily[e.date].masuk += e.amount;
      else daily[e.date].keluar += e.amount;
      daily[e.date].net = daily[e.date].masuk - daily[e.date].keluar;
    }

    // Category breakdown
    const byCategory: Record<string, number> = {};
    for (const e of entries) {
      const sign = e.type === "Masuk" ? 1 : -1;
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount * sign;
    }

    // Running saldo
    const sortedDates = Object.keys(daily).sort();
    let runningSaldo = 0;
    const dailyWithSaldo = sortedDates.map((date) => {
      runningSaldo += daily[date].net;
      return { date, ...daily[date], saldo: runningSaldo };
    });

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      period: { startDate, endDate },
      summary: {
        totalMasuk,
        totalKeluar,
        netCash,
        entryCount: entries.length,
      },
      daily: dailyWithSaldo,
      byCategory,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch summary", details: String(error) },
      { status: 500 }
    );
  }
}
