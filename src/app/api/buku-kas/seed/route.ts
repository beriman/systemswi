// POST /api/buku-kas/seed — Seed 20 sample transactions
import { NextRequest, NextResponse } from "next/server";
import {
  readBukuKasSheet,
  parseBukuKasRows,
  calculateRunningBalance,
  appendBukuKasRow,
  recalculateAndWriteSaldo,
  generateId,
  CATEGORIES,
  type BukuKasEntry,
} from "@/lib/buku-kas/sheets";

const SOURCE = "Google Sheets: Buku_Kas";

const SEED_DATA: Array<{
  date: string;
  type: "D" | "K";
  category: string;
  amount: number;
  description: string;
  reference: string;
}> = [
  // Week 1
  { date: "2026-06-01", type: "D", category: "Sales", amount: 15000000, description: "Penjualan parfum Aura 100ml batch #001", reference: "INV-001" },
  { date: "2026-06-01", type: "K", category: "Purchase", amount: 3500000, description: "Pembelian bahan baku alcohol 96%", reference: "PO-001" },
  { date: "2026-06-02", type: "D", category: "Sales", amount: 8500000, description: "Penjualan parfum Zen 50ml batch #002", reference: "INV-002" },
  { date: "2026-06-03", type: "K", category: "Operating", amount: 1200000, description: "Biaya listrik pabrik bulan Mei", reference: "OPR-001" },
  { date: "2026-06-04", type: "K", category: "Transport", amount: 750000, description: "Ongkos kirim barang ke distributor Jakarta", reference: "TRN-001" },
  { date: "2026-06-05", type: "D", category: "Sales", amount: 22000000, description: "Penjualan parfum Ocean 100ml batch #003", reference: "INV-003" },
  { date: "2026-06-05", type: "K", category: "Purchase", amount: 5000000, description: "Pembelian botol kaca 100ml (200 pcs)", reference: "PO-002" },

  // Week 2
  { date: "2026-06-08", type: "K", category: "Salary", amount: 12000000, description: "Gaji karyawan produksi Mei 2026", reference: "SAL-001" },
  { date: "2026-06-09", type: "D", category: "Sales", amount: 18500000, description: "Penjualan parfum Aura 50ml batch #004", reference: "INV-004" },
  { date: "2026-06-10", type: "K", category: "Purchase", amount: 2800000, description: "Pembelian essential oil lavender", reference: "PO-003" },
  { date: "2026-06-11", type: "K", category: "Operating", amount: 850000, description: "Biaya air dan kebersihan pabrik", reference: "OPR-002" },
  { date: "2026-06-12", type: "D", category: "Sales", amount: 11000000, description: "Penjualan parfum Zen 100ml batch #005", reference: "INV-005" },
  { date: "2026-06-12", type: "K", category: "Transport", amount: 1100000, description: "Ongkos kirim barang ke Surabaya", reference: "TRN-002" },

  // Week 3
  { date: "2026-06-15", type: "D", category: "Sales", amount: 25000000, description: "Penjualan parfum Ocean 50ml batch #006", reference: "INV-006" },
  { date: "2026-06-16", type: "K", category: "Purchase", amount: 4200000, description: "Pembelian packaging box premium", reference: "PO-004" },
  { date: "2026-06-17", type: "K", category: "Operating", amount: 1500000, description: "Biaya maintenance mesin filling", reference: "OPR-003" },
  { date: "2026-06-18", type: "D", category: "Sales", amount: 9500000, description: "Penjualan parfum Aura 100ml batch #007", reference: "INV-007" },
  { date: "2026-06-19", type: "K", category: "Salary", amount: 8000000, description: "Gaji karyawan admin & marketing Mei 2026", reference: "SAL-002" },

  // Week 4
  { date: "2026-06-22", type: "D", category: "Sales", amount: 16500000, description: "Penjualan parfum Zen 50ml batch #008", reference: "INV-008" },
  { date: "2026-06-23", type: "K", category: "Purchase", amount: 3200000, description: "Pembelian bahan pengawet parfum", reference: "PO-005" },
  { date: "2026-06-23", type: "K", category: "Transport", amount: 950000, description: "Ongkos kirim barang ke Bandung", reference: "TRN-003" },
];

export async function POST(req: NextRequest) {
  try {
    // Check if data already exists
    const existingRows = await readBukuKasSheet();
    const existing = parseBukuKasRows(existingRows);

    if (existing.length > 0) {
      return NextResponse.json({
        source: SOURCE,
        sourceStatus: "skipped",
        message: `Buku Kas already has ${existing.length} entries. Seed skipped to avoid duplicates.`,
        existingCount: existing.length,
      }, { status: 200 });
    }

    // Insert seed data
    const entries: Omit<BukuKasEntry, "row">[] = [];
    for (const data of SEED_DATA) {
      const id = generateId();
      entries.push({ id, ...data, saldo: 0 });
    }

    // Append all rows
    for (const entry of entries) {
      await appendBukuKasRow(entry);
    }

    // Recalculate all saldo
    const updatedRows = await readBukuKasSheet();
    const updatedEntries = parseBukuKasRows(updatedRows);
    await recalculateAndWriteSaldo(updatedEntries);

    const balanced = calculateRunningBalance(updatedEntries);
    const finalSaldo = balanced.length > 0 ? balanced[balanced.length - 1].saldo : 0;

    return NextResponse.json({
      source: SOURCE,
      sourceStatus: "live",
      message: `Seeded ${SEED_DATA.length} transactions successfully.`,
      count: SEED_DATA.length,
      finalSaldo,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to seed data",
      details: String(error),
    }, { status: 500 });
  }
}
