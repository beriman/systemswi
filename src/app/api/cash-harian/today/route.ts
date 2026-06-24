// GET /api/cash-harian/today — Today's cash position
import { NextRequest, NextResponse } from "next/server";
import { readSheet } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const SHEET_NAME = "Cash_Harian";

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

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const raw = await readSheet(SHEET_NAME);
    const hasHeader = raw.length > 0 && raw[0][0] === "EntryId";
    const dataRows = hasHeader ? raw.slice(1) : raw;

    const allEntries = dataRows.filter((row) => row && row[0]).map(rowToEntry);

    // All entries up to and including today
    const todayEntries = allEntries.filter((r) => r.date <= today);
    const todayOnlyEntries = allEntries.filter((r) => r.date === today);

    // Saldo: use the last entry up to today
    let saldoAkhir = 0;
    if (todayEntries.length > 0) {
      saldoAkhir = todayEntries[todayEntries.length - 1].saldo;
    }

    // If no sheet saldo stored, compute from scratch
    if (saldoAkhir === 0 && todayEntries.length > 0) {
      for (const e of todayEntries) {
        if (e.type === "Masuk") saldoAkhir += e.amount;
        else saldoAkhir -= e.amount;
      }
    }

    const todayMasuk = todayOnlyEntries
      .filter((e) => e.type === "Masuk")
      .reduce((s, e) => s + e.amount, 0);
    const todayKeluar = todayOnlyEntries
      .filter((e) => e.type === "Keluar")
      .reduce((s, e) => s + e.amount, 0);
    const saldoAwal = saldoAkhir - todayMasuk + todayKeluar;

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      date: today,
      summary: {
        saldoAwal,
        todayMasuk,
        todayKeluar,
        saldoAkhir,
        netChange: todayMasuk - todayKeluar,
        entryCount: todayOnlyEntries.length,
      },
      data: todayOnlyEntries,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch today's cash position", details: String(error) },
      { status: 500 }
    );
  }
}
