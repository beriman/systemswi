// Seed script for Sukuk Full Suite — populates all Sukuk Google Sheets with test data
import { writeRange, readRange, appendRows } from "../src/lib/sheets/sheets-real";

const today = new Date();
function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function fmtDateTime(d: Date): string {
  return d.toISOString().slice(0, 19).replace("T", " ");
}
function dateAdd(days: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return fmtDate(d);
}

async function seedSukukInvestors() {
  console.log("📊 Seeding SukukInvestor (SukukStore!A12:O26)...");
  const HEADER = ["ID", "Nama", "Email", "Telepon", "Alamat", "NPWP", "Bank", "No Rekening", "Saldo Investasi", "Total Profit", "Status", "Consent", "Tanggal Daftar", "Catatan"];
  const investors: (string | number)[][] = [
    ["INV-001", "PT Mandiri Sejahtera", "finance@mandiri-sejahtera.co.id", "021-5551234", "Jl. Sudirman No. 45, Jakarta", "01.234.567.8-001.000", "BCA", "1234567890", 50000000, 1250000, "aktif", "1", "2025-01-15", "Investor strategis batch 1"],
    ["INV-002", "CV Berkah Wangi", "info@berkahwangi.id", "021-5552345", "Jl. Gatot Subroto No. 12, Bandung", "02.345.678.9-002.000", "Mandiri", "9876543210", 30000000, 750000, "aktif", "1", "2025-02-20", "Mitra distributor"],
    ["INV-003", "Tn. Ahmad Fauzi", "ahmad.fauzi@email.com", "0812-3456-7890", "Jl. Merdeka No. 8, Surabaya", "03.456.789.0-003.000", "BNI", "1122334455", 15000000, 375000, "aktif", "1", "2025-03-10", "Investor individu"],
    ["INV-004", "PT Parfum Nusantara", "invest@parfumnusantara.co.id", "021-5553456", "Jl. Thamrin No. 22, Jakarta", "04.567.890.1-004.000", "BRI", "5566778899", 75000000, 1875000, "aktif", "1", "2025-04-05", "Investor korporat"],
    ["INV-005", "Yayasan Wangi Abadi", "admin@wangiabadi.org", "021-5554567", "Jl. Kuningan No. 17, Jakarta", "05.678.901.2-005.000", "BCA", "9988776655", 25000000, 625000, "aktif", "1", "2025-05-12", "Yayasan sosial"],
  ];
  // Write header + data to A12:O17
  await writeRange("SukukStore!A12:O12", [HEADER]);
  await writeRange("SukukStore!A13:O17", investors);
  console.log(`   ✅ ${investors.length} investors seeded`);
}

async function seedSukukCreditors() {
  console.log("📊 Seeding SukukCreditor (Sukuk_Creditor!A1:Z20)...");
  const HEADER = ["ID", "Nama", "Email", "Telepon", "Alamat", "NPWP", "Bank", "No Rekening", "Tipe", "Plafon", "Saldo Pinjaman", "Tenor (bln)", "Bunga (%)", "Status", "Tanggal Akad", "Catatan"];
  const creditors: (string | number)[][] = [
    ["CRD-001", "Bank Syariah Mandiri", "corporate@bsm.co.id", "021-5556789", "Jl. MH Thamrin No. 5, Jakarta", "01.111.222.3-006.000", "BSM", "1001234567", "Bank", 500000000, 200000000, 24, 8.5, "aktif", "2024-06-01", "Kreditur utama sukuk"],
    ["CRD-002", "PT Pembiayaan Syariah", "info@pembiayaansyariah.co.id", "021-5557890", "Jl. Sudirman No. 88, Jakarta", "02.222.333.4-007.000", "BRI Syariah", "2001234567", "Leasing", 300000000, 150000000, 18, 9.0, "aktif", "2024-08-15", "Pembiayaan infrastruktur"],
    ["CRD-003", "Koperasi Simpan Pinjam", "ksp@ksp-wangi.id", "021-5558901", "Jl. Asia Afrika No. 33, Bandung", "03.333.444.5-008.000", "BCA", "3001234567", "Koperasi", 100000000, 50000000, 12, 7.5, "aktif", "2024-10-20", "Koperasi karyawan SWI"],
  ];
  await writeRange("Sukuk_Creditor!A1:Z1", [HEADER]);
  await writeRange("Sukuk_Creditor!A2:Z4", creditors);
  console.log(`   ✅ ${creditors.length} creditors seeded`);
}

