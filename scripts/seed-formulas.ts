/**
 * Seed script: Create Formula sheets + insert 3 seed formulas
 * Run: npx tsx scripts/seed-formulas.ts
 */
import { google } from "googleapis";
import fs from "fs";

const SPREADSHEET_ID = "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA";
const TOKEN_PATH = "/home/ubuntu/.hermes/google_token.json";

function loadCredentials() {
  const content = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
  return {
    client_id: content.client_id,
    client_secret: content.client_secret,
    refresh_token: content.refresh_token,
    access_token: content.token || content.access_token || "",
    expiry_date: content.expiry_date || content.expiry || 0,
  };
}

async function main() {
  const creds = loadCredentials();
  const oauth2 = new google.auth.OAuth2(creds.client_id, creds.client_secret, "http://localhost:1");
  oauth2.setCredentials({
    refresh_token: creds.refresh_token,
    access_token: creds.access_token,
    token_type: "Bearer",
    expiry_date: creds.expiry_date,
  });
  const sheets = google.sheets({ version: "v4", auth: oauth2 });

  // ── Step 1: Create 3 sheets if they don't exist ──
  console.log("📋 Step 1: Checking/Creating sheets...");
  const ss = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existingSheets = ss.data.sheets?.map((s) => s.properties?.title) || [];

  const sheetsToCreate = ["Formula_Master", "Formula_Ingredients", "Formula_Cost_Summary"];
  const requests = sheetsToCreate
    .filter((name) => !existingSheets.includes(name))
    .map((name) => ({ addSheet: { properties: { title: name } } }));

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests },
    });
    console.log(`  ✅ Created sheets: ${requests.map((r) => r.addSheet?.properties?.title).join(", ")}`);
  } else {
    console.log("  ✅ All 3 sheets already exist.");
  }

  // ── Step 2: Write headers ──
  console.log("\n📝 Step 2: Writing headers...");
  const date = "2026-06-22";

  const headers: Record<string, string[][]> = {
    Formula_Master: [[
      "Formula ID", "Brand ID", "Brand Name", "Product Name", "SKU",
      "Product Type", "Batch Size", "Unit", "Version", "Status", "Created", "Updated",
    ]],
    Formula_Ingredients: [[
      "Formula ID", "Ingredient ID", "Ingredient Name", "Category",
      "Qty (ml)", "%", "Unit Cost", "Total Cost", "Supplier", "Notes",
    ]],
    Formula_Cost_Summary: [[
      "Formula ID", "Ingredient Cost", "Bottling Cost", "Packaging Cost",
      "Other Cost", "Total HPP/Unit", "Margin %", "Suggested Price", "Created",
    ]],
  };

  for (const [sheetName, headerRows] of Object.entries(headers)) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: headerRows },
    });
    console.log(`  ✅ Headers written to ${sheetName}`);
  }

  // ── Step 3: Seed 3 formulas ──
  console.log("\n🧪 Step 3: Seeding 3 formulas...");

  // ── Formula 1: L'Arc~en~Scent — EDP 30ml Rose ──
  const f1Id = "F-ARC-001";
  const f1Master = [[
    f1Id, "brand-larc", "L'Arc~en~Scent", "EDP 30ml Rose", "ARC-EDP-30",
    "Perfume", 50, "ml", "v1.0", "Active", date, date,
  ]];
  const f1Ingredients = [
    [f1Id, "INV-RM-001", "Alcohol 96%", "solvent", 15, 30, 35000, 525000, "TBA", "15ml × Rp 35000/liter"],
    [f1Id, "INV-RM-003", "Fragrance Oil Rose", "oil", 5, 10, 450000, 2250000, "TBA", "5ml × Rp 450000/kg"],
    [f1Id, "INV-RM-002", "Fixative Base", "fixative", 2, 4, 185000, 370000, "TBA", "2ml × Rp 185000/kg"],
    [f1Id, "INV-RM-004", "DPG Solvent", "solvent", 10, 20, 28000, 280000, "TBA", "10ml × Rp 28000/liter"],
    [f1Id, "INV-RM-005", "Distilled Water", "other", 18, 36, 5000, 90000, "TBA", "18ml × Rp 5000/liter"],
  ];
  // ingredient_cost = 525000 + 2250000 + 370000 + 280000 + 90000 = 3515000
  // total_production = 3515000 + 150000 + 200000 + 50000 = 3915000
  // hpp_per_unit = 3915000 / 50 = 78300
  // suggested_price = 78300 / (1 - 0.60) = 195750
  const f1Cost = [[
    f1Id, 3515000, 150000, 200000, 50000, 78300, 60, 195750, date,
  ]];

  // ── Formula 2: Pixel Potion — EDP 30ml Ocean ──
  const f2Id = "F-PXL-001";
  const f2Master = [[
    f2Id, "brand-pixel", "Pixel Potion", "EDP 30ml Ocean", "PXL-EDP-30",
    "Perfume", 30, "ml", "v1.0", "Active", date, date,
  ]];
  const f2Ingredients = [
    [f2Id, "INV-RM-001", "Alcohol 96%", "solvent", 14, 28, 35000, 490000, "TBA", "14ml × Rp 35000/liter"],
    [f2Id, "INV-RM-006", "Fragrance Oil Ocean", "oil", 6, 12, 480000, 2880000, "TBA", "6ml × Rp 480000/kg"],
    [f2Id, "INV-RM-002", "Fixative Base", "fixative", 2, 4, 185000, 370000, "TBA", "2ml × Rp 185000/kg"],
    [f2Id, "INV-RM-004", "DPG Solvent", "solvent", 8, 16, 28000, 224000, "TBA", "8ml × Rp 28000/liter"],
    [f2Id, "INV-RM-005", "Distilled Water", "other", 10, 20, 5000, 50000, "TBA", "10ml × Rp 5000/liter"],
  ];
  // ingredient_cost = 490000 + 2880000 + 370000 + 224000 + 50000 = 4014000
  // total_production = 4014000 + 120000 + 180000 + 40000 = 4354000
  // hpp_per_unit = 4354000 / 30 = 145133
  // suggested_price = 145133 / (1 - 0.60) = 362833
  const f2Cost = [[
    f2Id, 4014000, 120000, 180000, 40000, 145133, 60, 362833, date,
  ]];

  // ── Formula 3: Nuscentza — EDP 30ml Heritage ──
  const f3Id = "F-NSC-001";
  const f3Master = [[
    f3Id, "brand-nuscentza", "Nuscentza", "EDP 30ml Heritage", "NSC-EDP-30",
    "Perfume", 40, "ml", "v1.0", "Active", date, date,
  ]];
  const f3Ingredients = [
    [f3Id, "INV-RM-001", "Alcohol 96%", "solvent", 13, 26, 35000, 455000, "TBA", "13ml × Rp 35000/liter"],
    [f3Id, "INV-RM-007", "Fragrance Oil Heritage", "oil", 7, 14, 520000, 3640000, "TBA", "7ml × Rp 520000/kg"],
    [f3Id, "INV-RM-002", "Fixative Base", "fixative", 3, 6, 185000, 555000, "TBA", "3ml × Rp 185000/kg"],
    [f3Id, "INV-RM-004", "DPG Solvent", "solvent", 9, 18, 28000, 252000, "TBA", "9ml × Rp 28000/liter"],
    [f3Id, "INV-RM-005", "Distilled Water", "other", 8, 16, 5000, 40000, "TBA", "8ml × Rp 5000/liter"],
  ];
  // ingredient_cost = 455000 + 3640000 + 555000 + 252000 + 40000 = 4942000
  // total_production = 4942000 + 130000 + 190000 + 45000 = 5307000
  // hpp_per_unit = 5307000 / 40 = 132675
  // suggested_price = 132675 / (1 - 0.60) = 331688
  const f3Cost = [[
    f3Id, 4942000, 130000, 190000, 45000, 132675, 60, 331688, date,
  ]];

  // ── Write all data ──
  const allMaster = [...f1Master, ...f2Master, ...f3Master];
  const allIngredients = [...f1Ingredients, ...f2Ingredients, ...f3Ingredients];
  const allCosts = [...f1Cost, ...f2Cost, ...f3Cost];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "Formula_Master!A2",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: allMaster },
  });
  console.log(`  ✅ Formula_Master: ${allMaster.length} rows`);

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "Formula_Ingredients!A2",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: allIngredients },
  });
  console.log(`  ✅ Formula_Ingredients: ${allIngredients.length} rows`);

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "Formula_Cost_Summary!A2",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: allCosts },
  });
  console.log(`  ✅ Formula_Cost_Summary: ${allCosts.length} rows`);

  console.log("\n🎉 Done! 3 formulas seeded successfully.");
  console.log("   F-ARC-001: L'Arc~en~Scent EDP 30ml Rose — HPP Rp 78.300");
  console.log("   F-PXL-001: Pixel Potion EDP 30ml Ocean — HPP Rp 145.133");
  console.log("   F-NSC-001: Nuscentza EDP 30ml Heritage — HPP Rp 132.675");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
