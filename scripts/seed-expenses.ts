// Seed script for Expense Approval Flow
import { initializeExpenseSheets, readExpenseSheet, appendExpenseRows, EXPENSE_SHEETS } from "@/lib/expense/sheets";

const sampleSubmissions = [
  ["EXP-001", "2026-06-15", "Beriman Juliano", "SWI Beauty Expo 2026", "Sewa Booth", "Sewa booth utama acara beauty expo", 5000000, "", "Approved", "Beriman Juliano", "2026-06-16", "Approved - valid expense"],
  ["EXP-002", "2026-06-17", "Siti Rahmawati", "SWI Beauty Expo 2026", "Bahan Baku", "Pembelian bahan baku parfum limited edition", 3500000, "", "Approved", "Beriman Juliano", "2026-06-18", "Approved"],
  ["EXP-003", "2026-06-19", "Ahmad Fauzi", "Marketing Campaign Q3", "Iklan", "Iklan Instagram & TikTok bulan Juli", 2000000, "", "Pending", "", "", ""],
  ["EXP-004", "2026-06-20", "Dewi Lestari", "SWI Beauty Expo 2026", "Transport", "Transportasi crew dan barang ke venue", 750000, "", "Pending", "", "", ""],
  ["EXP-005", "2026-06-14", "Rendi Pratama", "Packaging Redesign", "Packaging", "Desain dan cetak ulang packaging baru", 4200000, "", "Rejected", "Beriman Juliano", "2026-06-15", "Budget terlalu tinggi, perlu revisi"],
];

const sampleApprovers = [
  ["APR-001", "Beriman Juliano", "Direktur", "beriman@swi.id"],
];

async function main() {
  console.log("Initializing expense sheets...");
  await initializeExpenseSheets();

  // Check existing data
  const existingSubmissions = await readExpenseSheet(EXPENSE_SHEETS.Submissions);
  const existingApprovers = await readExpenseSheet(EXPENSE_SHEETS.Approvers);

  console.log(`Existing submissions: ${Math.max(0, existingSubmissions.length - 1)} rows`);
  console.log(`Existing approvers: ${Math.max(0, existingApprovers.length - 1)} rows`);

  // Seed submissions if empty (only header row)
  if (existingSubmissions.length <= 1) {
    console.log("Seeding 5 sample submissions...");
    await appendExpenseRows(EXPENSE_SHEETS.Submissions, sampleSubmissions);
    console.log("✅ 5 submissions seeded.");
  } else {
    console.log("Submissions already has data, skipping seed.");
  }

  // Seed approvers if empty
  if (existingApprovers.length <= 1) {
    console.log("Seeding 1 approver...");
    await appendExpenseRows(EXPENSE_SHEETS.Approvers, sampleApprovers);
    console.log("✅ 1 approver seeded.");
  } else {
    console.log("Approvers already has data, skipping seed.");
  }

  // Verify
  const finalSubmissions = await readExpenseSheet(EXPENSE_SHEETS.Submissions);
  const finalApprovers = await readExpenseSheet(EXPENSE_SHEETS.Approvers);
  console.log(`\n📊 Final state:`);
  console.log(`   Submissions: ${Math.max(0, finalSubmissions.length - 1)} rows`);
  console.log(`   Approvers: ${Math.max(0, finalApprovers.length - 1)} rows`);
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
