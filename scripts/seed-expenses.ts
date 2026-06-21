/**
 * Seed Expense Approval Flow data into Google Sheets
 * Run with: npx tsx scripts/seed-expenses.ts
 */
import {
  initializeExpenseSheets,
  readExpenseSheet,
  appendExpenseRows,
  writeExpenseSheet,
  EXPENSE_SHEETS,
} from "../src/lib/expense/sheets";

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d: string) => d; // yyyy-mm-dd

async function main() {
  console.log("🚀 Initializing expense sheets...");
  await initializeExpenseSheets();
  console.log("✅ Sheets initialized (headers ensured).");

  // ── Check existing data ──
  const existing = await readExpenseSheet(EXPENSE_SHEETS.Submissions);
  const hasData = existing.length > 1; // row 0 = headers

  if (hasData) {
    console.log(`ℹ️  Expense_Submissions already has ${existing.length - 1} data rows. Skipping submissions seed.`);
  } else {
    // ── 5 Sample Submissions ──
    const submissions: (string | number)[][] = [
      [
        "EXP-001",
        fmtDate("2026-06-15"),
        "Siti Rahmawati",
        "Pekan Produk Lokal 2026",
        "Bahan Baku",
        "Pembelian bahan baku parfum (essential oil rose)",
        2500000,
        "",
        "Approved",
        "Beriman Juliano",
        fmtDate("2026-06-16"),
        "Approved — sesuai budget bahan Baku Q2",
      ],
      [
        "EXP-002",
        fmtDate("2026-06-17"),
        "Dwi Prasetyo",
        "Pekan Produk Lokal 2026",
        "Sewa Booth",
        "Sewa booth pameran 3 hari",
        4500000,
        "",
        "Approved",
        "Beriman Juliano",
        fmtDate("2026-06-18"),
        "Approved — sewa booth sudah termasuk meja & dekorasi",
      ],
      [
        "EXP-003",
        fmtDate("2026-06-19"),
        "Andi Kusuma",
        "Launching Parfum Nusantara",
        "Iklan",
        "Facebook & Instagram ads campaign — 2 minggu",
        1800000,
        "",
        "Pending",
        "",
        "",
        "",
      ],
      [
        "EXP-004",
        fmtDate("2026-06-20"),
        "Rina Wulandari",
        "Launching Parfum Nusantara",
        "Packaging",
        "Kotak parfum custom + stiker label",
        3200000,
        "",
        "Pending",
        "",
        "",
        "",
      ],
      [
        "EXP-005",
        fmtDate("2026-06-21"),
        "Budi Santoso",
        "Pekan Produk Lokal 2026",
        "Transport",
        "Ongkos kirim pesanan via JNE ke venue",
        750000,
        "",
        "Rejected",
        "Beriman Juliano",
        fmtDate("2026-06-21"),
        "Rejected — di bawah threshold minimum, gunakan budget logistik internal",
      ],
    ];

    await appendExpenseRows(EXPENSE_SHEETS.Submissions, submissions);
    console.log(`✅ Seeded ${submissions.length} expense submissions.`);
  }

  // ── Seed Approvers (idempotent — overwrite headers + 1 row) ──
  const approverRows: (string | number)[][] = [
    [
      "APR-001",
      "Beriman Juliano",
      "Direktur",
      "beriman@sensasiwangi.com",
    ],
  ];

  // Write approvers: headers + data (overwrite to ensure it exists)
  await writeExpenseSheet(EXPENSE_SHEETS.Approvers, [
    ["Approver ID", "Name", "Role", "Email"],
    ...approverRows,
  ]);
  console.log("✅ Seeded 1 approver: Beriman Juliano (Direktur).");

  // ── Verify ──
  const verifySubs = await readExpenseSheet(EXPENSE_SHEETS.Submissions);
  const verifyApprovers = await readExpenseSheet(EXPENSE_SHEETS.Approvers);
  console.log(`\n📊 Verification:`);
  console.log(`   Expense_Submissions: ${verifySubs.length - 1} rows (excl. header)`);
  console.log(`   Expense_Approvers:   ${verifyApprovers.length - 1} rows (excl. header)`);
  console.log(`\n🎉 Expense Approval Flow seed complete!`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
