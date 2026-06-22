// GET /api/sales/targets — List all sales targets
// POST /api/sales/targets — Create or update a sales target
// Uses Google Sheets as source of truth (Sales_Targets sheet)
import { NextRequest, NextResponse } from "next/server";
import { readRange, appendRows, writeRange } from "@/lib/sheets/sheets-real";

function n(value: unknown): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  return Number(cleaned) || 0;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// Sales_Targets columns:
// A: Target ID, B: Brand ID, C: Brand Name, D: Year, E: Month,
// F: Target Amount, G: Actual Amount, H: Achievement %,
// I: Notes, J: Created Date, K: Updated Date

export async function GET() {
  try {
    const rows = await readRange("Sales_Targets!A1:K1000");
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ targets: [], source: "sheets" });
    }
    const headers = rows[0];
    const targets = rows.slice(1).filter((r) => r.some(Boolean)).map((row) => ({
      targetId: row[0] || "",
      brandId: row[1] || "",
      brandName: row[2] || "",
      year: Number(row[3]) || 0,
      month: Number(row[4]) || 0,
      targetAmount: n(row[5]),
      actualAmount: n(row[6]),
      achievementPct: n(row[7]),
      notes: row[8] || "",
      createdDate: row[9] || "",
      updatedDate: row[10] || "",
      _headers: headers,
    }));

    return NextResponse.json({ targets, source: "sheets" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch sales targets", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = today();

    const targetId = body.targetId || `ST-${Date.now()}`;
    const year = Number(body.year) || new Date().getFullYear();
    const month = Number(body.month) || new Date().getMonth() + 1;
    const targetAmount = Number(body.targetAmount) || 0;
    const actualAmount = Number(body.actualAmount) || 0;
    const achievementPct = targetAmount > 0
      ? Math.round((actualAmount / targetAmount) * 10000) / 100
      : 0;

    // Check if target already exists for same brand/year/month
    const existing = await readRange("Sales_Targets!A1:K1000");
    if (existing && existing.length > 1) {
      let foundRow = -1;
      for (let i = 1; i < existing.length; i++) {
        const r = existing[i];
        if (r[1] === body.brandId && Number(r[3]) === year && Number(r[4]) === month) {
          foundRow = i + 1; // 1-indexed
          break;
        }
      }
      if (foundRow > 0) {
        // Update existing row
        const updatedRow = [
          existing[foundRow - 1][0], // keep original ID
          body.brandId,
          body.brandName || "",
          year,
          month,
          targetAmount,
          actualAmount,
          achievementPct,
          body.notes || "",
          existing[foundRow - 1][9], // keep original created date
          now,
        ];
        await writeRange(`Sales_Targets!A${foundRow}:K${foundRow}`, [updatedRow]);
        return NextResponse.json({
          target: {
            targetId: updatedRow[0],
            brandId: updatedRow[1],
            brandName: updatedRow[2],
            year, month, targetAmount, actualAmount, achievementPct,
            notes: updatedRow[8],
            createdDate: updatedRow[9],
            updatedDate: now,
          },
          action: "updated",
          source: "sheets",
        }, { status: 200 });
      }
    }

    // Append new row
    await appendRows("Sales_Targets", [[
      targetId,
      body.brandId || "",
      body.brandName || "",
      year,
      month,
      targetAmount,
      actualAmount,
      achievementPct,
      body.notes || "",
      now,
      now,
    ]]);

    return NextResponse.json({
      target: {
        targetId,
        brandId: body.brandId,
        brandName: body.brandName,
        year, month, targetAmount, actualAmount, achievementPct,
        notes: body.notes || "",
        createdDate: now,
        updatedDate: now,
      },
      action: "created",
      source: "sheets",
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create/update sales target", details: String(error) },
      { status: 500 }
    );
  }
}
