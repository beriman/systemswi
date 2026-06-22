// Seed Sales Target & Actual data to Google Sheets
// Creates sheets if they don't exist, then seeds data

import { getAuth } from "../src/lib/sheets/sheets-real";
import { google } from "googleapis";

const BRANDS = [
  { id: "brand-larc-en-scent", name: "L'Arc~en~Scent" },
  { id: "brand-pixel-potion", name: "Pixel Potion" },
  { id: "brand-nuscentza", name: "Nuscentza" },
];

const TARGET_DATA: Record<string, number[]> = {
  "brand-larc-en-scent": [5000000, 5500000, 6000000, 6500000, 7000000, 8000000],
  "brand-pixel-potion": [3000000, 3200000, 3500000, 4000000, 4500000, 5000000],
  "brand-nuscentza":   [4000000, 4200000, 4500000, 5000000, 5500000, 6000000],
};

const ACTUAL_TRANSACTIONS = [
  { date: "2026-01-05", brandIdx: 0, sku: "L'Arc~en~Scent EDP 30ml", qty: 10, price: 180000, channel: "Instagram" },
  { date: "2026-01-12", brandIdx: 0, sku: "L'Arc~en~Scent EDP 50ml", qty: 5, price: 280000, channel: "Direct" },
  { date: "2026-01-18", brandIdx: 1, sku: "Pixel Potion Discovery Set", qty: 8, price: 150000, channel: "TikTok" },
  { date: "2026-01-25", brandIdx: 2, sku: "Nuscentza EDP 30ml", qty: 12, price: 160000, channel: "Shopee" },
  { date: "2026-02-03", brandIdx: 0, sku: "L'Arc~en~Scent Travel Size", qty: 15, price: 95000, channel: "Event" },
  { date: "2026-02-10", brandIdx: 1, sku: "Pixel Potion EDP 30ml", qty: 9, price: 170000, channel: "Instagram" },
  { date: "2026-02-17", brandIdx: 2, sku: "Nuscentza Discovery Kit", qty: 7, price: 200000, channel: "Tokopedia" },
  { date: "2026-02-24", brandIdx: 2, sku: "Nuscentza EDP 50ml", qty: 4, price: 260000, channel: "Direct" },
  { date: "2026-03-02", brandIdx: 0, sku: "L'Arc~en~Scent EDP 30ml", qty: 18, price: 180000, channel: "Shopee" },
  { date: "2026-03-08", brandIdx: 1, sku: "Pixel Potion EDP 50ml", qty: 6, price: 270000, channel: "Instagram" },
  { date: "2026-03-15", brandIdx: 1, sku: "Pixel Potion Gift Set", qty: 5, price: 350000, channel: "Direct" },
  { date: "2026-03-22", brandIdx: 2, sku: "Nuscentza EDP 30ml", qty: 14, price: 160000, channel: "Instagram" },
  { date: "2026-04-01", brandIdx: 0, sku: "L'Arc~en~Scent EDP 50ml", qty: 8, price: 280000, channel: "Event" },
  { date: "2026-04-10", brandIdx: 0, sku: "L'Arc~en~Scent Perfume Oil", qty: 12, price: 120000, channel: "TikTok" },
  { date: "2026-04-18", brandIdx: 1, sku: "Pixel Potion Discovery Set", qty: 10, price: 150000, channel: "Shopee" },
  { date: "2026-04-25", brandIdx: 2, sku: "Nuscentza EDP 50ml", qty: 6, price: 260000, channel: "Direct" },
  { date: "2026-05-05", brandIdx: 0, sku: "L'Arc~en~Scent Collection Box", qty: 3, price: 550000, channel: "Direct" },
  { date: "2026-05-12", brandIdx: 1, sku: "Pixel Potion EDP 30ml", qty: 15, price: 170000, channel: "Tokopedia" },
  { date: "2026-05-20", brandIdx: 2, sku: "Nuscentza Discovery Kit", qty: 9, price: 200000, channel: "Event" },
  { date: "2026-06-01", brandIdx: 0, sku: "L'Arc~en~Scent EDP 30ml", qty: 20, price: 180000, channel: "Instagram" },
];

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA";

