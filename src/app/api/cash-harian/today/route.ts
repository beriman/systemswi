// GET /api/cash-harian/today — Today's cash position (saldo awal, total masuk/keluar, akhir)
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

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = await readSheet(SHEET_NAME);
    // Data starts at row 6 (header at row 5)
    const dataRows = raw.slice(1).filter((row) => row && row[0]);

    const allEntries = dataRows.map((row, i) => ({
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

    // Sort by date ascending
    allEntries.sort((a, b) => a.date.localeCompare(b.date));

    // Find saldo awal: last saldo before today
    const entriesBeforeToday = allEntries.filter((e) => e.date < today);
    const saldoAwal = entriesBeforeToday.length > 0
      ? entriesBeforeToday[entriesBeforeToday.length - 1].saldo
      : 0;

    // Today's entries
    const todayEntries = allEntries.filter((e) => e.date === today);

    const totalMasuk = todayEntries
      .filter((e) => e.type === "Masuk")
      .reduce((sum, e) => sum + e.amount, 0);

    const totalKeluar = todayEntries
      .filter((e) => e.type === "Keluar")
      .reduce((sum, e) => sum + e.amount, 0);

    const saldoAkhir = saldoAwal + totalMasuk - totalKeluar;

    // Get forecast for today (if available from CashflowForecast sheet)
    let vsForecast: number | null = null;

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      data: {
        date: today,
        saldoAwal,
        totalMasuk,
        totalKeluar,
        saldoAkhir,
        entries: todayEntries,
        vsForecast,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch today's position", details: String(error) },
      { status: 500 }
    );
  }
}
