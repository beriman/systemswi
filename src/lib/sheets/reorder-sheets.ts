// Reorder System — Google Sheets data layer
// Uses Reorder_Alerts, Purchase_Orders, Goods_Receipts, Inventory_Master sheets

import { readRange, appendRows, updateRow, writeRange } from "./sheets-real";

// ── Types ──────────────────────────────────────────────────────────

export interface ReorderAlert {
  alertId: string;
  date: string;
  itemId: string;
  itemName: string;
  currentQty: number;
  minimumQty: number;
  reorderQty: number;
  supplier: string;
  unitCost: number;
  totalCost: number;
  status: "New" | "PO Created" | "Received" | "Cancelled";
  poNumber: string;
  rowNumber: number;
}

export interface PurchaseOrderRow {
  id: string;
  date: string;
  supplierId: string;
  supplierName: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  total: number;
  status: "draft" | "ordered" | "partial" | "received" | "cancelled";
  expectedDate: string;
  proofUrl: string;
  notes: string;
  rowNumber: number;
}

export interface GoodsReceiptRow {
  receiptId: string;
  date: string;
  poNumber: string;
  itemId: string;
  itemName: string;
  qtyReceived: number;
  unitCost: number;
  totalCost: number;
  condition: "Good" | "Damaged" | "Partial";
  notes: string;
  rowNumber: number;
}

export type ReorderPoGovernance = {
  approvalRequired: boolean;
  flags: string[];
  requirement: string;
};

export interface InventoryMasterItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  qty: number;
  minimumQty: number;
  reorderQty: number;
  unitCost: number;
  supplier: string;
  location: string;
  status: string;
  lastMovementAt: string;
  notes: string;
  rowNumber: number;
}

// ── Helpers ────────────────────────────────────────────────────────

const text = (value: unknown) => String(value ?? "").trim();
const num = (value: unknown) => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  return Number(String(value).replace(/[^\d.-]/g, "")) || 0;
};
const today = () => new Date().toISOString().slice(0, 10);
const nowIso = () => new Date().toISOString();

function stockStatus(qty: number, minQty: number) {
  if (qty <= 0) return "empty";
  if (qty <= minQty * 0.5) return "critical";
  if (qty <= minQty) return "low";
  return "ok";
}

export function classifyReorderPoGovernance(total: number, supplierId: string, supplierName: string): ReorderPoGovernance {
  const flags: string[] = [];
  const normalizedSupplier = text(supplierName).toLowerCase();
  if (total > 500000) flags.push("DIRECTOR_APPROVAL_REQUIRED");
  if (total > 2000000) flags.push("TWO_BENCHMARKS_REQUIRED");
  if (!text(supplierId) || !normalizedSupplier || normalizedSupplier === "tba") flags.push("SUPPLIER_NOT_CONFIRMED");

  return {
    approvalRequired: flags.length > 0,
    flags,
    requirement: flags.length
      ? "Auto-reorder PO ditahan sebagai draft sampai review manusia: > Rp500.000 perlu Direktur; > Rp2.000.000 perlu 2 benchmark; supplier harus jelas/Vendor_Register."
      : "Normal reorder approval",
  };
}

// ── Sheet headers ─────────────────────────────────────────────────

const ALERT_HEADERS = [
  "Alert ID", "Date", "Item ID", "Item Name", "Current Qty",
  "Min Qty", "Reorder Qty", "Supplier", "Unit Cost", "Total Cost",
  "Status", "PO Number",
];

const RECEIPT_HEADERS = [
  "Receipt ID", "Date", "PO Number", "Item ID", "Item Name",
  "Qty Received", "Unit Cost", "Total Cost", "Condition", "Notes",
];

// ── Ensure sheets have headers ────────────────────────────────────

export async function ensureReorderSheetsInitialized(): Promise<void> {
  // Reorder_Alerts
  try {
    const rows = await readRange("Reorder_Alerts!A1:L1");
    if (!rows || rows.length === 0 || !rows[0][0]) {
      await writeRange("Reorder_Alerts!A1:L1", [ALERT_HEADERS]);
    }
  } catch {
    await writeRange("Reorder_Alerts!A1:L1", [ALERT_HEADERS]);
  }

  // Goods_Receipts
  try {
    const rows = await readRange("Goods_Receipts!A1:J1");
    if (!rows || rows.length === 0 || !rows[0][0]) {
      await writeRange("Goods_Receipts!A1:J1", [RECEIPT_HEADERS]);
    }
  } catch {
    await writeRange("Goods_Receipts!A1:J1", [RECEIPT_HEADERS]);
  }
}

