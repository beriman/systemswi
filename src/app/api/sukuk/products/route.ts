// GET /api/sukuk/products — List all products from SukukProduk!A6:L13
// POST /api/sukuk/products — Create new product
import { NextRequest, NextResponse } from "next/server";
import { readRange, appendRows } from "@/lib/sheets/sheets-real";

export async function GET() {
  try {
    const rows = await readRange("SukukProduk!A6:L13");
    if (!rows || rows.length === 0) {
      return NextResponse.json({ products: [], source: "sheets" });
    }
    const dataRows = rows[0]?.[0] === "ID Produk" ? rows.slice(1) : rows;
    const products = dataRows
      .filter((r) => r && r[0])
      .map((r) => ({
        id: Number(r && r[0]) || 0,
        kode: r[0] || "",
        nama: r[1] || "",
        deskripsi: r[2] || "",
        kategori: r[3] || "",
        modal_dibutuhkan: Number(r[4]) || 0,
        target_investor: Number(r[5]) || 0,
        nisbah: r[6] || "",
        status: r[7] || "open",
        pic_produk: r[8] || "",
        tanggal_launch: r[9] || "",
      }));
    return NextResponse.json({ products, source: "sheets" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const kode = body.kode || `SM-${Date.now()}`;
    const row = [
      kode,
      body.nama || "",
      body.deskripsi || "",
      body.kategori || "merchandise",
      Number(body.harga_per_unit || body.modal_dibutuhkan) || 0,
      Number(body.jumlah_unit || body.target_investor) || 0,
      body.nisbah || "60:40",
      body.status || "open",
      body.pic_produk || "",
      body.tanggal_launch || new Date().toISOString().slice(0, 10),
    ];
    await appendRows("SukukProduk", [row]);
    return NextResponse.json({ product: { kode, ...body }, source: "sheets" }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create product", details: String(error) },
      { status: 500 }
    );
  }
}
