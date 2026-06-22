// Seed script for Production Analytics Dashboard
// Creates sheets if needed, then seeds data
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
  console.log("🌱 Seeding Production Analytics data...\n");

  const creds = loadCredentials();
  if (!creds) {
    console.error("❌ No Google credentials found");
    process.exit(1);
  }

  const oauth2 = new google.auth.OAuth2(
    creds.client_id,
    creds.client_secret,
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:1"
  );
  oauth2.setCredentials({
    refresh_token: creds.refresh_token,
    access_token: creds.access_token,
    token_type: "Bearer",
    expiry_date: creds.expiry_date,
  });

  const sheets = google.sheets({ version: "v4", auth: oauth2 });

  // ── 1. Check existing sheets ──
  const ss = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });
  const existingSheets = (ss.data.sheets || []).map(
    (s: any) => s.properties?.title || ""
  );
  console.log(`Found ${existingSheets.length} existing sheets`);

  // ── 2. Create Production_Waste sheet if needed ──
  if (!existingSheets.includes("Production_Waste")) {
    console.log("Creating Production_Waste sheet...");
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: "Production_Waste" },
            },
          },
        ],
      },
    });
    console.log("  ✓ Production_Waste sheet created");
  } else {
    console.log("  ✓ Production_Waste sheet already exists");
  }

  // ── 3. Create Production_Targets sheet if needed ──
  if (!existingSheets.includes("Production_Targets")) {
    console.log("Creating Production_Targets sheet...");
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: "Production_Targets" },
            },
          },
        ],
      },
    });
    console.log("  ✓ Production_Targets sheet created");
  } else {
    console.log("  ✓ Production_Targets sheet already exists");
  }

  // ── 4. Write headers ──
  console.log("\nWriting headers...");
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "Production_Waste!A1:K1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          "Waste ID", "Date", "Production ID", "Batch Code",
          "Brand", "Product", "Qty Rejected", "Reason",
          "Disposition", "Cost Impact", "Notes",
        ],
      ],
    },
  });
  console.log("  ✓ Production_Waste header written");

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "Production_Targets!A1:F1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [["Target ID", "Brand", "Month", "Target Qty", "Actual Qty", "Achievement %"]],
    },
  });
  console.log("  ✓ Production_Targets header written");

  // ── 5. Count existing production records ──
  const prodData = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Brand_Production!A1:T1000",
  });
  const existingCount = (prodData.data.values || []).length - 1;
  const nextId = existingCount + 1;
  console.log(`\nExisting production records: ${existingCount}, next ID: PRD-${String(nextId).padStart(3, "0")}`);

  // ── 6. Seed 5 additional production records ──
  console.log("\nSeeding 5 additional production records...");
  const newProductions = [
    [
      `PRD-${String(nextId).padStart(3, "0")}`, "2025-07-15", "Aroma Nusantara", "ANS-001",
      "Eau de Parfum 50ml", "EDT", "BATCH-2025-0715", "500", "ml",
      "2500000", "750000", "500000", "250000", "7500", "4000000",
      "Completed", "Passed", "Warehouse A", "",
    ],
    [
      `PRD-${String(nextId + 1).padStart(3, "0")}`, "2025-08-20", "Botanica Scent", "BOT-002",
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

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Brand_Production!A:T",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: newProductions },
  });
  console.log(`  ✓ ${newProductions.length} production records appended`);

  // ── 7. Seed 3 waste events ──
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

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Production_Waste!A:K",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: wasteEvents },
  });
  console.log(`  ✓ ${wasteEvents.length} waste events appended`);

  // ── 8. Seed 3 monthly production targets ──
  console.log("\nSeeding 3 monthly production targets...");
  const targets = [
    ["TGT-001", "Aroma Nusantara", "2025-07", "1000", "500", "50.00%"],
    ["TGT-002", "Celeste Perfumery", "2025-09", "1500", "800", "53.33%"],
    ["TGT-003", "Essence ID", "2025-11", "500", "250", "50.00%"],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Production_Targets!A:F",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: targets },
  });
  console.log(`  ✓ ${targets.length} production targets appended`);

  console.log("\n✅ All seed data completed!");
  console.log(`   - Production records: ${newProductions.length} (total now: ${existingCount + newProductions.length})`);
  console.log(`   - Waste events: ${wasteEvents.length}`);
  console.log(`   - Monthly targets: ${targets.length}`);
}

main().catch(console.error);
