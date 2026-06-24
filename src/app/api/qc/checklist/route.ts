// GET /api/qc/checklist — Return QC checklist template
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  description: string;
  type: "score" | "boolean" | "text";
  order: number;
}

const CHECKLIST_TEMPLATE: ChecklistItem[] = [
  // Aroma
  { id: "aroma-1", category: "Aroma", item: "Intensity", description: "Kekuatan aroma sesuai standar (1-10)", type: "score", order: 1 },
  { id: "aroma-2", category: "Aroma", item: "Longevity", description: "Tahan lama aroma di kulit (1-10)", type: "score", order: 2 },
  { id: "aroma-3", category: "Aroma", item: "Accord Match", description: "Kesesuaian top/middle/base note (1-10)", type: "score", order: 3 },
  { id: "aroma-4", category: "Aroma", item: "Off-note Check", description: "Tidak ada bau tidak diinginkan (1-10)", type: "score", order: 4 },

  // Warna
  { id: "warna-1", category: "Warna", item: "Color Consistency", description: "Konsistensi warna antar batch (1-10)", type: "score", order: 5 },
  { id: "warna-2", category: "Warna", item: "Clarity", description: "Kejernihan cairan parfum (1-10)", type: "score", order: 6 },
  { id: "warna-3", category: "Warna", item: "No Sediment", description: "Tidak ada endapan (1-10)", type: "score", order: 7 },

  // Kejernihan
  { id: "kejernihan-1", category: "Kejernihan", item: "Visual Clarity", description: "Visual kejernihan produk (1-10)", type: "score", order: 8 },
  { id: "kejernihan-2", category: "Kejernihan", item: "Particle Check", description: "Tidak ada partikel mengambang (1-10)", type: "score", order: 9 },
  { id: "kejernihan-3", category: "Kejernihan", item: "Separation Test", description: "Tidak ada pemisahan lapisan (1-10)", type: "score", order: 10 },

  // Packaging
  { id: "packaging-1", category: "Packaging", item: "Bottle Quality", description: "Kualitas botol & sprayer (1-10)", type: "score", order: 11 },
  { id: "packaging-2", category: "Packaging", item: "Label Alignment", description: "Ketepatan label & posisi (1-10)", type: "score", order: 12 },
  { id: "packaging-3", category: "Packaging", item: "Box Condition", description: "Kondisi kartu & packaging (1-10)", type: "score", order: 13 },
  { id: "packaging-4", category: "Packaging", item: "Batch Code Print", description: "Kejelasan batch code & expiry (1-10)", type: "score", order: 14 },

  // Seal Integrity
  { id: "seal-1", category: "Seal Integrity", item: "Cap Seal", description: "Keutuhan tutup & seal (1-10)", type: "score", order: 15 },
  { id: "seal-2", category: "Seal Integrity", item: "Leak Test", description: "Tes kebocoran (1-10)", type: "score", order: 16 },
  { id: "seal-3", category: "Seal Integrity", item: "Sprayer Function", description: "Fungsi sprayer normal (1-10)", type: "score", order: 17 },
  { id: "seal-4", category: "Seal Integrity", item: "Tamper Evidence", description: "Bukti segel anti-tamper (1-10)", type: "score", order: 18 },
];

export async function GET() {
  try {
    // Group by category for easier UI rendering
    const categories = Array.from(new Set(CHECKLIST_TEMPLATE.map((c) => c.category)));
    const grouped = categories.map((cat) => ({
      category: cat,
      items: CHECKLIST_TEMPLATE.filter((c) => c.category === cat).sort((a, b) => a.order - b.order),
    }));

    return NextResponse.json({
      source: "template",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      categories: grouped,
      items: CHECKLIST_TEMPLATE,
      scoringGuide: {
        type: "1-10 scale per category",
        overallFormula: "average of 5 category scores (Aroma, Warna, Kejernihan, Packaging, Seal Integrity)",
        statusRules: [
          { status: "Pass", minScore: 7, maxScore: 10, color: "green" },
          { status: "Conditional", minScore: 5, maxScore: 6.99, color: "amber" },
          { status: "Fail", minScore: 0, maxScore: 4.99, color: "red" },
        ],
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch QC checklist", details: String(error) },
      { status: 500 }
    );
  }
}
