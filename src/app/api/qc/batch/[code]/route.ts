// GET /api/qc/batch/[code] — QC history per batch
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const rows = await readRange("QC_Results!A1:N1000");
    if (!rows || rows.length === 0) {
      return NextResponse.json({
        batchCode: code,
        data: [],
        summary: { total: 0, passed: 0, failed: 0, conditional: 0, avgOverall: 0, latestStatus: "—" },
      });
    }

    const startIdx = rows[0]?.[0] === "Result ID" ? 1 : 0;
    const batchRows = rows.slice(startIdx).filter((r) => r && r[1] && r[1].toLowerCase() === code.toLowerCase());

    const data = batchRows.map((r) => ({
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
    }));

    const total = data.length;
    const passed = data.filter((r) => r.status === "Pass").length;
    const failed = data.filter((r) => r.status === "Fail").length;
    const conditional = data.filter((r) => r.status === "Conditional").length;
    const avgOverall = total > 0 ? Math.round((data.reduce((s, r) => s + r.overallScore, 0) / total) * 100) / 100 : 0;
    const latestStatus = data.length > 0 ? data[data.length - 1].status : "—";

    return NextResponse.json({
      batchCode: code,
      data,
      summary: { total, passed, failed, conditional, avgOverall, latestStatus },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read batch QC history", details: String(error) },
      { status: 500 }
    );
  }
}
