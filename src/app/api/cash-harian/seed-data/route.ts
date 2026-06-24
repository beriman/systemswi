// POST /api/cash-harian/seed-data — Seed 14 days of cash entries
import { NextRequest, NextResponse } from "next/server";
import { readSheet, appendRows } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const SHEET_NAME = "CashHarian";

const HEADERS = [
  "EntryId", "Date", "Type", "Category", "Description",
  "Amount", "Saldo", "InputBy", "InputDate",
];

// 14 days of realistic daily cash entries (2-3 per day)
const SEED_DATA: (string | number)[][] = [
  // Day 1 — 2026-06-09
  ["CH-SEED-001", "2026-06-09", "Masuk", "Penjualan", "Penjualan parfum Aura Bloom 10 pcs", 2500000, 2500000, "system", "2026-06-09 08:30"],
  ["CH-SEED-002", "2026-06-09", "Keluar", "Bahan Baku", "Pembelian essential oil lavender", 800000, 1700000, "system", "2026-06-09 14:00"],
  // Day 2 — 2026-06-10
  ["CH-SEED-003", "2026-06-10", "Masuk", "Penjualan", "Penjualan Velvet Mist 5 pcs + Ocean Breeze 3 pcs", 1850000, 3550000, "system", "2026-06-10 09:00"],
  ["CH-SEED-004", "2026-06-10", "Keluar", "Operasional", "Biaya listrik pabrik", 450000, 3100000, "system", "2026-06-10 15:00"],
  // Day 3 — 2026-06-11
  ["CH-SEED-005", "2026-06-11", "Masuk", "Penjualan", "Online order marketplace", 3200000, 6300000, "system", "2026-06-11 10:00"],
  ["CH-SEED-006", "2026-06-11", "Keluar", "Transport", "Biaya pengiriman ke Surabaya", 650000, 5650000, "system", "2026-06-11 16:00"],
  // Day 4 — 2026-06-12
  ["CH-SEED-007", "2026-06-12", "Masuk", "Penjualan", "Penjualan grosir ke distributor Bali", 5000000, 10650000, "system", "2026-06-12 08:00"],
  ["CH-SEED-008", "2026-06-12", "Keluar", "Gaji", "Gaji karyawan bagian produksi", 3500000, 7150000, "system", "2026-06-12 17:00"],
  // Day 5 — 2026-06-13
  ["CH-SEED-009", "2026-06-13", "Masuk", "Penjualan", "Direct sale ke hotel", 4200000, 11350000, "system", "2026-06-13 09:30"],
  ["CH-SEED-010", "2026-06-13", "Keluar", "Utilitas", "Pembayaran air + internet kantor", 350000, 11000000, "system", "2026-06-13 11:00"],
  // Day 6 — 2026-06-14
  ["CH-SEED-011", "2026-06-14", "Masuk", "Penjualan", "Event sale festival parfum", 3800000, 14800000, "system", "2026-06-14 10:00"],
  ["CH-SEED-012", "2026-06-14", "Keluar", "Lain-lain", "Biaya event booth fee", 1200000, 13600000, "system", "2026-06-14 18:00"],
  // Day 7 — 2026-06-15
  ["CH-SEED-013", "2026-06-15", "Masuk", "Penjualan", "Penjualan reguler harian", 2100000, 15700000, "system", "2026-06-15 08:00"],
  ["CH-SEED-014", "2026-06-15", "Keluar", "Investasi", "Pembelian mesin filling otomatis", 8000000, 7700000, "system", "2026-06-15 13:00"],
  // Day 8 — 2026-06-16
  ["CH-SEED-015", "2026-06-16", "Masuk", "Penjualan", "Penjualan Aura Bloom 8 pcs + Velvet Mist 4 pcs", 2800000, 10500000, "system", "2026-06-16 09:00"],
  ["CH-SEED-016", "2026-06-16", "Keluar", "Bahan Baku", "Pembelian botol kaca + cap", 1500000, 9000000, "system", "2026-06-16 14:00"],
  // Day 9 — 2026-06-17
  ["CH-SEED-017", "2026-06-17", "Masuk", "Penjualan", "Online order Shopee + Tokopedia", 4100000, 13100000, "system", "2026-06-17 10:00"],
  ["CH-SEED-018", "2026-06-17", "Keluar", "Operasional", "Biaya packing + bubble wrap", 300000, 12800000, "system", "2026-06-17 15:00"],
  // Day 10 — 2026-06-18
  ["CH-SEED-019", "2026-06-18", "Masuk", "Penjualan", "Grosir ke reseller Jakarta", 6200000, 19000000, "system", "2026-06-18 08:00"],
  ["CH-SEED-020", "2026-06-18", "Keluar", "Gaji", "Gaji karyawan admin + marketing", 2800000, 16200000, "system", "2026-06-18 17:00"],
  // Day 11 — 2026-06-19
  ["CH-SEED-021", "2026-06-19", "Masuk", "Penjualan", "Penjualan reguler + sample gratis", 1900000, 18100000, "system", "2026-06-19 09:00"],
  ["CH-SEED-022", "2026-06-19", "Keluar", "Transport", "Ongkir pengiriman ke Bandung", 480000, 17620000, "system", "2026-06-19 13:00"],
  // Day 12 — 2026-06-20
  ["CH-SEED-023", "2026-06-20", "Masuk", "Penjualan", "Flash sale online 24 jam", 5500000, 23120000, "system", "2026-06-20 08:00"],
  ["CH-SEED-024", "2026-06-20", "Keluar", "Bahan Baku", "Restock alcohol + fragrance oil", 2200000, 20920000, "system", "2026-06-20 12:00"],
  // Day 13 — 2026-06-21
  ["CH-SEED-025", "2026-06-21", "Masuk", "Penjualan", "Penjualan akhir pekan", 3100000, 24020000, "system", "2026-06-21 10:00"],
  ["CH-SEED-026", "2026-06-21", "Keluar", "Utilitas", "Listrik + air + internet bulan Juni", 950000, 23070000, "system", "2026-06-21 16:00"],
  // Day 14 — 2026-06-22
  ["CH-SEED-027", "2026-06-22", "Masuk", "Penjualan", "Penjualan Ocean Breeze 12 pcs", 3600000, 26670000, "system", "2026-06-22 09:00"],
  ["CH-SEED-028", "2026-06-22", "Keluar", "Operasional", "Biaya maintenance mesin", 1100000, 25570000, "system", "2026-06-22 14:00"],
];

export async function POST(request: NextRequest) {
  try {
    const raw = await readSheet(SHEET_NAME);
    const hasHeader = raw.length > 0 && raw[0][0] === "EntryId";
    const dataRows = hasHeader ? raw.slice(1) : raw;

    const existingIds = new Set(
      dataRows.filter((r) => r && r[0]).map((r) => r[0] as string)
    );
    const newRows = SEED_DATA.filter((row) => !existingIds.has(String(row[0])));

    if (newRows.length === 0) {
      return NextResponse.json({
        source: `Google Sheets: ${SHEET_NAME}`,
        sourceStatus: "live",
        message: "Seed data already exists — nothing inserted",
        seeded: 0,
        total: SEED_DATA.length,
      });
    }

    if (!hasHeader) {
      await appendRows(SHEET_NAME, [HEADERS]);
    }

    await appendRows(SHEET_NAME, newRows);

    return NextResponse.json(
      {
        source: `Google Sheets: ${SHEET_NAME}`,
        sourceStatus: "live",
        message: `${newRows.length} cash entries seeded successfully`,
        seeded: newRows.length,
        total: SEED_DATA.length,
        skipped: SEED_DATA.length - newRows.length,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to seed cash data", details: String(error) },
      { status: 500 }
    );
  }
}
