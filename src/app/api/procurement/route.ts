import { NextRequest, NextResponse } from "next/server";
import { appendRows, readRange, updateRow } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

type Supplier = {
  id: string;
  name: string;
  category: string;
  contact: string;
  channel: string;
  leadTimeDays: number;
  rating: number;
  status: string;
  lastPo: string;
  notes: string;
};

type PurchaseOrder = {
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
};

type Receipt = {
  timestamp: string;
  id: string;
  poId: string;
  date: string;
  itemId: string;
  sku: string;
  quantity: number;
  qcStatus: "pending" | "passed" | "failed";
  qcNotes: string;
  proofUrl: string;
  pic: string;
  movementRef: string;
  notes: string;
};

type InventoryItem = {
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
  notes: string;
  rowNumber: number;
};

const text = (value: unknown) => String(value ?? "").trim();
const numberValue = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(/[^\d.-]/g, "")) || 0;
  return 0;
};

function stockStatus(qty: number, minimumQty: number) {
  if (qty <= 0) return "empty";
  if (qty <= minimumQty * 0.5) return "critical";
  if (qty <= minimumQty) return "low";
  return "ok";
}

function parseSuppliers(rows: string[][]): Supplier[] {
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row) => ({
    id: text(row[0]),
    name: text(row[1]),
    category: text(row[2]) || "TBA",
    contact: text(row[3]) || "TBA",
    channel: text(row[4]) || "TBA",
    leadTimeDays: numberValue(row[5]),
    rating: numberValue(row[6]),
    status: text(row[7]) || "draft",
    lastPo: text(row[8]),
    notes: text(row[9]),
  })).filter((supplier) => supplier.id && supplier.name);
}

function parsePurchaseOrders(rows: string[][]): PurchaseOrder[] {
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row, index) => {
    const quantity = numberValue(row[6]);
    const unitCost = numberValue(row[8]);
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
      total: numberValue(row[9]) || quantity * unitCost,
      status: (text(row[10]) as PurchaseOrder["status"]) || "draft",
      expectedDate: text(row[11]) || "TBA",
      proofUrl: text(row[12]),
      notes: text(row[13]),
      rowNumber: index + 2,
    };
  }).filter((po) => po.id);
}

function parseReceipts(rows: string[][]): Receipt[] {
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row) => ({
    timestamp: text(row[0]),
    id: text(row[1]),
    poId: text(row[2]),
    date: text(row[3]),
    itemId: text(row[4]),
    sku: text(row[5]),
    quantity: numberValue(row[6]),
    qcStatus: (text(row[7]) as Receipt["qcStatus"]) || "pending",
    qcNotes: text(row[8]),
    proofUrl: text(row[9]),
    pic: text(row[10]),
    movementRef: text(row[11]),
    notes: text(row[12]),
  }));
}

function parseInventory(rows: string[][]): InventoryItem[] {
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row, index) => ({
    id: text(row[0]),
    sku: text(row[1]),
    name: text(row[2]),
    category: text(row[3]) || "other",
    unit: text(row[4]) || "unit",
    qty: numberValue(row[5]),
    minimumQty: numberValue(row[6]),
    reorderQty: numberValue(row[7]),
    unitCost: numberValue(row[8]),
    supplier: text(row[9]) || "TBA",
    location: text(row[10]) || "TBA",
    notes: text(row[13]),
    rowNumber: index + 2,
  })).filter((item) => item.id && item.name);
}

function summarize(pos: PurchaseOrder[], receipts: Receipt[]) {
  const open = pos.filter((po) => ["draft", "ordered", "partial"].includes(po.status));
  return {
    totalPo: pos.length,
    openPo: open.length,
    orderedValue: open.reduce((sum, po) => sum + po.total, 0),
    pendingReceive: open.filter((po) => po.status !== "received").length,
    qcFailed: receipts.filter((receipt) => receipt.qcStatus === "failed").length,
    latestPo: pos.slice(-10).reverse(),
    latestReceipts: receipts.slice(-10).reverse(),
  };
}

function makePoId(existing: PurchaseOrder[]) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const sameDay = existing.filter((po) => po.id.includes(today)).length + 1;
  return `PO-${today}-${String(sameDay).padStart(3, "0")}`;
}

function makeReceiptId(existing: Receipt[]) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const sameDay = existing.filter((receipt) => receipt.id.includes(today)).length + 1;
  return `GR-${today}-${String(sameDay).padStart(3, "0")}`;
}

