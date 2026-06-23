// GET /api/sukuk/creditors — List all creditors from Sukuk_Creditor!A1:Z20
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";

export async function GET() {
  try {
    const rows = await readRange("Sukuk_Creditor!A1:Z20");
    if (!rows || rows.length === 0) {
      return NextResponse.json({ creditors: [], source: "sheets" });
    }
    const dataRows = rows[0]?.[0] === "ID" ? rows.slice(1) : rows;
    const creditors = dataRows
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
        tipe: r[8] || "",
        plafon: Number(r[9]) || 0,
        saldo_pinjaman: Number(r[10]) || 0,
        tenor_bulan: Number(r[11]) || 0,
        bunga_persen: Number(r[12]) || 0,
        status: r[13] || "aktif",
        tanggal_akad: r[14] || "",
        catatan: r[15] || "",
      }));
    return NextResponse.json({ creditors, source: "sheets" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch creditors", details: String(error) },
      { status: 500 }
    );
  }
}
