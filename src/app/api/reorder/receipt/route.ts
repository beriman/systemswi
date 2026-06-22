import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceWriteBlockedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { appendRows, readRange, updateRow } from "@/lib/sheets/sheets-real";
import { appendSwiMemoryLog } from "@/lib/google/audit-log";

export const runtime = "nodejs";

const money = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(/[^\d.-]/g, "")) || 0;
  return 0;
};

const text = (value: unknown) => String(value ?? "").trim();

function stockStatus(qty: number, minimumQty: number): "ok" | "low" | "critical" | "empty" {
  if (qty <= 0) return "empty";
  if (qty <= minimumQty * 0.5) return "critical";
  if (qty <= minimumQty) return "low";
  return "ok";
}

function makeReceiptId() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `GR-${today}-${Date.now().toString(36).toUpperCase()}`;
}

async function appendReceiptAudit(entry: { action: string; target: string; summary: string }) {
  try {
    await appendSwiMemoryLog(entry);
    return "ok";
  } catch (error) {
    return isGoogleWorkspaceAuthError(error) ? "blocked" : `warning:${String(error).slice(0, 160)}`;
  }
}

// ── PUT — confirm goods receipt → update inventory ──

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const poNumber = text(body.poNumber);
    const qtyReceived = money(body.qtyReceived);
    const condition = text(body.condition) || "Good";
    const notes = text(body.notes);

    if (!poNumber) {
      return NextResponse.json({ error: "poNumber wajib diisi" }, { status: 400 });
    }
    if (!qtyReceived || qtyReceived <= 0) {
      return NextResponse.json({ error: "qtyReceived wajib lebih dari 0" }, { status: 400 });
    }

    // Find the PO
    const poRows = await readRange("Purchase_Orders!A1:N1000");
    const poList = poRows.slice(1).filter((r) => r.some(Boolean)).map((row, index) => ({
      id: text(row[0]),
      date: text(row[1]),
      supplierId: text(row[2]),
      supplierName: text(row[3]),
      itemId: text(row[4]),
      itemName: text(row[5]),
      quantity: money(row[6]),
      unit: text(row[7]) || "unit",
      unitCost: money(row[8]),
      total: money(row[9]),
      status: text(row[10]) || "draft",
      expectedDate: text(row[11]) || "TBA",
      proofUrl: text(row[12]),
      notes: text(row[13]),
      rowNumber: index + 2,
    })).filter((po) => po.id);

    const po = poList.find((p) => p.id === poNumber);
    if (!po) {
      return NextResponse.json({ error: `PO ${poNumber} tidak ditemukan` }, { status: 404 });
    }

    if (po.status === "received") {
      return NextResponse.json({ error: `PO ${poNumber} sudah fully received` }, { status: 400 });
    }

    const now = new Date().toISOString();
    const date = now.slice(0, 10);
    const receiptId = makeReceiptId();
    const totalCost = qtyReceived * po.unitCost;

    // Create Goods Receipt row
    const receiptRow = [
      receiptId,
      date,
      poNumber,
      po.itemId,
      po.itemName,
      qtyReceived,
      po.unitCost,
      totalCost,
      condition,
      notes,
    ];
    await appendRows("GoodsReceipts", [receiptRow]);

    // Update inventory if condition is Good
    let inventoryUpdated = false;
    let newQty = 0;

    if (condition === "Good") {
      const invRows = await readRange("Inventory_Master!A1:O1000");
      const items = invRows.slice(1).filter((r) => r.some(Boolean)).map((row, index) => ({
        id: text(row[0]) || text(row[1]) || `INV-${index + 1}`,
        sku: text(row[1]),
        name: text(row[2]),
        category: text(row[3]) || "other",
        unit: text(row[4]) || "unit",
        qty: money(row[5]),
        minimumQty: money(row[6]),
        reorderQty: money(row[7]),
        unitCost: money(row[8]),
        supplier: text(row[9]) || "TBA",
        location: text(row[10]) || "TBA",
        status: text(row[11]) || "ok",
        lastMovementAt: text(row[12]),
        notes: text(row[13]),
        rowNumber: index + 2,
      })).filter((item) => item.id && item.name);

      const invItem = items.find(
        (item) => item.id === po.itemId || item.sku === po.itemId || item.name === po.itemName
      );

      if (invItem) {
        newQty = invItem.qty + qtyReceived;
        const status = stockStatus(newQty, invItem.minimumQty);
        await updateRow("InventoryMaster", invItem.rowNumber, [
          invItem.id, invItem.sku, invItem.name, invItem.category, invItem.unit,
          newQty, invItem.minimumQty, invItem.reorderQty, po.unitCost,
          po.supplierName || invItem.supplier, invItem.location, status,
          now, invItem.notes, `Receipt ${receiptId} from ${poNumber}`,
        ]);

        // Also add inventory movement
        await appendRows("InventoryMovements", [[
          now, date, invItem.id, invItem.sku, "in", qtyReceived,
          receiptId, "", "HemuHemu/OWL", `Goods receipt from PO ${poNumber}`,
        ]]);

        inventoryUpdated = true;
      }
    }

    // Update PO status
    const receiptRows = await readRange("Goods_Receipts!A1:J1000").catch(() => [] as string[][]);
    const existingReceipts = receiptRows.slice(1).filter((r) => r.some(Boolean) && text(r[2]) === poNumber);
    const totalReceived = existingReceipts.reduce((sum, r) => sum + money(r[5]), 0) + qtyReceived;
    const newStatus = totalReceived >= po.quantity ? "received" : "partial";

    await updateRow("PurchaseOrders", po.rowNumber, [
      po.id, po.date, po.supplierId, po.supplierName, po.itemId, po.itemName,
      po.quantity, po.unit, po.unitCost, po.total, newStatus, po.expectedDate,
      po.proofUrl, [po.notes, `Received ${qtyReceived} (${condition})`].filter(Boolean).join(" | "),
    ]);

    // Update related reorder alerts
    try {
      const alertRows = await readRange("Reorder_Alerts!A1:L1000").catch(() => [] as string[][]);
      const alerts = alertRows.slice(1).filter((r) => r.some(Boolean)).map((row, index) => ({
        id: text(row[0]),
        date: text(row[1]),
        itemId: text(row[2]),
        itemName: text(row[3]),
        currentQty: money(row[4]),
        minQty: money(row[5]),
        reorderQty: money(row[6]),
        supplier: text(row[7]),
        unitCost: money(row[8]),
        totalCost: money(row[9]),
        status: text(row[10]) || "Pending PO",
        poNumber: text(row[11]),
        rowNumber: index + 2,
      })).filter((a) => a.id);

      const relatedAlert = alerts.find((a) => a.poNumber === poNumber || a.itemId === po.itemId);
      if (relatedAlert && newStatus === "received") {
        await updateRow("ReorderAlerts", relatedAlert.rowNumber, [
          relatedAlert.id, relatedAlert.date, relatedAlert.itemId, relatedAlert.itemName,
          inventoryUpdated ? newQty : relatedAlert.currentQty, relatedAlert.minQty,
          relatedAlert.reorderQty, relatedAlert.supplier, relatedAlert.unitCost,
          relatedAlert.totalCost, "Completed", poNumber,
        ]);
      }
    } catch {
      // Non-critical: alert update failure shouldn't block receipt
    }

    const auditStatus = await appendReceiptAudit({
      action: "Goods Receipt Confirmed",
      target: `Goods_Receipts:${receiptId}`,
      summary: `Received ${qtyReceived} ${po.unit} for PO ${poNumber} (${po.itemName}); condition ${condition}; inventoryUpdated=${inventoryUpdated}`,
    });

    return NextResponse.json({
      success: true,
      receiptId,
      poNumber,
      itemName: po.itemName,
      qtyReceived,
      condition,
      inventoryUpdated,
      newQty: inventoryUpdated ? newQty : undefined,
      poStatus: newStatus,
      auditStatus,
      syncedSheets: ["Goods_Receipts", "Purchase_Orders", ...(inventoryUpdated ? ["Inventory_Master", "Inventory_Movements"] : [])],
    }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource("Google Sheets: Goods_Receipts + Purchase_Orders + Inventory_Master", error),
        error: "Google OAuth perlu re-auth",
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Gagal konfirmasi receipt", details: String(error) }, { status: 500 });
  }
}
