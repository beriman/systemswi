// GET /api/sukuk/investors — List investors
// POST /api/sukuk/investors — Add new investor
import { NextRequest, NextResponse } from "next/server";
import { readRange, appendRows } from "@/lib/sheets/sheets-real";

// SukukInvestor: SukukStore!A12:O26
const INVESTOR_RANGE = "SukukStore!A12:O26";
const HEADER_ROW = 12;

export async function GET() {
  try {
    const rows = await readRange(INVESTOR_RANGE);
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ investors: [], source: "sheets" });
    }
    const investors = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[0] && !r[1]) continue;
      investors.push({
        id: r[0] || String(i),
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
        consent: r[11] || "0",
        tanggal_daftar: r[12] || "",
        catatan: r[13] || "",
        row_number: HEADER_ROW + i,
      });
    }
    return NextResponse.json({ investors, source: "sheets" });
  } catch (error) {
    return NextResponse.json({ investors: [], source: "error", error: String(error) });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const nama = body.nama?.trim();
    if (!nama) {
      return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
    }
    const id = body.id || `INV-${Date.now()}`;
    const row = [
      id, nama,
      body.email || "", body.telepon || "", body.alamat || "",
      body.npwp || "", body.bank || "", body.no_rekening || "",
      Number(body.saldo_investasi) || 0, Number(body.total_profit) || 0,
      body.status || "aktif", body.consent ? "1" : "0",
      new Date().toISOString().split("T")[0], body.catatan || "",
    ];
    await appendRows("SukukInvestor", [row]);
    return NextResponse.json({ investor: { id, nama, status: "aktif" }, source: "sheets" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menambah investor", details: String(error) }, { status: 500 });
  }
}
