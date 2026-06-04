// GET /api/investors — List all investors
// POST /api/investors — Create new investor
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const investors = db.prepare(`
      SELECT * FROM investors ORDER BY no ASC
    `).all();
    return NextResponse.json({ investors });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch investors", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDb();

    const result = db.prepare(`
      INSERT INTO investors (no, nama, email, telepon, alamat, nik, npwp, jumlah_saham, nilai_saham, kyc_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      body.no,
      body.nama,
      body.email || null,
      body.telepon || null,
      body.alamat || null,
      body.nik || null,
      body.npwp || null,
      body.jumlah_saham || 0,
      body.nilai_saham || 0,
      body.kyc_verified ? 1 : 0
    );

    const investor = db.prepare("SELECT * FROM investors WHERE id = ?").get(result.lastInsertRowid);
    return NextResponse.json({ investor }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create investor", details: String(error) },
      { status: 500 }
    );
  }
}
