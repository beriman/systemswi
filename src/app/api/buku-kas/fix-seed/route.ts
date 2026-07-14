// POST /api/buku-kas/fix-seed — Clear bad data and re-seed with correct column mapping
import { NextResponse } from "next/server";
import { readSheet, appendRows, writeRange } from "@/lib/sheets/sheets-real";
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
  ["2026-06-01", "D", "Sales", "Modal awal kas", 50000000, 0],
  ["2026-06-02", "D", "Sales", "Penjualan parfum A", 3500000, 0],
  ["2026-06-03", "K", "Purchase", "Beli bahan baku", 0, 2000000],
  ["2026-06-04", "D", "Sales", "Penjualan parfum B", 2800000, 0],
  ["2026-06-05", "K", "Operating", "Listrik & air", 0, 850000],
  ["2026-06-07", "K", "Salary", "Gaji karyawan produksi", 0, 5000000],
  ["2026-06-08", "D", "Sales", "Penjualan online", 4200000, 0],
  ["2026-06-09", "K", "Transport", "Ongkos kirim", 0, 350000],
  ["2026-06-10", "D", "Sales", "Penjualan parfum C", 1500000, 0],
  ["2026-06-11", "K", "Purchase", "Beli packaging", 0, 1200000],
  ["2026-06-12", "D", "Sales", "Penjualan grosir", 8000000, 0],
  ["2026-06-13", "K", "Operating", "Internet & telepon", 0, 500000],
  ["2026-06-14", "K", "Salary", "Gaji karyawan admin", 0, 4000000],
  ["2026-06-15", "D", "Sales", "Penjualan retail", 2100000, 0],
  ["2026-06-16", "K", "Transport", "BBM & toll", 0, 450000],
  ["2026-06-17", "K", "Purchase", "Beli bahan baku 2", 0, 3500000],
  ["2026-06-18", "D", "Sales", "Penjualan parfum D", 3200000, 0],
  ["2026-06-19", "K", "Operating", "Biaya maintenance", 0, 750000],
  ["2026-06-20", "D", "Sales", "Penjualan event", 6500000, 0],
  ["2026-06-21", "K", "Salary", "Bonus karyawan", 0, 2000000],
];

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // Step 1: Clear existing data (clear rows 6 onwards - data starts at row 6)
    // Clear all data rows by writing empty values
    const clearRange = `Buku_Kas!A6:H1000`;
    await writeRange(clearRange, Array(995).fill(["", "", "", "", "", "", "", ""]));

    // Step 2: Build new rows with correct column mapping
    // Columns: EntryId | Date | Type | Category | Description | Debit | Credit | Saldo
    const rows: (string | number)[][] = [];
    let runningSaldo = 0;

    for (let i = 0; i < SEED_DATA.length; i++) {
      const [date, type, category, description, debit, credit] = SEED_DATA[i];
      const d = parseAmount(debit);
      const c = parseAmount(credit);
      runningSaldo += d - c;
      const entryId = `BK-${String(i + 1).padStart(3, "0")}`;
      rows.push([entryId, date, type, category, description, d, c, runningSaldo]);
    }

    // Step 3: Append corrected data
    await appendRows(SHEET_NAME, rows);

    // Step 4: Verify
    const raw = await readSheet(SHEET_NAME);
    const dataRows = raw.slice(1).filter((row) => row && row[0]);

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      message: `Fixed and re-seeded ${rows.length} transactions with correct debit/credit columns`,
      verification: {
        entryCount: dataRows.length,
        firstEntry: dataRows[0] ? {
          entryId: dataRows[0][0],
          date: dataRows[0][1],
          type: dataRows[0][2],
          category: dataRows[0][3],
          description: dataRows[0][4],
          debit: dataRows[0][5],
          credit: dataRows[0][6],
          saldo: dataRows[0][7],
        } : null,
        lastEntry: dataRows.length > 0 ? {
          entryId: dataRows[dataRows.length - 1][0],
          date: dataRows[dataRows.length - 1][1],
          description: dataRows[dataRows.length - 1][4],
          debit: dataRows[dataRows.length - 1][5],
          credit: dataRows[dataRows.length - 1][6],
          saldo: dataRows[dataRows.length - 1][7],
        } : null,
        totalDebit: dataRows.reduce((s, r) => s + (Number(r[5]) || 0), 0),
        totalKredit: dataRows.reduce((s, r) => s + (Number(r[6]) || 0), 0),
      },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      googleWorkspaceWriteBlockedSource(SHEET_NAME, error),
      { status: 500 }
    );
  }
}
