import { NextResponse } from "next/server";
import { readSheet } from "@/lib/sheets/sheets-real";
import { isGoogleWorkspaceAuthError, googleWorkspaceDegradedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await readSheet("QCChecklist");
    if (!rows || rows.length <= 1) {
      // Return default template if sheet is empty
      return NextResponse.json({
        source: "Google Sheets: QC_Checklist (default template)",
        template: {
          title: "QC Checklist Template — Parfum Production",
          categories: [
            { name: "Aroma", description: "Evaluasi kesesuaian dan konsistensi aroma terhadap spesifikasi formula", maxScore: 10 },
            { name: "Warna", description: "Evaluasi konsistensi warna cairan parfum", maxScore: 10 },
            { name: "Kejernihan", description: "Evaluasi kejernihan cairan — tidak ada partikel/sedimen", maxScore: 10 },
            { name: "Packaging", description: "Evaluasi kualitas botol, cap, sprayer, dan labeling", maxScore: 10 },
            { name: "Seal Integrity", description: "Evaluasi kekedapan segel dan kemasan", maxScore: 10 },
          ],
          gradingRules: { pass: ">= 7.0", conditional: "5.0 – 6.9", fail: "< 5.0" },
        },
      });
    }

    const items = rows.slice(1).filter((row) => row.some(Boolean)).map((row) => ({
      id: String(row[0] || "").trim(),
      category: String(row[1] || "").trim(),
      item: String(row[2] || "").trim(),
      standard: String(row[3] || "").trim(),
      method: String(row[4] || "").trim(),
      weight: Number(row[5]) || 1,
      stage: String(row[6] || "").trim(),
      notes: String(row[7] || "").trim(),
    }));

    return NextResponse.json({
      source: "Google Sheets: QC_Checklist",
      template: {
        title: "QC Checklist Template — Parfum Production",
        items,
        categories: [
          { name: "Aroma", description: "Evaluasi kesesuaian dan konsistensi aroma", maxScore: 10 },
          { name: "Warna", description: "Evaluasi konsistensi warna", maxScore: 10 },
          { name: "Kejernihan", description: "Evaluasi kejernihan cairan", maxScore: 10 },
          { name: "Packaging", description: "Evaluasi kualitas packaging", maxScore: 10 },
          { name: "Seal Integrity", description: "Evaluasi kekedapan segel", maxScore: 10 },
        ],
        gradingRules: { pass: ">= 7.0", conditional: "5.0 – 6.9", fail: "< 5.0" },
      },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: QC_Checklist", error),
        template: {
          title: "QC Checklist Template (default)",
          categories: [
            { name: "Aroma", description: "Evaluasi kesesuaian dan konsistensi aroma", maxScore: 10 },
            { name: "Warna", description: "Evaluasi konsistensi warna", maxScore: 10 },
            { name: "Kejernihan", description: "Evaluasi kejernihan cairan", maxScore: 10 },
            { name: "Packaging", description: "Evaluasi kualitas packaging", maxScore: 10 },
            { name: "Seal Integrity", description: "Evaluasi kekedapan segel", maxScore: 10 },
          ],
          gradingRules: { pass: ">= 7.0", conditional: "5.0 – 6.9", fail: "< 5.0" },
        },
      });
    }
    return NextResponse.json({ error: "Gagal membaca QC checklist", details: String(error) }, { status: 500 });
  }
}
