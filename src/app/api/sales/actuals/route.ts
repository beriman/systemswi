// GET /api/sales/actuals?year=YYYY — List sales actual transactions
// POST /api/sales/actuals — Record a sale
import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, googleWorkspaceWriteBlockedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { appendRows, readRange, updateRow, deleteRow } from "@/lib/sheets/sheets-real";
import { appendSwiMemoryLog } from "@/lib/google/audit-log";

export const runtime = "nodejs";

const SOURCE = "Google Sheets: Sales_Actuals";

const text = (v: unknown) => String(v ?? "").trim();
const num = (v: unknown) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v !== "string") return 0;
  return Number(v.replace(/[^\d.-]/g, "")) || 0;
};

function parseActuals(rows: string[][]) {
  return rows.slice(1).filter((r) => r.some(Boolean)).map((row, idx) => ({
    rowNumber: idx + 2,
    actualId: text(row[0]) || `SA-${idx + 1}`,
    date: text(row[1]) || "",
    brandId: text(row[2]) || "",
    brandName: text(row[3]) || "",
    productSku: text(row[4]) || "",
    productName: text(row[5]) || "",
    qtySold: num(row[6]) || 0,
    unitPrice: num(row[7]) || 0,
    totalRevenue: num(row[8]) || 0,
    channel: text(row[9]) || "Store",
    notes: text(row[10]) || "",
  }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    const rows = await readRange("Sales_Actuals!A1:J1000");
    let actuals = parseActuals(rows);

    if (year) {
      const yNum = parseInt(year);
      if (!Number.isNaN(yNum)) {
        actuals = actuals.filter((a) => a.date.startsWith(year));
      }
    }

    const totalRevenue = actuals.reduce((sum, a) => sum + a.totalRevenue, 0);
    const totalUnits = actuals.reduce((sum, a) => sum + a.qtySold, 0);

    return NextResponse.json({
      source: SOURCE,
      sourceStatus: "live",
      year: year ? parseInt(year) : null,
      actuals,
      totalRevenue,
      totalUnits,
      count: actuals.length,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        actuals: [],
        totalRevenue: 0,
        totalUnits: 0,
        count: 0,
      });
    }
    return NextResponse.json({ error: "Gagal mengambil sales actuals", details: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date().toISOString().split("T")[0];

    const actualId = body.actualId || `SA-${Date.now().toString(36).toUpperCase()}`;
    const totalRevenue = (body.qtySold || 0) * (body.unitPrice || 0);

    const row = [
      actualId,
      body.date || now,
      body.brandId || "TBA",
      body.brandName || "",
      body.productSku || "",
      body.productName || "",
      body.qtySold || 0,
      body.unitPrice || 0,
      totalRevenue,
      body.channel || "Store",
      body.notes || "",
    ];

    // Check if actualId exists
    const existing = await readRange("Sales_Actuals!A1:J1000");
    const existingRowIdx = existing.findIndex((r) => text(r[0]) === actualId);

    if (existingRowIdx > 0) {
      await updateRow("Sales_Actuals", existingRowIdx + 1, row);
    } else {
      await appendRows("Sales_Actuals", [row]);
    }

    await appendSwiMemoryLog({
      action: "sales_actual_upsert",
      target: "Sales_Actuals",
      summary: `Sale ${actualId} — ${body.brandName || "TBA"} — ${body.productName || ""} — ${body.qtySold || 0} × Rp ${(body.unitPrice || 0).toLocaleString("id-ID")} = Rp ${totalRevenue.toLocaleString("id-ID")}`,
    });

    return NextResponse.json({
      success: true,
      source: SOURCE,
      actual: { actualId, ...body, totalRevenue },
      action: existingRowIdx > 0 ? "updated" : "created",
    }, { status: existingRowIdx > 0 ? 200 : 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource(SOURCE, error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Gagal menyimpan sales actual", details: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const actualId = searchParams.get("actualId");

    if (!actualId) {
      return NextResponse.json({ error: "actualId diperlukan" }, { status: 400 });
    }

    const existing = await readRange("Sales_Actuals!A1:J1000");
    const rowIdx = existing.findIndex((r) => text(r[0]) === actualId);

    if (rowIdx <= 0) {
      return NextResponse.json({ error: "Actual tidak ditemukan" }, { status: 404 });
    }

    await deleteRow("Sales_Actuals", rowIdx + 1);

    await appendSwiMemoryLog({
      action: "sales_actual_delete",
      target: "Sales_Actuals",
      summary: `Deleted actual ${actualId}`,
    });

    return NextResponse.json({ success: true, message: `Actual ${actualId} dihapus` });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource(SOURCE, error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Gagal menghapus sales actual", details: String(error) }, { status: 500 });
  }
}
