// GET /api/sukuk — List all sukuk
// POST /api/sukuk — Create new sukuk
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const sukuk = db.prepare(`
      SELECT s.*,
        (SELECT COALESCE(SUM(jumlah_unit), 0) FROM sukuk_investors WHERE sukuk_id = s.id) as unit_terjual
      FROM sukuk s ORDER BY s.created_at DESC
    `).all();
    return NextResponse.json({ sukuk });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch sukuk", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDb();

    const result = db.prepare(`
      INSERT INTO sukuk (kode, nama, nilai_sukuk, jumlah_unit, harga_per_unit, tenor_bulan, nisbah_investor, nisbah_pengelola, jenis_akad, tanggal_penerbitan, tanggal_jatuh_tempo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      body.kode,
      body.nama,
      body.nilai_sukuk,
      body.jumlah_unit,
      body.harga_per_unit,
      body.tenor_bulan,
      body.nisbah_investor,
      body.nisbah_pengelola,
      body.jenis_akad,
      body.tanggal_penerbitan || null,
      body.tanggal_jatuh_tempo || null
    );

    const sukuk = db.prepare("SELECT * FROM sukuk WHERE id = ?").get(result.lastInsertRowid);
    return NextResponse.json({ sukuk }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create sukuk", details: String(error) },
      { status: 500 }
    );
  }
}