async function seedSukukProduk() {
  console.log("📊 Seeding SukukProduk (SukukProduk!A6:L13)...");
  const HEADER = ["ID Produk", "Nama Produk", "Deskripsi", "Jenis", "Modal Dibutuhkan", "Target Investor", "Nisbah", "Status", "PIC Produk", "Tanggal Launch"];
  const products: (string | number)[][] = [
    ["SM-001", "Sukuk Wangi Parfum A", "Sukuk mikro untuk produksi parfum Wangi A — 1000 unit", "Merchandise", 50000000, 1000, "60:40", "open", "Budi Santoso", "2025-01-01"],
    ["SM-002", "Sukuk Wangi Parfum B", "Sukuk mikro untuk ekspansi produk Wangi B — 500 unit", "Produk SWI", 75000000, 500, "55:45", "open", "Siti Rahayu", "2025-02-01"],
    ["SM-003", "Sukuk Experience Store", "Pendirian experience store di 3 kota besar", "Experience", 100000000, 200, "65:35", "open", "Andi Wijaya", "2025-03-01"],
    ["SM-004", "Sukuk Bahan Baku", "Pembelian bahan baku premium untuk Q2-Q3", "Merchandise", 30000000, 300, "50:50", "funded", "Dewi Lestari", "2025-04-01"],
    ["SM-005", "Sukuk Digital Marketing", "Kampanye digital marketing parfum SWI", "Produk SWI", 20000000, 400, "60:40", "open", "Rina Putri", "2025-05-01"],
  ];
  await writeRange("SukukProduk!A6:J6", [HEADER]);
  await writeRange("SukukProduk!A7:J11", products);
  console.log(`   ✅ ${products.length} products seeded`);
}

async function seedSukukProdukProj() {
  // SukukProdukProj uses SukukProduk!A22:M34 (same sheet as products, different range)
  console.log("📊 Seeding SukukProdukProj (SukukProduk!A22:M34)...");
  const HEADER = ["ID", "Brand", "Kategori", "Harga/Unit", "Unit", "Nilai Sukuk", "Tenor (bln)", "Nisbah Inv", "Nisbah Pengelola", "Jenis Akad", "Target COGS", "Target Harga Jual", "Status"];
  const proj: (string | number)[][] = [
    ["PROJ-001", "Wangi Parfum A", "Merchandise", 50000, 1000, 50000000, 6, 60, 40, "Musyarakah", 30000, 75000, "open"],
    ["PROJ-002", "Wangi Parfum B", "Produk SWI", 150000, 500, 75000000, 12, 55, 45, "Musyarakah", 90000, 180000, "open"],
    ["PROJ-003", "Experience Store", "Experience", 500000, 200, 100000000, 12, 65, 35, "Mudharabah", 300000, 750000, "open"],
    ["PROJ-004", "Bahan Baku Premium", "Merchandise", 100000, 300, 30000000, 6, 50, 50, "Musyarakah", 60000, 130000, "funded"],
    ["PROJ-005", "Digital Marketing", "Produk SWI", 50000, 400, 20000000, 6, 60, 40, "Mudharabah", 30000, 80000, "open"],
  ];
  await writeRange("SukukProduk!A22:M27", [HEADER, ...proj]);
  console.log(`   ✅ ${proj.length} product projections seeded`);
}

async function seedSukukTermSheet() {
  // Note: Sukuk_Term_Sheet does not exist in the spreadsheet — skipping
  console.log("⏭️  SukukTermSheet — sheet not found in spreadsheet, skipping");
}

