// GET /api/qc/checklist — Get QC checklist template
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// QC Checklist template — 5 categories, each with items
const CHECKLIST_TEMPLATE = {
  categories: [
    {
      category: "Aroma",
      items: [
        { id: "AR-001", category: "Aroma", item: "Kesesuaian Aroma", description: "Aroma sesuai dengan spec/fragrance profile", type: "score", order: 1 },
        { id: "AR-002", category: "Aroma", item: "Kekuatan Aroma", description: "Intensity/throw strength sesuai standar", type: "score", order: 2 },
        { id: "AR-003", category: "Aroma", item: "Stabilitas Aroma", description: "Tidak ada off-note atau perubahan aroma", type: "score", order: 3 },
        { id: "AR-004", category: "Aroma", item: "Longevity", description: "Durasi aroma sesuai spec (4-8 jam)", type: "score", order: 4 },
      ],
    },
    {
      category: "Warna",
      items: [
        { id: "WN-001", category: "Warna", item: "Konsistensi Warna", description: "Warna cairan sesuai dengan standard color", type: "score", order: 1 },
        { id: "WN-002", category: "Warna", item: "Kejernihan Visual", description: "Tidak ada partikel mengapung atau endapan", type: "score", order: 2 },
        { id: "WN-003", category: "Warna", item: "Gradasi Warna", description: "Tidak ada gradasi/pemisahan warna", type: "score", order: 3 },
      ],
    },
    {
      category: "Kejernihan",
      items: [
        { id: "KJ-001", category: "Kejernihan", item: "Visual Clarity", description: "Cairan jernih, tidak keruh", type: "score", order: 1 },
        { id: "KJ-002", category: "Kejernihan", item: "Partikel Check", description: "Tidak ada partikel asing di bawah lampu UV", type: "score", order: 2 },
        { id: "KJ-003", category: "Kejernihan", item: "Viskositas", description: "Viskositas sesuai spec (flow rate)", type: "score", order: 3 },
      ],
    },
    {
      category: "Packaging",
      items: [
        { id: "PK-001", category: "Packaging", item: "Botol & Cap", description: "Kualitas botol, cap, dan sprayer berfungsi baik", type: "score", order: 1 },
        { id: "PK-002", category: "Packaging", item: "Label & Printing", description: "Label rapi, printing jelas, tidak luntur", type: "score", order: 2 },
        { id: "PK-003", category: "Packaging", item: "Box & Insert", description: "Kotak luar dan insert card rapi", type: "score", order: 3 },
        { id: "PK-004", category: "Packaging", item: "Batch Code Print", description: "Batch code dan expiry date tercetak jelas", type: "score", order: 4 },
      ],
    },
    {
      category: "Seal Integrity",
      items: [
        { id: "SL-001", category: "Seal Integrity", item: "Cap Seal", description: "Seal cap utuh, tidak ada bukaan", type: "score", order: 1 },
        { id: "SL-002", category: "Seal Integrity", item: "Sprayer Seal", description: "Tidak ada kebocoran di area sprayer", type: "score", order: 2 },
        { id: "SL-003", category: "Seal Integrity", item: "Pressure Test", description: "Lekanan sesuai spec (tidak bocor saat ditekan)", type: "score", order: 3 },
        { id: "SL-004", category: "Seal Integrity", item: "Drop Test", description: "Tidak bocor/jatuh dari ketinggian 1m", type: "score", order: 4 },
      ],
    },
  ],
  scoring: {
    min: 1,
    max: 10,
    thresholds: {
      pass: ">= 7.0",
      conditional: "5.0 — 6.99",
      fail: "< 5.0",
    },
  },
};

export async function GET() {
  return NextResponse.json({
    source: "QC Checklist Template",
    sourceStatus: "live",
    generatedAt: new Date().toISOString(),
    ...CHECKLIST_TEMPLATE,
  });
}
