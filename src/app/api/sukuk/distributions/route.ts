// GET /api/sukuk/distributions — List profit distributions
// POST /api/sukuk/distributions — Create profit distribution (admin)
import { NextRequest, NextResponse } from "next/server";

function getDbSafe() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getDb } = require("@/lib/db");
    return getDb();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = getDbSafe();
    if (!db) {
      return NextResponse.json({
        distributions: [],
        source: "degraded",
        sourceStatus: "degraded",
        warning: "SQLite tidak tersedia. Jalankan server lokal untuk data lengkap.",
      });
    }
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");

    let distributions;
    if (productId) {
      distributions = db.prepare(`
        SELECT spd.*, sp.nama as product_name, sp.kode as product_code
        FROM sukuk_profit_distributions spd
        JOIN sukuk_products sp ON spd.product_id = sp.id
        WHERE spd.product_id = ? ORDER BY spd.periode DESC
      `).all(Number(productId));
    } else {
      distributions = db.prepare(`
        SELECT spd.*, sp.nama as product_name, sp.kode as product_code
        FROM sukuk_profit_distributions spd
        JOIN sukuk_products sp ON spd.product_id = sp.id
        ORDER BY spd.periode DESC LIMIT 50
      `).all();
    }
    return NextResponse.json({ distributions });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal memuat data distribusi profit", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDbSafe();
    if (!db) {
      return NextResponse.json({ error: "Server lokal diperlukan untuk menulis data" }, { status: 503 });
    }

    const productId = Number(body.product_id);
    const periode = body.periode?.trim();
    const totalRevenue = Number(body.total_revenue) || 0;
    const totalCogs = Number(body.total_cogs) || 0;
    const totalProfit = totalRevenue - totalCogs;

    if (!productId || !periode) {
      return NextResponse.json({ error: "product_id dan periode wajib diisi" }, { status: 400 });
    }
    if (totalProfit <= 0) {
      return NextResponse.json({ error: "Total profit harus lebih dari 0" }, { status: 400 });
    }

    const product = db.prepare("SELECT * FROM sukuk_products WHERE id = ?").get(productId);
    if (!product) return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });

    const nInvestor = Number(body.nisbah_investor) || product.nisbah_investor;
    const nPengelola = Number(body.nisbah_pengelola) || product.nisbah_pengelola;
    const jumlahDibagikan = Math.round(totalProfit * (nInvestor / 100));

    const unitResult = db.prepare("SELECT COALESCE(SUM(jumlah_unit), 0) as total FROM sukuk_investments WHERE product_id = ? AND status = 'aktif'").get(productId);
    const totalUnits = unitResult.total || 1;
    const perUnit = Math.round(jumlahDibagikan / totalUnits);

    const result = db.prepare(`
      INSERT INTO sukuk_profit_distributions (product_id, periode, total_revenue, total_cogs, total_profit, nisbah_investor, nisbah_pengelola, jumlah_dibagikan, jumlah_per_unit, tanggal_pembagian, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(productId, periode, totalRevenue, totalCogs, totalProfit, nInvestor, nPengelola, jumlahDibagikan, perUnit, body.tanggal_pembagian || null, body.status || "draft", body.notes || "");

    const distribution = db.prepare("SELECT * FROM sukuk_profit_distributions WHERE id = ?").get(result.lastInsertRowid);
    return NextResponse.json({ distribution }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal membuat distribusi profit", details: String(error) },
      { status: 500 }
    );
  }
}
