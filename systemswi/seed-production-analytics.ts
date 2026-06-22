import { readRanges, appendRows } from "./src/lib/sheets/sheets-real";

async function main() {
  // ── 1. Check existing Brand_Production data ──
  console.log("=== Reading existing Brand_Production data ===");
  const prodData = await readRanges(["Brand_Production!A1:T10"]);
  const prodRows = prodData["Brand_Production!A1:T10"] || [];
  console.log(`Found ${prodRows.length} rows (including header)`);
  prodRows.forEach((row, i) => console.log(`  Row ${i}: ${JSON.stringify(row.slice(0, 6))}...`));

  // ── 2. Seed 5 production records ──
  console.log("\n=== Seeding 5 production records ===");
  const now = new Date();
  const productions = [
    [
      "PROD-2026-006", "2026-01-15", "Aroma Nusantara", "AR-001", "Nusantara Mist 50ml",
      "BATCH-2026-006", "500", "pcs", "2500000", "500000", "750000", "250000",
      "7000", "4000000", "Done", "Pass", "Warehouse A", "Batch Januari 2026",
    ],
    [
      "PROD-2026-007", "2026-02-20", "Sensasi Wangi", "SW-002", "Sensasi Eau de Parfum 100ml",
      "BATCH-2026-007", "300", "pcs", "4500000", "900000", "1200000", "600000",
      "22000", "7200000", "Done", "Pass", "Warehouse B", "Batch Februari 2026",
    ],
    [
      "PROD-2026-008", "2026-03-10", "Parfum Kebaya", "PK-003", "Kebaya Bloom 75ml",
      "BATCH-2026-008", "400", "pcs", "3200000", "800000", "1000000", "400000",
      "12500", "5400000", "Done", "Pass", "Warehouse A", "Batch Maret 2026",
    ],
    [
      "PROD-2026-009", "2026-04-05", "Melati Indonesia", "MI-004", "Melati Noir 50ml",
      "BATCH-2026-009", "600", "pcs", "1800000", "600000", "900000", "300000",
      "5000", "3600000", "Done", "Pass", "Warehouse C", "Batch April 2026",
    ],
    [
      "PROD-2026-010", "2026-05-18", "Kopi Wangi", "KW-005", "Kopi Oud 100ml",
      "BATCH-2026-010", "250", "pcs", "3750000", "750000", "1000000", "500000",
      "21000", "6000000", "Done", "Pass", "Warehouse B", "Batch Mei 2026",
    ],
  ];

  for (const prod of productions) {
    await appendRows("Brand_Production", [prod]);
    console.log(`  ✅ Added: ${prod[0]} - ${prod[3]} ${prod[4]}`);
  }

  // ── 3. Seed 3 waste events ──
  console.log("\n=== Seeding 3 waste events ===");
  const wasteEvents = [
    [
      "W-2026-001", "2026-02-01", "PROD-2026-001", "BATCH-2026-001", "Aroma Nusantara",
      "Nusantara Mist 50ml", "15", "QC fail - off scent", "Scrap", "105000",
      "Rejected due to fragrance deviation from standard",
    ],
    [
      "W-2026-002", "2026-03-15", "PROD-2026-003", "BATCH-2026-003", "Sensasi Wangi",
      "Sensasi EDP 100ml", "8", "Packaging damage", "Rework", "176000",
      "Bottle cap misalignment, reworked and repackaged",
    ],
    [
      "W-2026-003", "2026-04-20", "PROD-2026-005", "BATCH-2026-005", "Parfum Kebaya",
      "Kebaya Bloom 75ml", "22", "Contamination detected", "Scrap", "275000",
      "Microbial contamination in raw material batch",
    ],
  ];

  for (const waste of wasteEvents) {
    await appendRows("ProductionWaste", [waste]);
    console.log(`  ✅ Added: ${waste[0]} - ${waste[4]} ${waste[5]} (${waste[6]} pcs rejected)`);
  }

  // ── 4. Seed 3 production targets ──
  console.log("\n=== Seeding 3 production targets ===");
  const targets = [
    ["TGT-2026-001", "Aroma Nusantara", "2026-01", "500", "500", "100%"],
    ["TGT-2026-002", "Sensasi Wangi", "2026-02", "300", "300", "100%"],
    ["TGT-2026-003", "Parfum Kebaya", "2026-03", "400", "400", "100%"],
  ];

  for (const target of targets) {
    await appendRows("ProductionTargets", [target]);
    console.log(`  ✅ Added: ${target[0]} - ${target[1]} ${target[2]} (target: ${target[3]} pcs)`);
  }

  console.log("\n=== ✅ All seed data complete ===");
  console.log("Summary:");
  console.log("  - 5 production records added to Brand_Production");
  console.log("  - 3 waste events added to Production_Waste");
  console.log("  - 3 production targets added to Production_Targets");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