// ── Parse functions ───────────────────────────────────────────────

export function parseAlerts(rows: string[][]): ReorderAlert[] {
  return rows
    .slice(1)
    .filter((r) => r.some(Boolean))
    .map((row, index) => ({
      alertId: text(row[0]),
      date: text(row[1]),
      itemId: text(row[2]),
      itemName: text(row[3]),
      currentQty: num(row[4]),
      minimumQty: num(row[5]),
      reorderQty: num(row[6]),
      supplier: text(row[7]) || "TBA",
      unitCost: num(row[8]),
      totalCost: num(row[9]),
      status: (text(row[10]) || "New") as ReorderAlert["status"],
      poNumber: text(row[11]),
      rowNumber: index + 2,
    }))
    .filter((a) => a.alertId);
}

export function parsePurchaseOrders(rows: string[][]): PurchaseOrderRow[] {
  return rows
    .slice(1)
    .filter((r) => r.some(Boolean))
    .map((row, index) => {
      const quantity = num(row[6]);
      const unitCost = num(row[8]);
      return {
        id: text(row[0]),
        date: text(row[1]),
        supplierId: text(row[2]),
        supplierName: text(row[3]),
        itemId: text(row[4]),
        itemName: text(row[5]),
        quantity,
        unit: text(row[7]) || "unit",
        unitCost,
        total: num(row[9]) || quantity * unitCost,
        status: (text(row[10]) || "draft") as PurchaseOrderRow["status"],
        expectedDate: text(row[11]) || "TBA",
        proofUrl: text(row[12]),
        notes: text(row[13]),
        rowNumber: index + 2,
      };
    })
    .filter((po) => po.id);
}

export function parseGoodsReceipts(rows: string[][]): GoodsReceiptRow[] {
  return rows
    .slice(1)
    .filter((r) => r.some(Boolean))
    .map((row, index) => ({
      receiptId: text(row[0]),
      date: text(row[1]),
      poNumber: text(row[2]),
      itemId: text(row[3]),
      itemName: text(row[4]),
      qtyReceived: num(row[5]),
      unitCost: num(row[6]),
      totalCost: num(row[7]),
      condition: (text(row[8]) || "Good") as GoodsReceiptRow["condition"],
      notes: text(row[9]),
      rowNumber: index + 2,
    }))
    .filter((r) => r.receiptId);
}

export function parseInventoryMaster(rows: string[][]): InventoryMasterItem[] {
  return rows
    .slice(1)
    .filter((r) => r.some(Boolean))
    .map((row, index) => ({
      id: text(row[0]) || text(row[1]) || `INV-${index + 1}`,
      sku: text(row[1]),
      name: text(row[2]),
      category: text(row[3]) || "other",
      unit: text(row[4]) || "unit",
      qty: num(row[5]),
      minimumQty: num(row[6]),
      reorderQty: num(row[7]),
      unitCost: num(row[8]),
      supplier: text(row[9]) || "TBA",
      location: text(row[10]) || "TBA",
      status: text(row[11]) || "ok",
      lastMovementAt: text(row[12]),
      notes: text(row[13]),
      rowNumber: index + 2,
    }))
    .filter((item) => item.id && item.name);
}

// ── Read functions ────────────────────────────────────────────────

export async function getReorderAlerts(): Promise<ReorderAlert[]> {
  await ensureReorderSheetsInitialized();
  const rows = await readRange("Reorder_Alerts!A1:L1000");
  return parseAlerts(rows);
}

export async function getPurchaseOrders(): Promise<PurchaseOrderRow[]> {
  const rows = await readRange("Purchase_Orders!A1:N1000");
  return parsePurchaseOrders(rows);
}

export async function getGoodsReceipts(): Promise<GoodsReceiptRow[]> {
  await ensureReorderSheetsInitialized();
  const rows = await readRange("Goods_Receipts!A1:J1000");
  return parseGoodsReceipts(rows);
}

export async function getInventoryMaster(): Promise<InventoryMasterItem[]> {
  const rows = await readRange("Inventory_Master!A1:O1000");
  return parseInventoryMaster(rows);
}

// ── Business logic ────────────────────────────────────────────────

