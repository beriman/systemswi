import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, googleWorkspaceWriteBlockedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { appendRows, readRange, updateRow, deleteRow } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

type ItemInput = {
  id?: string;
  sku?: string;
  name?: string;
  category?: string;
  unit?: string;
  qty?: number | string;
  minimumQty?: number | string;
  reorderQty?: number | string;
  unitCost?: number | string;
  supplier?: string;
  location?: string;
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

// GET — list all items
export async function GET() {
  try {
    const rows = await readRange("Inventory_Master!A1:O1000");
    const items = parseItems(rows);
    return NextResponse.json({ items, source: "Google Sheets: Inventory_Master" });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Inventory_Master", error),
        items: [],
      });
    }
    return NextResponse.json({ error: "Failed to load items", details: String(error) }, { status: 500 });
  }
}

// POST — add or update item
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ItemInput;
    const id = text(body.id) || `INV-${Date.now()}`;
    const sku = text(body.sku);
    const name = text(body.name);
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    if (!sku) return NextResponse.json({ error: "sku is required" }, { status: 400 });

    const qty = money(body.qty);
    const minimumQty = money(body.minimumQty);
    const reorderQty = money(body.reorderQty);
    const unitCost = money(body.unitCost);
    const category = text(body.category) || "raw_material";
    const unit = text(body.unit) || "pcs";
    const supplier = text(body.supplier) || "TBA";
    const location = text(body.location) || "TBA";
    const notes = text(body.notes);
    const status = stockStatus(qty, minimumQty);

    // Check if item exists (by id or sku)
    const masterRows = await readRange("Inventory_Master!A1:O1000");
    const existing = parseItems(masterRows);
    const found = existing.find((i) => i.id === id || i.sku === sku);

    if (found) {
      // Update existing row
      const rowNum = found.rowNumber;
      await updateRow("InventoryMaster", rowNum, [
        id, sku, name, category, unit, qty, minimumQty, reorderQty, unitCost,
        supplier, location, status, new Date().toISOString(), notes, "",
      ]);
      return NextResponse.json({
        success: true, action: "update", item: { id, sku, name, category, unit, qty, minimumQty, reorderQty, unitCost, supplier, location, status },
      });
    } else {
      // Append new row
      await appendRows("InventoryMaster", [[
        id, sku, name, category, unit, qty, minimumQty, reorderQty, unitCost,
        supplier, location, status, new Date().toISOString(), notes, "",
      ]]);
      return NextResponse.json({
        success: true, action: "create", item: { id, sku, name, category, unit, qty, minimumQty, reorderQty, unitCost, supplier, location, status },
      }, { status: 201 });
    }
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource("Google Sheets: Inventory_Master", error),
        error: "Google OAuth perlu re-auth",
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to save item", details: String(error) }, { status: 500 });
  }
}

// DELETE — remove item by id
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const id = text(body.id);
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const masterRows = await readRange("Inventory_Master!A1:O1000");
    const items = parseItems(masterRows);
    const found = items.find((i) => i.id === id);
    if (!found) return NextResponse.json({ error: `Item ${id} not found` }, { status: 404 });

    await deleteRow("InventoryMaster", found.rowNumber);
    return NextResponse.json({ success: true, action: "delete", id });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource("Google Sheets: Inventory_Master", error),
        error: "Google OAuth perlu re-auth",
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to delete item", details: String(error) }, { status: 500 });
  }
}
