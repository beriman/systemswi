// Initialize Formula sheets in Google Sheets + seed data
// Run with: npx tsx scripts/init-formula-sheets.ts

import { getAuth } from "@/lib/sheets/sheets-real";
import { google } from "googleapis";

const SPREADSHEET_ID = "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA";

const SHEET_HEADERS: Record<string, string[]> = {
  Formula_Master: [
    "Formula ID", "Brand ID", "Brand Name", "Product Name", "SKU",
    "Product Type", "Batch Size", "Unit", "Version", "Status", "Created", "Updated",
  ],
  Formula_Ingredients: [
    "Formula ID", "Ingredient ID", "Ingredient Name", "Category",
    "Qty (ml)", "%", "Unit Cost", "Total Cost", "Supplier", "Notes",
  ],
  Formula_Cost_Summary: [
    "Formula ID", "Ingredient Cost", "Bottling Cost", "Packaging Cost",
    "Other Cost", "Total HPP/Unit", "Margin %", "Suggested Price", "Created",
  ],
};

const SEED_DATA = [
  {
    formulaId: "F-ARC-001",
    brandId: "brand-larc",
    brandName: "L'Arc~en~Scent",
    productName: "EDP 30ml Rose",
    sku: "ARC-EDP-30",
    productType: "Perfume",
    batchSize: 50,
    unit: "ml",
    version: "v1.0",
    status: "Active",
    ingredients: [
      { ingredientId: "INV-RM-001", ingredientName: "Alcohol 96%", category: "solvent", qty: 15, unitCost: 35000, supplier: "TBA", notes: "15ml x Rp 35000/liter" },
      { ingredientId: "INV-RM-003", ingredientName: "Fragrance Oil Rose", category: "oil", qty: 5, unitCost: 450000, supplier: "TBA", notes: "5ml x Rp 450000/kg" },
      { ingredientId: "INV-RM-002", ingredientName: "Fixative Base", category: "fixative", qty: 2, unitCost: 185000, supplier: "TBA", notes: "2ml x Rp 185000/kg" },
      { ingredientId: "INV-RM-004", ingredientName: "Distilled Water", category: "solvent", qty: 28, unitCost: 5000, supplier: "TBA", notes: "28ml x Rp 5000/liter" },
    ],
    bottlingCost: 150000,
    packagingCost: 200000,
    otherCost: 50000,
    marginPercent: 60,
  },
  {
    formulaId: "F-PXL-001",
    brandId: "brand-pixel",
    brandName: "Pixel Potion",
    productName: "EDP 30ml Ocean",
    sku: "PXL-EDP-30",
    productType: "Perfume",
    batchSize: 30,
    unit: "ml",
    version: "v1.0",
    status: "Active",
    ingredients: [
      { ingredientId: "INV-RM-001", ingredientName: "Alcohol 96%", category: "solvent", qty: 14, unitCost: 35000, supplier: "TBA", notes: "14ml x Rp 35000/liter" },
      { ingredientId: "INV-RM-005", ingredientName: "Fragrance Oil Ocean", category: "oil", qty: 6, unitCost: 480000, supplier: "TBA", notes: "6ml x Rp 480000/kg" },
      { ingredientId: "INV-RM-002", ingredientName: "Fixative Base", category: "fixative", qty: 2, unitCost: 185000, supplier: "TBA", notes: "2ml x Rp 185000/kg" },
      { ingredientId: "INV-RM-004", ingredientName: "Distilled Water", category: "solvent", qty: 8, unitCost: 5000, supplier: "TBA", notes: "8ml x Rp 5000/liter" },
    ],
    bottlingCost: 150000,
    packagingCost: 200000,
    otherCost: 50000,
    marginPercent: 60,
  },
  {
    formulaId: "F-NUS-001",
    brandId: "brand-nuscentza",
    brandName: "Nuscentza",
    productName: "EDP 30ml Heritage",
    sku: "NUS-EDP-30",
    productType: "Perfume",
    batchSize: 40,
    unit: "ml",
    version: "v1.0",
    status: "Active",
    ingredients: [
      { ingredientId: "INV-RM-001", ingredientName: "Alcohol 96%", category: "solvent", qty: 13, unitCost: 35000, supplier: "TBA", notes: "13ml x Rp 35000/liter" },
      { ingredientId: "INV-RM-006", ingredientName: "Fragrance Oil Heritage", category: "oil", qty: 7, unitCost: 420000, supplier: "TBA", notes: "7ml x Rp 420000/kg" },
      { ingredientId: "INV-RM-002", ingredientName: "Fixative Base", category: "fixative", qty: 3, unitCost: 185000, supplier: "TBA", notes: "3ml x Rp 185000/kg" },
      { ingredientId: "INV-RM-004", ingredientName: "Distilled Water", category: "solvent", qty: 17, unitCost: 5000, supplier: "TBA", notes: "17ml x Rp 5000/liter" },
    ],
    bottlingCost: 150000,
    packagingCost: 200000,
    otherCost: 50000,
    marginPercent: 60,
  },
];

