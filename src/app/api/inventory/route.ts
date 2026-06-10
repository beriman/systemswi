import { NextRequest, NextResponse } from "next/server";
import { appendRows, readRange, updateRow } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  category: "raw_material" | "packaging" | "finished_good" | "other";
  unit: string;
  qty: number;
  minimumQty: number;
  reorderQty: number;
  unitCost: number;
  supplier: string;
  location: string;
  status: "ok" | "low" | "critical" | "empty";
  lastMovementAt: string;
  notes: string;
  rowNumber: number;
};

type MovementInput = {
  itemId?: string;
  sku?: string;
  type?: "in" | "out" | "adjustment";
  quantity?: number | string;
  unitCost?: number | string;
  reference?: string;
  proofUrl?: string;
  pic?: string;
  notes?: string;
  date?: string;
};

const money = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(/[^\d.-]/g, ""));
  return 0;
};

const text = (value: unknown) => String(value ?? "").trim();

function stockStatus(qty: number, minimumQty: number): InventoryItem["status"] {
  if (qty <= 0) return "empty";
  if (qty <= minimumQty * 0.5) return "critical";
  if (qty <= minimumQty) return "low";
  return "ok";
}

function parseItems(rows: string[][]): InventoryItem[] {
  return rows
    .slice(1)
    .map((row, index) => {
      const qty = money(row[5]);
      const minimumQty = money(row[6]);
      const item: InventoryItem = {
        id: text(row[0]) || text(row[1]) || `INV-${index + 1}`,
        sku: text(row[1]),
        name: text(row[2]),
        category: (text(row[3]) as InventoryItem["category"]) || "other",
        unit: text(row[4]) || "unit",
        qty,
        minimumQty,
        reorderQty: money(row[7]),
        unitCost: money(row[8]),
        supplier: text(row[9]) || "TBA",
        location: text(row[10]) || "TBA",
        status: stockStatus(qty, minimumQty),
        lastMovementAt: text(row[12]),
        notes: text(row[13]),
        rowNumber: index + 2,
      };
      return item;
    })
    .filter((item) => item.id && item.name);
}

function summarize(items: InventoryItem[]) {
  const totalValue = items.reduce((sum, item) => sum + item.qty * item.unitCost, 0);
  const alerts = items.filter((item) => item.status !== "ok");
  const byCategory = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  return {
    totalItems: items.length,
    totalValue,
    alertCount: alerts.length,
    lowStockCount: alerts.filter((item) => item.status === "low").length,
    criticalCount: alerts.filter((item) => item.status === "critical" || item.status === "empty").length,
    byCategory,
    alerts: alerts.slice(0, 20),
  };
}

async function readMovements() {
  const rows = await readRange("Inventory_Movements!A1:J200");
  return rows
    .slice(1)
    .filter((row) => row.some(Boolean))
    .slice(-30)
    .reverse()
    .map((row, index) => ({
      id: `${row[0] || "movement"}-${index}`,
      timestamp: text(row[0]),
      date: text(row[1]),
      itemId: text(row[2]),
      sku: text(row[3]),
      type: text(row[4]),
      quantity: money(row[5]),
      reference: text(row[6]),
      proofUrl: text(row[7]),
      pic: text(row[8]),
      notes: text(row[9]),
    }));
}

export async function GET() {
  try {
    const [masterRows, movements] = await Promise.all([
      readRange("Inventory_Master!A1:O1000"),
      readMovements().catch(() => []),
    ]);
    const items = parseItems(masterRows);
    return NextResponse.json({
      source: "Google Sheets: Inventory_Master + Inventory_Movements",
      items,
      movements,
      summary: summarize(items),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal membaca inventory", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MovementInput;
    const quantity = money(body.quantity);
    const type = body.type;

    if (!type || !["in", "out", "adjustment"].includes(type)) {
      return NextResponse.json({ error: "type wajib in, out, atau adjustment" }, { status: 400 });
    }
    if (!body.itemId && !body.sku) {
      return NextResponse.json({ error: "itemId atau sku wajib diisi" }, { status: 400 });
    }
    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: "quantity wajib lebih dari 0" }, { status: 400 });
    }

    const masterRows = await readRange("Inventory_Master!A1:O1000");
    const items = parseItems(masterRows);
    const item = items.find((candidate) =>
      (body.itemId && candidate.id.toLowerCase() === body.itemId.toLowerCase()) ||
      (body.sku && candidate.sku.toLowerCase() === body.sku.toLowerCase())
    );

    if (!item) {
      return NextResponse.json({ error: "Item inventory tidak ditemukan" }, { status: 404 });
    }

    const delta = type === "in" ? quantity : type === "out" ? -quantity : quantity - item.qty;
    const newQty = item.qty + delta;
    if (newQty < 0) {
      return NextResponse.json({ error: "Stock tidak cukup untuk movement keluar" }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const date = body.date || timestamp.slice(0, 10);
    const unitCost = money(body.unitCost) || item.unitCost;
    const status = stockStatus(newQty, item.minimumQty);
    const movementRow = [
      timestamp,
      date,
      item.id,
      item.sku,
      type,
      quantity,
      body.reference || "",
      body.proofUrl || "",
      body.pic || "HemuHemu/OWL",
      body.notes || "",
    ];

    await appendRows("InventoryMovements", [movementRow]);
    await updateRow("InventoryMaster", item.rowNumber, [
      item.id,
      item.sku,
      item.name,
      item.category,
      item.unit,
      newQty,
      item.minimumQty,
      item.reorderQty,
      unitCost,
      item.supplier,
      item.location,
      status,
      timestamp,
      item.notes,
      body.reference || body.proofUrl || "",
    ]);

    return NextResponse.json(
      {
        success: true,
        source: "Google Sheets",
        item: { ...item, qty: newQty, unitCost, status, lastMovementAt: timestamp },
        movement: { timestamp, date, type, quantity, reference: body.reference || "", proofUrl: body.proofUrl || "" },
        syncedSheets: ["Inventory_Master", "Inventory_Movements"],
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menyimpan movement inventory", details: String(error) },
      { status: 500 }
    );
  }
}
