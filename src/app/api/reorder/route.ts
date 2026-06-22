import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, googleWorkspaceWriteBlockedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { appendRows, readRange, updateRow } from "@/lib/sheets/sheets-real";
import { appendSwiMemoryLog } from "@/lib/google/audit-log";

export const runtime = "nodejs";

// ── Types ──

type ReorderAlert = {
  id: string;
  date: string;
  itemId: string;
  itemName: string;
  currentQty: number;
  minQty: number;
  reorderQty: number;
  supplier: string;
  unitCost: number;
  totalCost: number;
  status: "Pending PO" | "PO Created" | "Completed";
  poNumber: string;
  rowNumber: number;
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
  rowNumber: number;
};

// ── Helpers ──

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

function parseInventory(rows: string[][]): InventoryItem[] {
  return rows
    .slice(1)
    .filter((row) => row.some(Boolean))
    .map((row, index) => ({
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
      rowNumber: index + 2,
    }))
    .filter((item) => item.id && item.name);
}

function parseAlerts(rows: string[][]): ReorderAlert[] {
  return rows
    .slice(1)
    .filter((row) => row.some(Boolean))
    .map((row, index) => ({
      id: text(row[0]) || `RA-${index + 1}`,
      date: text(row[1]),
      itemId: text(row[2]),
      itemName: text(row[3]),
      currentQty: money(row[4]),
      minQty: money(row[5]),
      reorderQty: money(row[6]),
      supplier: text(row[7]) || "TBA",
      unitCost: money(row[8]),
      totalCost: money(row[9]),
      status: (text(row[10]) as ReorderAlert["status"]) || "Pending PO",
      poNumber: text(row[11]),
      rowNumber: index + 2,
    }))
    .filter((a) => a.id && a.itemName);
}

function makeAlertId() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `RA-${today}-${Date.now().toString(36).toUpperCase()}`;
}

function makePoNumber() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `PO-${today}-${Date.now().toString(36).toUpperCase()}`;
}

async function appendReorderAudit(entry: { action: string; target: string; summary: string }) {
  try {
    await appendSwiMemoryLog(entry);
    return "ok";
  } catch (error) {
    return isGoogleWorkspaceAuthError(error) ? "blocked" : `warning:${String(error).slice(0, 160)}`;
  }
}

// ── GET — list items needing reorder + existing alerts ──

export async function GET() {
  try {
    const [masterRows, alertRows] = await Promise.all([
      readRange("Inventory_Master!A1:O1000"),
      readRange("Reorder_Alerts!A1:L1000").catch(() => [] as string[][]),
    ]);

    const items = parseInventory(masterRows);
    const alerts = parseAlerts(alertRows);

    // Auto-generate alerts for items below minimum that don't have an active alert
    const activeAlertItemIds = new Set(
      alerts
        .filter((a) => a.status !== "Completed")
        .map((a) => a.itemId)
    );

    const needsReorder = items.filter(
      (item) => item.qty <= item.minimumQty && !activeAlertItemIds.has(item.id)
    );

    // Auto-create alerts for new items below minimum
    const newAlerts: ReorderAlert[] = [];
    for (const item of needsReorder) {
      const alertId = makeAlertId();
      const reorderQty = item.reorderQty > 0 ? item.reorderQty : item.minimumQty * 2;
      const totalCost = reorderQty * item.unitCost;
      const now = new Date().toISOString();
      const alert: ReorderAlert = {
        id: alertId,
        date: now.slice(0, 10),
        itemId: item.id,
        itemName: item.name,
        currentQty: item.qty,
        minQty: item.minimumQty,
        reorderQty,
        supplier: item.supplier,
        unitCost: item.unitCost,
        totalCost,
        status: "Pending PO",
        poNumber: "",
        rowNumber: 0, // will be set after append
      };
      newAlerts.push(alert);
    }

    if (newAlerts.length > 0) {
      await appendRows("ReorderAlerts", newAlerts.map((a) => [
        a.id, a.date, a.itemId, a.itemName, a.currentQty, a.minQty,
        a.reorderQty, a.supplier, a.unitCost, a.totalCost, a.status, a.poNumber,
      ]));
      // Re-read alerts after appending
      const freshAlertRows = await readRange("Reorder_Alerts!A1:L1000").catch(() => alertRows);
      alerts.push(...parseAlerts(freshAlertRows).slice(-newAlerts.length));
    }

    const allAlerts = [...alerts];
    const pendingCount = allAlerts.filter((a) => a.status === "Pending PO").length;
    const totalReorderValue = allAlerts
      .filter((a) => a.status !== "Completed")
      .reduce((sum, a) => sum + a.totalCost, 0);

    return NextResponse.json({
      source: "Google Sheets: Inventory_Master + Reorder_Alerts",
      items: items.map((item) => ({
        ...item,
        status: stockStatus(item.qty, item.minimumQty),
        needsReorder: item.qty <= item.minimumQty,
      })),
      alerts: allAlerts,
      summary: {
        totalItems: items.length,
        belowMinimum: items.filter((i) => i.qty <= i.minimumQty).length,
        totalReorderValue,
        pendingAlerts: pendingCount,
        poCreated: allAlerts.filter((a) => a.status === "PO Created").length,
        completed: allAlerts.filter((a) => a.status === "Completed").length,
      },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Inventory_Master + Reorder_Alerts", error),
        items: [],
        alerts: [],
        summary: { totalItems: 0, belowMinimum: 0, totalReorderValue: 0, pendingAlerts: 0, poCreated: 0, completed: 0 },
      });
    }
    return NextResponse.json({ error: "Gagal membaca reorder data", details: String(error) }, { status: 500 });
  }
}

