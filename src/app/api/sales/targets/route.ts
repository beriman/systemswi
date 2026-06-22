import { NextRequest, NextResponse } from "next/server";
import {
  getSalesTargets,
  createTarget,
  ensureSalesSheetsInitialized,
} from "@/lib/sheets/sales-sheets";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") ? Number(searchParams.get("year")) : undefined;
    const brandId = searchParams.get("brandId") || undefined;

    await ensureSalesSheetsInitialized();
    const targets = await getSalesTargets(year, brandId);

    return NextResponse.json({
      source: "Google Sheets: Sales_Targets",
      targets,
      count: targets.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal membaca sales targets", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, brandName, year, month, targetAmount, notes } = body;

    if (!brandId) return NextResponse.json({ error: "brandId wajib diisi" }, { status: 400 });
    if (!brandName) return NextResponse.json({ error: "brandName wajib diisi" }, { status: 400 });
    if (!year) return NextResponse.json({ error: "year wajib diisi" }, { status: 400 });
    if (!month) return NextResponse.json({ error: "month wajib diisi" }, { status: 400 });
    if (!targetAmount || Number(targetAmount) <= 0)
      return NextResponse.json({ error: "targetAmount wajib lebih dari 0" }, { status: 400 });

    await ensureSalesSheetsInitialized();
    const target = await createTarget({
      brandId: String(brandId),
      brandName: String(brandName),
      year: Number(year),
      month: Number(month),
      targetAmount: Number(targetAmount),
      notes: notes ? String(notes) : undefined,
    });

    return NextResponse.json(
      { success: true, target, syncedSheets: ["Sales_Targets"] },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menyimpan sales target", details: String(error) },
      { status: 500 }
    );
  }
}