function calcCosts(formula: typeof SEED_DATA[0]) {
  const ingredientCost = formula.ingredients.reduce((s, i) => s + i.qty * i.unitCost, 0);
  const totalProduction = ingredientCost + formula.bottlingCost + formula.packagingCost + formula.otherCost;
  const hppPerUnit = totalProduction / formula.batchSize;
  const margin = formula.marginPercent / 100;
  const suggestedPrice = hppPerUnit / (1 - margin);
  return { ingredientCost, hppPerUnit, suggestedPrice };
}

async function main() {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  // 1. Check existing sheets
  const ss = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existingSheets = (ss.data.sheets || []).map((s) => s.properties?.title || "");

  // 2. Create missing sheets with headers
  const sheetsToCreate: string[] = [];
  for (const [sheetName, headers] of Object.entries(SHEET_HEADERS)) {
    if (!existingSheets.includes(sheetName)) {
      sheetsToCreate.push(sheetName);
    } else {
      console.log(`ℹ️ Sheet "${sheetName}" already exists, skipping creation.`);
    }
  }

  if (sheetsToCreate.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: sheetsToCreate.map((sheetName) => ({
          addSheet: {
            properties: { title: sheetName },
          },
        })),
      },
    });
    console.log(`✅ Created sheets: ${sheetsToCreate.join(", ")}`);
  }

  // 3. Write headers for newly created sheets
  for (const sheetName of sheetsToCreate) {
    const headers = SHEET_HEADERS[sheetName];
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [headers] },
    });
    console.log(`✅ Headers written for ${sheetName}`);
  }

  // 4. Check if data already exists
  const masterCheck = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Formula_Master!A2:A10",
  });
  const existingRows = (masterCheck.data.values || []).filter((r) => r[0]);

  if (existingRows.length > 0) {
    console.log(`\n⚠️ Formula_Master already has ${existingRows.length} row(s). Skipping seed data.`);
    console.log("   Delete existing rows first if you want to re-seed.");
    return;
  }

  // 5. Seed data
  const date = new Date().toISOString().slice(0, 10);

  for (const formula of SEED_DATA) {
    const { ingredientCost, hppPerUnit, suggestedPrice } = calcCosts(formula);

    // Master
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Formula_Master!A:L",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          formula.formulaId, formula.brandId, formula.brandName,
          formula.productName, formula.sku, formula.productType,
          formula.batchSize, formula.unit, formula.version,
          formula.status, date, date,
        ]],
      },
    });

    // Ingredients
    const ingRows = formula.ingredients.map((ing) => {
      const totalCost = ing.qty * ing.unitCost;
      const pct = (ing.qty / formula.batchSize) * 100;
      return [
        formula.formulaId, ing.ingredientId, ing.ingredientName,
        ing.category, ing.qty, Math.round(pct * 100) / 100,
        ing.unitCost, totalCost, ing.supplier, ing.notes,
      ];
    });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Formula_Ingredients!A:J",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: ingRows },
    });

    // Cost Summary
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Formula_Cost_Summary!A:I",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          formula.formulaId, Math.round(ingredientCost), formula.bottlingCost,
          formula.packagingCost, formula.otherCost, Math.round(hppPerUnit),
          formula.marginPercent, Math.round(suggestedPrice), date,
        ]],
      },
    });

    console.log(`✅ Seeded: ${formula.formulaId} — ${formula.productName} (HPP: Rp ${Math.round(hppPerUnit).toLocaleString("id-ID")})`);
  }

  console.log("\n🎉 All 3 formulas seeded successfully!");
  console.log("   Sheets: Formula_Master, Formula_Ingredients, Formula_Cost_Summary");
}

main().catch((err) => {
  console.error("❌ Error:", err.message || err);
  process.exit(1);
});
