// Seed script for Auto-Reorder System (API seed logic)
// Run with: npx tsx scripts/seed-reorder-api.ts

import { readRange, writeRange, appendRows, updateRow, getAuth } from "@/lib/sheets/sheets-real";
import {
  ensureReorderSheetsInitialized,
  getReorderAlerts,
  getPurchaseOrders,
  getGoodsReceipts,
  getInventoryMaster,
} from "@/lib/sheets/reorder-sheets";

const text = (v: unknown) => String(v ?? "").trim();
const num = (v: unknown) => {
  if (typeof v === "number") return v;
  if (!v) return 0;
  return Number(String(v).replace(/[^\d.-]/g, "")) || 0;
};
const today = () => new Date().toISOString().slice(0, 10);
const dateStr = today();

async function main() {
  console.log("🌱 Seeding Auto-Reorder System data (API seed logic)...\n");
  await ensureReorderSheetsInitialized();

  // Check existing data
  const [existingAlerts, existingPOs, existingReceipts, items] = await Promise.all([
    getReorderAlerts(),
    getPurchaseOrders(),
    getGoodsReceipts(),
    getInventoryMaster(),
  ]);

  console.log(`Current: ${existingAlerts.length} alerts, ${existingPOs.length} POs, ${existingReceipts.length} receipts`);
  console.log(`Inventory: ${items.length} items`);

  // Seed 3 sample POs if needed
  const poDate = dateStr;
  const samplePOs = [
    {
      id: `PO-${poDate.replace(/-/g, "")}-S01`,
      date: poDate, supplierId: "SUP-001", supplierName: "PT Aroma Essence Indonesia",
      itemId: "RM-001", itemName: "Alcohol 96% (Raw Material)",
      quantity: 500, unit: "liter", unitCost: 45000, status: "ordered" as const,
      expectedDate: poDate, notes: "Sample PO — Pending (seed)",
    },
    {
      id: `PO-${poDate.replace(/-/g, "")}-S02`,
      date: poDate, supplierId: "SUP-002", supplierName: "CV Kemasan Prima",
      itemId: "PK-001", itemName: "Glass Bottle 50ml",
      quantity: 2000, unit: "pcs", unitCost: 3500, status: "received" as const,
      expectedDate: poDate, notes: "Sample PO — Completed (seed)",
    },
    {
      id: `PO-${poDate.replace(/-/g, "")}-S03`,
      date: poDate, supplierId: "SUP-003", supplierName: "PT Fragrance Labs",
      itemId: "RM-002", itemName: "Essence Rose Absolute",
      quantity: 100, unit: "ml", unitCost: 250000, status: "draft" as const,
      expectedDate: poDate, notes: "Sample PO — Draft (seed)",
    },
  ];

  let poCount = 0;
  for (const po of samplePOs) {
    const exists = existingPOs.find((p) => p.id === po.id);
    if (!exists) {
      await appendRows("PurchaseOrders", [[
        po.id, po.date, po.supplierId, po.supplierName,
        po.itemId, po.itemName, po.quantity, po.unit,
        po.unitCost, po.quantity * po.unitCost, po.status,
        po.expectedDate, "", po.notes,
      ]]);
      poCount++;
      console.log(`  Created PO: ${po.id}`);
    }
  }
  console.log(`POs: ${poCount} new created (${samplePOs.length - poCount} already existed)`);

  // Seed 5 receipts
  const sampleReceipts = [
    { id: `GR-${poDate.replace(/-/g, "")}-001`, poNumber: samplePOs[1].id, itemId: "PK-001", itemName: "Glass Bottle 50ml", qtyReceived: 1000, unitCost: 3500, condition: "Good" as const, notes: "Receipt 1 — Good condition (seed)" },
    { id: `GR-${poDate.replace(/-/g, "")}-002`, poNumber: samplePOs[1].id, itemId: "PK-001", itemName: "Glass Bottle 50ml", qtyReceived: 1000, unitCost: 3500, condition: "Good" as const, notes: "Receipt 2 — Good condition (seed)" },
    { id: `GR-${poDate.replace(/-/g, "")}-003`, poNumber: samplePOs[0].id, itemId: "RM-001", itemName: "Alcohol 96% (Raw Material)", qtyReceived: 200, unitCost: 45000, condition: "Good" as const, notes: "Receipt 3 — Partial delivery (seed)" },
    { id: `GR-${poDate.replace(/-/g, "")}-004`, poNumber: samplePOs[0].id, itemId: "RM-001", itemName: "Alcohol 96% (Raw Material)", qtyReceived: 50, unitCost: 45000, condition: "Damaged" as const, notes: "Receipt 4 — Damaged items (seed)" },
    { id: `GR-${poDate.replace(/-/g, "")}-005`, poNumber: samplePOs[1].id, itemId: "PK-001", itemName: "Glass Bottle 50ml", qtyReceived: 500, unitCost: 3500, condition: "Partial" as const, notes: "Receipt 5 — Partial condition (seed)" },
  ];

  let receiptCount = 0;
  for (const r of sampleReceipts) {
    const exists = existingReceipts.find((er) => er.receiptId === r.id);
    if (!exists) {
      await appendRows("GoodsReceipts", [[
        r.id, poDate, r.poNumber, r.itemId, r.itemName,
        r.qtyReceived, r.unitCost, r.qtyReceived * r.unitCost,
        r.condition, r.notes,
      ]]);
      receiptCount++;
      console.log(`  Created Receipt: ${r.id}`);
    }
  }
  console.log(`Receipts: ${receiptCount} new created (${sampleReceipts.length - receiptCount} already existed)`);

  // Seed 2 alerts
  const sampleAlerts = [
    { id: `ALT-${poDate.replace(/-/g, "")}-001`, itemId: "RM-001", itemName: "Alcohol 96% (Raw Material)", currentQty: 50, minimumQty: 200, reorderQty: 500, supplier: "PT Aroma Essence Indonesia", unitCost: 45000, status: "PO Created" as const, poNumber: samplePOs[0].id },
    { id: `ALT-${poDate.replace(/-/g, "")}-002`, itemId: "PK-001", itemName: "Glass Bottle 50ml", currentQty: 100, minimumQty: 500, reorderQty: 2000, supplier: "CV Kemasan Prima", unitCost: 3500, status: "New" as const, poNumber: "" },
  ];

  let alertCount = 0;
  for (const a of sampleAlerts) {
    const exists = existingAlerts.find((ea) => ea.alertId === a.id);
    if (!exists) {
      await appendRows("ReorderAlerts", [[
        a.id, poDate, a.itemId, a.itemName,
        a.currentQty, a.minimumQty, a.reorderQty,
        a.supplier, a.unitCost, a.currentQty * a.unitCost,
        a.status, a.poNumber,
      ]]);
      alertCount++;
      console.log(`  Created Alert: ${a.id}`);
    }
  }
  console.log(`Alerts: ${alertCount} new created (${sampleAlerts.length - alertCount} already existed)`);

  // Set 2 items below minimum
  const targetItems = items.filter((i) => i.minimumQty > 0).slice(0, 2);
  let itemsUpdated = 0;
  for (const item of targetItems) {
    if (item.qty <= item.minimumQty * 0.5) {
      console.log(`  ${item.name} already below minimum (${item.qty} <= ${item.minimumQty})`);
      itemsUpdated++;
      continue;
    }
    const newQty = Math.max(0, Math.floor(item.minimumQty * 0.3));
    await updateRow("InventoryMaster", item.rowNumber, [
      item.id, item.sku, item.name, item.category, item.unit,
      newQty, item.minimumQty, item.reorderQty,
      item.unitCost, item.supplier, item.location,
      newQty <= item.minimumQty * 0.5 ? "critical" : "low",
      new Date().toISOString(), item.notes, "Seed: set below minimum",
    ]);
    itemsUpdated++;
    console.log(`  Updated ${item.name} qty to ${newQty} (min: ${item.minimumQty})`);
  }
  console.log(`Inventory: ${itemsUpdated} items set/confirmed below minimum`);

  // Final summary
  const [finalAlerts, finalPOs, finalReceipts, finalItems] = await Promise.all([
    getReorderAlerts(),
    getPurchaseOrders(),
    getGoodsReceipts(),
    getInventoryMaster(),
  ]);

  console.log("\n🎉 Auto-Reorder System seed complete!");
  console.log("\nFinal counts:");
  console.log(`  - Reorder Alerts: ${finalAlerts.length}`);
  console.log(`  - Purchase Orders: ${finalPOs.length}`);
  console.log(`  - Goods Receipts: ${finalReceipts.length}`);
  console.log(`  - Inventory Items: ${finalItems.length}`);
  console.log(`  - Items Below Min: ${finalItems.filter(i => i.qty <= i.minimumQty && i.minimumQty > 0).length}`);
}

main().catch(console.error);
