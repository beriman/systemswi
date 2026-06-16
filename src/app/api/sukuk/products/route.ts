// GET /api/sukuk/products — List all sukuk micro products
// POST /api/sukuk/products — Create new sukuk micro product
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const products = db.prepare(`
      SELECT sp.*,
        (SELECT COALESCE(SUM(si.jumlah_unit), 0) FROM sukuk_investments WHERE product_id = sp.id AND si.status = 'aktif') as unit_terjual,
        (SELECT COALESCE(SUM(si.nilai_investasi), 0) FROM sukuk_investments WHERE product_id = sp.id AND si.status = 'aktif') as total_terkumpul
      FROM sukuk_products sp ORDER BY sp.created_at DESC
    `).all();
    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal memuat produk sukuk mikro", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDb();

    const kode = body.kode?.trim();
    const nama = body.nama?.trim();
    const harga_per_unit = Number(body.harga_per_unit) || 0;
    const jumlah_unit = Number(body.jumlah_unit) || 0;
    const nilai_sukuk = harga_per_unit * jumlah_unit;

    if (!kode || !nama || harga_per_unit <= 0 || jumlah_unit <= 0) {
      return NextResponse.json(
        { error: "kode, nama, harga_per_unit, dan jumlah_unit wajib diisi dengan benar" },
        { status: 400 }
      );
    }

    const result = db.prepare(`
      INSERT INTO sukuk_products (kode, nama, deskripsi, kategori, harga_per_unit, jumlah_unit, nilai_sukuk, tenor_bulan, nisbah_investor, nisbah_pengelola, jenis_akad, target_cogs, target_harga_jual, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      kode,
      nama,
      body.deskripsi || "",
      body.kategori || "merchandise",
      harga_per_unit,
      jumlah_unit,
      nilai_sukuk,
      Number(body.tenor_bulan) || 12,
      Number(body.nisbah_investor) || 50,
      Number(body.nisbah_pengelola) || 50,
      body.jenis_akad || "musyarakah",
      Number(body.target_cogs) || 0,
      Number(body.target_harga_jual) || 0,
      body.status || "open"
    );

    const product = db.prepare("SELECT * FROM sukuk_products WHERE id = ?").get(result.lastInsertRowid);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    if (error?.message?.includes("UNIQUE constraint failed")) {
      return NextResponse.json({ error: "Kode produk sudah digunakan" }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Gagal membuat produk sukuk mikro", details: String(error) },
      { status: 500 }
    );
  }
}
