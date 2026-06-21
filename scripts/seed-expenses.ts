/**
 * Seed script for Expense Approval Flow
 * - Creates Expense_Submissions sheet with headers + 5 sample rows
 * - Creates Expense_Approvers sheet with headers + 1 approver (Beriman Juliano)
 */
import {
  initializeExpenseSheets,
  appendExpenseRows,
  readExpenseSheet,
  EXPENSE_SHEETS,
} from "../src/lib/expense/sheets";

async function main() {
  console.log("🌱 Seeding expense sheets...");

  // Ensure sheets exist with headers
  await initializeExpenseSheets();
  console.log("✅ Sheets initialized");

  // Check existing data
  const existing = await readExpenseSheet(EXPENSE_SHEETS.Submissions);
  if (existing.length > 1) {
    console.log(`ℹ️  Expense_Submissions already has ${existing.length - 1} rows. Skipping seed.`);
  } else {
    // 5 sample submissions (mix status)
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);

    const submissions: (string | number)[][] = [
      [
        "EXP-001",           // Submission ID
        today,               // Date
        "Beriman Juliano",   // Submitter Name
        "SWI Grand Launch",  // Related Event
        "Sewa Booth",        // Category
        "Sewa booth utama event grand launch di Mall Taman Anggrek", // Description
        3500000,             // Amount
        "",                  // Proof URL
        "Approved",          // Status
        "Beriman Juliano",   // Reviewed By
        today,               // Reviewed Date
        "Approved — budget confirmed", // Notes
      ],
      [
        "EXP-002",
        yesterday,
        "Siti Rahmawati",
        "SWI Grand Launch",
        "Bahan Baku",
        "Pembelian bahan baku parfum edisi limited: essential oils, alcohol, botol kaca",
        2750000,
        "",
        "Approved",
        "Beriman Juliano",
        today,
        "Approved — receipt verified",
      ],
      [
        "EXP-003",
        yesterday,
        "Andi Prasetyo",
        "Bazaar Parfum Jakarta",
        "Iklan",
        "Biaya iklan Instagram & TikTok untuk promo bazaar",
        1500000,
        "",
        "Pending",
        "",
        "",
        "",
      ],
      [
        "EXP-004",
        twoDaysAgo,
        "Dewi Lestari",
        "Bazaar Parfum Jakarta",
        "Transport",
        "Ongkos kirim booth dan merchandise dari gudang ke venue",
        450000,
        "",
        "Pending",
        "",
        "",
        "",
      ],
      [
        "EXP-005",
        twoDaysAgo,
        "Rizky Firmansyah",
        "Workshop Perfumery",
        "Packaging",
        "Custom box packaging untuk workshop kit peserta (50 pcs)",
        1200000,
        "",
        "Rejected",
        "Beriman Juliano",
        yesterday,
        "Rejected — melebihi budget packaging. Revisi amount dan resubmit.",
      ],
    ];

    await appendExpenseRows(EXPENSE_SHEETS.Submissions, submissions);
    console.log(`✅ Seeded ${submissions.length} expense submissions`);
  }

  // Seed approvers
  const existingApprovers = await readExpenseSheet(EXPENSE_SHEETS.Approvers);
  if (existingApprovers.length > 1) {
    console.log(`ℹ️  Expense_Approvers already has ${existingApprovers.length - 1} rows. Skipping seed.`);
  } else {
    const approvers: (string | number)[][] = [
      [
        "APR-001",           // Approver ID
        "Beriman Juliano",   // Name
        "Direktur",          // Role
        "beriman@sensasiwangi.com", // Email
      ],
    ];

    await appendExpenseRows(EXPENSE_SHEETS.Approvers, approvers);
    console.log(`✅ Seeded ${approvers.length} approver`);
  }

  // Verify
  const finalSubmissions = await readExpenseSheet(EXPENSE_SHEETS.Submissions);
  const finalApprovers = await readExpenseSheet(EXPENSE_SHEETS.Approvers);
  console.log(`\n📊 Final state:`);
  console.log(`   Expense_Submissions: ${finalSubmissions.length - 1} data rows`);
  console.log(`   Expense_Approvers: ${finalApprovers.length - 1} data rows`);
  console.log("\n🎉 Seed complete!");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
