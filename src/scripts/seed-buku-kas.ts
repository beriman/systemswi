#!/usr/bin/env node
/**
 * Seed script for Buku Kas
 * Inserts 20 sample transactions into the Buku_Kas Google Sheet
 *
 * Usage:
 *   npx tsx src/scripts/seed-buku-kas.ts
 *
 * Or via API:
 *   GET /api/buku-kas/seed (dev only)
 */

import { readRange, writeRange, appendRows } from "@/lib/sheets/sheets-real";

const SHEET_NAME = "Buku_Kas";

interface SeedEntry {
  id: string;
  date: string;
  type: "D" | "K";
  category: string;
  amount: number;
  description: string;
  reference: string;
}

const SEED_DATA: SeedEntry[] = [
  // Week 1
  { id: "BK-001", date: "2026-06-01", type: "D", category: "Sales", amount: 15000000, description: "Penjualan parfum batch #PRD-061", reference: "INV-001" },
  { id: "BK-002", date: "2026-06-02", type: "K", category: "Purchase", amount: 3500000, description: "Pembelian bahan baku aromatik", reference: "PO-001" },
  { id: "BK-003", date: "2026-06-03", type: "K", category: "Operating", amount: 1200000, description: "Biaya listrik pabrik", reference: "UTIL-001" },
  { id: "BK-004", date: "2026-06-04", type: "D", category: "Sales", amount: 8500000, description: "Penjualan online Shopee & Tokopedia", reference: "INV-002" },
  { id: "BK-005", date: "2026-06-05", type: "K", category: "Transport", amount: 750000, description: "Ongkos kirim barang ke distributor", reference: "SHP-001" },

  // Week 2
  { id: "BK-006", date: "2026-06-06", type: "D", category: "Sales", amount: 22000000, description: "Penjualan wholesale ke toko ritel", reference: "INV-003" },
  { id: "BK-007", date: "2026-06-07", type: "K", category: "Salary", amount: 12000000, description: "Gaji karyawan bulan Juni", reference: "SAL-001" },
  { id: "BK-008", date: "2026-06-08", type: "K", category: "Purchase", amount: 5000000, description: "Pembelian packaging botol & cap", reference: "PO-002" },
  { id: "BK-009", date: "2026-06-09", type: "D", category: "Sales", amount: 6800000, description: "Penjualan di event Jakarta Perfume Expo", reference: "INV-004" },
  { id: "BK-010", date: "2026-06-10", type: "K", category: "Operating", amount: 2500000, description: "Biaya sewa pabrik bulan Juni", reference: "RNT-001" },

  // Week 3
  { id: "BK-011", date: "2026-06-11", type: "D", category: "Sales", amount: 18500000, description: "Penjualan parfum custom order", reference: "INV-005" },
  { id: "BK-012", date: "2026-06-13", type: "K", category: "Transport", amount: 1500000, description: "Distribusi ke mal & department store", reference: "SHP-002" },
  { id: "BK-013", date: "2026-06-15", type: "D", category: "Sales", amount: 11200000, description: "Penjualan corporate gift set", reference: "INV-006" },
  { id: "BK-014", date: "2026-06-16", type: "K", category: "Purchase", amount: 4200000, description: "Pembelian bahan pengkosmetikan", reference: "PO-003" },
  { id: "BK-015", date: "2026-06-17", type: "K", category: "Operating", amount: 900000, description: "Biaya internet & telepon kantor", reference: "UTIL-002" },

  // Week 4
  { id: "BK-016", date: "2026-06-20", type: "D", category: "Sales", amount: 9500000, description: "Penjualan parfum di marketplace", reference: "INV-007" },
  { id: "BK-017", date: "2026-06-21", type: "K", category: "Salary", amount: 3500000, description: "Bonus produksi karyawan", reference: "SAL-002" },
  { id: "BK-018", date: "2026-06-22", type: "K", category: "Transport", amount: 1200000, description: "Expedisi ke Surabaya & Bandung", reference: "SHP-003" },
  { id: "BK-019", date: "2026-06-23", type: "D", category: "Sales", amount: 14700000, description: "Penjualan merchandise TIM collection", reference: "INV-008" },
  { id: "BK-020", date: "2026-06-24", type: "K", category: "Operating", amount: 1800000, description: "Biaya administrasi bank & maintenance", reference: "ADM-001" },
];

async function seed() {
  console.log("🌱 Starting Buku Kas seed...");

  try {
    // Read current sheet to check if data exists
    const existing = await readRange(`${SHEET_NAME}!A5:H100`);
    const dataRows = existing.slice(1).filter((r) => r[0] && r[0].trim() !== "");

    if (dataRows.length > 0) {
      console.log(`⚠️ Sheet already has ${dataRows.length} entries. Skipping seed.`);
      console.log("To re-seed, first clear rows 6+ in the Buku_Kas sheet.");
      process.exit(0);
    }

    // Calculate running balance
    let balance = 0;
    const rows: (string | number)[][] = [];

    for (const entry of SEED_DATA) {
      if (entry.type === "D") {
        balance += entry.amount;
      } else {
        balance -= entry.amount;
      }

      rows.push([
        entry.id,
        entry.date,
        entry.type,
        entry.category,
        entry.amount,
        entry.description,
        entry.reference,
        balance,
      ]);
    }

    // Write header row (row 5)
    await writeRange(`${SHEET_NAME}!A5:H5`, [[
      "ID", "Date", "Type", "Category", "Amount", "Description", "Reference", "Saldo"
    ]]);

    // Write data rows (row 6 onwards)
    const startRow = 6;
    const endRow = startRow + rows.length - 1;
    await writeRange(`${SHEET_NAME}!A${startRow}:H${endRow}`, rows);

    const totalDebit = SEED_DATA.filter((e) => e.type === "D").reduce((s, e) => s + e.amount, 0);
    const totalKredit = SEED_DATA.filter((e) => e.type === "K").reduce((s, e) => s + e.amount, 0);

    console.log(`✅ Successfully seeded ${SEED_DATA.length} transactions!`);
    console.log(`   Total Debit:  Rp ${totalDebit.toLocaleString("id-ID")}`);
    console.log(`   Total Kredit: Rp ${totalKredit.toLocaleString("id-ID")}`);
    console.log(`   Final Saldo:  Rp ${balance.toLocaleString("id-ID")}`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
