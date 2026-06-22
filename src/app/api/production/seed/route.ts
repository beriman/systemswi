import { NextRequest, NextResponse } from "next/server";
import { appendRows, readRange } from "@/lib/sheets/sheets-real";

const PRODUCTION_HEADERS = [
  "Production ID", "Date", "Brand", "SKU", "Product",
  "Batch Code", "Qty", "Unit", "Raw Material Cost", "Bottling Cost",
  "Packaging Cost", "Other Cost", "HPP/Unit", "Total Production Cost",
  "Status", "QC Status", "Stock Location", "Notes", "Target HPP", "Achievement %",
];

const WASTE_HEADERS = [
  "Waste ID", "Date", "Production ID", "Batch Code", "Brand",
  "Product", "Qty Rejected", "Reason", "Disposition", "Cost Impact", "Notes",
];

const TARGETS_HEADERS = [
  "Target ID", "Brand", "Month", "Target Qty", "Actual Qty", "Achievement %",
];

// Seed 5 production records (different brands, months)
const SEED_PRODUCTION = [
  ["PROD-2026-001", "2026-01-15", "Aura Bloom", "AB-100", "Aura Bloom EDP 100ml", "BATCH-2026-01-15-1001", "500", "ml", "15000000", "5000000", "3000000", "2000000", "40000", "25000000", "Done", "Passed", "Gudang A", "First batch of the year", "40000", "100"],
  ["PROD-2026-002", "2026-02-10", "Lumière", "LM-50", "Lumière Mist 50ml", "BATCH-2026-02-10-2001", "800", "ml", "12000000", "4000000", "2500000", "1500000", "23750", "20000000", "Done", "Passed", "Gudang B", "Valentine edition", "24000", "99"],
  ["PROD-2026-003", "2026-03-20", "Noir Essence", "NE-75", "Noir Essence EDT 75ml", "BATCH-2026-03-20-3001", "300", "ml", "18000000", "6000000", "4000000", "2000000", "66667", "30000000", "Done", "Passed", "Gudang A", "Premium line", "65000", "102"],
  ["PROD-2026-004", "2026-04-05", "Aura Bloom", "AB-30", "Aura Bloom Roller 30ml", "BATCH-2026-04-05-4001", "1200", "ml", "8000000", "3000000", "2000000", "1000000", "11667", "14000000", "Done", "Passed", "Gudang A", "Travel size", "12000", "97"],
  ["PROD-2026-005", "2026-05-18", "Velvet Cloud", "VC-100", "Velvet Cloud EDP 100ml", "BATCH-2026-05-18-5001", "400", "ml", "20000000", "8000000", "5000000", "3000000", "65000", "36000000", "In Progress", "Unchecked", "Gudang C", "New launch", "60000", "0"],
];

// Seed 3 waste events
const SEED_WASTE = [
  ["W-2026-001", "2026-01-15", "PROD-2026-001", "BATCH-2026-01-15-1001", "Aura Bloom", "Aura Bloom EDP 100ml", "15", "Off-note on mixing", "Scrap", "600000", "Raw material contamination"],
  ["W-2026-002", "2026-03-20", "PROD-2026-003", "BATCH-2026-03-20-3001", "Noir Essence", "Noir Essence EDT 75ml", "8", "Packaging misalignment", "Rework", "200000", "Label repositioning needed"],
  ["W-2026-003", "2026-05-18", "PROD-2026-005", "BATCH-2026-05-18-5001", "Velvet Cloud", "Velvet Cloud EDP 100ml", "22", "Bottle crack on filling", "Scrap", "1430000", "Machine calibration issue"],
];

// Seed 3 monthly production targets
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
    // Sheet may not have headers yet — that's fine, data rows will append
  }

  // Production_Waste headers
  try {
    const existing = await readRange("Production_Waste!A1:K1");
    if (!existing || existing.length === 0 || !existing[0]?.[0]) {
      // writeRange via appendRows with headers
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

export async function POST(req: NextRequest) {
  try {
    await ensureHeaders();

    const body = await req.json().catch(() => ({}));
    const clear = body?.clear === true;

    let prodAppended = 0;
    let wasteAppended = 0;
    let targetsAppended = 0;

    // Seed production records
    if (clear) {
      // Note: clearing is a destructive operation, handled separately
    }

    // Always append seed data (Google Sheets will allow duplicates — user manages dedup)
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
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to seed production data" },
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
