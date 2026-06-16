// GET /api/sukuk/invest — List investments for a product
// POST /api/sukuk/invest — Create new investment
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");

    let investments;
    if (productId) {
      investments = db.prepare(`
        SELECT si.*, sp.nama as product_name, sp.kode as product_code
        FROM sukuk_investments si
        JOIN sukuk_products sp ON si.product_id = sp.id
        WHERE si.product_id = ?
        ORDER BY si.tanggal_investasi DESC
      `).all(Number(productId));
    } else {
      investments = db.prepare(`
        SELECT si.*, sp.nama as product_name, sp.kode as product_code
        FROM sukuk_investments si
        JOIN sukuk_products sp ON si.product_id = sp.id
        ORDER BY si.tanggal_investasi DESC
        LIMIT 100
      `).all();
    }

    return NextResponse.json({ investments });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal memuat data investasi", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDb();

    const productId = Number(body.product_id);
    const investorName = body.investor_name?.trim();
    const jumlahUnit = Number(body.jumlah_unit) || 0;
    const consent = body.consent ? 1 : 0;

    if (!productId || !investorName || jumlahUnit <= 0) {
      return NextResponse.json(
        { error: "product_id, investor_name, dan jumlah_unit wajib diisi" },
        { status: 400 }
      );
    }

    if (!consent) {
      return NextResponse.json(
        { error: "Investor harus menyetujui syarat dan ketentuan (consent)" },
        { status: 400 }
      );
    }

    // Get product details
    const product = db.prepare("SELECT * FROM sukuk_products WHERE id = ?").get(productId);
    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    if (product.status !== "open") {
      return NextResponse.json({ error: "Produk tidak menerima investasi baru" }, { status: 400 });
    }

    // Check available units
    const soldResult = db.prepare(
      "SELECT COALESCE(SUM(jumlah_unit), 0) as sold FROM sukuk_investments WHERE product_id = ? AND status = 'aktif'"
    ).get(productId);
    const available = product.jumlah_unit - soldResult.sold;

    if (jumlahUnit > available) {
      return NextResponse.json(
        { error: `Unit tidak tersedia. Sisa: ${available} unit` },
        { status: 400 }
      );
    }

    const nilaiInvestasi = jumlahUnit * product.harga_per_unit;

    const result = db.prepare(`
      INSERT INTO sukuk_investments (product_id, investor_name, investor_email, investor_phone, jumlah_unit, nilai_investasi, consent, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      productId,
      investorName,
      body.investor_email || "",
      body.investor_phone || "",
      jumlahUnit,
      nilaiInvestasi,
      consent,
      body.notes || ""
    );

    const investment = db.prepare("SELECT * FROM sukuk_investments WHERE id = ?").get(result.lastInsertRowid);

    // Check if fully funded
    const newSoldResult = db.prepare(
      "SELECT COALESCE(SUM(jumlah_unit), 0) as sold FROM sukuk_investments WHERE product_id = ? AND status = 'aktif'"
    ).get(productId);
    if (newSoldResult.sold >= product.jumlah_unit) {
      db.prepare("UPDATE sukuk_products SET status = 'funded' WHERE id = ?").run(productId);
    }

    return NextResponse.json({ investment, product_name: product.nama }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal memproses investasi", details: String(error) },
      { status: 500 }
    );
  }
}
