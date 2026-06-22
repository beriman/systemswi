import { NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readRange } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const money = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(/[^\d.-]/g, "")) || 0;
  return 0;
};

const text = (value: unknown) => String(value ?? "").trim();

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
  status: string;
  expectedDate: string;
  proofUrl: string;
  notes: string;
  rowNumber: number;
};

function parsePOs(rows: string[][]): PurchaseOrder[] {
  return rows
    .slice(1)
    .filter((row) => row.some(Boolean))
    .map((row, index) => {
      const quantity = money(row[6]);
      const unitCost = money(row[8]);
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
        total: money(row[9]) || quantity * unitCost,
        status: text(row[10]) || "draft",
        expectedDate: text(row[11]) || "TBA",
        proofUrl: text(row[12]),
        notes: text(row[13]),
        rowNumber: index + 2,
      };
    })
    .filter((po) => po.id);
}

export async function GET() {
  try {
    const [poRows, alertRows] = await Promise.all([
      readRange("Purchase_Orders!A1:N1000"),
      readRange("Reorder_Alerts!A1:L1000").catch(() => [] as string[][]),
    ]);

    const allPOs = parsePOs(poRows);
    const pendingPOs = allPOs.filter((po) =>
      ["draft", "ordered", "partial"].includes(po.status)
    );

    const totalPendingValue = pendingPOs.reduce((sum, po) => sum + po.total, 0);

    // Parse alerts for context
    const alerts = alertRows.slice(1).filter((r) => r.some(Boolean)).map((row) => ({
      id: text(row[0]),
      itemId: text(row[2]),
      itemName: text(row[3]),
      status: text(row[10]) || "Pending PO",
      poNumber: text(row[11]),
    }));

    return NextResponse.json({
      source: "Google Sheets: Purchase_Orders + Reorder_Alerts",
      purchaseOrders: pendingPOs,
      allPOs: allPOs.slice(-50).reverse(),
      alerts,
      summary: {
        totalPending: pendingPOs.length,
        totalPendingValue,
        draft: pendingPOs.filter((po) => po.status === "draft").length,
        ordered: pendingPOs.filter((po) => po.status === "ordered").length,
        partial: pendingPOs.filter((po) => po.status === "partial").length,
        completed: allPOs.filter((po) => po.status === "received").length,
      },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Purchase_Orders", error),
        purchaseOrders: [],
        allPOs: [],
        alerts: [],
        summary: { totalPending: 0, totalPendingValue: 0, draft: 0, ordered: 0, partial: 0, completed: 0 },
      });
    }
    return NextResponse.json({ error: "Gagal membaca pending PO", details: String(error) }, { status: 500 });
  }
}
