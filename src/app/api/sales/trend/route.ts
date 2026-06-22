import { NextRequest, NextResponse } from "next/server";
import {
  getTrendAnalysis,
  ensureSalesSheetsInitialized,
} from "@/lib/sheets/sales-sheets";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get("year")) || new Date().getFullYear();

    await ensureSalesSheetsInitialized();
    const { brandTrends } = await getTrendAnalysis(year);

    return NextResponse.json({
      source: "Google Sheets: Sales_Targets + Sales_Actuals",
      year,
      brandTrends,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menghitung trend", details: String(error) },
      { status: 500 }
    );
  }
}
