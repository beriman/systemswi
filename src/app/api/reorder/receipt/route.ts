import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceWriteBlockedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { appendSwiMemoryLog } from "@/lib/google/audit-log";
import { confirmReceipt } from "@/lib/sheets/reorder-sheets";

export const runtime = "nodejs";

const text = (value: unknown) => String(value ?? "").trim();

async function appendReorderAudit(entry: { action: string; target: string; summary: string }) {
  try {
    await appendSwiMemoryLog(entry);
    return "ok";
  } catch (error) {
    return isGoogleWorkspaceAuthError(error) ? "blocked" : `warning:${String(error).slice(0, 160)}`;
  }
}

/**
 * PUT — Confirm goods receipt → update inventory
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const poNumber = text(body.poNumber);
    const itemId = text(body.itemId);
    const itemName = text(body.itemName);
    const qtyReceived = Number(body.qtyReceived);
    const unitCost = Number(body.unitCost) || 0;
    const condition = (text(body.condition) || "Good") as "Good" | "Damaged" | "Partial";

    if (!poNumber) {
      return NextResponse.json({ error: "poNumber wajib diisi" }, { status: 400 });
    }
    if (!itemId) {
      return NextResponse.json({ error: "itemId wajib diisi" }, { status: 400 });
    }
    if (!qtyReceived || qtyReceived <= 0) {
      return NextResponse.json({ error: "qtyReceived wajib lebih dari 0" }, { status: 400 });
    }

    const result = await confirmReceipt({
      poNumber,
      itemId,
      itemName,
      qtyReceived,
      unitCost,
      condition,
      notes: text(body.notes),
    });

    const auditStatus = await appendReorderAudit({
      action: "Reorder Goods Receipt",
      target: `Goods_Receipts:${result.receipt.receiptId}`,
      summary: `Received ${qtyReceived} of ${itemName} for PO ${poNumber}; condition ${condition}; inventoryUpdated=${result.inventoryUpdated}`,
    });

    return NextResponse.json({
      success: true,
      receipt: result.receipt,
      inventoryUpdated: result.inventoryUpdated,
      auditStatus,
      syncedSheets: [
        "Goods_Receipts",
        "Purchase_Orders",
        ...(result.inventoryUpdated ? ["Inventory_Master", "Inventory_Movements"] : []),
      ],
    }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource("Google Sheets: Goods_Receipts + Inventory_Master", error),
        error: "Google Workspace OAuth perlu re-auth sebelum bisa menyimpan receipt.",
      }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Gagal konfirmasi receipt", details: String(error) },
      { status: 500 }
    );
  }
}
