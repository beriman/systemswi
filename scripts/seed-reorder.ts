// Seed Auto-Reorder System data to Google Sheets
// 1. Ensure Reorder_Alerts sheet exists with headers
// 2. Ensure Goods_Receipts sheet exists with headers
// 3. Seed 3 sample POs (1 pending, 1 completed, 1 draft)
// 4. Seed 5 sample goods receipts
// 5. Set 2 Inventory_Master items below minimum

import { getAuth } from "../src/lib/sheets/sheets-real";
import { google } from "googleapis";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA";

async function main() {
  const auth = getAuth();
  const sheetsApi = google.sheets({ version: "v4", auth });
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  console.log("🌱 Seeding Auto-Reorder System data...\n");

  // ── Step 1: Check/create sheets ────────────────────────────────────
  console.log("Step 1: Checking/creating sheets...");
  const ss = await sheetsApi.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });

  const existingSheets = (ss.data.sheets || []).map((s) => s.properties?.title || "");
  const requests: any[] = [];

  const neededSheets = ["Reorder_Alerts", "Goods_Receipts"];
  for (const sheetName of neededSheets) {
    if (!existingSheets.includes(sheetName)) {
      requests.push({
        addSheet: {
          properties: { title: sheetName },
        },
      });
      console.log(`  → Creating ${sheetName} sheet`);
    } else {
      console.log(`  ✓ ${sheetName} already exists`);
    }
  }

  if (requests.length > 0) {
    await sheetsApi.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests },
    });
    console.log("  ✓ Sheets created");
  }

  // ── Step 2: Write headers ─────────────────────────────────────────
  console.log("\nStep 2: Writing headers...");

  // Check if Reorder_Alerts has data
  const reorderAlertsCheck = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Reorder_Alerts!A1:L1",
  }).catch(() => null);

  if (!reorderAlertsCheck?.data?.values?.length) {
    await sheetsApi.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "Reorder_Alerts!A1:L1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          "Alert ID", "Date", "Item ID", "Item Name", "Current Qty",
          "Min Qty", "Reorder Qty", "Supplier", "Unit Cost", "Total Cost",
          "Status", "PO Number"
        ]],
      },
    });
    console.log("  ✓ Reorder_Alerts headers written");
  } else {
    console.log("  ✓ Reorder_Alerts headers already exist");
  }

  // Check if Goods_Receipts has data
  const goodsReceiptsCheck = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Goods_Receipts!A1:J1",
  }).catch(() => null);

  if (!goodsReceiptsCheck?.data?.values?.length) {
    await sheetsApi.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "Goods_Receipts!A1:J1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          "Receipt ID", "Date", "PO Number", "Item ID", "Item Name",
          "Qty Received", "Unit Cost", "Total Cost", "Condition", "Notes"
        ]],
      },
    });
    console.log("  ✓ Goods_Receipts headers written");
  } else {
    console.log("  ✓ Goods_Receipts headers already exist");
  }

  // ── Step 3: Read Inventory_Master to find items ───────────────────
  console.log("\nStep 3: Reading Inventory_Master...");
  const invData = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Inventory_Master!A1:O100",
  });
  const invRows = invData.data.values || [];
  console.log(`  ✓ ${invRows.length - 1} inventory items found`);

  if (invRows.length < 2) {
    console.log("  ⚠️  No inventory items found. Skipping inventory seed.");
    return;
  }

  const invHeaders = invRows[0];
  console.log(`  Headers: ${invHeaders.join(", ")}`);

  // Parse inventory items
  const items = invRows.slice(1).filter((r) => r.some(Boolean)).map((row, index) => ({
    id: row[0] || row[1] || `INV-${index + 1}`,
    sku: row[1] || "",
    name: row[2] || "",
    category: row[3] || "other",
    unit: row[4] || "unit",
    qty: Number(row[5]) || 0,
    minimumQty: Number(row[6]) || 0,
    reorderQty: Number(row[7]) || 0,
    unitCost: Number(row[8]) || 0,
    supplier: row[9] || "TBA",
    location: row[10] || "TBA",
    rowNumber: index + 2,
  })).filter((item) => item.id && item.name);

  console.log(`  Parsed ${items.length} valid items`);

  // ── Step 4: Set 2 items below minimum ─────────────────────────────
  console.log("\nStep 4: Setting 2 items below minimum...");

  // Find items with decent minimum qty to set below
  const itemsWithMin = items.filter((i) => i.minimumQty > 0);
  const itemsToUpdate = itemsWithMin.slice(0, 2);

  for (const item of itemsToUpdate) {
    const newQty = Math.max(0, Math.floor(item.minimumQty * 0.3)); // Set to 30% of minimum
    const updateRange = `Inventory_Master!F${item.rowNumber}:F${item.rowNumber}`;
    await sheetsApi.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: updateRange,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[newQty]] },
    });
    console.log(`  ✓ Set "${item.name}" qty from ${item.qty} → ${newQty} (min: ${item.minimumQty})`);
  }

  if (itemsToUpdate.length < 2) {
    console.log("  ⚠️  Not enough items with minimum qty. Using first items.");
    const fallbackItems = items.slice(0, 2 - itemsToUpdate.length);
    for (const item of fallbackItems) {
      const newQty = 5;
      const updateRange = `Inventory_Master!F${item.rowNumber}:F${item.rowNumber}`;
      await sheetsApi.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: updateRange,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[newQty]] },
      });
      console.log(`  ✓ Set "${item.name}" qty → ${newQty}`);
    }
  }

  // ── Step 5: Seed 3 sample POs ─────────────────────────────────────
  console.log("\nStep 5: Seeding 3 sample Purchase Orders...");

  // Check existing POs
  const poCheck = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Purchase_Orders!A1:N1",
  }).catch(() => null);

  if (!poCheck?.data?.values?.length) {
    // Write PO headers
    await sheetsApi.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "Purchase_Orders!A1:N1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          "PO Number", "Date", "Supplier ID", "Supplier Name",
          "Item ID", "Item Name", "Quantity", "Unit",
          "Unit Cost", "Total", "Status", "Expected Date",
          "Proof URL", "Notes"
        ]],
      },
    });
    console.log("  ✓ Purchase_Orders headers written");
  }

  // Use first 3 inventory items for POs
  const poItems = items.slice(0, 3);
  const samplePOs = [
    // PO 1: pending/ordered
    [
      "PO-20260620-001", lastWeek, "SUP-001", "PT Aroma Essence Indonesia",
      poItems[0]?.id || "INV-001", poItems[0]?.name || "Essential Oil Rose",
      100, "ml", 15000, 1500000, "ordered", today,
      "", "Sample PO - pending delivery"
    ],
    // PO 2: completed/received
    [
      "PO-20260615-002", lastWeek, "SUP-002", "CV Botol Kaca Nusantara",
      poItems[1]?.id || "INV-002", poItems[1]?.name || "Botol Kaca 50ml",
      500, "pcs", 3500, 1750000, "received", yesterday,
      "", "Sample PO - already received"
    ],
    // PO 3: draft
    [
      "PO-20260622-003", today, "SUP-003", "PT Packaging Solutions",
      poItems[2]?.id || "INV-003", poItems[2]?.name || "Box Premium",
      200, "pcs", 8000, 1600000, "draft", "",
      "", "Sample PO - draft"
    ],
  ];

  await sheetsApi.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Purchase_Orders!A2:N${samplePOs.length + 1}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: samplePOs as (string | number)[][] },
  });
  console.log(`  ✓ ${samplePOs.length} sample POs seeded`);

  // ── Step 6: Seed 5 sample goods receipts ──────────────────────────
  console.log("\nStep 6: Seeding 5 sample Goods Receipts...");

  const sampleReceipts = [
    [
      "GR-20260618-001", lastWeek, "PO-20260615-002",
      poItems[1]?.id || "INV-002", poItems[1]?.name || "Botol Kaca 50ml",
      200, 3500, 700000, "Good", "First batch received - good condition"
    ],
    [
      "GR-20260619-002", yesterday, "PO-20260615-002",
      poItems[1]?.id || "INV-002", poItems[1]?.name || "Botol Kaca 50ml",
      300, 3500, 1050000, "Good", "Second batch received - completed PO"
    ],
    [
      "GR-20260617-003", lastWeek, "PO-20260615-002",
      poItems[1]?.id || "INV-002", poItems[1]?.name || "Botol Kaca 50ml",
      0, 3500, 0, "Damaged", "50 pcs damaged in transit - returned to supplier"
    ],
    [
      "GR-20260616-004", lastWeek, "PO-20260620-001",
      poItems[0]?.id || "INV-001", poItems[0]?.name || "Essential Oil Rose",
      50, 15000, 750000, "Good", "Partial delivery - 50ml received"
    ],
    [
      "GR-20260621-005", yesterday, "PO-20260620-001",
      poItems[0]?.id || "INV-001", poItems[0]?.name || "Essential Oil Rose",
      30, 15000, 450000, "Good", "Second partial delivery - 30ml received"
    ],
  ];

  await sheetsApi.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Goods_Receipts!A2:J${sampleReceipts.length + 1}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: sampleReceipts as (string | number)[][] },
  });
  console.log(`  ✓ ${sampleReceipts.length} sample goods receipts seeded`);

  // ── Step 7: Seed Reorder Alerts ───────────────────────────────────
  console.log("\nStep 7: Seeding Reorder Alerts...");

  const sampleAlerts = [
    [
      "RA-20260622-001", today, poItems[0]?.id || "INV-001",
      poItems[0]?.name || "Essential Oil Rose", 5, 50, 200,
      "PT Aroma Essence Indonesia", 15000, 3000000, "Pending PO", ""
    ],
    [
      "RA-20260622-002", today, poItems[1]?.id || "INV-002",
      poItems[1]?.name || "Botol Kaca 50ml", 10, 100, 500,
      "CV Botol Kaca Nusantara", 3500, 1750000, "PO Created", "PO-20260615-002"
    ],
  ];

  await sheetsApi.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Reorder_Alerts!A2:L${sampleAlerts.length + 1}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: sampleAlerts as (string | number)[][] },
  });
  console.log(`  ✓ ${sampleAlerts.length} reorder alerts seeded`);

  // ── Summary ──────────────────────────────────────────────────────
  console.log("\n✅ Auto-Reorder System seed complete!");
  console.log(`   Sheets created: Reorder_Alerts, Goods_Receipts`);
  console.log(`   Inventory items set below minimum: 2`);
  console.log(`   Purchase Orders: 3 (1 ordered, 1 received, 1 draft)`);
  console.log(`   Goods Receipts: 5`);
  console.log(`   Reorder Alerts: 2 (1 pending, 1 PO created)`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
