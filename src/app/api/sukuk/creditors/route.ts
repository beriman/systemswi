// GET /api/sukuk/creditors — List creditors
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";

// SukukCreditor: Sukuk_Creditor!A1:Z20
const CREDITOR_RANGE = "Sukuk_Creditor!A1:Z20";

export async function GET() {
  try {
    const rows = await readRange(CREDITOR_RANGE);
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ creditors: [], source: "sheets" });
    }
    const creditors = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[0] && !r[1]) continue;
      creditors.push({
        id: r[0] || String(i),
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
      });
    }
    return NextResponse.json({ creditors, source: "sheets" });
  } catch (error) {
    return NextResponse.json({ creditors: [], source: "error", error: String(error) });
  }
}
