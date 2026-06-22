import { NextRequest, NextResponse } from "next/server";
import { getTrendAnalysis } from "@/lib/sheets/sales-sheets";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get("year")) || new Date().getFullYear();

    const trend = await getTrendAnalysis(year);
    return NextResponse.json(trend);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch trend analysis" },
      { status: 500 }
    );
  }
}