export async function GET() {
  try {
    const [supplierRows, poRows, receiptRows] = await Promise.all([
      readRange("Supplier_Master!A1:J1000"),
      readRange("Purchase_Orders!A1:N1000"),
      readRange("Goods_Receipts!A1:M1000"),
    ]);
    const suppliers = parseSuppliers(supplierRows);
    const purchaseOrders = parsePurchaseOrders(poRows);
    const receipts = parseReceipts(receiptRows);
    return NextResponse.json({
      source: "Google Sheets: Supplier_Master + Purchase_Orders + Goods_Receipts",
      suppliers,
      purchaseOrders,
      receipts,
      summary: summarize(purchaseOrders, receipts),
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal membaca procurement", details: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = text(body.action);

    const [supplierRows, poRows, receiptRows] = await Promise.all([
      readRange("Supplier_Master!A1:J1000"),
      readRange("Purchase_Orders!A1:N1000"),
      readRange("Goods_Receipts!A1:M1000"),
    ]);
    const suppliers = parseSuppliers(supplierRows);
    const purchaseOrders = parsePurchaseOrders(poRows);
    const receipts = parseReceipts(receiptRows);

    if (action === "create-po") {
      const supplierId = text(body.supplierId);
      const itemId = text(body.itemId);
      const itemName = text(body.itemName);
      const quantity = numberValue(body.quantity);
      const unitCost = numberValue(body.unitCost);
      if (!supplierId) return NextResponse.json({ error: "supplierId wajib diisi" }, { status: 400 });
      if (!itemId || !itemName) return NextResponse.json({ error: "itemId dan itemName wajib diisi" }, { status: 400 });
      const supplier = suppliers.find((item) => item.id.toLowerCase() === supplierId.toLowerCase());
      if (!supplier) return NextResponse.json({ error: "supplierId tidak ditemukan" }, { status: 404 });
      if (quantity <= 0) return NextResponse.json({ error: "quantity wajib lebih dari 0" }, { status: 400 });
      const poId = text(body.poId) || makePoId(purchaseOrders);
      const date = text(body.date) || new Date().toISOString().slice(0, 10);
      const total = quantity * unitCost;
      const row = [
        poId,
        date,
        supplier.id,
        supplier.name,
        itemId,
        itemName,
        quantity,
        text(body.unit) || "unit",
        unitCost,
        total,
        text(body.status) || "ordered",
        text(body.expectedDate) || "TBA",
        text(body.proofUrl),
        text(body.notes),
      ];
      await appendRows("PurchaseOrders", [row]);
      return NextResponse.json({ success: true, action, po: { id: poId, supplierName: supplier.name, total }, syncedSheets: ["Purchase_Orders"] }, { status: 201 });
    }

    if (action === "receive") {
      const poId = text(body.poId);
      const po = purchaseOrders.find((item) => item.id.toLowerCase() === poId.toLowerCase());
      const quantity = numberValue(body.quantity);
      const qcStatus = (text(body.qcStatus) || "pending") as Receipt["qcStatus"];
      if (!po) return NextResponse.json({ error: "PO tidak ditemukan" }, { status: 404 });
      if (quantity <= 0) return NextResponse.json({ error: "quantity wajib lebih dari 0" }, { status: 400 });
      if (!["pending", "passed", "failed"].includes(qcStatus)) return NextResponse.json({ error: "qcStatus wajib pending, passed, atau failed" }, { status: 400 });

      const timestamp = new Date().toISOString();
      const receiptId = text(body.receiptId) || makeReceiptId(receipts);
      const date = text(body.date) || timestamp.slice(0, 10);
      const movementRef = `${receiptId}/${po.id}`;
      const inventoryRows = await readRange("Inventory_Master!A1:O1000");
      const inventory = parseInventory(inventoryRows);
      const inv = inventory.find((item) =>
        item.id.toLowerCase() === po.itemId.toLowerCase() || item.sku.toLowerCase() === po.itemId.toLowerCase()
      );

      await appendRows("GoodsReceipts", [[
        timestamp,
        receiptId,
        po.id,
        date,
        po.itemId,
        inv?.sku || po.itemId,
        quantity,
        qcStatus,
        text(body.qcNotes),
        text(body.proofUrl),
        text(body.pic) || "HemuHemu/OWL",
        movementRef,
        text(body.notes),
      ]]);

      if (qcStatus === "passed" && inv) {
        const newQty = inv.qty + quantity;
        await appendRows("InventoryMovements", [[
          timestamp,
          date,
          inv.id,
          inv.sku,
          "in",
          quantity,
          movementRef,
          text(body.proofUrl),
          text(body.pic) || "HemuHemu/OWL",
          `Receiving ${po.id}: ${text(body.qcNotes) || "QC passed"}`,
        ]]);
        await updateRow("InventoryMaster", inv.rowNumber, [
          inv.id,
          inv.sku,
          inv.name,
          inv.category,
          inv.unit,
          newQty,
          inv.minimumQty,
          inv.reorderQty,
          po.unitCost || inv.unitCost,
          po.supplierName || inv.supplier,
          inv.location,
          stockStatus(newQty, inv.minimumQty),
          timestamp,
          inv.notes,
          movementRef,
        ]);
      }

      const previouslyReceived = receipts
        .filter((receipt) => receipt.poId.toLowerCase() === po.id.toLowerCase() && receipt.qcStatus !== "failed")
        .reduce((sum, receipt) => sum + receipt.quantity, 0);
      const receivedTotal = previouslyReceived + (qcStatus === "failed" ? 0 : quantity);
      const newStatus = receivedTotal >= po.quantity ? "received" : receivedTotal > 0 ? "partial" : po.status;
      await updateRow("PurchaseOrders", po.rowNumber, [
        po.id,
        po.date,
        po.supplierId,
        po.supplierName,
        po.itemId,
        po.itemName,
        po.quantity,
        po.unit,
        po.unitCost,
        po.total,
        newStatus,
        po.expectedDate,
        text(body.proofUrl) || po.proofUrl,
        [po.notes, text(body.notes)].filter(Boolean).join(" | "),
      ]);

      return NextResponse.json({
        success: true,
        action,
        receipt: { id: receiptId, poId: po.id, quantity, qcStatus },
        inventoryUpdated: qcStatus === "passed" && Boolean(inv),
        poStatus: newStatus,
        syncedSheets: ["Goods_Receipts", "Purchase_Orders", ...(qcStatus === "passed" && inv ? ["Inventory_Master", "Inventory_Movements"] : [])],
      }, { status: 201 });
    }

    return NextResponse.json({ error: "action wajib create-po atau receive" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menyimpan procurement", details: String(error) }, { status: 500 });
  }
}
