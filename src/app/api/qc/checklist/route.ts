// GET /api/qc/checklist — Get QC checklist template
import { NextResponse } from "next/server";

export interface ChecklistCategory {
  name: string;
  description: string;
  maxScore: number;
}

export interface ChecklistTemplate {
  title: string;
  categories: ChecklistCategory[];
  gradingRules: {
    pass: string;
    conditional: string;
    fail: string;
  };
}

const CHECKLIST_TEMPLATE: ChecklistTemplate = {
  title: "QC Checklist — Produksi Parfum",
  categories: [
    {
      name: "Aroma",
      description: "Kesesuaian aroma dengan formula/resep",
      maxScore: 10,
    },
    {
      name: "Warna",
      description: "Konsistensi warna cairan parfum",
      maxScore: 10,
    },
    {
      name: "Kejernihan",
      description: "Kejernihan cairan, tidak ada partikel mengambang",
      maxScore: 10,
    },
    {
      name: "Packaging",
      description: "Kualitas packaging, label, dan kemasan",
      maxScore: 10,
    },
    {
      name: "Seal Integrity",
      description: "Kekedapan segal, tidak ada kebocoran",
      maxScore: 10,
    },
  ],
  gradingRules: {
    pass: "Overall Score ≥ 7.0",
    conditional: "Overall Score 5.0 – 6.9",
    fail: "Overall Score < 5.0",
  },
};

export async function GET() {
  return NextResponse.json({
    source: "Google Sheets: QC_Checklist",
    sourceStatus: "live",
    template: CHECKLIST_TEMPLATE,
  });
}