async function seedSukukPanduan() {
  // Note: SukukPanduan sheet does not exist in the spreadsheet — skipping
  console.log("⏭️  SukukPanduan — sheet not found in spreadsheet, skipping");
}

async function seedSukukRAB() {
  console.log("📊 Seeding SukukRAB (Sukuk_RAB!A1:Z30)...");
  const HEADER = ["ID", "Kategori", "Deskripsi", "Volume", "Satuan", "Harga Satuan", "Jumlah", "Realisasi", "Variance", "Status", "Catatan"];
  const rab: (string | number)[][] = [
    ["RAB-001", "Produksi", "Bahan baku parfum Wangi A", 1000, "kg", 50000, 50000000, 48000000, 2000000, "approved", "Bahan baku premium dari supplier lokal"],
    ["RAB-002", "Operasional", "Biaya produksi dan QC", 1, "lot", 25000000, 25000000, 23500000, 1500000, "approved", "Termasuk QC dan packaging"],
    ["RAB-003", "Marketing", "Kampanye pemasaran Q2", 1, "kampanye", 15000000, 15000000, 12000000, 3000000, "approved", "Digital marketing + influencer"],
  ];
  await writeRange("Sukuk_RAB!A1:K1", [HEADER]);
  await writeRange("Sukuk_RAB!A2:K4", rab);
  console.log(`   ✅ ${rab.length} RAB entries seeded`);
}

async function seedSukukSchedule() {
  console.log("📊 Seeding SukukSchedule (Sukuk_Payment_Schedule!A1:L25)...");
  const HEADER = ["ID", "Product ID", "Product Name", "Periode", "Tanggal Jatuh Tempo", "Jumlah Pokok", "Jumlah Bagi Hasil", "Total Bayar", "Status", "Tanggal Bayar", "Catatan"];
  const schedule: (string | number)[][] = [
    ["SCH-001", "SM-001", "Sukuk Wangi Parfum A", "1", dateAdd(30), 10000000, 500000, 10500000, "scheduled", "", "Pembayaran periode 1"],
    ["SCH-002", "SM-001", "Sukuk Wangi Parfum A", "2", dateAdd(60), 10000000, 500000, 10500000, "scheduled", "", "Pembayaran periode 2"],
    ["SCH-003", "SM-002", "Sukuk Wangi Parfum B", "1", dateAdd(45), 15000000, 750000, 15750000, "scheduled", "", "Pembayaran periode 1"],
    ["SCH-004", "SM-003", "Sukuk Experience Store", "1", dateAdd(90), 20000000, 1000000, 21000000, "scheduled", "", "Pembayaran periode 1"],
    ["SCH-005", "SM-004", "Sukuk Bahan Baku", "1", dateAdd(30), 6000000, 300000, 6300000, "paid", fmtDate(new Date()), "Sudah dibayar"],
    ["SCH-006", "SM-005", "Sukuk Digital Marketing", "1", dateAdd(60), 4000000, 200000, 4200000, "scheduled", "", "Pembayaran periode 1"],
  ];
  await writeRange("Sukuk_Payment_Schedule!A1:L1", [HEADER]);
  await writeRange("Sukuk_Payment_Schedule!A2:L7", schedule);
  console.log(`   ✅ ${schedule.length} schedule entries seeded`);
}

