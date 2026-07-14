import { NextResponse } from "next/server";
import { googleWorkspaceWriteBlockedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { appendRows, writeRange, readRange, updateRow } from "@/lib/sheets/sheets-real";
import {
  ensureReorderSheetsInitialized,
  getReorderAlerts,
  getPurchaseOrders,
  getGoodsReceipts,
  getInventoryMaster,
} from "@/lib/sheets/reorder-sheets";

export const runtime = "nodejs";

const today = () => new Date().toISOString().slice(0, 10);
const dateStr = today();

/**
 * POST — Seed sample data for Reorder System
 * - 3 sample PO (1 pending, 1 completed, 1 draft)
 * - 5 sample goods receipts
 * - 2 items in Inventory_Master set below minimum
 */
export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await ensureReorderSheetsInitialized();

    const results: string[] = [];

    // ── 1. Ensure Purchase_Orders has headers ──
    try {
      const poRows = await readRange("Purchase_Orders!A1:N1");
      if (!poRows || poRows.length === 0 || !poRows[0][0]) {
        await writeRange("Purchase_Orders!A1:N1", [[
          "PO ID", "Date", "Supplier ID", "Supplier Name",
          "Item ID", "Item Name", "Quantity", "Unit",
          "Unit Cost", "Total", "Status", "Expected Date",
          "Proof URL", "Notes",
        ]]);
      }
    } catch {
      await writeRange("Purchase_Orders!A1:N1", [[
        "PO ID", "Date", "Supplier ID", "Supplier Name",
        "Item ID", "Item Name", "Quantity", "Unit",
        "Unit Cost", "Total", "Status", "Expected Date",
        "Proof URL", "Notes",
      ]]);
    }

    // ── 2. Seed 3 sample POs ──
    const existingPOs = await getPurchaseOrders();
    const poDate = dateStr;

    const samplePOs = [
      {
        id: `PO-${poDate.replace(/-/g, "")}-S01`,
        date: poDate,
        supplierId: "SUP-001",
        supplierName: "PT Aroma Essence Indonesia",
        itemId: "RM-001",
        itemName: "Alcohol 96% (Raw Material)",
        quantity: 500,
        unit: "liter",
        unitCost: 45000,
        status: "ordered" as const,
        expectedDate: poDate,
        notes: "Sample PO — Pending (seed)",
      },
      {
        id: `PO-${poDate.replace(/-/g, "")}-S02`,
        date: poDate,
        supplierId: "SUP-002",
        supplierName: "CV Kemasan Prima",
        itemId: "PK-001",
        itemName: "Glass Bottle 50ml",
        quantity: 2000,
        unit: "pcs",
        unitCost: 3500,
        status: "received" as const,
        expectedDate: poDate,
        notes: "Sample PO — Completed (seed)",
      },
      {
        id: `PO-${poDate.replace(/-/g, "")}-S03`,
        date: poDate,
        supplierId: "SUP-003",
        supplierName: "PT Fragrance Labs",
        itemId: "RM-002",
        itemName: "Essence Rose Absolute",
        quantity: 100,
        unit: "ml",
        unitCost: 250000,
        status: "draft" as const,
        expectedDate: poDate,
        notes: "Sample PO — Draft (seed)",
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
      }
    }
    results.push(`PO: ${poCount} new (${samplePOs.length} total target)`);

    // ── 3. Seed 5 sample goods receipts ──
    const existingReceipts = await getGoodsReceipts();
    const sampleReceipts = [
      {
        id: `GR-${poDate.replace(/-/g, "")}-001`,
        poNumber: samplePOs[1].id, // completed PO
        itemId: "PK-001",
        itemName: "Glass Bottle 50ml",
        qtyReceived: 1000,
        unitCost: 3500,
        condition: "Good" as const,
        notes: "Receipt 1 — Good condition (seed)",
      },
      {
        id: `GR-${poDate.replace(/-/g, "")}-002`,
        poNumber: samplePOs[1].id,
        itemId: "PK-001",
        itemName: "Glass Bottle 50ml",
        qtyReceived: 1000,
        unitCost: 3500,
        condition: "Good" as const,
        notes: "Receipt 2 — Good condition (seed)",
      },
      {
        id: `GR-${poDate.replace(/-/g, "")}-003`,
        poNumber: samplePOs[0].id, // pending PO
        itemId: "RM-001",
        itemName: "Alcohol 96% (Raw Material)",
        qtyReceived: 200,
        unitCost: 45000,
        condition: "Good" as const,
        notes: "Receipt 3 — Partial delivery (seed)",
      },
      {
        id: `GR-${poDate.replace(/-/g, "")}-004`,
        poNumber: samplePOs[0].id,
        itemId: "RM-001",
        itemName: "Alcohol 96% (Raw Material)",
        qtyReceived: 50,
        unitCost: 45000,
        condition: "Damaged" as const,
        notes: "Receipt 4 — Damaged items (seed)",
      },
      {
        id: `GR-${poDate.replace(/-/g, "")}-005`,
        poNumber: samplePOs[1].id,
        itemId: "PK-001",
        itemName: "Glass Bottle 50ml",
        qtyReceived: 500,
        unitCost: 3500,
        condition: "Partial" as const,
        notes: "Receipt 5 — Partial condition (seed)",
      },
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
      }
    }
    results.push(`Receipts: ${receiptCount} new (${sampleReceipts.length} total target)`);

    // ── 4. Seed reorder alerts ──
    const existingAlerts = await getReorderAlerts();
    const sampleAlerts = [
      {
        id: `ALT-${poDate.replace(/-/g, "")}-001`,
        itemId: "RM-001",
        itemName: "Alcohol 96% (Raw Material)",
        currentQty: 50,
        minimumQty: 200,
        reorderQty: 500,
        supplier: "PT Aroma Essence Indonesia",
        unitCost: 45000,
        status: "PO Created" as const,
        poNumber: samplePOs[0].id,
      },
      {
        id: `ALT-${poDate.replace(/-/g, "")}-002`,
        itemId: "PK-001",
        itemName: "Glass Bottle 50ml",
        currentQty: 100,
        minimumQty: 500,
        reorderQty: 2000,
        supplier: "CV Kemasan Prima",
        unitCost: 3500,
        status: "New" as const,
        poNumber: "",
      },
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
      }
    }
    results.push(`Alerts: ${alertCount} new (${sampleAlerts.length} total target)`);

    // ── 5. Set 2 items below minimum in Inventory_Master ──
    const items = await getInventoryMaster();
    let itemsUpdated = 0;

    // Find 2 items to set below minimum
    const targetItems = items.filter((i) => i.minimumQty > 0 && i.qty > 0).slice(0, 2);
    for (const item of targetItems) {
      const newQty = Math.max(0, Math.floor(item.minimumQty * 0.3)); // 30% of minimum = critical
      await updateRow("InventoryMaster", item.rowNumber, [
        item.id, item.sku, item.name, item.category, item.unit,
        newQty, item.minimumQty, item.reorderQty,
        item.unitCost, item.supplier, item.location,
        newQty <= item.minimumQty * 0.5 ? "critical" : "low",
        new Date().toISOString(), item.notes, "Seed: set below minimum",
      ]);
      itemsUpdated++;
    }
    results.push(`Inventory: ${itemsUpdated} items set below minimum`);

    return NextResponse.json({
      success: true,
      message: "Seed data created successfully",
      details: results,
      counts: {
        purchaseOrders: poCount,
        goodsReceipts: receiptCount,
        reorderAlerts: alertCount,
        inventoryItemsBelowMin: itemsUpdated,
      },
    }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource("Google Sheets: Reorder System sheets", error),
        error: "Google Workspace OAuth perlu re-auth sebelum bisa seed data.",
      }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Gagal seed reorder data", details: String(error) },
      { status: 500 }
    );
  }
}
