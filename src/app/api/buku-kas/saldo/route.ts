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

    const entries = dataRows.filter((row) => row && row[0]);
    const lastSaldo = entries.length > 0 ? (Number(entries[entries.length - 1][7]) || 0) : 0;
    const lastEntryDate = entries.length > 0 ? entries[entries.length - 1][1] : null;

    const totalDebit = entries.reduce((s, r) => s + (Number(r[5]) || 0), 0);
    const totalCredit = entries.reduce((s, r) => s + (Number(r[6]) || 0), 0);

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      saldo: lastSaldo,
      totalDebit,
      totalCredit,
      entryCount: entries.length,
      lastEntryDate,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch saldo", details: String(error) },
      { status: 500 }
    );
  }
}
