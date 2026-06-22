import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, googleWorkspaceWriteBlockedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { appendSwiMemoryLog } from "@/lib/google/audit-log";
import {
  getReorderAlerts,
  getReorderSummary,
  generateReorderAlerts,
  generatePOFromAlert,
  getInventoryMaster,
} from "@/lib/sheets/reorder-sheets";

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
 * GET — List reorder alerts + summary
 * POST — action: "generate-alerts" | "generate-po"
 */
export async function GET() {
  try {
    const [alerts, summary, items] = await Promise.all([
      getReorderAlerts(),
      getReorderSummary(),
      getInventoryMaster(),
    ]);

    return NextResponse.json({
      source: "Google Sheets: Reorder_Alerts + Inventory_Master",
      alerts,
      summary,
      itemsBelowMin: items.filter((i) => i.qty <= i.minimumQty && i.minimumQty > 0),
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Reorder_Alerts + Inventory_Master", error),
        alerts: [],
        summary: { totalAlerts: 0, newAlerts: 0, poCreated: 0, totalItemsBelowMin: 0, totalReorderValue: 0, pendingPOs: 0, completedReceipts: 0 },
        itemsBelowMin: [],
      });
    }
    return NextResponse.json(
      { error: "Gagal membaca reorder data", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = text(body.action);

    if (action === "generate-alerts") {
      const alerts = await generateReorderAlerts();
      const newAlerts = alerts.filter((a) => a.status === "New");
      const auditStatus = await appendReorderAudit({
        action: "Reorder Alerts Generated",
        target: "Reorder_Alerts",
        summary: `Generated ${newAlerts.length} new reorder alerts from Inventory_Master`,
      });
      return NextResponse.json({
        success: true,
        action,
        alertsGenerated: newAlerts.length,
        alerts: newAlerts,
        auditStatus,
      }, { status: 201 });
    }

    if (action === "generate-po") {
      const alertId = text(body.alertId);
      if (!alertId) {
        return NextResponse.json({ error: "alertId wajib diisi" }, { status: 400 });
      }
      const result = await generatePOFromAlert(alertId, text(body.supplierId));
      if (!result) {
        return NextResponse.json({ error: "Gagal generate PO" }, { status: 500 });
      }
      const auditStatus = await appendReorderAudit({
        action: "Reorder PO Generated",
        target: `Purchase_Orders:${result.po.id}`,
        summary: `Generated PO ${result.po.id} from alert ${alertId} for ${result.po.itemName}; qty ${result.po.quantity}; total ${result.po.total}`,
      });
      return NextResponse.json({
        success: true,
        action,
        po: result.po,
        alert: result.alert,
        auditStatus,
        syncedSheets: ["Purchase_Orders", "Reorder_Alerts"],
      }, { status: 201 });
    }

    return NextResponse.json(
      { error: "action tidak valid. Pilih: generate-alerts, generate-po" },
      { status: 400 }
    );
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource("Google Sheets: Reorder_Alerts + Purchase_Orders", error),
        error: "Google Workspace OAuth perlu re-auth sebelum bisa menyimpan reorder data.",
      }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Gagal memproses reorder", details: String(error) },
      { status: 500 }
    );
  }
}
