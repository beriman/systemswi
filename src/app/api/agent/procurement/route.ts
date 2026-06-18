// GET /api/agent/procurement — Check low stock + draft POs
// POST /api/agent/procurement — Draft POs + send Telegram approval
import { NextRequest, NextResponse } from "next/server";
import { draftProcurementPOs, formatProcurementForTelegram } from "@/lib/agent/procurement-auto";
import { sendTelegramMessage, isTelegramConfigured } from "@/lib/agent/telegram";
import { logAgentActionSafe } from "@/lib/agent/audit";

export const runtime = "nodejs";

export async function GET() {
  try {
    const report = await draftProcurementPOs();
    return NextResponse.json({
      source: "Google Sheets: Inventory_Master + Supplier_Master",
      lowStockItems: report.lowStockItems,
      poDrafts: report.poDrafts.map((po) => ({
        id: po.id,
        supplier: po.supplier.name,
        items: po.items.length,
        grandTotal: po.grandTotal,
        deliveryDate: po.deliveryDate,
        status: po.status,
      })),
      totalDrafts: report.totalDrafts,
      totalValue: report.totalValue,
      suppliersContacted: report.suppliersContacted,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to run procurement check", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const report = await draftProcurementPOs();

    await logAgentActionSafe({
      timestamp: new Date().toISOString(),
      agent: "HemuHemu/OWL",
      action: "Procurement Auto — Draft POs",
      target: "Inventory_Master + Supplier_Master",
      status: "success",
      humanApproved: "pending",
      notes: `${report.totalDrafts} PO drafts, ${report.lowStockItems.length} low stock items, total Rp ${report.totalValue.toLocaleString("id-ID")}`,
    });

    let telegramSent = false;
    if (isTelegramConfigured() && report.totalDrafts > 0) {
      await sendTelegramMessage(formatProcurementForTelegram(report));
      telegramSent = true;
    }

    return NextResponse.json({
      ...report,
      telegramSent,
      telegramConfigured: isTelegramConfigured(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to draft POs", details: String(error) },
      { status: 500 }
    );
  }
}
