// GET /api/sukuk/products — List all sukuk micro products
// POST /api/sukuk/products — Create new sukuk micro product
// Uses SQLite when available, falls back to Google Sheets on Vercel
import { NextRequest, NextResponse } from "next/server";
import {
  getSukukProductsFromSheets,
  addSukukProductToSheets,
} from "@/lib/sheets/sukuk-sheets";

function getDbSafe() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getDb } = require("@/lib/db");
    return getDb();
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const db = getDbSafe();
    if (!db) {
      // Fallback: read from Google Sheets
      const { products, source } = await getSukukProductsFromSheets();
      return NextResponse.json({
        products,
        source,
        sourceStatus: source === "sheets" ? "live" : "degraded",
        warning:
          source === "sheets"
            ? undefined
            : "Data source tidak tersedia.",
      });
    }

    const products = db.prepare(`
      SELECT sp.*,
        (SELECT COALESCE(SUM(si.jumlah_unit), 0) FROM sukuk_investments WHERE product_id = sp.id AND si.status = 'aktif') as unit_terjual,
        (SELECT COALESCE(SUM(si.nilai_investasi), 0) FROM sukuk_investments WHERE product_id = sp.id AND si.status = 'aktif') as total_terkumpul
      FROM sukuk_products sp ORDER BY sp.created_at DESC
    `).all();

    // Enrich with sheets data if available (merge mode)
    try {
      const { products: sheetsProducts } = await getSukukProductsFromSheets();
      if (sheetsProducts.length > 0 && products.length === 0) {
        return NextResponse.json({
          products: sheetsProducts.map((sp: any) => ({
            id: sp.id,
            kode: sp.id,
            nama: sp.nama,
            deskripsi: sp.deskripsi,
            kategori: sp.kategori,
            harga_per_unit: sp.modal_dibutuhkan,
            jumlah_unit: sp.target_investor,
            nilai_sukuk: sp.modal_dibutuhkan,
            status: sp.status === "Perencanaan" ? "draft" : "open",
            unit_terjual: 0,
            total_terkumpul: 0,
            from_sheets: true,
          })),
          source: "sheets-fallback",
          sourceStatus: "live",
        });
      }
    } catch {
      // Sheets not available, return SQLite data
    }

    return NextResponse.json({ products, source: "local" });
  } catch (error) {
    return NextResponse.json(
      { products: [], source: "degraded", sourceStatus: "degraded", warning: "Gagal memuat data", details: String(error) },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDbSafe();

    const kode = body.kode?.trim();
    const nama = body.nama?.trim();
    const harga_per_unit = Number(body.harga_per_unit) || 0;
    const jumlah_unit = Number(body.jumlah_unit) || 0;

    if (!kode || !nama || harga_per_unit <= 0 || jumlah_unit <= 0) {
      return NextResponse.json(
        { error: "kode, nama, harga_per_unit, dan jumlah_unit wajib diisi dengan benar" },
        { status: 400 }
      );
    }

    // Try SQLite first
    if (db) {
      try {
        const nilai_sukuk = harga_per_unit * jumlah_unit;
        const result = db.prepare(`
          INSERT INTO sukuk_products (kode, nama, deskripsi, kategori, harga_per_unit, jumlah_unit, nilai_sukuk, tenor_bulan, nisbah_investor, nisbah_pengelola, jenis_akad, target_cogs, target_harga_jual, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          kode, nama, body.deskripsi || "", body.kategori || "merchandise",
          harga_per_unit, jumlah_unit, nilai_sukuk,
          Number(body.tenor_bulan) || 12,
          Number(body.nisbah_investor) || 50,
          Number(body.nisbah_pengelola) || 50,
          body.jenis_akad || "musyarakah",
          Number(body.target_cogs) || 0,
          Number(body.target_harga_jual) || 0,
          body.status || "open"
        );
        const product = db.prepare("SELECT * FROM sukuk_products WHERE id = ?").get(result.lastInsertRowid);
        return NextResponse.json({ product, source: "local" }, { status: 201 });
      } catch (dbError: any) {
        if (dbError?.message?.includes("UNIQUE constraint failed")) {
          return NextResponse.json({ error: "Kode produk sudah digunakan" }, { status: 409 });
        }
        // Fall through to sheets
      }
    }

    // Fallback: write to Google Sheets
    const added = await addSukukProductToSheets({
      id: kode,
      nama,
      deskripsi: body.deskripsi || "",
      kategori: body.kategori || "merchandise",
      modal_dibutuhkan: harga_per_unit * jumlah_unit,
      target_investor: jumlah_unit,
      nisbah: `${body.nisbah_investor || 50}:${body.nisbah_pengelola || 50}`,
      status: body.status || "open",
      pic: body.pic || "",
      tanggal_launch: body.tanggal_launch || "",
    });

    if (added) {
      return NextResponse.json({
        product: {
          id: kode, kode, nama,
          deskripsi: body.deskripsi || "",
          kategori: body.kategori || "merchandise",
          harga_per_unit, jumlah_unit,
          nilai_sukuk: harga_per_unit * jumlah_unit,
          status: body.status || "open",
          from_sheets: true,
        },
        source: "sheets",
      }, { status: 201 });
    }

    return NextResponse.json({ error: "Gagal menyimpan produk" }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Gagal membuat produk sukuk mikro", details: String(error) },
      { status: 500 }
    );
  }
}
