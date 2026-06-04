// GET /api/transactions — List transactions
// POST /api/transactions — Create transaction
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const jenis = searchParams.get("jenis");

    const db = getDb();
    let query = "SELECT * FROM transactions";
    const params: any[] = [];

    if (jenis) {
      query += " WHERE jenis = ?";
      params.push(jenis);
    }

    query += " ORDER BY tanggal DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const transactions = db.prepare(query).all(...params);

    // Get summary
    const summary = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN jenis = 'pemasukan' THEN jumlah ELSE 0 END), 0) as total_pemasukan,
        COALESCE(SUM(CASE WHEN jenis = 'pengeluaran' THEN jumlah ELSE 0 END), 0) as total_pengeluaran,
        COUNT(*) as total_transaksi
      FROM transactions
    `).get();

    return NextResponse.json({ transactions, summary });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch transactions", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDb();

    const result = db.prepare(`
      INSERT INTO transactions (tanggal, jenis, kategori, deskripsi, jumlah, sumber, referensi)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      body.tanggal,
      body.jenis,
      body.kategori,
      body.deskripsi || null,
      body.jumlah,
      body.sumber || "bank",
      body.referensi || null
    );

    const transaction = db.prepare("SELECT * FROM transactions WHERE id = ?").get(result.lastInsertRowid);
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create transaction", details: String(error) },
      { status: 500 }
    );
  }
}