// ── POST — generate PO from alert ──

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const alertId = text(body.alertId);

    if (!alertId) {
      return NextResponse.json({ error: "alertId wajib diisi" }, { status: 400 });
    }

    // Read alerts
    const alertRows = await readRange("Reorder_Alerts!A1:L1000").catch(() => [] as string[][]);
    const alerts = parseAlerts(alertRows);
    const alert = alerts.find((a) => a.id === alertId);

    if (!alert) {
      return NextResponse.json({ error: `Alert ${alertId} tidak ditemukan` }, { status: 404 });
    }

    if (alert.status === "PO Created") {
      return NextResponse.json({ error: `Alert ${alertId} sudah memiliki PO: ${alert.poNumber}` }, { status: 400 });
    }

    // Generate PO number
    const poNumber = makePoNumber();
    const now = new Date().toISOString();
    const date = now.slice(0, 10);

    // Create PO row
    const poRow = [
      poNumber,
      date,
      alert.supplier,
      alert.supplier,
      alert.itemId,
      alert.itemName,
      alert.reorderQty,
      "unit",
      alert.unitCost,
      alert.totalCost,
      "ordered",
      date,
      "",
      `Auto-generated from Reorder Alert ${alertId}`,
    ];
    await appendRows("PurchaseOrders", [poRow]);

    // Update alert status
    await updateRow("ReorderAlerts", alert.rowNumber, [
      alert.id, alert.date, alert.itemId, alert.itemName, alert.currentQty,
      alert.minQty, alert.reorderQty, alert.supplier, alert.unitCost, alert.totalCost,
      "PO Created", poNumber,
    ]);

    const auditStatus = await appendReorderAudit({
      action: "Reorder PO Generated",
      target: `Purchase_Orders:${poNumber}`,
      summary: `Generated PO ${poNumber} from alert ${alertId} for ${alert.itemName}; qty ${alert.reorderQty}; total ${alert.totalCost}`,
    });

    return NextResponse.json({
      success: true,
      poNumber,
      alertId,
      itemName: alert.itemName,
      reorderQty: alert.reorderQty,
      totalCost: alert.totalCost,
      auditStatus,
      syncedSheets: ["Purchase_Orders", "Reorder_Alerts"],
    }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource("Google Sheets: Reorder_Alerts + Purchase_Orders", error),
        error: "Google OAuth perlu re-auth",
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Gagal generate PO", details: String(error) }, { status: 500 });
  }
}
