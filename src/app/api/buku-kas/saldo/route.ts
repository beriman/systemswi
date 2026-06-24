// GET /api/buku-kas/saldo — Get current saldo
import { NextRequest, NextResponse } from "next/server";
import { readSheet } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const SHEET_NAME = "BukuKas";

export async function GET(request: NextRequest) {
  try {
    const raw = await readSheet(SHEET_NAME);
    const hasHeader = raw.length > 0 && raw[0][0] === "EntryId";
    const dataRows = hasHeader ? raw.slice(1) : raw;

    const entries = dataRows
      .filter((row) => row && row[0])
      .map((row) => ({
        entryId: row[0] || "",
        date: row[1] || "",
        type: row[2] || "",
        debit: Number(row[5]) || 0,
        credit: Number(row[6]) || 0,
        saldo: Number(row[7]) || 0,
      }));

    const currentSaldo = entries.length > 0 ? entries[entries.length - 1].saldo : 0;
    const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
    const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
    const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null;

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      saldo: {
        current: currentSaldo,
        totalDebit,
        totalCredit,
        entryCount: entries.length,
        lastEntryDate: lastEntry?.date || null,
        lastEntryId: lastEntry?.entryId || null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch saldo", details: String(error) },
      { status: 500 }
    );
  }
}
