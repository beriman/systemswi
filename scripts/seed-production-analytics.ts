// Seed script for Production Analytics Dashboard
// Run: npx ts-node scripts/seed-production-analytics.ts
import { readRange, writeRange, appendRows } from "../src/lib/sheets/sheets-real";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function n(value: unknown): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  return Number(String(value).replace(/[^0-9.-]/g, "")) || 0;
}

async function seed() {
  console.log("🌱 Seeding Production Analytics data...\n");

  // ── 1. Ensure Production_Waste sheet has headers ──
  console.log("1. Checking Production_Waste sheet...");
  try {
    const wasteHeaders = await readRange("Production_Waste!A1:K1");
    if (!wasteHeaders || wasteHeaders.length === 0 || !wasteHeaders[0][0]) {
      await writeRange("Production_Waste!A1:K1", [[
        "Waste ID", "Date", "Production ID", "Batch Code", "Brand",
        "Product", "Qty Rejected", "Reason", "Disposition", "Cost Impact", "Notes"
      ]]);
      console.log("   ✅ Created Production_Waste headers");
    } else {
      console.log("   ✅ Production_Waste headers already exist");
    }
  } catch {
    await writeRange("Production_Waste!A1:K1", [[
      "Waste ID", "Date", "Production ID", "Batch Code", "Brand",
      "Product", "Qty Rejected", "Reason", "Disposition", "Cost Impact", "Notes"
    ]]);
    console.log("   ✅ Created Production_Waste headers");
  }

  // ── 2. Ensure Production_Targets sheet has headers ──
  console.log("2. Checking Production_Targets sheet...");
  try {
    const targetHeaders = await readRange("Production_Targets!A1:F1");
    if (!targetHeaders || targetHeaders.length === 0 || !targetHeaders[0][0]) {
      await writeRange("Production_Targets!A1:F1", [[
        "Target ID", "Brand", "Month", "Target Qty", "Actual Qty", "Achievement %"
      ]]);
      console.log("   ✅ Created Production_Targets headers");
    } else {
      console.log("   ✅ Production_Targets headers already exist");
    }
  } catch {
    await writeRange("Production_Targets!A1:F1", [[
      "Target ID", "Brand", "Month", "Target Qty", "Actual Qty", "Achievement %"
    ]]);
    console.log("   ✅ Created Production_Targets headers");
  }

  // ── 3. Check existing Brand_Production data ──
  console.log("3. Checking Brand_Production data...");
  const existingProd = await readRange("Brand_Production!A1:T1000");
  const existingCount = existingProd ? Math.max(0, existingProd.length - 1) : 0;
  console.log(`   Found ${existingCount} existing production records`);

  // ── 4. Seed 5 additional production records ──
  console.log("4. Seeding 5 additional production records...");
  const brands = [
    { id: "BRD-001", name: "Aroma Nusantara", sku: "AN-EDP-001", product: "Aroma Nusantara EDP 100ml" },
    { id: "BRD-002", name: "Sensasi Wangi", sku: "SW-EDT-002", product: "Sensasi Wangi EDT 50ml" },
    { id: "BRD-003", name: "Parfum Kebaya", sku: "PK-EDP-003", product: "Parfum Kebaya EDP 75ml" },
    { id: "BRD-004", name: "Mystic Java", sku: "MJ-EDP-004", product: "Mystic Java EDP 100ml" },
    { id: "BRD-005", name: "Floral Bali", sku: "FB-EDT-005", product: "Floral Bali EDT 50ml" },
  ];

  const months = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05"];
  const statuses = ["Completed", "Completed", "In Progress", "Completed", "QC"];
  const qcStatuses = ["Passed", "Passed", "Unchecked", "Passed", "Passed"];

  const newProductionRows: (string | number)[][] = [];
  for (let i = 0; i < 5; i++) {
    const brand = brands[i];
    const month = months[i];
    const day = String(15 + i * 3).padStart(2, "0");
    const date = `${month}-${day}`;
    const batchCode = `BATCH-${month.replace("-", "")}-${String(i + 1).padStart(3, "0")}`;
    const qty = 500 + i * 200;
    const rawMaterialCost = 15000000 + i * 3000000;
    const bottlingCost = 2000000 + i * 500000;
    const packagingCost = 3000000 + i * 750000;
    const otherCost = 1000000 + i * 250000;
    const totalCost = rawMaterialCost + bottlingCost + packagingCost + otherCost;
    const hppPerUnit = Math.round(totalCost / qty);

    newProductionRows.push([
      `PROD-${Date.now()}-${i}`, // Production ID
      date,                       // Date
      brand.name,                 // Brand (C)
      brand.sku,                  // SKU (D)
      brand.product,              // Product (E)
      batchCode,                  // Batch Code (F)
      qty,                        // Qty (G)
      "pcs",                      // Unit (H)
      rawMaterialCost,            // Raw Material Cost (I)
      bottlingCost,               // Bottling Cost (J)
      packagingCost,              // Packaging Cost (K)
      otherCost,                  // Other Cost (L)
      hppPerUnit,                 // HPP/Unit (M)
      totalCost,                  // Total Production Cost (N)
      statuses[i],                // Status (O)
      qcStatuses[i],              // QC Status (P)
      "Gudang Utama",             // Stock Location (Q)
      `Seed data - ${brand.name}`, // Notes (R)
    ]);
  }

  await appendRows("BrandProduction", newProductionRows);
  console.log(`   ✅ Added 5 production records`);

  // ── 5. Seed 3 waste events ──
  console.log("5. Seeding 3 waste events...");
  const wasteRows: (string | number)[][] = [
    [
      `W-${Date.now()}-1`, today(), newProductionRows[0][0] as string, newProductionRows[0][5] as string,
      brands[0].name, brands[0].product, 25, "QC fail - aroma off-spec", "Scrap", 2500000, "Batch rejected due to fragrance deviation"
    ],
    [
      `W-${Date.now()}-2`, today(), newProductionRows[1][0] as string, newProductionRows[1][5] as string,
      brands[1].name, brands[1].product, 10, "Packaging damage", "Rework", 500000, "Labels misaligned, rework needed"
    ],
    [
      `W-${Date.now()}-3`, today(), newProductionRows[2][0] as string, newProductionRows[2][5] as string,
      brands[2].name, brands[2].product, 5, "Leakage during filling", "Scrap", 750000, "Bottle seal failure"
    ],
  ];

  await appendRows("ProductionWaste", wasteRows);
  console.log(`   ✅ Added 3 waste events`);

  // ── 6. Seed 3 monthly production targets ──
  console.log("6. Seeding 3 monthly production targets...");
  const targetRows: (string | number)[][] = [
    [`TGT-${Date.now()}-1`, brands[0].name, "2026-01", 1000, 850, 85],
    [`TGT-${Date.now()}-2`, brands[1].name, "2026-02", 1500, 1200, 80],
    [`TGT-${Date.now()}-3`, brands[2].name, "2026-03", 800, 900, 112.5],
  ];

  await appendRows("ProductionTargets", targetRows);
  console.log(`   ✅ Added 3 production targets`);

  console.log("\n🎉 Seeding complete!");
  console.log("Summary:");
  console.log(`  - Production records: 5 added (${existingCount + 5} total)`);
  console.log(`  - Waste events: 3 added`);
  console.log(`  - Production targets: 3 added`);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
