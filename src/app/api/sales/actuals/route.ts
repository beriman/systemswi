import { NextRequest, NextResponse } from "next/server";
import {
  getSalesActuals,
  createActual,
  ensureSalesSheetsInitialized,
} from "@/lib/sheets/sales-sheets";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") ? Number(searchParams.get("year")) : undefined;
    const brandId = searchParams.get("brandId") || undefined;

    await ensureSalesSheetsInitialized();
    const actuals = await getSalesActuals(year, brandId);

    return NextResponse.json({
      source: "Google Sheets: Sales_Actuals",
      actuals,
      count: actuals.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal membaca sales actuals", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, brandId, brandName, productSku, qtySold, unitPrice, channel, notes } = body;

    if (!date) return NextResponse.json({ error: "date wajib diisi" }, { status: 400 });
    if (!brandId) return NextResponse.json({ error: "brandId wajib diisi" }, { status: 400 });
    if (!brandName) return NextResponse.json({ error: "brandName wajib diisi" }, { status: 400 });
    if (!qtySold || Number(qtySold) <= 0)
      return NextResponse.json({ error: "qtySold wajib lebih dari 0" }, { status: 400 });
    if (!unitPrice || Number(unitPrice) <= 0)
      return NextResponse.json({ error: "unitPrice wajib lebih dari 0" }, { status: 400 });

    await ensureSalesSheetsInitialized();
    const actual = await createActual({
      date: String(date),
      brandId: String(brandId),
      brandName: String(brandName),
      productSku: String(productSku || ""),
      qtySold: Number(qtySold),
      unitPrice: Number(unitPrice),
      channel: String(channel || "Direct"),
      notes: notes ? String(notes) : undefined,
    });

    return NextResponse.json(
      { success: true, actual, syncedSheets: ["Sales_Actuals"] },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menyimpan sales actual", details: String(error) },
      { status: 500 }
    );
  }
}
