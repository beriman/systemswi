import { NextResponse } from "next/server";
import { appendRows, readRange } from "@/lib/sheets/sheets-real";

// Brand_Production actual schema (20 columns):
// 0: Production ID, 1: Date, 2: Brand ID, 3: Brand Name, 4: SKU,
// 5: Product Name, 6: Product Type, 7: Batch Code, 8: Qty Produced,
// 9: Unit, 10: Raw Material Cost, 11: Bottling Cost, 12: Packaging Cost,
// 13: Other Cost, 14: HPP/Unit, 15: Total Production Cost, 16: Status,
// 17: QC Status, 18: Stock Location, 19: Notes

const PRODUCTION_HEADERS = [
  "Production ID", "Date", "Brand ID", "Brand Name", "SKU",
  "Product Name", "Product Type", "Batch Code", "Qty Produced", "Unit",
  "Raw Material Cost", "Bottling Cost", "Packaging Cost", "Other Cost",
  "HPP / Unit", "Total Production Cost", "Status", "QC Status",
  "Stock Location", "Notes",
];

const WASTE_HEADERS = [
  "Waste ID", "Date", "Production ID", "Batch Code", "Brand",
  "Product", "Qty Rejected", "Reason", "Disposition", "Cost Impact", "Notes",
];

const TARGETS_HEADERS = [
  "Target ID", "Brand", "Month", "Target Qty", "Actual Qty", "Achievement %",
];

// 5 additional production records (different brands, months) — 2026 data
const SEED_PRODUCTION = [
  ["PROD-2026-001", "2026-01-15", "brand-aura-bloom", "Aura Bloom", "AB-EDP-100", "Aura Bloom EDP 100ml", "EDP", "BATCH-2026-01-15-1001", "500", "ml", "15000000", "5000000", "3000000", "2000000", "40000", "25000000", "Done", "Passed", "Gudang A", "First batch of the year"],
  ["PROD-2026-002", "2026-02-10", "brand-lumiere", "Lumière", "LM-MIST-50", "Lumière Mist 50ml", "Mist", "BATCH-2026-02-10-2001", "800", "ml", "12000000", "4000000", "2500000", "1500000", "23750", "20000000", "Done", "Passed", "Gudang B", "Valentine edition"],
  ["PROD-2026-003", "2026-03-20", "brand-noir-essence", "Noir Essence", "NE-EDT-75", "Noir Essence EDT 75ml", "EDT", "BATCH-2026-03-20-3001", "300", "ml", "18000000", "6000000", "4000000", "2000000", "66667", "30000000", "Done", "Passed", "Gudang A", "Premium line"],
  ["PROD-2026-004", "2026-04-05", "brand-aura-bloom", "Aura Bloom", "AB-ROLL-30", "Aura Bloom Roller 30ml", "Roll-on", "BATCH-2026-04-05-4001", "1200", "ml", "8000000", "3000000", "2000000", "1000000", "11667", "14000000", "Done", "Passed", "Gudang A", "Travel size"],
  ["PROD-2026-005", "2026-05-18", "brand-velvet-cloud", "Velvet Cloud", "VC-EDP-100", "Velvet Cloud EDP 100ml", "EDP", "BATCH-2026-05-18-5001", "400", "ml", "20000000", "8000000", "5000000", "3000000", "65000", "36000000", "In Progress", "Unchecked", "Gudang C", "New launch"],
];

// 3 additional waste events
const SEED_WASTE = [
  ["W-2026-001", "2026-01-15", "PROD-2026-001", "BATCH-2026-01-15-1001", "Aura Bloom", "Aura Bloom EDP 100ml", "15", "Off-note on mixing", "Scrap", "600000", "Raw material contamination"],
  ["W-2026-002", "2026-03-20", "PROD-2026-003", "BATCH-2026-03-20-3001", "Noir Essence", "Noir Essence EDT 75ml", "8", "Packaging misalignment", "Rework", "200000", "Label repositioning needed"],
  ["W-2026-003", "2026-05-18", "PROD-2026-005", "BATCH-2026-05-18-5001", "Velvet Cloud", "Velvet Cloud EDP 100ml", "22", "Bottle crack on filling", "Scrap", "1430000", "Machine calibration issue"],
];

// 3 monthly production targets
const SEED_TARGETS = [
  ["TGT-2026-001", "Aura Bloom", "2026-01", "500", "500", "100.00"],
  ["TGT-2026-002", "Lumière", "2026-02", "800", "800", "100.00"],
  ["TGT-2026-003", "Noir Essence", "2026-03", "300", "300", "100.00"],
];

async function ensureHeaders() {
  // Brand_Production headers
  try {
    const existing = await readRange("Brand_Production!A1:T1");
    if (!existing || existing.length === 0 || !existing[0]?.[0]) {
      await appendRows("Brand_Production", [PRODUCTION_HEADERS]);
    }
  } catch {
    // Sheet may not have headers yet
  }

  // Production_Waste headers
  try {
    const existing = await readRange("Production_Waste!A1:K1");
    if (!existing || existing.length === 0 || !existing[0]?.[0]) {
      const { writeRange } = await import("@/lib/sheets/sheets-real");
      await writeRange("Production_Waste!A1:K1", [WASTE_HEADERS]);
    }
  } catch {
    // ignore
  }

  // Production_Targets headers
  try {
    const existing = await readRange("Production_Targets!A1:F1");
    if (!existing || existing.length === 0 || !existing[0]?.[0]) {
      const { writeRange } = await import("@/lib/sheets/sheets-real");
      await writeRange("Production_Targets!A1:F1", [TARGETS_HEADERS]);
    }
  } catch {
    // ignore
  }
}

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await ensureHeaders();

    let prodAppended = 0;
    let wasteAppended = 0;
    let targetsAppended = 0;

    // Append seed data (Google Sheets allows duplicates — user manages dedup)
    await appendRows("BrandProduction", SEED_PRODUCTION);
    prodAppended = SEED_PRODUCTION.length;

    await appendRows("ProductionWaste", SEED_WASTE);
    wasteAppended = SEED_WASTE.length;

    await appendRows("ProductionTargets", SEED_TARGETS);
    targetsAppended = SEED_TARGETS.length;

    return NextResponse.json({
      success: true,
      seeded: {
        production: prodAppended,
        waste: wasteAppended,
        targets: targetsAppended,
      },
      totalRows: prodAppended + wasteAppended + targetsAppended,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to seed production data";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Production Analytics Seed Endpoint",
    usage: "POST to seed sample data (5 production records, 3 waste events, 3 targets)",
  });
}