async function seedSukukAudit() {
  console.log("📊 Seeding SukukAudit (Sukuk_Audit!A1:H50)...");
  const HEADER = ["ID", "Timestamp", "User", "Action", "Entity", "Entity ID", "Details", "IP Address"];
  const now = new Date();
  const audit: (string | number)[][] = [
    ["AUD-001", fmtDateTime(new Date(now.getTime() - 86400000 * 10)), "system", "CREATE", "product", "SM-001", "Produk sukuk Wangi Parfum A dibuat", "10.0.0.1"],
    ["AUD-002", fmtDateTime(new Date(now.getTime() - 86400000 * 9)), "admin", "APPROVE", "product", "SM-001", "Produk disetujui untuk diluncurkan", "10.0.0.2"],
    ["AUD-003", fmtDateTime(new Date(now.getTime() - 86400000 * 8)), "investor", "INVEST", "investment", "INV-001", "Investasi Rp 50.000.000 oleh PT Mandiri Sejahtera", "192.168.1.10"],
    ["AUD-004", fmtDateTime(new Date(now.getTime() - 86400000 * 7)), "system", "DISTRIBUTE", "distribution", "DIST-001", "Distribusi profit periode 1 — Rp 1.250.000", "10.0.0.1"],
    ["AUD-005", fmtDateTime(new Date(now.getTime() - 86400000 * 6)), "admin", "UPDATE", "investor", "INV-002", "Data investor CV Berkah Wangi diperbarui", "10.0.0.2"],
    ["AUD-006", fmtDateTime(new Date(now.getTime() - 86400000 * 5)), "investor", "INVEST", "investment", "INV-003", "Investasi Rp 15.000.000 oleh Tn. Ahmad Fauzi", "192.168.1.11"],
    ["AUD-007", fmtDateTime(new Date(now.getTime() - 86400000 * 4)), "system", "NOTIFY", "notification", "NOTIF-001", "Notifikasi fully funded dikirim ke investor", "10.0.0.1"],
    ["AUD-008", fmtDateTime(new Date(now.getTime() - 86400000 * 3)), "admin", "CREATE", "product", "SM-002", "Produk sukuk Wangi Parfum B dibuat", "10.0.0.2"],
    ["AUD-009", fmtDateTime(new Date(now.getTime() - 86400000 * 2)), "system", "SCHEDULE", "payment", "SCH-001", "Jadwal pembayaran periode 1 dibuat", "10.0.0.1"],
    ["AUD-010", fmtDateTime(new Date(now.getTime() - 86400000 * 1)), "admin", "APPROVE", "payment", "SCH-005", "Pembayaran periode 1 Sukuk Bahan Baku disetujui", "10.0.0.2"],
  ];
  await writeRange("Sukuk_Audit!A1:H1", [HEADER]);
  await writeRange("Sukuk_Audit!A2:H11", audit);
  console.log(`   ✅ ${audit.length} audit entries seeded`);
}

async function seedSukukNotifications() {
  console.log("📊 Seeding SukukNotification (Sukuk_Notification!A1:H50)...");
  const HEADER = ["ID", "Timestamp", "Tipe", "Judul", "Pesan", "Recipient", "Read Status", "Action URL"];
  const now = new Date();
  const notifs: (string | number)[][] = [
    ["NOTIF-001", fmtDateTime(new Date(now.getTime() - 86400000 * 5)), "info", "Produk SM-001 Fully Funded", "Produk Sukuk Wangi Parfum A telah mencapai target pendanaan 100%", "all_investors", "unread", "/sukuk/products/SM-001"],
    ["NOTIF-002", fmtDateTime(new Date(now.getTime() - 86400000 * 4)), "payment", "Pembayaran Periode 1", "Pembayaran pokok + bagi hasil periode 1 akan jatuh tempo dalam 7 hari", "INV-001", "unread", "/sukuk/schedule"],
    ["NOTIF-003", fmtDateTime(new Date(now.getTime() - 86400000 * 3)), "profit", "Distribusi Profit", "Distribusi profit sebesar Rp 1.250.000 telah dikirim ke rekening", "INV-001", "read", "/sukuk/distributions"],
    ["NOTIF-004", fmtDateTime(new Date(now.getTime() - 86400000 * 2)), "new_product", "Produk Baru Tersedia", "Sukuk Experience Store sekarang terbuka untuk investasi", "all_investors", "unread", "/sukuk/register"],
    ["NOTIF-005", fmtDateTime(new Date(now.getTime() - 86400000 * 1)), "reminder", "Jatuh Tempo Pembayaran", "Pembayaran periode 2 SM-001 akan jatuh tempo dalam 3 hari", "INV-001", "unread", "/sukuk/schedule"],
  ];
  await writeRange("Sukuk_Notification!A1:H1", [HEADER]);
  await writeRange("Sukuk_Notification!A2:H6", notifs);
  console.log(`   ✅ ${notifs.length} notifications seeded`);
}

