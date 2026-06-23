// GET /api/sukuk/rab — RAB (Rencana Anggaran Biaya) data
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";

// SukukRAB: Sukuk_RAB!A1:Z30
const RAB_RANGE = "Sukuk_RAB!A1:Z30";

export async function GET() {
  try {
    const rows = await readRange(RAB_RANGE);
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ rab: [], source: "sheets" });
    }
    const rab = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[0] && !r[1]) continue;
      rab.push({
        id: r[0] || String(i),
        kategori: r[1] || "",
        deskripsi: r[2] || "",
        volume: Number(r[3]) || 0,
        satuan: r[4] || "",
        harga_satuan: Number(r[5]) || 0,
        jumlah: Number(r[6]) || 0,
        realisasi: Number(r[7]) || 0,
        variance: Number(r[8]) || 0,
        status: r[9] || "draft",
        catatan: r[10] || "",
      });
    }
    return NextResponse.json({ rab, source: "sheets" });
  } catch (error) {
    return NextResponse.json({ rab: [], source: "error", error: String(error) });
  }
}