/** Generate alerts from Inventory_Master where qty <= minimumQty */
export async function generateReorderAlerts(): Promise<ReorderAlert[]> {
  const items = await getInventoryMaster();
  const existingAlerts = await getReorderAlerts();

  const lowStockItems = items.filter(
    (item) => item.qty <= item.minimumQty && item.minimumQty > 0
  );

  const newAlerts: ReorderAlert[] = [];
  const date = today();

  for (const item of lowStockItems) {
    // Skip if already has an active alert
    const existing = existingAlerts.find(
      (a) => a.itemId === item.id && a.status !== "Received" && a.status !== "Cancelled"
    );
    if (existing) continue;

    const alertId = `ALT-${date.replace(/-/g, "")}-${item.id.slice(0, 6)}`;
    const reorderQty = item.reorderQty || Math.max(item.minimumQty * 2 - item.qty, item.minimumQty);
    const totalCost = reorderQty * item.unitCost;

    const alert: ReorderAlert = {
      alertId,
      date,
      itemId: item.id,
      itemName: item.name,
      currentQty: item.qty,
      minimumQty: item.minimumQty,
      reorderQty,
      supplier: item.supplier,
      unitCost: item.unitCost,
      totalCost,
      status: "New",
      poNumber: "",
      rowNumber: 0, // will be set after append
    };

    await appendRows("ReorderAlerts", [[
      alert.alertId, alert.date, alert.itemId, alert.itemName,
      alert.currentQty, alert.minimumQty, alert.reorderQty,
      alert.supplier, alert.unitCost, alert.totalCost,
      alert.status, alert.poNumber,
    ]]);

    newAlerts.push(alert);
  }

  return [...existingAlerts, ...newAlerts];
}

/** Generate PO from alert */
export async function generatePOFromAlert(
  alertId: string,
  supplierId?: string
): Promise<{ po: PurchaseOrderRow; alert: ReorderAlert } | null> {
  const alerts = await getReorderAlerts();
  const alert = alerts.find((a) => a.alertId === alertId);
  if (!alert) throw new Error("Alert tidak ditemukan");
  if (alert.status === "PO Created") throw new Error("PO sudah dibuat untuk alert ini");

  const pos = await getPurchaseOrders();
  const date = today();
  const poId = `PO-${date.replace(/-/g, "")}-${String(pos.length + 1).padStart(3, "0")}`;

  // Get supplier info
  let supplierName = alert.supplier;
  let supId = supplierId || "";
  if (!supId) {
    // Try to find supplier by name
    const supRows = await readRange("Supplier_Master!A1:J100");
    const sups = supRows.slice(1).filter((r) => r.some(Boolean));
    const found = sups.find((r) => text(r[1]).toLowerCase() === alert.supplier.toLowerCase());
    if (found) {
      supId = text(found[0]);
      supplierName = text(found[1]);
    }
  }

  const total = alert.reorderQty * alert.unitCost;
  const governance = classifyReorderPoGovernance(total, supId, supplierName);
  const poRow: PurchaseOrderRow = {
    id: poId,
    date,
    supplierId: supId,
    supplierName,
    itemId: alert.itemId,
    itemName: alert.itemName,
    quantity: alert.reorderQty,
    unit: "unit",
    unitCost: alert.unitCost,
    total,
    status: governance.approvalRequired ? "draft" : "ordered",
    expectedDate: "",
    proofUrl: "",
    notes: [
      `Auto-generated from reorder alert ${alertId}`,
      governance.flags.length ? `GCG flags: ${governance.flags.join(", ")}` : "",
      governance.approvalRequired ? "Status forced draft until human approval is confirmed." : "",
    ].filter(Boolean).join(" | "),
    rowNumber: pos.length + 2,
  };

  await appendRows("PurchaseOrders", [[
    poRow.id, poRow.date, poRow.supplierId, poRow.supplierName,
    poRow.itemId, poRow.itemName, poRow.quantity, poRow.unit,
    poRow.unitCost, poRow.total, poRow.status, poRow.expectedDate,
    poRow.proofUrl, poRow.notes,
  ]]);

  // Update alert status
  await updateRow("ReorderAlerts", alert.rowNumber, [
    alert.alertId, alert.date, alert.itemId, alert.itemName,
    alert.currentQty, alert.minimumQty, alert.reorderQty,
    alert.supplier, alert.unitCost, alert.totalCost,
    "PO Created", poId,
  ]);

  return { po: poRow, alert: { ...alert, status: "PO Created", poNumber: poId } };
}

