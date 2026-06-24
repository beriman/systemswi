// GET /api/cash-harian/summary — Period summary with daily breakdown
import { NextRequest, NextResponse } from "next/server";
import { readSheet } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const SHEET_NAME = "CashHarian";

function rowToEntry(row: string[]) {
  return {
    entryId: row[0] || "",
    date: row[1] || "",
    type: row[2] || "",
    category: row[3] || "",
    description: row[4] || "",
    amount: Number(row[5]) || 0,
    saldo: Number(row[6]) || 0,
    inputBy: row[7] || "",
    inputDate: row[8] || "",
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const raw = await readSheet(SHEET_NAME);
    const hasHeader = raw.length > 0 && raw[0][0] === "EntryId";
    const dataRows = hasHeader ? raw.slice(1) : raw;

    let allEntries = dataRows.filter((row) => row && row[0]).map(rowToEntry);

    if (startDate) allEntries = allEntries.filter((r) => r.date >= startDate);
    if (endDate) allEntries = allEntries.filter((r) => r.date <= endDate);

    // Group by date
    const byDate = new Map<
      string,
      { masuk: number; keluar: number; categories: Record<string, number> }
    >();
    for (const e of allEntries) {
      if (!byDate.has(e.date))
        byDate.set(e.date, { masuk: 0, keluar: 0, categories: {} });
      const d = byDate.get(e.date)!;
      if (e.type === "Masuk") {
        d.masuk += e.amount;
        d.categories[e.category] = (d.categories[e.category] || 0) + e.amount;
      } else {
        d.keluar += e.amount;
        d.categories[e.category] = (d.categories[e.category] || 0) + e.amount;
      }
    }

    const dailyBreakdown = Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date,
        masuk: d.masuk,
        keluar: d.keluar,
        net: d.masuk - d.keluar,
        categories: d.categories,
      }));

    const totalMasuk = dailyBreakdown.reduce((s, d) => s + d.masuk, 0);
    const totalKeluar = dailyBreakdown.reduce((s, d) => s + d.keluar, 0);

    // Category breakdown
    const categories: Record<
      string,
      { masuk: number; keluar: number; total: number }
    > = {};
    for (const e of allEntries) {
      if (!categories[e.category])
        categories[e.category] = { masuk: 0, keluar: 0, total: 0 };
      if (e.type === "Masuk") categories[e.category].masuk += e.amount;
      else categories[e.category].keluar += e.amount;
      categories[e.category].total += e.amount;
    }

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      period: { startDate: startDate || "all", endDate: endDate || "all" },
      summary: {
        totalMasuk,
        totalKeluar,
        netCash: totalMasuk - totalKeluar,
        dayCount: dailyBreakdown.length,
      },
      dailyBreakdown,
      categories,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch summary", details: String(error) },
      { status: 500 }
    );
  }
}
