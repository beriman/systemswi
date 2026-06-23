import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readRange } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await readRange("Inventory_Master!A1:O1000");
    const items = rows
      .slice(1)
      .filter((r) => r.some(Boolean))
      .map((row, index) => ({
        id: String(row[0] || row[1] || `INV-${index + 1}`),
        sku: String(row[1] || ""),
        name: String(row[2] || ""),
        category: String(row[3] || "other"),
        unit: String(row[4] || "unit"),
        qty: Number(String(row[5] || "0").replace(/[^\d.-]/g, "")) || 0,
        minimumQty: Number(String(row[6] || "0").replace(/[^\d.-]/g, "")) || 0,
        reorderQty: Number(String(row[7] || "0").replace(/[^\d.-]/g, "")) || 0,
        unitCost: Number(String(row[8] || "0").replace(/[^\d.-]/g, "")) || 0,
        supplier: String(row[9] || "TBA"),
        location: String(row[10] || "TBA"),
        status: String(row[11] || "ok"),
        lastMovementAt: String(row[12] || ""),
        notes: String(row[13] || ""),
        rowNumber: index + 2,
      }))
      .filter((item) => item.id && item.name);

    return NextResponse.json({
      source: "Google Sheets: Inventory_Master",
      items,
      total: items.length,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Inventory_Master", error),
        items: [],
        total: 0,
      });
    }
    return NextResponse.json(
      { error: "Gagal membaca inventory", details: String(error) },
      { status: 500 }
    );
  }
}
