// scripts/seed-bep.mjs
// Creates BEP_Calculations sheet in Google Spreadsheet and seeds data
import { google } from "googleapis";
import fs from "fs";

const SPREADSHEET_ID = "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA";
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
  } catch (e) {
    console.error("Failed to load credentials:", e.message);
    process.exit(1);
  }
}

const creds = loadCredentials();
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

function calcBEP(fixedCost, variableCost, sellingPrice) {
  const contributionMargin = sellingPrice - variableCost;
  if (contributionMargin <= 0) {
    return { contributionMargin: 0, bepUnits: 0, bepRevenue: 0 };
  }
  const bepUnits = Math.ceil(fixedCost / contributionMargin);
  const bepRevenue = bepUnits * sellingPrice;
  return { contributionMargin, bepUnits, bepRevenue };
}

const SEED_DATA = [
  { brand: "Wangi Signature", product: "Eau de Parfum 50ml", fixedCost: 45000000, variableCostPerUnit: 85000, sellingPricePerUnit: 180000, currentSales: 320 },
  { brand: "Wangi Signature", product: "Eau de Toilette 30ml", fixedCost: 30000000, variableCostPerUnit: 45000, sellingPricePerUnit: 95000, currentSales: 480 },
  { brand: "Wangi Signature", product: "Body Mist 100ml", fixedCost: 20000000, variableCostPerUnit: 22000, sellingPricePerUnit: 55000, currentSales: 650 },
  { brand: "Aroma Nusantara", product: "Eau de Parfum 30ml", fixedCost: 35000000, variableCostPerUnit: 55000, sellingPricePerUnit: 120000, currentSales: 380 },
  { brand: "Aroma Nusantara", product: "Roll-On 10ml", fixedCost: 15000000, variableCostPerUnit: 12000, sellingPricePerUnit: 35000, currentSales: 720 },
  { brand: "Aroma Nusantara", product: "Hair Mist 50ml", fixedCost: 18000000, variableCostPerUnit: 18000, sellingPricePerUnit: 45000, currentSales: 550 },
  { brand: "Scent of SWI", product: "Mini Discovery Set", fixedCost: 25000000, variableCostPerUnit: 35000, sellingPricePerUnit: 80000, currentSales: 420 },
  { brand: "Scent of SWI", product: "Travel Size 15ml", fixedCost: 12000000, variableCostPerUnit: 20000, sellingPricePerUnit: 48000, currentSales: 380 },
  { brand: "Scent of SWI", product: "Gift Box Set", fixedCost: 40000000, variableCostPerUnit: 120000, sellingPricePerUnit: 280000, currentSales: 180 },
];

async function main() {
  // 1. Check if BEP_Calculations sheet exists
  const ss = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });

  const existingSheets = ss.data.sheets?.map((s) => s.properties?.title) || [];
  console.log("Existing sheets:", existingSheets);

  // 2. Create BEP_Calculations sheet if it doesn't exist
  if (!existingSheets.includes("BEP_Calculations")) {
    console.log("Creating BEP_Calculations sheet...");
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: "BEP_Calculations",
                gridProperties: { rowCount: 1000, columnCount: 12 },
              },
            },
          },
        ],
      },
    });
    console.log("BEP_Calculations sheet created");
  } else {
    console.log("BEP_Calculations sheet already exists");
  }

  // 3. Build seed rows
  const headers = [
    "ID", "Brand", "Product", "Fixed Cost", "Variable Cost/Unit",
    "Selling Price/Unit", "Contribution Margin", "BEP (units)",
    "BEP (revenue)", "Current Sales", "Margin of Safety", "Profit/Loss",
  ];

  const rows = [];
  let idCounter = 1;
  for (const item of SEED_DATA) {
    const { contributionMargin, bepUnits, bepRevenue } = calcBEP(
      item.fixedCost,
      item.variableCostPerUnit,
      item.sellingPricePerUnit
    );
    const marginOfSafety = item.currentSales > 0
      ? Math.round(((item.currentSales - bepUnits) / item.currentSales) * 100)
      : 0;
    const profitLoss = (item.currentSales * contributionMargin) - item.fixedCost;
    const id = `bep-${String(idCounter).padStart(4, "0")}`;
    rows.push([
      id, item.brand, item.product, item.fixedCost, item.variableCostPerUnit,
      item.sellingPricePerUnit, contributionMargin, bepUnits, bepRevenue,
      item.currentSales, marginOfSafety, profitLoss,
    ]);
    idCounter++;
  }

  const allRows = [headers, ...rows];

  // Clear existing data and write new
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: "BEP_Calculations!A:L",
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "BEP_Calculations!A1",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: allRows },
  });

  console.log(`Seeded ${rows.length} BEP calculations`);
  console.log("Brands:", [...new Set(SEED_DATA.map((d) => d.brand))].join(", "));
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
