// Seed script for Sukuk Full Suite — populates Google Sheets with demo data
// Sheet ranges per sheets-real.ts:
//   SukukStore!A4:O9   → Store
//   SukukStore!A12:O26 → Investors
//   SukukStore!A29:O44 → Proyeksi
//   SukukProduk!A6:L13 → Products
//   SukukProduk!A22:M34 → Produk Proyeksi
//   Sukuk_Creditor!A1:Z20 → Creditors
//   Sukuk_RAB!A1:Z30    → RAB
//   Sukuk_Payment_Schedule!A1:L25 → Schedule
//   Sukuk_Notification!A1:H50 → Notifications
//   Sukuk_Audit!A1:H50   → Audit

import { writeRange, readRange, appendRows } from "../src/lib/sheets/sheets-real";

const today = new Date();
function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function addDays(days: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return fmtDate(d);
}

async function seed() {
  console.log("🌱 Starting Sukuk Full Suite seed...\n");

  // ── 1. Headers ──────────────────────────────────────────────────
  console.log("📝 Writing headers...");

  // Store headers (row 4)
  const storeHeader = [["ID", "Brand", "Kategori", "Lokasi", "Revenue/Bulan", "Unit Terjual", "Avg Ticket", "Pelanggan Aktif", "Conversion Rate", "NPS", "Status", "Catatan", "", "", ""]];
  await writeRange("SukukStore!A4:O4", storeHeader);

  // Investor headers (row 12)
  const investorHeader = [["ID", "Nama", "Email", "Telepon", "Alamat", "NPWP", "Bank", "No Rekening", "Saldo Investasi", "Total Profit", "Status", "Consent", "Tanggal Daftar", "Catatan", ""]];
  await writeRange("SukukStore!A12:O12", investorHeader);

  // Proyeksi headers (row 29)
  const proyeksiHeader = [["ID", "Brand", "Product ID", "Product Name", "Investasi", "Bagi Hasil Bulanan", "Return 6 Bln", "Return 12 Bln", "ROI %", "Payback Bln", "NPV", "IRR %", "Status", "Catatan", ""]];
  await writeRange("SukukStore!A29:O29", proyeksiHeader);

  // Product headers (row 6)
  const productHeader = [["ID Produk", "Nama Produk", "Deskripsi", "Jenis", "Modal Dibutuhkan", "Target Investor", "Nisbah", "Status", "PIC Produk", "Tanggal Launch", "", ""]];
  await writeRange("SukukProduk!A6:L6", productHeader);

  // Creditor headers (row 1)
  const creditorHeader = [["ID", "Nama", "Email", "Telepon", "Alamat", "NPWP", "Bank", "No Rekening", "Tipe", "Plafon", "Saldo Pinjaman", "Tenor (bln)", "Bunga %", "Status", "Tanggal Akad", "Catatan"]];
  await writeRange("Sukuk_Creditor!A1:P1", creditorHeader);

  // RAB headers (row 1)
  const rabHeader = [["ID", "Kategori", "Deskripsi", "Volume", "Satuan", "Harga Satuan", "Jumlah", "Realisasi", "Variance", "Status", "Catatan"]];
  await writeRange("Sukuk_RAB!A1:K1", rabHeader);

  // Schedule headers (row 1)
  const scheduleHeader = [["ID", "Product ID", "Product Name", "Periode", "Tanggal Jatuh Tempo", "Jumlah Pokok", "Jumlah Bagi Hasil", "Total Bayar", "Status", "Tanggal Bayar", "Catatan"]];
  await writeRange("Sukuk_Payment_Schedule!A1:K1", scheduleHeader);

  // Notification headers (row 1)
  const notifHeader = [["ID", "Timestamp", "Tipe", "Judul", "Pesan", "Recipient", "Read Status", "Action URL"]];
  await writeRange("Sukuk_Notification!A1:H1", notifHeader);

  // Audit headers (row 1)
  const auditHeader = [["ID", "Timestamp", "User", "Action", "Entity", "Entity ID", "Details", "IP Address"]];
  await writeRange("Sukuk_Audit!A1:H1", auditHeader);

  console.log("✅ Headers written\n");

  // ── 2. Store Data (5 rows: A5:O9) ──────────────────────────────
  console.log("🏪 Writing store data...");
  const storeData = [
    ["STO-001", "Kampoeng Parfum", "Experience", "Jakarta Selatan", 85000000, 420, 202381, 1250, 0.034, 72, "aktif", "Flagship store dengan experience room", "", "", ""],
    ["STO-002", "Aroma Nusantara", "Merchandise", "Bandung", 42000000, 280, 150000, 890, 0.041, 68, "aktif", "Store offline + online", "", "", ""],
    ["STO-003", "Sensasi Wangi Shop", "Merchandise", "Surabaya", 55000000, 350, 157143, 1020, 0.038, 75, "aktif", "Mall-based store", "", "", ""],
    ["STO-004", "Wangi Indonesia", "Online", "Nasional", 38000000, 520, 73077, 2100, 0.028, 65, "aktif", "E-commerce focused", "", "", ""],
    ["STO-005", "Parfum Gallery", "Experience", "Yogyakarta", 28000000, 180, 155556, 650, 0.029, 70, "aktif", "Experience + retail", "", "", ""],
  ];
  await writeRange("SukukStore!A5:O9", storeData);
  console.log(`✅ ${storeData.length} store rows written`);

  // ── 3. Investor Data (5 rows: A13:O17) ─────────────────────────
  console.log("👥 Writing investor data...");
  const investorData = [
    ["INV-001", "Ahmad Fauzi", "ahmad.fauzi@email.com", "081234567890", "Jl. Sudirman No. 45, Jakarta", "12.345.678.9-012.345", "BCA", "1234567890", 150000000, 25000000, "aktif", "1", addDays(-180), "Investor awal batch 1"],
    ["INV-002", "Siti Nurhaliza", "siti.nur@email.com", "081987654321", "Jl. Gatot Subroto No. 12, Bandung", "23.456.789.0-123.456", "Mandiri", "2345678901", 200000000, 35000000, "aktif", "1", addDays(-150), "Investor reguler"],
    ["INV-003", "Budi Santoso", "budi.s@email.com", "081112223334", "Jl. Diponegoro No. 78, Surabaya", "34.567.890.1-234.567", "BNI", "3456789012", 100000000, 12000000, "aktif", "1", addDays(-120), "Investor menengah"],
    ["INV-004", "Dewi Lestari", "dewi.l@email.com", "081444555666", "Jl. Ahmad Yani No. 23, Yogyakarta", "45.678.901.2-345.678", "BRI", "4567890123", 75000000, 8500000, "aktif", "1", addDays(-90), "Investor baru"],
    ["INV-005", "Rizky Pratama", "rizky.p@email.com", "081777888999", "Jl. Merdeka No. 56, Medan", "56.789.012.3-456.789", "BCA", "5678901234", 300000000, 55000000, "aktif", "1", addDays(-60), "Investor premium"],
  ];
  await writeRange("SukukStore!A13:O17", investorData);
  console.log(`✅ ${investorData.length} investor rows written`);

  // ── 4. Proyeksi Data (3 rows: A30:O32) ─────────────────────────
  console.log("📊 Writing proyeksi data...");
  const proyeksiData = [
    ["PRO-001", "Kampoeng Parfum", "SM-001", "Sukuk Mikro KP-1", 500000000, 12500000, 75000000, 150000000, 30, 8, 45000000, 18.5, "aktif", "Proyeksi dengan asumsi 80% pencapaian target"],
    ["PRO-002", "Aroma Nusantara", "SM-002", "Sukuk Mikro AN-1", 300000000, 7500000, 45000000, 90000000, 30, 7, 28000000, 19.2, "aktif", "Proyeksi konservatif"],
    ["PRO-003", "Sensasi Wangi Shop", "SM-003", "Sukuk Mikro SW-1", 400000000, 10000000, 60000000, 120000000, 30, 7, 38000000, 20.1, "aktif", "Proyeksi moderat"],
  ];
  await writeRange("SukukStore!A30:O32", proyeksiData);
  console.log(`✅ ${proyeksiData.length} proyeksi rows written`);

  // ── 5. Product Data (5 rows: A7:L11) ───────────────────────────
  console.log("🪙 Writing product data...");
  const productData = [
    ["SM-001", "Sukuk Mikro Kampoeng Parfum", "Pendanaan pengembangan experience room Kampoeng Parfum Jakarta", "Experience", 500000000, 1000, "60:40", "open", "Tim Sukuk", addDays(-30), "", ""],
    ["SM-002", "Sukuk Mikro Aroma Nusantara", "Ekspansi outlet Aroma Nusantara di 5 kota besar", "Merchandise", 300000000, 600, "55:45", "open", "Tim Sukuk", addDays(-20), "", ""],
    ["SM-003", "Sukuk Mikro Sensasi Wangi", "Modal kerja produksi parfum batch baru", "Produksi", 400000000, 800, "65:35", "funded", "Tim Sukuk", addDays(-10), "", ""],
    ["SM-004", "Sukuk Mikro Wangi Indonesia", "Pengembangan platform e-commerce dan logistik", "Digital", 250000000, 500, "50:50", "open", "Tim Sukuk", addDays(-5), "", ""],
    ["SM-005", "Sukuk Mikro Parfum Gallery", "Pembukaan cabang baru di Yogyakarta", "Experience", 200000000, 400, "60:40", "Perencanaan", "Tim Sukuk", addDays(15), "", ""],
  ];
  await writeRange("SukukProduk!A7:L11", productData);
  console.log(`✅ ${productData.length} product rows written`);

  // ── 6. Creditor Data (3 rows: A2:P4) ───────────────────────────
  console.log("🏦 Writing creditor data...");
  const creditorData = [
    ["KRD-001", "PT Syariah Mandiri Finance", "contact@syariahfinance.co.id", "021-5551234", "Jl. Thamrin No. 10, Jakarta", "11.222.333.4-555.666", "Bank Syariah Indonesia", "7788990011", "Korporat", 2000000000, 750000000, 36, 5.5, "aktif", addDays(-200), "Kreditur utama untuk batch 1-3"],
    ["KRD-002", "CV Berkah Abadi Pinjaman", "info@berkahabadi.id", "021-5559876", "Jl. Kuningan No. 22, Jakarta", "22.333.444.5-666.777", "Bank BCA Syariah", "1122334455", "KMK", 500000000, 150000000, 24, 6.0, "aktif", addDays(-100), "Kreditur untuk modal kerja"],
    ["KRD-003", "PT Pembiayaan Nusantara", "sales@pembiayaanusa.co.id", "021-5554321", "Jl. Sudirman No. 88, Jakarta", "33.444.555.6-777.888", "Bank Mandiri Syariah", "5566778899", "Korporat", 1500000000, 0, 48, 5.0, "aktif", addDays(-50), "Kreditur baru untuk ekspansi"],
  ];
  await writeRange("Sukuk_Creditor!A2:P4", creditorData);
  console.log(`✅ ${creditorData.length} creditor rows written`);

  // ── 7. RAB Data (3 rows: A2:K4) ────────────────────────────────
  console.log("📋 Writing RAB data...");
  const rabData = [
    ["RAB-001", "Pengembangan", "Pembangunan experience room KP-1", 1, "unit", 250000000, 250000000, 245000000, 5000000, "approved", "Pembangunan selesai 98%"],
    ["RAB-002", "Produksi", "Produksi parfum batch 001-005", 500, "liter", 150000, 75000000, 72000000, 3000000, "approved", "COGS sesuai target"],
    ["RAB-003", "Marketing", "Kampanye digital Q3 2026", 1, "kampanye", 50000000, 50000000, 35000000, 15000000, "draft", "Alokasi untuk iklan & influencer"],
  ];
  await writeRange("Sukuk_RAB!A2:K4", rabData);
  console.log(`✅ ${rabData.length} RAB rows written`);

  // ── 8. Schedule Data (6 rows: A2:K7) ───────────────────────────
  console.log("📅 Writing schedule data...");
  const scheduleData = [
    ["SCH-001", "SM-001", "Sukuk Mikro KP-1", "Q3-2026", addDays(15), 4166667, 12500000, 16666667, "scheduled", "", "Pembagian bagi hasil Q3"],
    ["SCH-002", "SM-001", "Sukuk Mikro KP-1", "Q4-2026", addDays(105), 4166667, 12500000, 16666667, "scheduled", "", "Pembagian bagi hasil Q4"],
    ["SCH-003", "SM-002", "Sukuk Mikro AN-1", "Q3-2026", addDays(20), 2500000, 7500000, 10000000, "scheduled", "", "Bagi hasil triwulan"],
    ["SCH-004", "SM-003", "Sukuk Mikro SW-1", "Q3-2026", addDays(25), 3333333, 10000000, 13333333, "paid", addDays(-5), "Sudah dibayar lunas"],
    ["SCH-005", "SM-003", "Sukuk Mikro SW-1", "Q4-2026", addDays(115), 3333333, 10000000, 13333333, "scheduled", "", "Jadwal Q4"],
    ["SCH-006", "SM-004", "Sukuk Mikro WI-1", "Q3-2026", addDays(30), 2083333, 6250000, 8333333, "scheduled", "", "Pembayaran pertama"],
  ];
  await writeRange("Sukuk_Payment_Schedule!A2:K7", scheduleData);
  console.log(`✅ ${scheduleData.length} schedule rows written`);

  // ── 9. Audit Data (10 rows: A2:H11) ────────────────────────────
  console.log("🔍 Writing audit data...");
  const auditData = [
    ["AUD-001", addDays(-30) + "T08:00:00Z", "admin", "CREATE", "product", "SM-001", "Produk sukuk KP-1 didaftarkan", "10.0.0.1"],
    ["AUD-002", addDays(-28) + "T09:15:00Z", "admin", "UPDATE", "product", "SM-001", "Status diubah menjadi open", "10.0.0.1"],
    ["AUD-003", addDays(-25) + "T10:30:00Z", "investor", "CREATE", "investment", "INV-001", "Investasi awal Rp 50.000.000", "192.168.1.10"],
    ["AUD-004", addDays(-20) + "T14:00:00Z", "admin", "CREATE", "product", "SM-002", "Produk sukuk AN-1 didaftarkan", "10.0.0.1"],
    ["AUD-005", addDays(-18) + "T11:20:00Z", "investor", "CREATE", "investment", "INV-002", "Investasi Rp 100.000.000", "192.168.1.11"],
    ["AUD-006", addDays(-15) + "T16:45:00Z", "system", "UPDATE", "product", "SM-003", "Status changed to funded (target tercapai)", "10.0.0.5"],
    ["AUD-007", addDays(-10) + "T07:30:00Z", "admin", "CREATE", "distribution", "DIST-001", "Distribusi profit Q2 2026", "10.0.0.1"],
    ["AUD-008", addDays(-7) + "T13:00:00Z", "investor", "CREATE", "investment", "INV-003", "Investasi Rp 75.000.000", "192.168.1.12"],
    ["AUD-009", addDays(-3) + "T09:00:00Z", "admin", "UPDATE", "schedule", "SCH-004", "Pembayaran SCH-004 ditandai lunas", "10.0.0.1"],
    ["AUD-010", addDays(-1) + "T15:30:00Z", "system", "CREATE", "notification", "NOT-005", "Notifikasi pembayaran terkirim ke investor", "10.0.0.5"],
  ];
  await writeRange("Sukuk_Audit!A2:H11", auditData);
  console.log(`✅ ${auditData.length} audit rows written`);

  // ── 10. Notification Data (5 rows: A2:H6) ──────────────────────
  console.log("🔔 Writing notification data...");
  const notifData = [
    ["NOT-001", addDays(-1) + "T07:00:00Z", "payment", "Pembayaran Bagi Hasil", "Bagi hasil Q2 2026 sebesar Rp 12.500.000 telah dikirim ke rekening", "ahmad.fauzi@email.com", "unread", "/sukuk#distributions"],
    ["NOT-002", addDays(-2) + "T08:00:00Z", "reminder", "Jatuh Tempo Pembayaran", "Pembayaran SCH-006 akan jatuh tempo dalam 30 hari", "siti.nur@email.com", "unread", "/sukuk#schedule"],
    ["NOT-003", addDays(-3) + "T09:00:00Z", "update", "Produk Baru Tersedia", "Sukuk Mikro WI-1 sekarang sudah open untuk investasi", "all@investors.id", "read", "/sukuk#products"],
    ["NOT-004", addDays(-5) + "T10:00:00Z", "system", "Audit Log Alert", "Terdapat 10 aktivitas audit terakhir", "admin@swi.id", "read", "/sukuk#audit"],
    ["NOT-005", addDays(-7) + "T14:00:00Z", "payment", "Pencairan Dana", "Dana sebesar Rp 250.000.000 telah dicairkan untuk proyek KP-1", "budi.s@email.com", "read", "/sukuk#store"],
  ];
  await writeRange("Sukuk_Notification!A2:H6", notifData);
  console.log(`✅ ${notifData.length} notification rows written`);

  console.log("\n🎉 Sukuk Full Suite seed completed!");
  console.log("   Summary:");
  console.log("   - 5 stores");
  console.log("   - 5 investors");
  console.log("   - 3 proyeksi");
  console.log("   - 5 products");
  console.log("   - 3 creditors");
  console.log("   - 3 RAB entries");
  console.log("   - 6 schedule entries");
  console.log("   - 10 audit logs");
  console.log("   - 5 notifications");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
