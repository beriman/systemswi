// Seed script for Production Analytics Dashboard
// Run with: npx tsx scripts/seed-production-analytics.ts
import { appendRows, writeRange, readRanges } from "@/lib/sheets/sheets-real";

async function main() {
  console.log("🌱 Seeding Production Analytics data...\n");

  // ── 1. Create Production_Waste sheet header ──
  console.log("Setting up Production_Waste sheet header...");
  try {
    await writeRange("Production_Waste!A1:K1", [
      [
        "Waste ID", "Date", "Production ID", "Batch Code",
        "Brand", "Product", "Qty Rejected", "Reason",
        "Disposition", "Cost Impact", "Notes",
      ],
    ]);
    console.log("  ✓ Production_Waste header created");
  } catch (e: any) {
    console.log(`  ⚠ Production_Waste header may already exist: ${e.message}`);
  }

  // ── 2. Create Production_Targets sheet header ──
  console.log("Setting up Production_Targets sheet header...");
  try {
    await writeRange("Production_Targets!A1:F1", [
      ["Target ID", "Brand", "Month", "Target Qty", "Actual Qty", "Achievement %"],
    ]);
    console.log("  ✓ Production_Targets header created");
  } catch (e: any) {
    console.log(`  ⚠ Production_Targets header may already exist: ${e.message}`);
  }

  // ── 3. Seed 5 additional production records ──
  console.log("\nSeeding 5 additional production records...");
  const existingProd = await readRanges(["Brand_Production!A1:T1000"]);
  const existingCount = (existingProd["Brand_Production!A1:T1000"] || []).length - 1;
  const nextId = existingCount + 1;

  const newProductions = [
    [
      `PRD-${String(nextId).padStart(3, "0")}`, "2025-07-15", "Aroma Nusantara", "ANS-001",
      "Eau de Parfum 50ml", "EDT", "BATCH-2025-0715", "500", "ml",
      "2500000", "750000", "500000", "250000", "7500", "4000000",
      "Completed", "Passed", "Warehouse A", "",
    ],
    [
      `PRD-${String(nextId + 1).padStart(3, "0")}`, "2025-08-20", "Botanica scent ", "BOT-002",
      "Perfume Oil 30ml", "Oil", "BATCH-2025-0820", "300", "ml",
      "1800000", "450000", "350000", "150000", "8500", "2750000",
      "Completed", "Passed", "Warehouse B", "",
    ],
    [
      `PRD-${String(nextId + 2).padStart(3, "0")}`, "2025-09-10", "Celeste Perfumery", "CEL-003",
      "Body Mist 100ml", "Mist", "BATCH-2025-0910", "800", "ml",
      "3200000", "1200000", "800000", "400000", "6750", "5600000",
      "Completed", "Passed", "Warehouse A", "",
    ],
    [
      `PRD-${String(nextId + 3).padStart(3, "0")}`, "2025-10-05", "Dewi Aromatics", "DEW-004",
      "Roll-on 10ml", "RollOn", "BATCH-2025-1005", "1000", "ml",
      "1500000", "600000", "400000", "200000", "2700", "2700000",
      "In Progress", "Pending", "Production Line", "",
    ],
    [
      `PRD-${String(nextId + 4).padStart(3, "0")}`, "2025-11-18", "Essence ID", "ESS-005",
      "Perfume Set 3x30ml", "Set", "BATCH-2025-1118", "250", "sets",
      "5000000", "1500000", "1200000", "500000", "12800", "8200000",
      "Completed", "Passed", "Warehouse C", "",
    ],
  ];

  await appendRows("BrandProduction", newProductions);
  console.log(`  ✓ ${newProductions.length} production records appended`);

  // ── 4. Seed 3 waste events ──
  console.log("\nSeeding 3 waste events...");
  const wasteEvents = [
    [
      "W-001", "2025-07-20", `PRD-${String(nextId).padStart(3, "0")}`, "BATCH-2025-0715",
      "Aroma Nusantara", "Eau de Parfum 50ml", "15", "QC fail - scent off",
      "Rework", "112500", "Reblending required",
    ],
    [
      "W-002", "2025-09-15", `PRD-${String(nextId + 2).padStart(3, "0")}`, "BATCH-2025-0910",
      "Celeste Perfumery", "Body Mist 100ml", "30", "Packaging damage",
      "Scrap", "202500", "Bottle cracked during filling",
    ],
    [
      "W-003", "2025-11-20", `PRD-${String(nextId + 4).padStart(3, "0")}`, "BATCH-2025-1118",
      "Essence ID", "Perfume Set 3x30ml", "5", "Label misprint",
      "Return", "64000", "Wrong label batch",
    ],
  ];

  await appendRows("ProductionWaste", wasteEvents);
  console.log(`  ✓ ${wasteEvents.length} waste events appended`);

  // ── 5. Seed 3 monthly production targets ──
  console.log("\nSeeding 3 monthly production targets...");
  const targets = [
    ["TGT-001", "Aroma Nusantara", "2025-07", "1000", "500", "50.00%"],
    ["TGT-002", "Celeste Perfumery", "2025-09", "1500", "800", "53.33%"],
    ["TGT-003", "Essence ID", "2025-11", "500", "250", "50.00%"],
  ];

  await appendRows("ProductionTargets", targets);
  console.log(`  ✓ ${targets.length} production targets appended`);

  console.log("\n✅ All seed data completed!");
  console.log(`   - Production records: ${newProductions.length} (total now: ${existingCount + newProductions.length})`);
  console.log(`   - Waste events: ${wasteEvents.length}`);
  console.log(`   - Monthly targets: ${targets.length}`);
}

main().catch(console.error);
