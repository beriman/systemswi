// POST /api/buku-kas/seed — Seed 20 sample transactions
import { NextResponse } from "next/server";
import { readSheet, appendRows } from "@/lib/sheets/sheets-real";
import { googleWorkspaceWriteBlockedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const SHEET_NAME = "BukuKas";

const HEADERS = [
  "EntryId", "Date", "Type", "Category", "Description",
  "Debit", "Credit", "Saldo", "Reference", "InputBy", "InputDate",
];

// 20 sample transactions for June 2026
const SEED_DATA = [
  // [date, type, category, description, debit, credit, reference]
  ["2026-06-01", "Debit", "Sales", "Penjualan parfum Aura 100ml", 15000000, 0, "INV-001"],
  ["2026-06-01", "Kredit", "Purchase", "Pembelian bahan baku essential oil", 0, 8500000, "PO-001"],
  ["2026-06-02", "Debit", "Sales", "Penjualan parfum Zen 50ml", 7500000, 0, "INV-002"],
  ["2026-06-03", "Kredit", "Operating", "Biaya listrik pabrik", 0, 2500000, "OP-001"],
  ["2026-06-04", "Kredit", "Salary", "Gaji karyawan produksi", 0, 12000000, "SAL-001"],
  ["2026-06-05", "Debit", "Sales", "Penjualan parfum Bloom 100ml", 22000000, 0, "INV-003"],
  ["2026-06-06", "Kredit", "Transport", "Ongkos kirim ke distributor", 0, 1800000, "TR-001"],
  ["2026-06-07", "Kredit", "Purchase", "Pembelian packaging botol kaca", 0, 5500000, "PO-002"],
  ["2026-06-08", "Debit", "Sales", "Penjualan parfum Fresh 50ml", 9500000, 0, "INV-004"],
  ["2026-06-09", "Kredit", "Operating", "Biaya air dan telepon", 0, 1200000, "OP-002"],
  ["2026-06-10", "Kredit", "Salary", "Gaji karyawan admin", 0, 8000000, "SAL-002"],
  ["2026-06-11", "Debit", "Sales", "Penjualan parfum Night 100ml", 18500000, 0, "INV-005"],
  ["2026-06-12", "Kredit", "Purchase", "Pembelian bahan pewangi", 0, 6800000, "PO-003"],
  ["2026-06-13", "Kredit", "Transport", "Bensi operasional mobil", 0, 750000, "TR-002"],
  ["2026-06-14", "Debit", "Sales", "Penjualan parfum Day 50ml", 6500000, 0, "INV-006"],
  ["2026-06-15", "Kredit", "Operating", "Biaya maintenance mesin", 0, 3500000, "OP-003"],
  ["2026-06-16", "Kredit", "Salary", "Gaji karyawan QC", 0, 6500000, "SAL-003"],
  ["2026-06-17", "Debit", "Sales", "Penjualan parfum Sport 100ml", 11000000, 0, "INV-007"],
  ["2026-06-18", "Kredit", "Purchase", "Pembelian bahan alkohol", 0, 4200000, "PO-004"],
  ["2026-06-19", "Kredit", "Operating", "Biaya izin BPOM", 0, 5000000, "OP-004"],
];

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // Check if data already exists
    const raw = await readSheet(SHEET_NAME);
    const hasHeader = raw.length > 0 && raw[0][0] === "EntryId";
    const dataRows = hasHeader ? raw.slice(1) : raw;
    const existingIds = new Set(dataRows.filter((r) => r && r[0]).map((r) => r[0]));

    if (existingIds.size > 0) {
      return NextResponse.json({
        source: `Google Sheets: ${SHEET_NAME}`,
        sourceStatus: "live",
        message: "Seed skipped — data already exists",
        seeded: 0,
        skipped: SEED_DATA.length,
        existingCount: existingIds.size,
      });
    }

    // Ensure header
    if (raw.length === 0 || raw[0][0] !== "EntryId") {
      await appendRows(SHEET_NAME, [HEADERS]);
    }

    // Build rows with running saldo
    let runningSaldo = 0;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const rows: (string | number)[][] = [];

    for (const [date, type, category, description, debit, credit, reference] of SEED_DATA) {
      runningSaldo += Number(debit) - Number(credit);
      const entryId = `BK-SEED-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      rows.push([
        entryId, date, type, category, description,
        debit, credit, runningSaldo, reference, "system", now,
      ]);
    }

    await appendRows(SHEET_NAME, rows);

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      message: "Seed completed successfully",
      seeded: rows.length,
      skipped: 0,
      finalSaldo: runningSaldo,
    });
  } catch (error) {
    return NextResponse.json(
      googleWorkspaceWriteBlockedSource(SHEET_NAME, error),
      { status: 500 }
    );
  }
}
