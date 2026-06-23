// GET /api/sukuk/invest — List investments
// POST /api/sukuk/invest — Create investment
import { NextRequest, NextResponse } from "next/server";
import { readRange, appendRows } from "@/lib/sheets/sheets-real";

export async function GET() {
  try {
    // Investments are tracked in the products sheet or a dedicated range
    // For now, return empty — investments are created via POST
    const rows = await readRange("SukukProduk!A6:L13");
    if (!rows || rows.length === 0) {
      return NextResponse.json({ investments: [], source: "sheets" });
    }
    // Build investment list from product data
    const dataRows = rows[0]?.[0] === "ID Produk" ? rows.slice(1) : rows;
    const investments: any[] = [];
    dataRows.forEach((r, i) => {
      if (r && r[0]) {
        investments.push({
          id: i + 1,
          product_id: i + 1,
          product_name: r[1] || "",
          product_code: r[0] || "",
          investor_name: "",
          investor_email: "",
          investor_phone: "",
          jumlah_unit: 0,
          nilai_investasi: 0,
          tanggal_investasi: "",
          status: "open",
          consent: 1,
        });
      }
    });
    return NextResponse.json({ investments, source: "sheets" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch investments", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = `INV-${Date.now()}`;
    const investment = {
      id,
      product_id: body.product_id,
      investor_name: body.investor_name,
      investor_email: body.investor_email,
      investor_phone: body.investor_phone,
      jumlah_unit: Number(body.jumlah_unit) || 1,
      nilai_investasi: Number(body.nilai_investasi) || 0,
      tanggal_investasi: body.tanggal_investasi || new Date().toISOString().slice(0, 10),
      status: "active",
      consent: 1,
    };
    return NextResponse.json({ investment, source: "sheets" }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create investment", details: String(error) },
      { status: 500 }
    );
  }
}
