// GET /api/sukuk/distributions — List profit distributions
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";

export async function GET() {
  try {
    // Distributions are derived from product and schedule data
    const rows = await readRange("Sukuk_Payment_Schedule!A1:L25");
    if (!rows || rows.length === 0) {
      return NextResponse.json({ distributions: [], source: "sheets" });
    }
    const dataRows = rows[0]?.[0] === "ID" ? rows.slice(1) : rows;
    const distributions = dataRows
      .filter((r) => r && r[0] && r[8] === "paid")
      .map((r, i) => ({
        id: i + 1,
        product_id: 1,
        product_name: r[2] || "",
        product_code: r[1] || "",
        periode: r[3] || "",
        total_revenue: (Number(r[5]) || 0) + (Number(r[6]) || 0),
        total_cogs: 0,
        total_profit: Number(r[6]) || 0,
        nisbah_investor: 60,
        nisbah_pengelola: 40,
        jumlah_dibagikan: Number(r[6]) || 0,
        jumlah_per_unit: 0,
        status: "paid",
      }));
    return NextResponse.json({ distributions, source: "sheets" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch distributions", details: String(error) },
      { status: 500 }
    );
  }
}
