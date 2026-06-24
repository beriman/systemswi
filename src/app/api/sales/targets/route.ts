// GET /api/sales/targets?year=YYYY — List sales targets
// POST /api/sales/targets — Create/update sales target
import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, googleWorkspaceWriteBlockedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { appendRows, readRange, updateRow } from "@/lib/sheets/sheets-real";
import { appendSwiMemoryLog } from "@/lib/google/audit-log";

export const runtime = "nodejs";

const SOURCE = "Google Sheets: Sales_Targets";

const text = (v: unknown) => String(v ?? "").trim();
const num = (v: unknown) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v !== "string") return 0;
  return Number(v.replace(/[^\d.-]/g, "")) || 0;
};

function parseTargets(rows: string[][]) {
  return rows.slice(1).filter((r) => r.some(Boolean)).map((row, idx) => ({
    rowNumber: idx + 2,
    targetId: text(row[0]) || `ST-${idx + 1}`,
    brandId: text(row[1]) || "",
    brandName: text(row[2]) || "",
    year: num(row[3]) || new Date().getFullYear(),
    month: num(row[4]) || 1,
    targetAmount: num(row[5]) || 0,
    productCategory: text(row[6]) || "TBA",
    channel: text(row[7]) || "all",
    pic: text(row[8]) || "",
    notes: text(row[9]) || "",
  }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    const rows = await readRange("Sales_Targets!A1:K1000");
    let targets = parseTargets(rows);

    if (year) {
      const yNum = parseInt(year);
      if (!Number.isNaN(yNum)) {
        targets = targets.filter((t) => t.year === yNum);
      }
    }

    const totalTarget = targets.reduce((sum, t) => sum + t.targetAmount, 0);

    return NextResponse.json({
      source: SOURCE,
      sourceStatus: "live",
      year: year ? parseInt(year) : null,
      targets,
      totalTarget,
      count: targets.length,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        targets: [],
        totalTarget: 0,
        count: 0,
      });
    }
    return NextResponse.json({ error: "Gagal mengambil sales targets", details: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const targetId = body.targetId || `ST-${Date.now().toString(36).toUpperCase()}`;
    const year = body.year || new Date().getFullYear();
    const month = body.month || new Date().getMonth() + 1;

    const row = [
      targetId,
      body.brandId || "TBA",
      body.brandName || "",
      year,
      month,
      body.targetAmount || 0,
      body.productCategory || "TBA",
      body.channel || "all",
      body.pic || "",
      body.notes || "",
    ];

    // Check if targetId exists
    const existing = await readRange("Sales_Targets!A1:K1000");
    const existingRowIdx = existing.findIndex((r) => text(r[0]) === targetId);

    if (existingRowIdx > 0) {
      await updateRow("Sales_Targets", existingRowIdx + 1, row);
    } else {
      await appendRows("Sales_Targets", [row]);
    }

    await appendSwiMemoryLog({
      action: "sales_target_upsert",
      target: "Sales_Targets",
      summary: `Target ${targetId} — ${body.brandName || "TBA"} — ${month}/${year} — Rp ${(body.targetAmount || 0).toLocaleString("id-ID")}`,
    });

    return NextResponse.json({
      success: true,
      source: SOURCE,
      target: { targetId, ...body },
      action: existingRowIdx > 0 ? "updated" : "created",
    }, { status: existingRowIdx > 0 ? 200 : 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource(SOURCE, error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Gagal menyimpan sales target", details: String(error) }, { status: 500 });
  }
}
