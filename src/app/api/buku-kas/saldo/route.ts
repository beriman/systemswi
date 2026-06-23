// GET /api/buku-kas/saldo — Get current saldo (latest balance)
import { NextRequest, NextResponse } from "next/server";
import { readSheet } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const SHEET_NAME = "BukuKas";

export async function GET(request: NextRequest) {
  try {
    const raw = await readSheet(SHEET_NAME);
    const dataRows = raw.slice(1).filter((row) => row && row[0]);

    if (dataRows.length === 0) {
      return NextResponse.json({
        source: `Google Sheets: ${SHEET_NAME}`,
        sourceStatus: "live",
        generatedAt: new Date().toISOString(),
        saldo: 0,
        totalDebit: 0,
        totalCredit: 0,
        entryCount: 0,
        lastEntry: null,
      });
    }

    const lastRow = dataRows[dataRows.length - 1];
    const lastSaldo = Number(lastRow[7]) || 0;

    // Calculate totals
    let totalDebit = 0;
    let totalCredit = 0;
    for (const row of dataRows) {
      totalDebit += Number(row[5]) || 0;
      totalCredit += Number(row[6]) || 0;
    }

    // Calculate current month totals
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthRows = dataRows.filter((r) => r[1]?.startsWith(currentMonth));
    const monthDebit = currentMonthRows.reduce((s, r) => s + (Number(r[5]) || 0), 0);
    const monthKredit = currentMonthRows.reduce((s, r) => s + (Number(r[6]) || 0), 0);

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      saldo: lastSaldo,
      totalDebit,
      totalKredit: totalCredit,
      entryCount: dataRows.length,
      currentMonth,
      monthDebit,
      monthKredit,
      lastEntry: {
        entryId: lastRow[0],
        date: lastRow[1],
        description: lastRow[4],
        debit: Number(lastRow[5]) || 0,
        credit: Number(lastRow[6]) || 0,
        saldo: lastSaldo,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch saldo", details: String(error) },
      { status: 500 }
    );
  }
}
