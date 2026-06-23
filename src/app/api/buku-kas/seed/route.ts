// POST /api/buku-kas/seed — Seed 20 sample transactions
import { NextRequest, NextResponse } from "next/server";
import { appendRows, readSheet, SHEETS } from "@/lib/sheets/sheets-real";
import { googleWorkspaceWriteBlockedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const SHEET_NAME = "BukuKas";

function parseAmount(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const normalized = value.replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

const SEED_DATA = [
  // Date | Type | Category | Description | Debit | Credit
  ["2026-06-01", "Debit", "Sales", "Modal awal kas", 50000000, 0],
  ["2026-06-02", "Debit", "Sales", "Penjualan parfum A", 3500000, 0],
  ["2026-06-03", "Kredit", "Purchase", "Beli bahan baku", 0, 2000000],
  ["2026-06-04", "Debit", "Sales", "Penjualan parfum B", 2800000, 0],
  ["2026-06-05", "Kredit", "Operating", "Listrik & air", 0, 850000],
  ["2026-06-07", "Kredit", "Salary", "Gaji karyawan produksi", 0, 5000000],
  ["2026-06-08", "Debit", "Sales", "Penjualan online", 4200000, 0],
  ["2026-06-09", "Kredit", "Transport", "Ongkos kirim", 0, 350000],
  ["2026-06-10", "Debit", "Sales", "Penjualan parfum C", 1500000, 0],
  ["2026-06-11", "Kredit", "Purchase", "Beli packaging", 0, 1200000],
  ["2026-06-12", "Debit", "Sales", "Penjualan grosir", 8000000, 0],
  ["2026-06-13", "Kredit", "Operating", "Internet & telepon", 0, 500000],
  ["2026-06-14", "Kredit", "Salary", "Gaji karyawan admin", 0, 4000000],
  ["2026-06-15", "Debit", "Sales", "Penjualan retail", 2100000, 0],
  ["2026-06-16", "Kredit", "Transport", "BBM & toll", 0, 450000],
  ["2026-06-17", "Kredit", "Purchase", "Beli bahan baku 2", 0, 3500000],
  ["2026-06-18", "Debit", "Sales", "Penjualan parfum D", 3200000, 0],
  ["2026-06-19", "Kredit", "Operating", "Biaya maintenance", 0, 750000],
  ["2026-06-20", "Debit", "Sales", "Penjualan event", 6500000, 0],
  ["2026-06-21", "Kredit", "Salary", "Bonus karyawan", 0, 2000000],
];

export async function POST(request: NextRequest) {
  try {
    // Check if data already exists
    const raw = await readSheet(SHEET_NAME);
    const existingData = raw.slice(1).filter((row) => row && row[0]);
    if (existingData.length > 0) {
      return NextResponse.json({
        source: `Google Sheets: ${SHEET_NAME}`,
        sourceStatus: "live",
        message: "Data already exists. Skipping seed.",
        existingCount: existingData.length,
      });
    }

    // Build rows with running balance
    const rows: (string | number)[][] = [];
    let runningSaldo = 0;

    for (const [date, type, category, description, debit, credit] of SEED_DATA) {
      const d = parseAmount(debit);
      const c = parseAmount(credit);
      runningSaldo += d - c;
      const entryId = `BK-SEED-${String(rows.length + 1).padStart(3, "0")}`;
      rows.push([entryId, date, type, category, description, d, c, runningSaldo]);
    }

    await appendRows(SHEET_NAME, rows);

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      message: `Seeded ${rows.length} sample transactions`,
      data: rows,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      googleWorkspaceWriteBlockedSource(SHEET_NAME, error),
      { status: 500 }
    );
  }
}
