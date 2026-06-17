// GET /api/sukuk/invest — List investments
// POST /api/sukuk/invest — Create new investment
// Uses SQLite when available, falls back to Google Sheets on Vercel
import { NextRequest, NextResponse } from "next/server";
import {
  getSukukInvestmentsFromSheets,
  addSukukInvestmentToSheets,
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

export async function GET(request: NextRequest) {
  try {
    const db = getDbSafe();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");

    if (!db) {
      // Fallback: read from Google Sheets
      const { investments, source } = await getSukukInvestmentsFromSheets(productId || undefined);
      return NextResponse.json({
        investments: investments.map((inv) => ({
          id: inv.id,
          product_id: inv.product_id,
          investor_name: inv.investor_name,
          investor_email: inv.investor_email,
          investor_phone: inv.investor_phone,
          jumlah_unit: inv.jumlah_unit,
          nilai_investasi: inv.nilai_investasi,
          tanggal_investasi: inv.tanggal_investasi,
          status: inv.status,
          consent: inv.consent,
        })),
        source,
        sourceStatus: source === "sheets" ? "live" : "degraded",
      });
    }

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
        ORDER BY si.tanggal_investasi DESC LIMIT 100
      `).all();
    }
    return NextResponse.json({ investments, source: "local" });
  } catch (error) {
    return NextResponse.json(
      { investments: [], source: "degraded", sourceStatus: "degraded", warning: "Gagal memuat data", details: String(error) },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDbSafe();

    const productId = Number(body.product_id);
    const investorName = body.investor_name?.trim();
    const jumlahUnit = Number(body.jumlah_unit) || 0;
    const consent = body.consent ? 1 : 0;

    if (!productId || !investorName || jumlahUnit <= 0) {
      return NextResponse.json({ error: "product_id, investor_name, dan jumlah_unit wajib diisi" }, { status: 400 });
    }
    if (!consent) {
      return NextResponse.json({ error: "Investor harus menyetujui syarat dan ketentuan (consent)" }, { status: 400 });
    }

    // Try SQLite first
    if (db) {
      try {
        const product = db.prepare("SELECT * FROM sukuk_products WHERE id = ?").get(productId);
        if (!product) return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
        if (product.status !== "open") return NextResponse.json({ error: "Produk tidak menerima investasi baru" }, { status: 400 });

        const soldResult = db.prepare("SELECT COALESCE(SUM(jumlah_unit), 0) as sold FROM sukuk_investments WHERE product_id = ? AND status = 'aktif'").get(productId);
        const available = product.jumlah_unit - soldResult.sold;
        if (jumlahUnit > available) {
          return NextResponse.json({ error: `Unit tidak tersedia. Sisa: ${available} unit` }, { status: 400 });
        }

        const nilaiInvestasi = jumlahUnit * product.harga_per_unit;
        const result = db.prepare(`
          INSERT INTO sukuk_investments (product_id, investor_name, investor_email, investor_phone, jumlah_unit, nilai_investasi, consent, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(productId, investorName, body.investor_email || "", body.investor_phone || "", jumlahUnit, nilaiInvestasi, consent, body.notes || "");

        const investment = db.prepare("SELECT * FROM sukuk_investments WHERE id = ?").get(result.lastInsertRowid);

        // Check if fully funded
        const newSold = db.prepare("SELECT COALESCE(SUM(jumlah_unit), 0) as sold FROM sukuk_investments WHERE product_id = ? AND status = 'aktif'").get(productId);
        if (newSold.sold >= product.jumlah_unit) {
          db.prepare("UPDATE sukuk_products SET status = 'funded' WHERE id = ?").run(productId);
        }

        return NextResponse.json({ investment, product_name: product.nama, source: "local" }, { status: 201 });
      } catch (dbError) {
        // Fall through to sheets
      }
    }

    // Fallback: write to Google Sheets
    const tanggalInvestasi = new Date().toISOString().split("T")[0];
    const added = await addSukukInvestmentToSheets({
      product_id: String(productId),
      investor_name: investorName,
      investor_email: body.investor_email || "",
      investor_phone: body.investor_phone || "",
      jumlah_unit: jumlahUnit,
      nilai_investasi: body.nilai_investasi || 0,
      tanggal_investasi: tanggalInvestasi,
      status: "aktif",
      consent,
    });

    if (added) {
      return NextResponse.json({
        investment: {
          id: Date.now(),
          product_id: String(productId),
          investor_name: investorName,
          investor_email: body.investor_email || "",
          investor_phone: body.investor_phone || "",
          jumlah_unit: jumlahUnit,
          nilai_investasi: body.nilai_investasi || 0,
          tanggal_investasi: tanggalInvestasi,
          status: "aktif",
          consent,
        },
        source: "sheets",
      }, { status: 201 });
    }

    return NextResponse.json({ error: "Gagal menyimpan investasi" }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memproses investasi", details: String(error) }, { status: 500 });
  }
}
