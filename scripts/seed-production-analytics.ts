// Seed Production Analytics data directly to Google Sheets
// - 5 additional production records in Brand_Production
// - 3 waste events in Production_Waste
// - 3 monthly production targets in Production_Targets
import { google } from "googleapis";
import fs from "fs";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA";
const TOKEN_PATH = "/home/ubuntu/.hermes/google_token.json";

function loadCredentials() {
  try {
    const content = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
    return {
      client_id: content.client_id,
      client_secret: content.client_secret,
      refresh_token: content.refresh_token,
      access_token: content.token || content.access_token || "",
      expiry_date: content.expiry_date || content.expiry || 0,
    };
  } catch {
    return null;
  }
}

async function main() {
  const creds = loadCredentials();
  if (!creds) {
    console.error("No Google credentials found");
    process.exit(1);
  }

  const oauth2 = new google.auth.OAuth2(
    creds.client_id,
    creds.client_secret,
    "http://localhost:1"
  );
  oauth2.setCredentials({
    refresh_token: creds.refresh_token,
    access_token: creds.access_token,
    token_type: "Bearer",
    expiry_date: creds.expiry_date,
  });

  const sheets = google.sheets({ version: "v4", auth: oauth2 });

  // ── Check existing sheets ──
  const ss = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });
  const existingSheets = ss.data.sheets?.map((s: any) => s.properties?.title) || [];
  console.log("Existing sheets:", existingSheets.join(", "));

  // ── 1. Ensure Production_Waste sheet exists with headers ──
  if (!existingSheets.includes("Production_Waste")) {
    console.log("Creating Production_Waste sheet...");
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: "Production_Waste" } } }],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "Production_Waste!A1:K1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          "Waste ID", "Date", "Production ID", "Batch Code", "Brand",
          "Product", "Qty Rejected", "Reason", "Disposition", "Cost Impact", "Notes",
        ]],
      },
    });
    console.log("✅ Production_Waste sheet created with headers");
  } else {
    console.log("Production_Waste sheet already exists");
  }

  // ── 2. Ensure Production_Targets sheet exists with headers ──
  if (!existingSheets.includes("Production_Targets")) {
    console.log("Creating Production_Targets sheet...");
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: "Production_Targets" } } }],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "Production_Targets!A1:F1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          "Target ID", "Brand", "Month", "Target Qty", "Actual Qty", "Achievement %",
        ]],
      },
    });
    console.log("✅ Production_Targets sheet created with headers");
  } else {
    console.log("Production_Targets sheet already exists");
  }

  // ── 3. Seed 5 additional production records in Brand_Production ──
  const { data: brandProdData } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Brand_Production!A:T",
  });
  const existingProdRows = brandProdData.values || [];
  const existingProdCount = existingProdRows.length > 1 ? existingProdRows.length - 1 : 0;
  console.log(`Brand_Production has ${existingProdCount} existing data rows`);

  // Brand_Production columns:
  // A: Production ID, B: Date, C: Brand, D: SKU, E: Product,
  // F: Batch Code, G: Qty, H: Unit, I: Raw Material Cost, J: Bottling Cost,
  // K: Packaging Cost, L: Other Cost, M: HPP/Unit, N: Total Production Cost,
  // O: Status, P: QC Status, Q: Stock Location, R: Notes, S: Created At, T: Updated At

  const newProductionRecords = [
    [
      "PROD-006", "2026-01-15", "Aroma Nusantara", "AROMA-50ML", "Eau de Parfum 50ml",
      "BATCH-2601-A", 500, "ml", 15000000, 2500000, 3000000, 1500000, 43000, 22000000,
      "Completed", "Pass", "Gudang A", "Batch Januari 2026", "2026-01-15", "2026-01-15",
    ],
    [
      "PROD-007", "2026-02-20", "Scent Nusantara", "SCENT-30ML", "Eau de Toilette 30ml",
      "BATCH-2602-B", 800, "ml", 18000000, 3200000, 3500000, 1800000, 33125, 26500000,
      "Completed", "Pass", "Gudang B", "Batch Februari 2026", "2026-02-20", "2026-02-20",
    ],
    [
      "PROD-008", "2026-03-10", "Wangi Indonesia", "WANGI-100ML", "Perfume Oil 100ml",
      "BATCH-2603-C", 300, "ml", 12000000, 1800000, 2200000, 1000000, 50000, 17000000,
      "Completed", "Pass", "Gudang A", "Batch Maret 2026", "2026-03-10", "2026-03-10",
    ],
    [
      "PROD-009", "2026-04-05", "Aroma Nusantara", "AROMA-100ML", "Eau de Parfum 100ml",
      "BATCH-2604-D", 600, "ml", 24000000, 4000000, 4500000, 2000000, 50833, 34500000,
      "In Progress", "Pending", "Gudang C", "Batch April 2026", "2026-04-05", "2026-04-05",
    ],
    [
      "PROD-010", "2026-05-18", "Scent Nusantara", "SCENT-50ML", "Body Mist 50ml",
      "BATCH-2605-E", 1000, "ml", 10000000, 2000000, 2500000, 1200000, 15700, 15700000,
      "Completed", "Pass", "Gudang B", "Batch Mei 2026", "2026-05-18", "2026-05-18",
    ],
  ];

  // Only append if we have fewer than 6 data rows (to avoid duplicates)
  if (existingProdCount < 6) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Brand_Production!A:T",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: newProductionRecords },
    });
    console.log(`✅ Seeded ${newProductionRecords.length} production records`);
  } else {
    console.log("Brand_Production already has sufficient data. Skipping production seed.");
  }

  // ── 4. Seed 3 waste events in Production_Waste ──
  const { data: wasteData } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Production_Waste!A:K",
  });
  const existingWasteRows = wasteData.values || [];
  const existingWasteCount = existingWasteRows.length > 1 ? existingWasteRows.length - 1 : 0;
  console.log(`Production_Waste has ${existingWasteCount} existing data rows`);

  const wasteEvents = [
    [
      "W-001", "2026-02-05", "PROD-006", "BATCH-2601-A", "Aroma Nusantara",
      "Eau de Parfum 50ml", 25, "QC fail — off-spec fragrance concentration", "Scrap", 575000,
      "Rejected during QC testing — fragrance too weak",
    ],
    [
      "W-002", "2026-03-22", "PROD-008", "BATCH-2603-C", "Wangi Indonesia",
      "Perfume Oil 100ml", 12, "Packaging damage during bottling", "Rework", 600000,
      "Bottles cracked during filling — rework with new bottles",
    ],
    [
      "W-003", "2026-05-30", "PROD-010", "BATCH-2605-E", "Scent Nusantara",
      "Body Mist 50ml", 40, "Contamination — foreign particles detected", "Scrap", 628000,
      "Batch contaminated — full disposal required",
    ],
  ];

  if (existingWasteCount === 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Production_Waste!A:K",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: wasteEvents },
    });
    console.log(`✅ Seeded ${wasteEvents.length} waste events`);
  } else {
    console.log("Production_Waste already has data. Skipping waste seed.");
  }

  // ── 5. Seed 3 monthly production targets in Production_Targets ──
  const { data: targetsData } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Production_Targets!A:F",
  });
  const existingTargetsRows = targetsData.values || [];
  const existingTargetsCount = existingTargetsRows.length > 1 ? existingTargetsRows.length - 1 : 0;
  console.log(`Production_Targets has ${existingTargetsCount} existing data rows`);

  // Production_Targets columns:
  // A: Target ID, B: Brand, C: Month, D: Target Qty, E: Actual Qty, F: Achievement %
  const targets = [
    ["TGT-001", "Aroma Nusantara", "2026-01", 500, 500, 100],
    ["TGT-002", "Scent Nusantara", "2026-02", 800, 800, 100],
    ["TGT-003", "Wangi Indonesia", "2026-03", 300, 300, 100],
  ];

  if (existingTargetsCount === 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Production_Targets!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: targets },
    });
    console.log(`✅ Seeded ${targets.length} production targets`);
  } else {
    console.log("Production_Targets already has data. Skipping targets seed.");
  }

  console.log("\n🎉 Production Analytics seed complete!");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
