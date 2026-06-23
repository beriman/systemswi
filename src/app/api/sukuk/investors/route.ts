// GET /api/sukuk/investors — List all investors from SukukStore!A12:O26
// POST /api/sukuk/investors — Add new investor
import { NextRequest, NextResponse } from "next/server";
import { readRange, appendRows } from "@/lib/sheets/sheets-real";

export async function GET() {
  try {
    const rows = await readRange("SukukStore!A13:O26");
    if (!rows || rows.length === 0) {
      return NextResponse.json({ investors: [], source: "sheets" });
    }
    const dataRows = rows[0]?.[0] === "ID" ? rows.slice(1) : rows;
    const investors = dataRows
      .filter((r) => r && r[0])
      .map((r) => ({
        id: r[0] || "",
        nama: r[1] || "",
        email: r[2] || "",
        telepon: r[3] || "",
        alamat: r[4] || "",
        npwp: r[5] || "",
        bank: r[6] || "",
        no_rekening: r[7] || "",
        saldo_investasi: Number(r[8]) || 0,
        total_profit: Number(r[9]) || 0,
        status: r[10] || "aktif",
        consent: r[11] || "1",
        tanggal_daftar: r[12] || "",
        catatan: r[13] || "",
      }));
    return NextResponse.json({ investors, source: "sheets" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch investors", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.id || `INV-${Date.now()}`;
    const row = [
      id,
      body.nama || "",
      body.email || "",
      body.telepon || "",
      body.alamat || "",
      body.npwp || "",
      body.bank || "",
      body.no_rekening || "",
      Number(body.saldo_investasi) || 0,
      Number(body.total_profit) || 0,
      body.status || "aktif",
      body.consent ? "1" : "0",
      body.tanggal_daftar || new Date().toISOString().slice(0, 10),
      body.catatan || "",
    ];
    await appendRows("SukukInvestor", [row]);
    return NextResponse.json({ investor: { id, ...body }, source: "sheets" }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add investor", details: String(error) },
      { status: 500 }
    );
  }
}
