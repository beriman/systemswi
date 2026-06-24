import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, googleWorkspaceWriteBlockedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readRange, appendRows } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

type MovementInput = {
  itemId?: string;
  type?: "in" | "out" | "adjustment";
  quantity?: number | string;
  reference?: string;
  proofUrl?: string;
  pic?: string;
  notes?: string;
};

const money = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(/[^\d.-]/g, ""));
  return 0;
};

const text = (value: unknown) => String(value ?? "").trim();

function stockStatus(qty: number, minimumQty: number): string {
  if (qty <= 0) return "empty";
  if (qty <= minimumQty * 0.5) return "critical";
  if (qty <= minimumQty) return "low";
  return "ok";
}

function parseItems(rows: string[][]) {
  return rows
    .slice(1)
    .filter((r) => r.some(Boolean))
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
      status: stockStatus(money(row[5]), money(row[6])),
      lastMovementAt: text(row[12]),
      notes: text(row[13]),
      rowNumber: index + 2,
    }))
    .filter((item) => item.id && item.name);
}

// GET — list all items + summary + recent movements
export async function GET() {
  try {
    const [masterRows, movementRows] = await Promise.all([
      readRange("Inventory_Master!A1:O1000"),
      readRange("Inventory_Movements!A1:J1000"),
    ]);

    const items = parseItems(masterRows);

    // Compute summary
    const totalItems = items.length;
    const totalValue = items.reduce((sum, i) => sum + i.qty * i.unitCost, 0);
    const lowStockCount = items.filter((i) => i.status === "low").length;
    const criticalCount = items.filter((i) => i.status === "critical" || i.status === "empty").length;
    const alertCount = lowStockCount + criticalCount;
    const alerts = items.filter((i) => i.status === "low" || i.status === "critical" || i.status === "empty");

    // Merchandise breakdown
    const merchandiseItems = items.filter((i) => {
      const h = `${i.category} ${i.sku} ${i.name} ${i.location} ${i.notes}`.toLowerCase();
      return h.includes("merch") || h.includes("tim") || h.includes("apparel") || h.includes("retail");
    });

    // Recent movements (last 30)
    const movements = movementRows
      .slice(1)
      .filter((r) => r.some(Boolean))
      .map((row) => ({
        id: text(row[0]) || text(row[6]) || "",
        timestamp: text(row[0]) || "",
        date: text(row[1]) || text(row[0] || "").slice(0, 10),
        itemId: text(row[2]) || "",
        sku: text(row[3]) || "",
        type: text(row[4]) || "",
        quantity: money(row[5]),
        reference: text(row[6]) || "",
        proofUrl: text(row[7]) || "",
        pic: text(row[8]) || "",
        notes: text(row[9]) || "",
      }))
      .reverse()
      .slice(0, 30);

    return NextResponse.json({
      source: "Google Sheets: Inventory_Master + Inventory_Movements",
      sourceStatus: "live",
      items,
      movements,
      summary: {
        totalItems,
        totalValue,
        alertCount,
        lowStockCount,
        criticalCount,
        alerts,
        merchandise: {
          totalItems: merchandiseItems.length,
          totalValue: merchandiseItems.reduce((s, i) => s + i.qty * i.unitCost, 0),
          alertCount: merchandiseItems.filter((i) => i.status === "low" || i.status === "critical").length,
          reorderPlan: merchandiseItems
            .filter((i) => i.status === "low" || i.status === "critical")
            .map((i) => ({
              id: i.id, sku: i.sku, name: i.name, vendor: i.supplier, location: i.location,
              qty: i.qty, unit: i.unit, minimumQty: i.minimumQty, reorderQty: i.reorderQty,
              status: i.status, notes: i.notes,
            })),
        },
      },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Inventory_Master", error),
        items: [],
        movements: [],
        summary: { totalItems: 0, totalValue: 0, alertCount: 0, lowStockCount: 0, criticalCount: 0, alerts: [] },
      });
    }
    return NextResponse.json(
      { error: "Gagal membaca inventory", details: String(error) },
      { status: 500 }
    );
  }
}

// POST — record a stock movement (in / out / adjustment)
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MovementInput;
    const itemId = text(body.itemId);
    const type = text(body.type) || "in";
    const quantity = money(body.quantity);
    const reference = text(body.reference);
    const proofUrl = text(body.proofUrl);
    const pic = text(body.pic) || "HemuHemu/OWL";
    const notes = text(body.notes);

    if (!itemId) return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    if (!quantity || quantity <= 0) return NextResponse.json({ error: "quantity must be > 0" }, { status: 400 });
    if (!["in", "out", "adjustment"].includes(type)) {
      return NextResponse.json({ error: "type must be 'in', 'out', or 'adjustment'" }, { status: 400 });
    }

    // Find the item in master
    const masterRows = await readRange("Inventory_Master!A1:O1000");
    const items = parseItems(masterRows);
    const item = items.find((i) => i.id === itemId || i.sku === itemId);
    if (!item) return NextResponse.json({ error: `Item ${itemId} not found` }, { status: 404 });

    // Calculate new qty
    let newQty = item.qty;
    if (type === "in") newQty = item.qty + quantity;
    else if (type === "out") newQty = Math.max(0, item.qty - quantity);
    else if (type === "adjustment") newQty = quantity;

    const newStatus = stockStatus(newQty, item.minimumQty);
    const timestamp = new Date().toISOString();

    // Append movement row to Inventory_Movements
    // Schema: Timestamp | Date | ItemID | SKU | Type | Quantity | Reference | ProofURL | PIC | Notes
    await appendRows("InventoryMovements", [[
      timestamp,
      timestamp.slice(0, 10),
      item.id,
      item.sku,
      type,
      quantity,
      reference,
      proofUrl,
      pic,
      notes,
    ]]);

    // Update master row qty + status + lastMovementAt
    const { updateRow } = await import("@/lib/sheets/sheets-real");
    await updateRow("InventoryMaster", item.rowNumber, [
      item.id, item.sku, item.name, item.category, item.unit,
      newQty, item.minimumQty, item.reorderQty, item.unitCost,
      item.supplier, item.location, newStatus, timestamp, item.notes, "",
    ]);

    return NextResponse.json({
      source: "Google Sheets: Inventory_Movements + Inventory_Master",
      sourceStatus: "live",
      success: true,
      action: "movement",
      movement: { itemId: item.id, sku: item.sku, type, quantity, reference, proofUrl, pic, timestamp },
      item: { id: item.id, name: item.name, qty: newQty, unit: item.unit, status: newStatus },
    }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource("Google Sheets: Inventory_Movements", error),
        error: "Google OAuth perlu re-auth",
      }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Gagal menyimpan movement", details: String(error) },
      { status: 500 }
    );
  }
}
