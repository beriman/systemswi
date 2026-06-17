// GET /api/sukuk/distributions — List profit distributions
// POST /api/sukuk/distributions — Create profit distribution (admin)
// Uses SQLite when available, falls back to Google Sheets on Vercel
import { NextRequest, NextResponse } from "next/server";
import {
  getSukukDistributionsFromSheets,
  addSukukDistributionToSheets,
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
      const { distributions, source } = await getSukukDistributionsFromSheets(productId || undefined);
      return NextResponse.json({
        distributions: distributions.map((d) => ({
          id: d.id,
          product_id: d.product_id,
          periode: d.periode,
          total_revenue: d.total_revenue,
          total_cogs: d.total_cogs,
          total_profit: d.total_profit,
          nisbah_investor: d.nisbah_investor,
          nisbah_pengelola: d.nisbah_pengelola,
          jumlah_dibagikan: d.jumlah_dibagikan,
          jumlah_per_unit: d.jumlah_per_unit,
          tanggal_pembagian: d.tanggal_pembagian,
          status: d.status,
          notes: d.notes,
        })),
        source,
        sourceStatus: source === "sheets" ? "live" : "degraded",
      });
    }

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
    return NextResponse.json({ distributions, source: "local" });
  } catch (error) {
    return NextResponse.json(
      { distributions: [], source: "degraded", sourceStatus: "degraded", warning: "Gagal memuat data", details: String(error) },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDbSafe();

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

    // Try SQLite first
    if (db) {
      try {
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
        return NextResponse.json({ distribution, source: "local" }, { status: 201 });
      } catch (dbError) {
        // Fall through to sheets
      }
    }

    // Fallback: write to Google Sheets
    const nInvestor = Number(body.nisbah_investor) || 50;
    const nPengelola = Number(body.nisbah_pengelola) || 50;
    const jumlahDibagikan = Math.round(totalProfit * (nInvestor / 100));
    const totalUnits = Number(body.total_units) || 1;
    const perUnit = Math.round(jumlahDibagikan / totalUnits);

    const added = await addSukukDistributionToSheets({
      product_id: String(productId),
      periode,
      total_revenue: totalRevenue,
      total_cogs: totalCogs,
      total_profit: totalProfit,
      nisbah_investor: nInvestor,
      nisbah_pengelola: nPengelola,
      jumlah_dibagikan: jumlahDibagikan,
      jumlah_per_unit: perUnit,
      tanggal_pembagian: body.tanggal_pembagian || "",
      status: body.status || "draft",
      notes: body.notes || "",
    });

    if (added) {
      return NextResponse.json({
        distribution: {
          id: Date.now(),
          product_id: String(productId),
          periode,
          total_revenue: totalRevenue,
          total_cogs: totalCogs,
          total_profit: totalProfit,
          nisbah_investor: nInvestor,
          nisbah_pengelola: nPengelola,
          jumlah_dibagikan: jumlahDibagikan,
          jumlah_per_unit: perUnit,
          tanggal_pembagian: body.tanggal_pembagian || "",
          status: body.status || "draft",
          notes: body.notes || "",
        },
        source: "sheets",
      }, { status: 201 });
    }

    return NextResponse.json({ error: "Gagal menyimpan distribusi" }, { status: 500 });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal membuat distribusi profit", details: String(error) },
      { status: 500 }
    );
  }
}
