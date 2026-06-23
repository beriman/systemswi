// POST /api/cash-harian/seed — Seed 14 days of daily cash entries
import { NextRequest, NextResponse } from "next/server";
import { readSheet, appendRows } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const SHEET_NAME = "CashHarian";
const SOURCE = "Google Sheets: Cash_Harian";

function generateId(): string {
  return `CH-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// 14 days of seed data: mix of Masuk and Keluar entries
const SEED_DATA: Array<{
  date: string;
  type: "Masuk" | "Keluar";
  category: string;
  description: string;
  amount: number;
}> = [
  // Day 1 — 2026-06-09
  { date: "2026-06-09", type: "Masuk", category: "Penjualan", description: "Penjualan parfum Aura 100ml batch #001", amount: 15000000 },
  { date: "2026-06-09", type: "Keluar", category: "Bahan Baku", description: "Pembelian bahan baku alcohol 96%", amount: 3500000 },

  // Day 2 — 2026-06-10
  { date: "2026-06-10", type: "Masuk", category: "Penjualan", description: "Penjualan parfum Zen 50ml batch #002", amount: 8500000 },
  { date: "2026-06-10", type: "Keluar", category: "Operasional", description: "Biaya listrik pabrik bulan Mei", amount: 1200000 },

  // Day 3 — 2026-06-11
  { date: "2026-06-11", type: "Keluar", category: "Transport", description: "Ongkos kirim barang ke distributor Jakarta", amount: 750000 },
  { date: "2026-06-11", type: "Masuk", category: "Penjualan", description: "Penjualan parfum Ocean 100ml batch #003", amount: 22000000 },

  // Day 4 — 2026-06-12
  { date: "2026-06-12", type: "Keluar", category: "Bahan Baku", description: "Pembelian botol kaca 100ml (200 pcs)", amount: 5000000 },
  { date: "2026-06-12", type: "Keluar", category: "Gaji", description: "Gaji karyawan produksi Mei 2026", amount: 12000000 },

  // Day 5 — 2026-06-13
  { date: "2026-06-13", type: "Masuk", category: "Penjualan", description: "Penjualan parfum Aura 50ml batch #004", amount: 18500000 },
  { date: "2026-06-13", type: "Keluar", category: "Bahan Baku", description: "Pembelian essential oil lavender", amount: 2800000 },

  // Day 6 — 2026-06-14
  { date: "2026-06-14", type: "Keluar", category: "Operasional", description: "Biaya air dan kebersihan pabrik", amount: 850000 },
  { date: "2026-06-14", type: "Masuk", category: "Penjualan", description: "Penjualan parfum Zen 100ml batch #005", amount: 11000000 },

  // Day 7 — 2026-06-15
  { date: "2026-06-15", type: "Keluar", category: "Transport", description: "Ongkos kirim barang ke Surabaya", amount: 1100000 },
  { date: "2026-06-15", type: "Masuk", category: "Penjualan", description: "Penjualan parfum Ocean 50ml batch #006", amount: 25000000 },

  // Day 8 — 2026-06-16
  { date: "2026-06-16", type: "Keluar", category: "Bahan Baku", description: "Pembelian packaging box premium", amount: 4200000 },
  { date: "2026-06-16", type: "Keluar", category: "Operasional", description: "Biaya maintenance mesin filling", amount: 1500000 },

  // Day 9 — 2026-06-17
  { date: "2026-06-17", type: "Masuk", category: "Penjualan", description: "Penjualan parfum Aura 100ml batch #007", amount: 9500000 },
  { date: "2026-06-17", type: "Keluar", category: "Gaji", description: "Gaji karyawan admin & marketing Mei 2026", amount: 8000000 },

  // Day 10 — 2026-06-18
  { date: "2026-06-18", type: "Masuk", category: "Penjualan", description: "Penjualan parfum Zen 50ml batch #008", amount: 16500000 },
  { date: "2026-06-18", type: "Keluar", category: "Bahan Baku", description: "Pembelian bahan pengawet parfum", amount: 3200000 },

  // Day 11 — 2026-06-19
  { date: "2026-06-19", type: "Keluar", category: "Transport", description: "Ongkos kirim barang ke Bandung", amount: 950000 },
  { date: "2026-06-19", type: "Masuk", category: "Penjualan", description: "Penjualan parfum Ocean 100ml batch #009", amount: 13000000 },

  // Day 12 — 2026-06-20
  { date: "2026-06-20", type: "Keluar", category: "Utilitas", description: "Biaya internet & telepon kantor", amount: 500000 },
  { date: "2026-06-20", type: "Masuk", category: "Penjualan", description: "Penjualan parfum Aura 50ml batch #010", amount: 19000000 },
  { date: "2026-06-20", type: "Keluar", category: "Bahan Baku", description: "Pembelian essential oil rose", amount: 4500000 },

  // Day 13 — 2026-06-21
  { date: "2026-06-21", type: "Masuk", category: "Investasi", description: "Modal tambahan dari pemilik", amount: 50000000 },
  { date: "2026-06-21", type: "Keluar", category: "Operasional", description: "Biaya sewa gudang bulan Juni", amount: 6000000 },

  // Day 14 — 2026-06-22
  { date: "2026-06-22", type: "Masuk", category: "Penjualan", description: "Penjualan parfum Zen 100ml batch #011", amount: 21000000 },
  { date: "2026-06-22", type: "Keluar", category: "Gaji", description: "Gaji karyawan produksi Juni 2026", amount: 12000000 },
  { date: "2026-06-22", type: "Keluar", category: "Lain-lain", description: "Biaya tak terduga - perbaikan atap pabrik", amount: 2000000 },
];

export async function POST(req: NextRequest) {
  try {
    // Check if data already exists
    const raw = await readSheet(SHEET_NAME);
    const dataRows = raw.slice(1).filter((row) => row && row[0]);

    if (dataRows.length > 0) {
      return NextResponse.json({
        source: SOURCE,
        sourceStatus: "skipped",
        message: `Cash Harian already has ${dataRows.length} entries. Seed skipped to avoid duplicates.`,
        existingCount: dataRows.length,
      }, { status: 200 });
    }

    // Calculate running saldo for seed data (starting from 0 as initial balance)
    let runningSaldo = 0;
    const rowsToInsert: (string | number)[][] = [];
    const today = new Date().toISOString().slice(0, 10);

    for (const data of SEED_DATA) {
      const entryId = generateId();
      if (data.type === "Masuk") {
        runningSaldo += data.amount;
      } else {
        runningSaldo -= data.amount;
      }
      rowsToInsert.push([
        entryId,
        data.date,
        data.type,
        data.category,
        data.description,
        data.amount,
        runningSaldo,
        "system",
        today,
      ]);
    }

    // Insert in batches of 10 to avoid timeout
    const BATCH_SIZE = 10;
    for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
      const batch = rowsToInsert.slice(i, i + BATCH_SIZE);
      await appendRows(SHEET_NAME, batch);
    }

    return NextResponse.json({
      source: SOURCE,
      sourceStatus: "live",
      message: `Seeded ${SEED_DATA.length} cash harian entries across 14 days successfully.`,
      count: SEED_DATA.length,
      finalSaldo: runningSaldo,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to seed cash harian data",
      details: String(error),
    }, { status: 500 });
  }
}
