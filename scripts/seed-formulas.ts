// Seed script: Insert 3 formula seed data into Google Sheets
// Run with: npx tsx scripts/seed-formulas.ts

import { appendRows, readRange } from "@/lib/sheets/sheets-real";

const SEED_FORMULAS = [
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
      { ingredientId: "INV-RM-001", ingredientName: "Alcohol 96%", category: "solvent", qty: 15, unitCost: 35000, supplier: "TBA", notes: "15ml × Rp 35000/liter" },
      { ingredientId: "INV-RM-003", ingredientName: "Fragrance Oil Rose", category: "oil", qty: 5, unitCost: 450000, supplier: "TBA", notes: "5ml × Rp 450000/kg" },
      { ingredientId: "INV-RM-002", ingredientName: "Fixative Base", category: "fixative", qty: 2, unitCost: 185000, supplier: "TBA", notes: "2ml × Rp 185000/kg" },
      { ingredientId: "INV-RM-004", ingredientName: "Distilled Water", category: "solvent", qty: 28, unitCost: 5000, supplier: "TBA", notes: "28ml × Rp 5000/liter" },
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
      { ingredientId: "INV-RM-001", ingredientName: "Alcohol 96%", category: "solvent", qty: 14, unitCost: 35000, supplier: "TBA", notes: "14ml × Rp 35000/liter" },
      { ingredientId: "INV-RM-005", ingredientName: "Fragrance Oil Ocean", category: "oil", qty: 6, unitCost: 480000, supplier: "TBA", notes: "6ml × Rp 480000/kg" },
      { ingredientId: "INV-RM-002", ingredientName: "Fixative Base", category: "fixative", qty: 2, unitCost: 185000, supplier: "TBA", notes: "2ml × Rp 185000/kg" },
      { ingredientId: "INV-RM-004", ingredientName: "Distilled Water", category: "solvent", qty: 8, unitCost: 5000, supplier: "TBA", notes: "8ml × Rp 5000/liter" },
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
      { ingredientId: "INV-RM-001", ingredientName: "Alcohol 96%", category: "solvent", qty: 13, unitCost: 35000, supplier: "TBA", notes: "13ml × Rp 35000/liter" },
      { ingredientId: "INV-RM-006", ingredientName: "Fragrance Oil Heritage", category: "oil", qty: 7, unitCost: 420000, supplier: "TBA", notes: "7ml × Rp 420000/kg" },
      { ingredientId: "INV-RM-002", ingredientName: "Fixative Base", category: "fixative", qty: 3, unitCost: 185000, supplier: "TBA", notes: "3ml × Rp 185000/kg" },
      { ingredientId: "INV-RM-004", ingredientName: "Distilled Water", category: "solvent", qty: 17, unitCost: 5000, supplier: "TBA", notes: "17ml × Rp 5000/liter" },
    ],
    bottlingCost: 150000,
    packagingCost: 200000,
    otherCost: 50000,
    marginPercent: 60,
  },
];

function calcCosts(formula: typeof SEED_FORMULAS[0]) {
  const ingredientCost = formula.ingredients.reduce((sum, ing) => sum + ing.qty * ing.unitCost, 0);
  const totalProduction = ingredientCost + formula.bottlingCost + formula.packagingCost + formula.otherCost;
  const hppPerUnit = totalProduction / formula.batchSize;
  const margin = formula.marginPercent / 100;
  const suggestedPrice = hppPerUnit / (1 - margin);
  return { ingredientCost, hppPerUnit, suggestedPrice };
}

async function seed() {
  const date = new Date().toISOString().slice(0, 10);

  for (const formula of SEED_FORMULAS) {
    const { ingredientCost, hppPerUnit, suggestedPrice } = calcCosts(formula);

    // 1. Append to Formula_Master
    await appendRows("FormulaMaster", [[
      formula.formulaId,
      formula.brandId,
      formula.brandName,
      formula.productName,
      formula.sku,
      formula.productType,
      formula.batchSize,
      formula.unit,
      formula.version,
      formula.status,
      date,
      date,
    ]]);

    // 2. Append ingredients
    const ingRows = formula.ingredients.map((ing) => {
      const totalCost = ing.qty * ing.unitCost;
      const pct = (ing.qty / formula.batchSize) * 100;
      return [
        formula.formulaId,
        ing.ingredientId,
        ing.ingredientName,
        ing.category,
        ing.qty,
        Math.round(pct * 100) / 100,
        ing.unitCost,
        totalCost,
        ing.supplier,
        ing.notes,
      ];
    });
    await appendRows("FormulaIngredients", ingRows);

    // 3. Append cost summary
    await appendRows("FormulaCostSummary", [[
      formula.formulaId,
      Math.round(ingredientCost),
      formula.bottlingCost,
      formula.packagingCost,
      formula.otherCost,
      Math.round(hppPerUnit),
      formula.marginPercent,
      Math.round(suggestedPrice),
      date,
    ]]);

    console.log(`✅ Seeded: ${formula.formulaId} — ${formula.productName} (HPP: Rp ${Math.round(hppPerUnit).toLocaleString("id-ID")})`);
  }

  console.log("\n🎉 All 3 formulas seeded successfully!");
}

seed().catch(console.error);
