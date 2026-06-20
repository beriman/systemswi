// GET /api/sukuk/products — List all sukuk micro products
// POST /api/sukuk/products — Create new sukuk micro product
// Uses SQLite when available, falls back to Google Sheets on Vercel
import { NextRequest, NextResponse } from "next/server";
import {
  getSukukProductsFromSheets,
  addSukukProductToSheets,
} from "@/lib/sheets/sukuk-sheets";
import { readRange } from "@/lib/sheets/sheets-real";

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
    // Read directly from Google Sheets (source of truth)
    const { products, source } = await getSukukProductsFromSheets();

    // Enrich with investment summary from Sheets
    let investments: any[] = [];
    try {
      const invRows = await readRange("SukukMikro_Investments!A1:J1000");
      if (invRows && invRows.length > 1) {
        investments = invRows.slice(1).filter((r) => r.some(Boolean));
      }
    } catch {
      // ignore — investments are optional enrichment
    }

    const enriched = products.map((p) => {
      const productInvestments = investments.filter((inv) => inv[1] === p.id || inv[2] === p.id);
      const totalTerKumpul = productInvestments.reduce((sum, inv) => sum + (Number(inv[5]) || 0), 0);
      const unitTerjual = productInvestments.reduce((sum, inv) => sum + (Number(inv[4]) || 0), 0);
      return {
        ...p,
        unit_terjual: unitTerjual,
        total_terkumpul: totalTerKumpul,
      };
    });

    return NextResponse.json({
      products: enriched,
      source,
      sourceStatus: source === "sheets" ? "live" : "degraded",
      warning:
        source === "sheets"
          ? undefined
          : "Data source tidak tersedia.",
    });
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

    // Write to Google Sheets (source of truth)
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
