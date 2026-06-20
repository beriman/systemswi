// GET /api/merch — Read merch products from Merch_TIM sheet
// POST /api/merch — Create/update/delete merch product
import { NextRequest, NextResponse } from "next/server";
import { readRange, appendRows, updateRow, deleteRow } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

type MerchProduct = {
  id: string;
  sku: string;
  name: string;
  category: string;
  cogs: number;
  price: number;
  margin: number;
  marginPct: string;
  stock: number;
  status: string;
  notes: string;
  rowNumber: number;
};

function parseMerch(rows: string[][]): MerchProduct[] {
  // Merch_TIM sheet structure:
  // A: ID, B: SKU, C: Product Name, D: Category, E: Size/Variant,
  // F: COGS, G: Price, H: Stock, I: Margin%, J: Status, K: Notes
  return rows
    .slice(1)
    .filter((row) => row.some(Boolean))
    .map((row, index) => {
      const cogs = Number(row[5]) || 0;
      const price = Number(row[6]) || 0;
      const margin = price - cogs;
      const marginPct = price > 0 ? ((margin / price) * 100).toFixed(0) : "0";
      return {
        id: String(row[0] || `merch-${index + 2}`),
        sku: String(row[1] || ""),
        name: String(row[2] || ""),
        category: String(row[3] || "apparel"),
        cogs,
        price,
        margin,
        marginPct,
        stock: Number(row[7]) || 0,
        status: String(row[9] || "active"),
        notes: String(row[10] || ""),
        rowNumber: index + 2,
      };
    })
    .filter((p) => p.sku || p.name);
}

export async function GET() {
  try {
    let rows: string[][] = [];
    try {
      rows = await readRange("Merch_TIM!A1:L1000");
    } catch {
      return NextResponse.json({
        source: "empty",
        sourceStatus: "empty",
        message: "Sheet Merch_TIM tidak tersedia",
        products: [],
        analytics: null,
      });
    }

    const products = parseMerch(rows);

    if (products.length === 0) {
      return NextResponse.json({
        source: "Merch_TIM",
        sourceStatus: "empty",
        message: "Sheet ada tapi tidak ada data produk",
        products: [],
        analytics: null,
      });
    }

    // Analytics
    const totalCOGS = products.reduce((s, p) => s + p.cogs, 0);
    const totalValue = products.reduce((s, p) => s + p.price, 0);
    const avgMargin = products.length > 0
      ? (products.reduce((s, p) => s + Number(p.marginPct), 0) / products.length).toFixed(1)
      : "0";
    const totalStock = products.reduce((s, p) => s + p.stock, 0);

    return NextResponse.json({
      source: "Merch_TIM",
      sourceStatus: "live",
      products,
      analytics: {
        totalSKU: products.length,
        totalCOGS,
        totalValue,
        avgMargin: `${avgMargin}%`,
        totalStock,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal membaca merch", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body.action || "create");

    if (action === "create") {
      const sku = body.sku || `M-${Date.now()}`;
      const name = body.name || "";
      const category = body.category || "apparel";
      const cogs = Number(body.cogs) || 0;
      const price = Number(body.price) || 0;
      const stock = Number(body.stock) || 0;
      const status = body.status || "active";
      const notes = body.notes || "";

      if (!name || price <= 0) {
        return NextResponse.json({ error: "name dan price wajib diisi" }, { status: 400 });
      }

      // Match sheet columns: ID, SKU, Name, Category, Size, COGS, Price, Stock, Margin%, Status, Notes
      const id = `MERCH-${Date.now()}`;
      const marginPct = price > 0 ? (((price - cogs) / price) * 100).toFixed(1) : "0";
      const row = [id, sku, name, category, body.size || "", cogs, price, stock, marginPct, status, notes];
      await appendRows("Merch_TIM", [row]);

      return NextResponse.json(
        { success: true, action, product: { sku, name, price }, syncedSheets: ["Merch_TIM"] },
        { status: 201 }
      );
    }

    if (action === "update") {
      const sku = String(body.sku || "");
      if (!sku) return NextResponse.json({ error: "sku wajib diisi" }, { status: 400 });

      const rows = await readRange("Merch_TIM!A1:L1000");
      const products = parseMerch(rows);
      const product = products.find((p) => p.sku === sku);
      if (!product) return NextResponse.json({ error: "produk tidak ditemukan" }, { status: 404 });

      const newCogs = Number(body.cogs) || product.cogs;
      const newPrice = Number(body.price) || product.price;
      const newMarginPct = newPrice > 0 ? (((newPrice - newCogs) / newPrice) * 100).toFixed(1) : "0";
      const row = [
        product.id,
        body.sku || product.sku,
        body.name || product.name,
        body.category || product.category,
        body.size || product.notes, // size variant column
        newCogs,
        newPrice,
        Number(body.stock) || product.stock,
        newMarginPct,
        body.status || product.status,
        body.notes || product.notes,
      ];
      await updateRow("Merch_TIM", product.rowNumber, row);
      return NextResponse.json({ success: true, action, syncedSheets: ["Merch_TIM"] });
    }

    if (action === "delete") {
      const sku = String(body.sku || "");
      if (!sku) return NextResponse.json({ error: "sku wajib diisi" }, { status: 400 });

      const rows = await readRange("Merch_TIM!A1:L1000");
      const products = parseMerch(rows);
      const product = products.find((p) => p.sku === sku);
      if (!product) return NextResponse.json({ error: "produk tidak ditemukan" }, { status: 404 });

      await deleteRow("Merch_TIM", product.rowNumber);
      return NextResponse.json({ success: true, action, deleted: sku, syncedSheets: ["Merch_TIM"] });
    }

    return NextResponse.json(
      { error: "action tidak valid. Pilih: create, update, delete" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menyimpan merch", details: String(error) },
      { status: 500 }
    );
  }
}
