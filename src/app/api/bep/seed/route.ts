// POST /api/bep/seed — Seed BEP data (idempotent)
import { NextRequest, NextResponse } from "next/server";
import { seedBEPData } from "@/lib/sheets/bep-sheets";

export const runtime = "nodejs";

export async function POST() {
  try {
    const data = await seedBEPData();
    return NextResponse.json({
      source: "Google Sheets: BEP_Calculations",
      sourceStatus: "live",
      message: `BEP data seeded: ${data.length} calculations`,
      seeded: data.length,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to seed BEP data", details: String(error) },
      { status: 500 }
    );
  }
}
