// POST /api/buku-kas/seed — Seed 20 sample transactions
import { NextRequest, NextResponse } from "next/server";
import { readSheet, appendRows } from "@/lib/sheets/sheets-real";
import { googleWorkspaceWriteBlockedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const SHEET_NAME = "BukuKas";

const HEADERS = [
  "EntryId", "Date", "Type", "Category", "Description",
  "Debit", "Credit", "Saldo",
];

// 20 sample transactions for June 2026
const SEED_DATA: (string | number)[][] = [
  ["BK-20260601-001", "2026-06-01", "Debit", "Sales", "Penjualan parfum Aroma Vanilla 120 pcs", 2400000, 0, 2400000],
  ["BK-20260601-002", "2026-06-01", "Debit", "Sales", "Penjualan marketplace Shopee", 1800000, 0, 4200000],
  ["BK-20260602-001", "2026-06-02", "Kredit", "Purchase", "Pembelian bahan baku alkohol 20L", 0, 3500000, 700000],
  ["BK-20260602-002", "2026-06-02", "Kredit", "Purchase", "Pembelian kemasan botol 500pcs", 0, 1200000, -500000],
  ["BK-20260603-001", "2026-06-03", "Debit", "Sales", "Penjualan langsung toko 80 pcs", 1600000, 0, 1100000],
  ["BK-20260604-001", "2026-06-04", "Kredit", "Operating", "Biaya listrik & air kantor", 0, 850000, 250000],
  ["BK-20260605-001", "2026-06-05", "Kredit", "Salary", "Gaji karyawan produksi Mei", 0, 8000000, -7750000],
  ["BK-20260605-002", "2026-06-05", "Kredit", "Salary", "Gaji karyawan admin Mei", 0, 5000000, -12750000],
  ["BK-20260606-001", "2026-06-06", "Debit", "Sales", "Penjualan parfum Aroma Rose 200 pcs", 3500000, 0, -9250000],
  ["BK-20260607-001", "2026-06-07", "Kredit", "Transport", "Ongkos kirim ke Jakarta (5 paket)", 0, 750000, -10000000],
  ["BK-20260608-001", "2026-06-08", "Debit", "Sales", "Penjualan grosir distributor Bandung", 5200000, 0, -4800000],
  ["BK-20260609-001", "2026-06-09", "Kredit", "Purchase", "Pembelian pewangi essential oil", 0, 2800000, -7600000],
  ["BK-20260610-001", "2026-06-10", "Debit", "Sales", "Penjualan parfum Aroma Ocean 150 pcs", 2700000, 0, -4900000],
  ["BK-20260611-001", "2026-06-11", "Kredit", "Operating", "Biaya sewa gudang Juni", 0, 3000000, -7900000],
  ["BK-20260612-001", "2026-06-12", "Kredit", "Transport", "BBM & toll pengiriman Surabaya", 0, 450000, -8350000],
  ["BK-20260613-001", "2026-06-13", "Debit", "Sales", "Penjualan event pop-up store", 4100000, 0, -4250000],
  ["BK-20260614-001", "2026-06-14", "Kredit", "Purchase", "Pembelian bahan baku glycerin 10L", 0, 950000, -5200000],
  ["BK-20260615-001", "2026-06-15", "Debit", "Sales", "Penjualan online Tokopedia", 2200000, 0, -3000000],
  ["BK-20260616-001", "2026-06-16", "Kredit", "Operating", "Biaya internet & telepon", 0, 350000, -3350000],
  ["BK-20260617-001", "2026-06-17", "Debit", "Sales", "Penjualan parfum Aroma Musk 100 pcs", 2000000, 0, -1350000],
];

export async function POST(request: NextRequest) {
  try {
    // Check if data already exists
    const raw = await readSheet(SHEET_NAME);
    const hasHeader = raw.length > 0 && raw[0][0] === "EntryId";
    if (!hasHeader) {
      await appendRows(SHEET_NAME, [HEADERS]);
    }

    const dataRows = hasHeader ? raw.slice(1) : raw;
    const existingIds = new Set(
      dataRows.filter((row) => row && row[0]).map((row) => row[0])
    );

    const toAdd = SEED_DATA.filter((row) => !existingIds.has(String(row[0])));
    if (toAdd.length > 0) {
      await appendRows(SHEET_NAME, toAdd);
    }

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      message: `Seed complete: ${toAdd.length} entries added (${SEED_DATA.length - toAdd.length} already existed)`,
      seeded: toAdd.length,
      skipped: SEED_DATA.length - toAdd.length,
      total: SEED_DATA.length,
    });
  } catch (error) {
    return NextResponse.json(
      googleWorkspaceWriteBlockedSource(SHEET_NAME, error),
      { status: 500 }
    );
  }
}
