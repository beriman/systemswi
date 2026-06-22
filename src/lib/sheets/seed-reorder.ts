// Seed script for Auto-Reorder System
// Run with: npx tsx src/lib/sheets/seed-reorder.ts

import { readRange, writeRange, appendRows } from "./sheets-real";

async function seed() {
  console.log("🌱 Seeding Auto-Reorder System data...\n");

  // 1. Check/create Reorder_Alerts sheet headers
  try {
    const existing = await readRange("Reorder_Alerts!A1:L1");
    if (existing.length === 0 || !existing[0]?.length) {
      console.log("Creating Reorder_Alerts headers...");
      await writeRange("Reorder_Alerts!A1:L1", [[
        "Alert ID", "Date", "Item ID", "Item Name", "Current Qty",
        "Min Qty", "Reorder Qty", "Supplier", "Unit Cost", "Total Cost",
        "Status", "PO Number",
      ]]);
      console.log("✅ Reorder_Alerts headers created");
    } else {
      console.log("✅ Reorder_Alerts sheet already has headers");
    }
  } catch {
    console.log("Creating Reorder_Alerts sheet with headers...");
    await writeRange("Reorder_Alerts!A1:L1", [[
      "Alert ID", "Date", "Item ID", "Item Name", "Current Qty",
      "Min Qty", "Reorder Qty", "Supplier", "Unit Cost", "Total Cost",
      "Status", "PO Number",
    ]]);
    console.log("✅ Reorder_Alerts headers created");
  }

  // 2. Check/create Goods_Receipts sheet headers
  try {
    const existing = await readRange("Goods_Receipts!A1:J1");
    if (existing.length === 0 || !existing[0]?.length) {
      console.log("Creating Goods_Receipts headers...");
      await writeRange("Goods_Receipts!A1:J1", [[
        "Receipt ID", "Date", "PO Number", "Item ID", "Item Name",
        "Qty Received", "Unit Cost", "Total Cost", "Condition", "Notes",
      ]]);
      console.log("✅ Goods_Receipts headers created");
    } else {
      console.log("✅ Goods_Receipts sheet already has headers");
    }
  } catch {
    console.log("Creating Goods_Receipts sheet with headers...");
    await writeRange("Goods_Receipts!A1:J1", [[
      "Receipt ID", "Date", "PO Number", "Item ID", "Item Name",
      "Qty Received", "Unit Cost", "Total Cost", "Condition", "Notes",
    ]]);
    console.log("✅ Goods_Receipts headers created");
  }

  // 3. Read Inventory_Master to find items
  const invRows = await readRange("Inventory_Master!A1:O1000");
  const items = invRows.slice(1).filter((r) => r.some(Boolean));
  console.log(`\n📦 Found ${items.length} inventory items`);

  // 4. Set 2 items below minimum for demo
  if (items.length >= 2) {
    // Set first item qty to 0 (below minimum)
    const item1 = items[0];
    const row1 = invRows.indexOf(item1);
    console.log(`\nSetting item ${item1[2] || item1[0]} qty to 0 (was ${item1[5]})...`);
    await writeRange(`Inventory_Master!F${row1 + 1}`, [["0"]]);

    // Set second item qty to half of minimum
    const item2 = items[1];
    const minQty2 = Number(item2[6]) || 10;
    const row2 = invRows.indexOf(item2);
    const halfMin = Math.floor(minQty2 / 2);
    console.log(`Setting item ${item2[2] || item2[0]} qty to ${halfMin} (min: ${minQty2})...`);
    await writeRange(`Inventory_Master!F${row2 + 1}`, [[String(halfMin)]]);

    console.log("✅ 2 items set below minimum for demo");
  }

  // 5. Add sample PO data
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Check existing POs
  const poRows = await readRange("Purchase_Orders!A1:N1000");
  const existingPOs = poRows.slice(1).filter((r) => r.some(Boolean));

  if (existingPOs.length === 0) {
    console.log("\n📋 Adding sample Purchase Orders...");

    // Get supplier info
    const supRows = await readRange("Supplier_Master!A1:J1000");
    const suppliers = supRows.slice(1).filter((r) => r.some(Boolean));
    const sup1 = suppliers[0] || ["SUP-001", "PT Kimia Farma", "TBA", "TBA", "TBA", "7", "4", "active", "", ""];
    const sup2 = suppliers[1] || ["SUP-002", "PT Packaging Indo", "TBA", "TBA", "TBA", "5", "3", "active", "", ""];

    // Get item info
    const invItems = invRows.slice(1).filter((r) => r.some(Boolean));
    const inv1 = invItems[0] || ["INV-001", "RM-ALC-96", "Alcohol 96%", "raw_material", "liter", "0", "50", "100", "25000", "PT Kimia Farma", "Gudang A", "empty", "", "", ""];
    const inv2 = invItems[1] || ["INV-002", "PK-BTL-500", "Botol 500ml", "packaging", "pcs", "5", "100", "200", "3500", "PT Packaging Indo", "Gudang B", "critical", "", "", ""];

    const samplePOs = [
      // 1 pending PO
      [`PO-${today.replace(/-/g, "")}-001`, today, sup1[0], sup1[1], inv1[0], inv1[2], "100", "liter", "25000", "2500000", "ordered", today, "", "Sample pending PO"],
      // 1 completed PO
      [`PO-${yesterday.replace(/-/g, "")}-001`, yesterday, sup2[0], sup2[1], inv2[0], inv2[2], "200", "pcs", "3500", "700000", "received", yesterday, "", "Sample completed PO"],
      // 1 draft PO
      [`PO-${today.replace(/-/g, "")}-002`, today, sup1[0], sup1[1], inv1[0], inv1[2], "50", "liter", "25000", "1250000", "draft", "", "", "Sample draft PO"],
    ];

    await appendRows("PurchaseOrders", samplePOs);
    console.log("✅ 3 sample POs created (1 pending, 1 completed, 1 draft)");
  } else {
    console.log(`\n✅ Purchase_Orders already has ${existingPOs.length} rows, skipping seed`);
  }

  // 6. Add sample goods receipts
  const grRows = await readRange("Goods_Receipts!A1:J1000");
  const existingGR = grRows.slice(1).filter((r) => r.some(Boolean));

  if (existingGR.length === 0) {
    console.log("\n📦 Adding sample Goods Receipts...");

    const sampleReceipts = [
      [`GR-${yesterday.replace(/-/g, "")}-001`, yesterday, `PO-${yesterday.replace(/-/g, "")}-001`, "INV-002", "Botol 500ml", "200", "3500", "700000", "Good", "Received in good condition"],
      [`GR-${yesterday.replace(/-/g, "")}-002`, yesterday, `PO-${yesterday.replace(/-/g, "")}-001`, "INV-002", "Botol 500ml", "0", "3500", "0", "Damaged", "Some items damaged in transit"],
      [`GR-${today.replace(/-/g, "")}-001`, today, `PO-${today.replace(/-/g, "")}-001`, "INV-001", "Alcohol 96%", "50", "25000", "1250000", "Good", "Partial delivery"],
      [`GR-${today.replace(/-/g, "")}-002`, today, `PO-${today.replace(/-/g, "")}-001`, "INV-001", "Alcohol 96%", "30", "25000", "750000", "Good", "Second delivery"],
      [`GR-${today.replace(/-/g, "")}-003`, today, `PO-${today.replace(/-/g, "")}-001`, "INV-001", "Alcohol 96%", "20", "25000", "500000", "Good", "Final delivery"],
    ];

    await appendRows("GoodsReceipts", sampleReceipts);
    console.log("✅ 5 sample goods receipts created");
  } else {
    console.log(`\n✅ Goods_Receipts already has ${existingGR.length} rows, skipping seed`);
  }

  console.log("\n🎉 Auto-Reorder System seed complete!");
  console.log("\nSummary:");
  console.log("  - Reorder_Alerts sheet: headers ready");
  console.log("  - Goods_Receipts sheet: headers ready");
  console.log("  - 2 inventory items set below minimum");
  console.log("  - 3 sample POs (1 pending, 1 completed, 1 draft)");
  console.log("  - 5 sample goods receipts");
}

seed().catch(console.error);
