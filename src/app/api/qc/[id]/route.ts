// GET /api/qc/[id] — QC detail
// PUT /api/qc/[id] — Update QC result
import { NextRequest, NextResponse } from "next/server";
import { readRange, updateRow } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

function calcStatus(overall: number): string {
  if (overall >= 7) return "Pass";
  if (overall >= 5) return "Conditional";
  return "Fail";
}

async function findQCRow(resultId: string): Promise<{ rowNumber: number; row: string[] } | null> {
  const rows = await readRange("QC_Results!A1:N1000");
  if (!rows || rows.length === 0) return null;

  const startIdx = rows[0]?.[0] === "Result ID" ? 1 : 0;
  for (let i = startIdx; i < rows.length; i++) {
    if (rows[i] && rows[i][0] === resultId) {
      return { rowNumber: i + 1, row: rows[i] };
    }
  }
  return null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const found = await findQCRow(id);
    if (!found) {
      return NextResponse.json({ error: "QC result not found" }, { status: 404 });
    }

    const r = found.row;
    return NextResponse.json({
      data: {
        resultId: r[0] || "",
        batchCode: r[1] || "",
        productionId: r[2] || "",
        date: r[3] || "",
        inspector: r[4] || "",
        aromaScore: Number(r[5]) || 0,
        warnaScore: Number(r[6]) || 0,
        kejernihanScore: Number(r[7]) || 0,
        packagingScore: Number(r[8]) || 0,
        sealIntegrityScore: Number(r[9]) || 0,
        overallScore: Number(r[10]) || 0,
        status: r[11] || "",
        notes: r[12] || "",
        followUpRequired: r[13] || "No",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read QC detail", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const found = await findQCRow(id);
    if (!found) {
      return NextResponse.json({ error: "QC result not found" }, { status: 404 });
    }

    const r = found.row;
    const aroma = body.aromaScore !== undefined ? Number(body.aromaScore) : Number(r[5]) || 0;
    const warna = body.warnaScore !== undefined ? Number(body.warnaScore) : Number(r[6]) || 0;
    const kejernihan = body.kejernihanScore !== undefined ? Number(body.kejernihanScore) : Number(r[7]) || 0;
    const packaging = body.packagingScore !== undefined ? Number(body.packagingScore) : Number(r[8]) || 0;
    const seal = body.sealIntegrityScore !== undefined ? Number(body.sealIntegrityScore) : Number(r[9]) || 0;

    const clamp = (n: number) => Math.min(10, Math.max(1, n));
    const scores = [aroma, warna, kejernihan, packaging, seal].map(clamp);
    const overall = Math.round((scores.reduce((a, b) => a + b, 0) / 5) * 100) / 100;
    const status = calcStatus(overall);

    const updated = [
      r[0],
      body.batchCode ?? r[1],
      body.productionId ?? r[2],
      body.date ?? r[3],
      body.inspector ?? r[4],
      scores[0],
      scores[1],
      scores[2],
      scores[3],
      scores[4],
      overall,
      status,
      body.notes ?? r[12],
      body.followUpRequired ? "Yes" : (r[13] || "No"),
    ];

    await updateRow("QC_Results", found.rowNumber, updated);

    return NextResponse.json({
      success: true,
      data: { resultId: id, overallScore: overall, status },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update QC result", details: String(error) },
      { status: 500 }
    );
  }
}
