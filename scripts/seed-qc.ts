// Seed QC data — run with: npx tsx scripts/seed-qc.ts
import {
  readQcSheet,
  parseQcRows,
  seedQcData,
} from "../src/lib/qc/sheets";

async function main() {
  console.log("🔬 QC Seed — checking existing data...");

  const rows = await readQcSheet();
  const existing = parseQcRows(rows);
  console.log(`  Found ${existing.length} existing QC results`);

  if (existing.length > 0) {
    console.log("  Existing IDs:", existing.map((r) => r.id).join(", "));
    console.log("  Skipping seed — QC_Results already has data.");
    return;
  }

  console.log("  Seeding 5 QC results (3 Pass, 1 Fail, 1 Conditional)...");
  const seeded = await seedQcData();
  console.log(`  ✅ Seeded ${seeded} QC results successfully.`);

  // Verify
  const verify = await readQcSheet();
  const parsed = parseQcRows(verify);
  console.log(`  Verification: ${parsed.length} QC results in sheet`);
  parsed.forEach((r) => {
    console.log(`    ${r.id} | ${r.batchCode} | ${r.overallScore} | ${r.status}`);
  });
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