/** Confirm receipt → update inventory */
export async function confirmReceipt(input: {
  poNumber: string;
  itemId: string;
  itemName: string;
  qtyReceived: number;
  unitCost: number;
  condition: "Good" | "Damaged" | "Partial";
  notes?: string;
}): Promise<{ receipt: GoodsReceiptRow; inventoryUpdated: boolean }> {
  const date = today();
  const existingReceipts = await getGoodsReceipts();
  const receiptId = `GR-${date.replace(/-/g, "")}-${String(existingReceipts.length + 1).padStart(3, "0")}`;

  const totalCost = input.qtyReceived * input.unitCost;

  const receipt: GoodsReceiptRow = {
    receiptId,
    date,
    poNumber: input.poNumber,
    itemId: input.itemId,
    itemName: input.itemName,
    qtyReceived: input.qtyReceived,
    unitCost: input.unitCost,
    totalCost,
    condition: input.condition,
    notes: input.notes || "",
    rowNumber: existingReceipts.length + 2,
  };

  await appendRows("GoodsReceipts", [[
    receipt.receiptId, receipt.date, receipt.poNumber,
    receipt.itemId, receipt.itemName, receipt.qtyReceived,
    receipt.unitCost, receipt.totalCost, receipt.condition, receipt.notes,
  ]]);

  // Update inventory if condition is Good
  let inventoryUpdated = false;
  if (input.condition === "Good") {
    const items = await getInventoryMaster();
    const item = items.find(
      (i) => i.id === input.itemId || i.sku === input.itemId
    );
    if (item) {
      const newQty = item.qty + input.qtyReceived;
      await updateRow("InventoryMaster", item.rowNumber, [
        item.id, item.sku, item.name, item.category, item.unit,
        newQty, item.minimumQty, item.reorderQty,
        input.unitCost || item.unitCost, item.supplier, item.location,
        stockStatus(newQty, item.minimumQty), nowIso(), item.notes,
        `Receipt ${receiptId}`,
      ]);

      // Also append movement
      await appendRows("InventoryMovements", [[
        nowIso(), date, item.id, item.sku, "in", input.qtyReceived,
        receiptId, "", "Auto-Reorder System", `Goods receipt ${receiptId}`,
      ]]);

      inventoryUpdated = true;
    }
  }

  // Update PO status
  const pos = await getPurchaseOrders();
  const po = pos.find((p) => p.id === input.poNumber);
  if (po) {
    const allReceipts = [...existingReceipts, receipt];
    const receivedTotal = allReceipts
      .filter((r) => r.poNumber === input.poNumber && r.condition === "Good")
      .reduce((sum, r) => sum + r.qtyReceived, 0);
    const newStatus: PurchaseOrderRow["status"] =
      receivedTotal >= po.quantity ? "received" : receivedTotal > 0 ? "partial" : po.status;

    await updateRow("PurchaseOrders", po.rowNumber, [
      po.id, po.date, po.supplierId, po.supplierName,
      po.itemId, po.itemName, po.quantity, po.unit,
      po.unitCost, po.total, newStatus, po.expectedDate,
      po.proofUrl, [po.notes, `Receipt ${receiptId}`].filter(Boolean).join(" | "),
    ]);
  }

  // Update related alert status
  const alerts = await getReorderAlerts();
  const alert = alerts.find((a) => a.poNumber === input.poNumber);
  if (alert) {
    await updateRow("ReorderAlerts", alert.rowNumber, [
      alert.alertId, alert.date, alert.itemId, alert.itemName,
      inventoryUpdated ? alert.currentQty + input.qtyReceived : alert.currentQty,
      alert.minimumQty, alert.reorderQty,
      alert.supplier, alert.unitCost, alert.totalCost,
      "Received", alert.poNumber,
    ]);
  }

  return { receipt, inventoryUpdated };
}

// ── Summary ───────────────────────────────────────────────────────

export interface ReorderSummary {
  totalAlerts: number;
  newAlerts: number;
  poCreated: number;
  totalItemsBelowMin: number;
  totalReorderValue: number;
  pendingPOs: number;
  completedReceipts: number;
}

export async function getReorderSummary(): Promise<ReorderSummary> {
  const [alerts, pos, receipts, items] = await Promise.all([
    getReorderAlerts(),
    getPurchaseOrders(),
    getGoodsReceipts(),
    getInventoryMaster(),
  ]);

  const belowMin = items.filter((i) => i.qty <= i.minimumQty && i.minimumQty > 0);

  return {
    totalAlerts: alerts.length,
    newAlerts: alerts.filter((a) => a.status === "New").length,
    poCreated: alerts.filter((a) => a.status === "PO Created").length,
    totalItemsBelowMin: belowMin.length,
    totalReorderValue: belowMin.reduce(
      (sum, i) => sum + Math.max(i.reorderQty || i.minimumQty * 2 - i.qty, i.minimumQty) * i.unitCost,
      0
    ),
    pendingPOs: pos.filter((p) => ["draft", "ordered", "partial"].includes(p.status)).length,
    completedReceipts: receipts.length,
  };
}
