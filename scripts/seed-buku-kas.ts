// Seed 20 sample transactions to Buku_Kas sheet
import { appendRows, readRange } from "@/lib/sheets/sheets-real";

const CATEGORIES = ["Sales", "Purchase", "Operating", "Salary", "Transport"];
const DIVISI = ["Holding", "Produksi", "Store", "Event", "Ecommerse"];

interface SeedTx {
  tanggal: string;
  kodeAkun: string;
  kategori: string;
  deskripsi: string;
  debit: number;
  kredit: number;
  referensi: string;
  divisi: string;
}

const seedData: SeedTx[] = [
  // Week 1
  { tanggal: "2026-06-01", kodeAkun: "101", kategori: "Sales", deskripsi: "Penjualan parfum Wangi Mawar batch #001", debit: 15000000, kredit: 0, referensi: "INV-2026-001", divisi: "Store" },
  { tanggal: "2026-06-02", kodeAkun: "501", kategori: "Purchase", deskripsi: "Pembelian bahan baku alcohol 96%", debit: 0, kredit: 3500000, referensi: "PO-2026-001", divisi: "Produksi" },
  { tanggal: "2026-06-03", kodeAkun: "502", kategori: "Operating", deskripsi: "Biaya listrik pabrik Juni", debit: 0, kredit: 2800000, referensi: "PLN-2026-06", divisi: "Produksi" },
  { tanggal: "2026-06-04", kodeAkun: "101", kategori: "Sales", deskripsi: "Penjualan online marketplace", debit: 8500000, kredit: 0, referensi: "INV-2026-002", divisi: "Ecommerse" },
  { tanggal: "2026-06-05", kodeAkun: "503", kategori: "Transport", deskripsi: "Ongkos kirim bahan baku dari Jakarta", debit: 0, kredit: 1200000, referensi: "TRK-2026-001", divisi: "Produksi" },
  // Week 2
  { tanggal: "2026-06-08", kodeAkun: "101", kategori: "Sales", deskripsi: "Penjualan parfum Wangi Melati batch #002", debit: 12000000, kredit: 0, referensi: "INV-2026-003", divisi: "Store" },
  { tanggal: "2026-06-09", kodeAkun: "504", kategori: "Salary", deskripsi: "Gaji karyawan produksi minggu 1", debit: 0, kredit: 8000000, referensi: "SAL-2026-W1", divisi: "Produksi" },
  { tanggal: "2026-06-10", kodeAkun: "501", kategori: "Purchase", deskripsi: "Pembelian packaging botol parfum 50ml", debit: 0, kredit: 4500000, referensi: "PO-2026-002", divisi: "Produksi" },
  { tanggal: "2026-06-11", kodeAkun: "101", kategori: "Sales", deskripsi: "Penjualan event Fragrantions 2026", debit: 25000000, kredit: 0, referensi: "INV-2026-004", divisi: "Event" },
  { tanggal: "2026-06-12", kodeAkun: "502", kategori: "Operating", deskripsi: "Biaya sewa booth event", debit: 0, kredit: 5000000, referensi: "BTH-2026-001", divisi: "Event" },
  // Week 3
  { tanggal: "2026-06-15", kodeAkun: "101", kategori: "Sales", deskripsi: "Penjualan parfum Wangi Cendana batch #003", debit: 18000000, kredit: 0, referensi: "INV-2026-005", divisi: "Store" },
  { tanggal: "2026-06-16", kodeAkun: "504", kategori: "Salary", deskripsi: "Gaji karyawan produksi minggu 2", debit: 0, kredit: 8000000, referensi: "SAL-2026-W2", divisi: "Produksi" },
  { tanggal: "2026-06-17", kodeAkun: "503", kategori: "Transport", deskripsi: "Ongkos kirim produk ke distributor", debit: 0, kredit: 2000000, referensi: "TRK-2026-002", divisi: "Store" },
  { tanggal: "2026-06-18", kodeAkun: "101", kategori: "Sales", deskripsi: "Penjualan corporate gift set", debit: 35000000, kredit: 0, referensi: "INV-2026-006", divisi: "Holding" },
  { tanggal: "2026-06-19", kodeAkun: "501", kategori: "Purchase", deskripsi: "Pembelian bahan baku essential oil", debit: 0, kredit: 6000000, referensi: "PO-2026-003", divisi: "Produksi" },
  // Week 4
  { tanggal: "2026-06-22", kodeAkun: "101", kategori: "Sales", deskripsi: "Penjualan parfum Wangi Kenanga batch #004", debit: 14000000, kredit: 0, referensi: "INV-2026-007", divisi: "Store" },
  { tanggal: "2026-06-23", kodeAkun: "504", kategori: "Salary", deskripsi: "Gaji karyawan produksi minggu 3", debit: 0, kredit: 8000000, referensi: "SAL-2026-W3", divisi: "Produksi" },
  { tanggal: "2026-06-24", kodeAkun: "502", kategori: "Operating", deskripsi: "Biaya internet & telepon kantor", debit: 0, kredit: 1500000, referensi: "TEL-2026-06", divisi: "Holding" },
  { tanggal: "2026-06-25", kodeAkun: "101", kategori: "Sales", deskripsi: "Penjualan flash sale online", debit: 22000000, kredit: 0, referensi: "INV-2026-008", divisi: "Ecommerse" },
  { tanggal: "2026-06-26", kodeAkun: "502", kategori: "Operating", deskripsi: "Biaya maintenance peralatan pabrik", debit: 0, kredit: 3200000, referensi: "MNT-2026-001", divisi: "Produksi" },
];

async function seed() {
  console.log("🌱 Seeding 20 sample transactions to Buku_Kas...");

  // Check existing data
  const existing = await readRange("Buku_Kas!A1:H10");
  const hasData = existing.length > 1 && existing.slice(1).some((row) => row.some(Boolean));

  if (hasData) {
    console.log("⚠️  Buku_Kas already has data. Skipping seed to avoid duplicates.");
    console.log("   To re-seed, clear the sheet first.");
    process.exit(0);
  }

  // Append all rows
  const rows = seedData.map((tx) => [
    tx.tanggal,
    tx.kodeAkun,
    tx.kategori,
    tx.deskripsi,
    tx.debit,
    tx.kredit,
    tx.referensi,
    tx.divisi,
  ]);

  await appendRows("Buku_Kas", rows);
  console.log(`✅ Successfully seeded ${rows.length} transactions to Buku_Kas.`);

  // Calculate expected saldo
  let saldo = 0;
  for (const tx of seedData) {
    saldo += tx.debit - tx.kredit;
  }
  console.log(`   Expected final saldo: Rp ${saldo.toLocaleString("id-ID")}`);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
