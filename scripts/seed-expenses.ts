/**
 * Seed script for Expense Approval Flow
 * - Creates Expense_Submissions sheet with 5 sample rows
 * - Creates Expense_Approvers sheet with 1 approver (Beriman Juliano)
 *
 * Run: npx tsx scripts/seed-expenses.ts
 */

import {
  initializeExpenseSheets,
  readExpenseSheet,
  appendExpenseRows,
  EXPENSE_SHEETS,
} from "../src/lib/expense/sheets";

const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
const threeWeeksAgo = new Date(Date.now() - 21 * 86400000).toISOString().slice(0, 10);

const sampleSubmissions = [
  // 1. Pending — Sewa Booth for Pekan Raya Jakarta
  [
    "EXP-001",
    threeWeeksAgo,
    "Beriman Juliano",
    "Pekan Raya Jakarta 2025",
    "Sewa Booth",
    "Sewa booth utama Pekan Raya Jakarta — lantai 1 zona parfum",
    8500000,
    "",
    "Pending",
    "",
    "",
    "",
  ],
  // 2. Pending — Iklan for Launch Event
  [
    "EXP-002",
    twoWeeksAgo,
    "Wapiq",
    "Launch Event Wangi Nusantara",
    "Iklan",
    "Iklan Instagram & TikTok untuk launch event — 2 minggu campaign",
    3200000,
    "",
    "Pending",
    "",
    "",
    "",
  ],
  // 3. Approved — Transport for Pameran
  [
    "EXP-003",
    lastWeek,
    "Beriman Juliano",
    "Pameran Parfum Bandung",
    "Transport",
    "Transportasi & akomodasi tim untuk pameran parfum Bandung (3 orang, 2 hari)",
    2750000,
    "",
    "Approved",
    "Beriman Juliano",
    lastWeek,
    "Approved — within budget",
  ],
  // 4. Approved — Bahan Baku
  [
    "EXP-004",
    yesterday,
    "Wapiq",
    "Produksi Batch #047",
    "Bahan Baku",
    "Pembelian essential oil dan alcohol untuk produksi batch #047",
    5100000,
    "",
    "Approved",
    "Beriman Juliano",
    today,
    "Approved — verified with PO",
  ],
  // 5. Rejected — Packaging
  [
    "EXP-005",
    today,
    "Beriman Juliano",
    "Packaging Redesign Q3",
    "Packaging",
    "Desain ulang packaging premium line — vendor external",
    12000000,
    "",
    "Rejected",
    "Beriman Juliano",
    today,
    "Rejected — exceeds Q3 packaging budget. Revisit next quarter.",
  ],
];

const sampleApprovers = [
  [
    "APR-001",
    "Beriman Juliano",
    "Direktur",
    "beriman@swi.id",
  ],
];

async function main() {
  console.log("🌱 Seeding Expense Approval Flow data...\n");

  // Step 1: Ensure sheets exist with headers
  console.log("📋 Step 1: Initializing expense sheets...");
  await initializeExpenseSheets();
  console.log("   ✅ Sheets initialized (headers created if needed)\n");

  // Step 2: Check if submissions already have data
  console.log("📊 Step 2: Checking existing submissions...");
  const existingSubmissions = await readExpenseSheet(EXPENSE_SHEETS.Submissions);
  const hasSubmissions = existingSubmissions.length > 1; // header + data

  if (hasSubmissions) {
    console.log(`   ℹ️  Found ${existingSubmissions.length - 1} existing submission(s). Skipping submissions seed.\n`);
  } else {
    console.log("   📝 Seeding 5 sample submissions...");
    await appendExpenseRows(EXPENSE_SHEETS.Submissions, sampleSubmissions);
    console.log("   ✅ 5 submissions seeded\n");
  }

  // Step 3: Check if approvers already have data
  console.log("👤 Step 3: Checking existing approvers...");
  const existingApprovers = await readExpenseSheet(EXPENSE_SHEETS.Approvers);
  const hasApprovers = existingApprovers.length > 1;

  if (hasApprovers) {
    console.log(`   ℹ️  Found ${existingApprovers.length - 1} existing approver(s). Skipping approver seed.\n`);
  } else {
    console.log("   📝 Seeding 1 approver (Beriman Juliano)...");
    await appendExpenseRows(EXPENSE_SHEETS.Approvers, sampleApprovers);
    console.log("   ✅ 1 approver seeded\n");
  }

  // Step 4: Verify
  console.log("🔍 Step 4: Verifying seeded data...");
  const finalSubmissions = await readExpenseSheet(EXPENSE_SHEETS.Submissions);
  const finalApprovers = await readExpenseSheet(EXPENSE_SHEETS.Approvers);

  console.log(`   📊 Expense_Submissions: ${Math.max(0, finalSubmissions.length - 1)} data rows`);
  console.log(`   👤 Expense_Approvers: ${Math.max(0, finalApprovers.length - 1)} data rows`);

  // Print summary
  if (finalSubmissions.length > 1) {
    console.log("\n📋 Submission Summary:");
    for (const row of finalSubmissions.slice(1)) {
      const status = row[8] || "Pending";
      const emoji = status === "Approved" ? "✅" : status === "Rejected" ? "❌" : "🟡";
      console.log(`   ${emoji} ${row[0]} | ${row[4]} | Rp ${Number(row[6] || 0).toLocaleString("id-ID")} | ${status}`);
    }
  }

  if (finalApprovers.length > 1) {
    console.log("\n👤 Approver Summary:");
    for (const row of finalApprovers.slice(1)) {
      console.log(`   🏷️  ${row[0]} | ${row[1]} (${row[2]}) | ${row[3]}`);
    }
  }

  console.log("\n🎉 Expense Approval Flow seed complete!");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
