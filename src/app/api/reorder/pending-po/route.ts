import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { getPurchaseOrders } from "@/lib/sheets/reorder-sheets";

export const runtime = "nodejs";

export async function GET() {
  try {
    const pos = await getPurchaseOrders();
    const pending = pos.filter((p) => ["draft", "ordered", "partial"].includes(p.status));

    return NextResponse.json({
      source: "Google Sheets: Purchase_Orders",
      pendingPOs: pending,
      totalPending: pending.length,
      totalValue: pending.reduce((sum, p) => sum + p.total, 0),
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Purchase_Orders", error),
        pendingPOs: [],
        totalPending: 0,
        totalValue: 0,
      });
    }
    return NextResponse.json(
      { error: "Gagal membaca pending PO", details: String(error) },
      { status: 500 }
    );
  }
}