async function seedSukukProyeksi() {
  console.log("📊 Seeding SukukProyeksi (SukukStore!A29:O44)...");
  const HEADER = ["ID", "Brand", "Product ID", "Product Name", "Investasi", "Bagi Hasil Bulanan", "Return 6 Bln", "Return 12 Bln", "ROI (%)", "Payback (bln)", "NPV", "IRR (%)", "Status", "Catatan"];
  const proyeksi: (string | number)[][] = [
    ["PROY-001", "Wangi Parfum", "SM-001", "Sukuk Wangi Parfum A", 50000000, 1500000, 9000000, 18000000, 36, 3.3, 2500000, 18.5, "aktif", "Proyeksi konservatif"],
    ["PROY-002", "Wangi Parfum", "SM-002", "Sukuk Wangi Parfum B", 75000000, 2250000, 13500000, 27000000, 36, 3.3, 3750000, 19.2, "aktif", "Proyeksi moderat"],
    ["PROY-003", "Experience", "SM-003", "Sukuk Experience Store", 100000000, 3000000, 18000000, 36000000, 36, 3.3, 5000000, 20.1, "aktif", "Proyeksi optimis"],
  ];
  await writeRange("SukukStore!A29:O29", [HEADER]);
  await writeRange("SukukStore!A30:O32", proyeksi);
  console.log(`   ✅ ${proyeksi.length} proyeksi entries seeded`);
}

async function seedSukukStore() {
  console.log("📊 Seeding SukukStore (SukukStore!A4:O9)...");
  const HEADER = ["ID", "Brand", "Kategori", "Lokasi", "Revenue/Bulan", "Unit Terjual", "Avg Ticket", "Pelanggan Aktif", "Conversion (%)", "NPS", "Status", "Catatan"];
  const store: (string | number)[][] = [
    ["STO-001", "Wangi Parfum", "Retail", "Jakarta - Senayan", 25000000, 500, 50000, 1200, 3.5, 72, "aktif", "Store flagship"],
    ["STO-002", "Wangi Parfum", "Online", "Shopee Official", 15000000, 300, 50000, 800, 4.2, 78, "aktif", "Tokopedia + Shopee"],
    ["STO-003", "Experience", "Pop-up", "Bandung - Kota", 10000000, 200, 50000, 400, 5.0, 80, "aktif", "Pop-up store event"],
  ];
  await writeRange("SukukStore!A4:L4", [HEADER]);
  await writeRange("SukukStore!A5:L7", store);
  console.log(`   ✅ ${store.length} store entries seeded`);
}

async function main() {
  console.log("🚀 Starting Sukuk Full Suite seed...\n");

  try {
    await seedSukukInvestors();
    await seedSukukCreditors();
    await seedSukukProduk();
    await seedSukukProdukProj();
    await seedSukukTermSheet();
    await seedSukukPanduan();
    await seedSukukRAB();
    await seedSukukSchedule();
    await seedSukukAudit();
    await seedSukukNotifications();
    await seedSukukProyeksi();
    await seedSukukStore();

    console.log("\n✅ Sukuk Full Suite seed completed successfully!");
    console.log("📋 Summary:");
    console.log("   • 5 investors");
    console.log("   • 3 creditors");
    console.log("   • 5 products + 5 product projections");
    console.log("   • 2 term sheets");
    console.log("   • 5 panduan entries");
    console.log("   • 3 RAB entries");
    console.log("   • 6 schedule entries");
    console.log("   • 10 audit logs");
    console.log("   • 5 notifications");
    console.log("   • 3 proyeksi entries");
    console.log("   • 3 store entries");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

main();
