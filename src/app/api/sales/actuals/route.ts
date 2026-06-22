// GET /api/sales/actuals — List all actual sales
// POST /api/sales/actuals — Record a new actual sale
// Uses Google Sheets as source of truth (Sales_Actuals sheet)
import { NextRequest, NextResponse } from "next/server";
import { readRange, appendRows } from "@/lib/sheets/sheets-real";

function n(value: unknown): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  return Number(cleaned) || 0;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// Sales_Actuals columns:
// A: Actual ID, B: Date, C: Brand ID, D: Brand Name,
// E: Product/SKU, F: Qty Sold, G: Unit Price, H: Total Revenue,
// I: Channel, J: Notes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId") || "";
    const month = searchParams.get("month") || "";
    const year = searchParams.get("year") || "";

    const rows = await readRange("Sales_Actuals!A1:J1000");
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ actuals: [], source: "sheets" });
    }

    let actuals = rows.slice(1).filter((r) => r.some(Boolean)).map((row) => ({
      actualId: row[0] || "",
      date: row[1] || "",
      brandId: row[2] || "",
      brandName: row[3] || "",
      productSku: row[4] || "",
      qtySold: n(row[5]),
      unitPrice: n(row[6]),
      totalRevenue: n(row[7]),
      channel: row[8] || "",
      notes: row[9] || "",
    }));

    // Apply filters
    if (brandId) {
      actuals = actuals.filter((a) => a.brandId === brandId);
    }
    if (year) {
      actuals = actuals.filter((a) => a.date.startsWith(year));
    }
    if (month) {
      const m = String(month).padStart(2, "0");
      actuals = actuals.filter((a) => {
        const parts = a.date.split("-");
        return parts.length >= 2 && parts[1] === m;
      });
    }

    // Sort by date descending
    actuals.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    return NextResponse.json({ actuals, source: "sheets", count: actuals.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch actual sales", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = today();

    const actualId = body.actualId || `SA-${Date.now()}`;
    const date = body.date || now;
    const qtySold = Number(body.qtySold) || 0;
    const unitPrice = Number(body.unitPrice) || 0;
    const totalRevenue = body.totalRevenue !== undefined
      ? Number(body.totalRevenue)
      : qtySold * unitPrice;

    await appendRows("Sales_Actuals", [[
      actualId,
      date,
      body.brandId || "",
      body.brandName || "",
      body.productSku || "",
      qtySold,
      unitPrice,
      totalRevenue,
      body.channel || "Direct",
      body.notes || "",
    ]]);

    return NextResponse.json({
      actual: {
        actualId,
        date,
        brandId: body.brandId,
        brandName: body.brandName,
        productSku: body.productSku,
        qtySold,
        unitPrice,
        totalRevenue,
        channel: body.channel || "Direct",
        notes: body.notes || "",
      },
      action: "created",
      source: "sheets",
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to record actual sale", details: String(error) },
      { status: 500 }
    );
  }
}
