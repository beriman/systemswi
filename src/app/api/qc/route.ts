// GET /api/qc — List QC results (filter: batch, status)
// POST /api/qc — Submit QC result
import { NextRequest, NextResponse } from "next/server";
import { readRange, appendRows } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const SHEET = "QC_Results";
const HEADER = [
  "Result ID", "Batch Code", "Production ID", "Date", "Inspector",
  "Aroma Score", "Warna Score", "Kejernihan Score",
  "Packaging Score", "Seal Integrity Score", "Overall Score",
  "Status", "Notes", "Follow-up Required",
];

function generateResultId(): string {
  const now = new Date();
  const ts = now.getFullYear().toString().slice(2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `QC-${ts}-${rand}`;
}

function calcStatus(overall: number): string {
  if (overall >= 7) return "Pass";
  if (overall >= 5) return "Conditional";
  return "Fail";
}

async function getQCFromSheets(): Promise<string[][]> {
  try {
    const rows = await readRange("QC_Results!A1:N1000");
    if (!rows || rows.length === 0) return [];
    const first = rows[0];
    if (first && first[0] === "Result ID") return rows.slice(1);
    return rows;
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchFilter = searchParams.get("batch")?.toLowerCase() || "";
    const statusFilter = searchParams.get("status")?.toLowerCase() || "";

    const rows = await getQCFromSheets();

    const data = rows
      .filter((r) => r && r[0])
      .map((r) => ({
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
      }))
      .filter((r) => {
        if (batchFilter && !r.batchCode.toLowerCase().includes(batchFilter)) return false;
        if (statusFilter && r.status.toLowerCase() !== statusFilter) return false;
        return true;
      });

    const total = data.length;
    const passed = data.filter((r) => r.status === "Pass").length;
    const failed = data.filter((r) => r.status === "Fail").length;
    const conditional = data.filter((r) => r.status === "Conditional").length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    return NextResponse.json({
      data,
      summary: { total, passed, failed, conditional, passRate },
      source: "Google Sheets: QC_Results",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read QC results", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const batchCode = (body.batchCode || "").trim();
    if (!batchCode) {
      return NextResponse.json({ error: "batchCode is required" }, { status: 400 });
    }

    const aroma = Number(body.aromaScore) || 0;
    const warna = Number(body.warnaScore) || 0;
    const kejernihan = Number(body.kejernihanScore) || 0;
    const packaging = Number(body.packagingScore) || 0;
    const seal = Number(body.sealIntegrityScore) || 0;

    const clamp = (n: number) => Math.min(10, Math.max(1, n));
    const scores = [aroma, warna, kejernihan, packaging, seal].map(clamp);
    const overall = Math.round((scores.reduce((a, b) => a + b, 0) / 5) * 100) / 100;
    const status = calcStatus(overall);
    const resultId = generateResultId();

    const row = [
      resultId,
      batchCode,
      (body.productionId || "").trim(),
      body.date || new Date().toISOString().slice(0, 10),
      (body.inspector || "").trim(),
      scores[0],
      scores[1],
      scores[2],
      scores[3],
      scores[4],
      overall,
      status,
      (body.notes || "").trim(),
      body.followUpRequired ? "Yes" : "No",
    ];

    await appendRows(SHEET, [row]);

    return NextResponse.json({
      success: true,
      data: {
        resultId,
        batchCode,
        overallScore: overall,
        status,
      },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to submit QC result", details: String(error) },
      { status: 500 }
    );
  }
}