async function main() {
  const now = new Date().toISOString().slice(0, 10);
  const auth = getAuth();
  const sheetsApi = google.sheets({ version: "v4", auth });

  console.log("🌱 Seeding Sales Target & Actual data...\n");

  // ── Step 1: Create sheets if they don't exist ────────────────────
  console.log("Step 1: Checking/creating sheets...");
  const ss = await sheetsApi.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });

  const existingSheets = (ss.data.sheets || []).map((s) => s.properties?.title || "");
  const requests: any[] = [];

  if (!existingSheets.includes("Sales_Targets")) {
    requests.push({
      addSheet: {
        properties: { title: "Sales_Targets" },
      },
    });
    console.log("  → Creating Sales_Targets sheet");
  } else {
    console.log("  ✓ Sales_Targets already exists");
  }

  if (!existingSheets.includes("Sales_Actuals")) {
    requests.push({
      addSheet: {
        properties: { title: "Sales_Actuals" },
      },
    });
    console.log("  → Creating Sales_Actuals sheet");
  } else {
    console.log("  ✓ Sales_Actuals already exists");
  }

  if (requests.length > 0) {
    await sheetsApi.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests },
    });
    console.log("  ✓ Sheets created");
  }

  // ── Step 2: Write headers ────────────────────────────────────────
  console.log("\nStep 2: Writing headers...");
  await sheetsApi.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: [
        {
          range: "Sales_Targets!A1:K1",
          values: [[
            "Target ID", "Brand ID", "Brand Name", "Year", "Month",
            "Target Amount", "Actual Amount", "Achievement %",
            "Notes", "Created Date", "Updated Date"
          ]],
        },
        {
          range: "Sales_Actuals!A1:J1",
          values: [[
            "Actual ID", "Date", "Brand ID", "Brand Name",
            "Product/SKU", "Qty Sold", "Unit Price", "Total Revenue",
            "Channel", "Notes"
          ]],
        },
      ],
    },
  });
  console.log("  ✓ Headers written");

  // ── Step 3: Seed targets ─────────────────────────────────────────
  console.log("\nStep 3: Seeding targets (3 brands × 6 months)...");
  const targetRows: (string | number)[][] = [];
  for (const brand of BRANDS) {
    const amounts = TARGET_DATA[brand.id] || [];
    for (let month = 1; month <= 6; month++) {
      const targetAmount = amounts[month - 1] || 5000000;
      const targetId = `ST-${brand.id}-2026-${String(month).padStart(2, "0")}`;
      targetRows.push([
        targetId, brand.id, brand.name, 2026, month,
        targetAmount, 0, 0,
        `Target ${brand.name} 2026`, now, now,
      ]);
    }
  }

  await sheetsApi.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Sales_Targets!A2:K${targetRows.length + 1}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: targetRows },
  });
  console.log(`  ✓ ${targetRows.length} targets seeded`);

  // ── Step 4: Seed actuals ─────────────────────────────────────────
  console.log("\nStep 4: Seeding 20 actual sales transactions...");
  const actualRows: (string | number)[][] = ACTUAL_TRANSACTIONS.map((tx, i) => {
    const brand = BRANDS[tx.brandIdx];
    return [
      `SA-${String(i + 1).padStart(3, "0")}`,
      tx.date, brand.id, brand.name, tx.sku,
      tx.qty, tx.price, tx.qty * tx.price,
      tx.channel, `Sample sale #${i + 1}`,
    ];
  });

  await sheetsApi.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Sales_Actuals!A2:J${actualRows.length + 1}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: actualRows },
  });
  console.log(`  ✓ ${actualRows.length} actual sales seeded`);

  // ── Step 5: Compute achievement ──────────────────────────────────
  console.log("\nStep 5: Computing achievement for targets...");
  const brandMonthActual: Record<string, number> = {};
  for (const row of actualRows) {
    const date = row[1] as string;
    const parts = date.split("-");
    const month = parts[1];
    const bId = row[2] as string;
    const total = row[7] as number;
    const key = `${bId}_${month}`;
    brandMonthActual[key] = (brandMonthActual[key] || 0) + total;
  }

  const updatedTargetRows = targetRows.map((row) => {
    const bId = row[1] as string;
    const month = String(row[4] as number).padStart(2, "0");
    const targetAmt = row[5] as number;
    const key = `${bId}_${month}`;
    const actualAmt = brandMonthActual[key] || 0;
    const achievement = targetAmt > 0 ? Math.round((actualAmt / targetAmt) * 10000) / 100 : 0;
    return [...row.slice(0, 5), targetAmt, actualAmt, achievement, ...row.slice(8)];
  });

  await sheetsApi.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Sales_Targets!A2:K${updatedTargetRows.length + 1}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: updatedTargetRows },
  });
  console.log("  ✓ Achievement computed and updated");

  // ── Summary ──────────────────────────────────────────────────────
  console.log("\n✅ Seed complete!");
  console.log(`   Targets: ${targetRows.length} rows (3 brands × 6 months)`);
  console.log(`   Actuals: ${actualRows.length} transactions`);
  console.log(`   Achievement: auto-calculated per brand/month`);
}

main().catch(console.error);
