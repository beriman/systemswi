// GET /api/qc/checklist — Return QC checklist template
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const CHECKLIST_TEMPLATE = [
  {
    category: "Aroma",
    items: [
      { id: "aroma-1", category: "Aroma", item: "Kesesuaian aroma dengan formula", description: "Cocok dengan deskripsi produk dan formula", type: "score", order: 1 },
      { id: "aroma-2", category: "Aroma", item: "Kekuatan aroma (longevity)", description: "Tahan minimal 4 jam di kulit", type: "score", order: 2 },
      { id: "aroma-3", category: "Aroma", item: "Tidak ada bau aneh/off-note", description: "Tidak ada bau tengik, metalik, atau tidak wajar", type: "score", order: 3 },
    ],
  },
  {
    category: "Warna",
    items: [
      { id: "warna-1", category: "Warna", item: "Konsistensi warna dengan standar", description: "Warna sesuai dengan color chart produk", type: "score", order: 1 },
      { id: "warna-2", category: "Warna", item: "Tidak ada perubahan warna", description: "Tidak ada oksidasi atau perubahan warna selama produksi", type: "score", order: 2 },
    ],
  },
  {
    category: "Kejernihan",
    items: [
      { id: "kejernihan-1", category: "Kejernihan", item: "Kejernihan cairan", description: "Cairan jernih, tidak ada partikel atau endapan", type: "score", order: 1 },
      { id: "kejernihan-2", category: "Kejernihan", item: "Tidak ada pemisahan fase", description: "Tidak ada pemisahan minyak dan air", type: "score", order: 2 },
    ],
  },
  {
    category: "Packaging",
    items: [
      { id: "packaging-1", category: "Packaging", item: "Kualitas botol", description: "Botol tidak ada goresan, retak, atau cacat", type: "score", order: 1 },
      { id: "packaging-2", category: "Packaging", item: "Label benar dan rapi", description: "Label sesuai produk, posisi rapi, tidak mengelupas", type: "score", order: 2 },
      { id: "packaging-3", category: "Packaging", item: "Kartu dan aksesoris lengkap", description: "Kartu produk, stiker, dan aksesoris lengkap", type: "score", order: 3 },
    ],
  },
  {
    category: "Seal Integrity",
    items: [
      { id: "seal-1", category: "Seal Integrity", item: "Keutuhan seal botol", description: "Seal utuh, tidak ada tanda-tanda buka", type: "score", order: 1 },
      { id: "seal-2", category: "Seal Integrity", item: "Tidak bocor", description: "Tidak ada kebocoran saat dibalik atau ditekan", type: "score", order: 2 },
      { id: "seal-3", category: "Seal Integrity", item: "Cap/spray berfungsi baik", description: "Tutup atau sprayer berfungsi dengan baik", type: "score", order: 3 },
    ],
  },
];

export async function GET() {
  return NextResponse.json({
    categories: CHECKLIST_TEMPLATE,
    totalItems: CHECKLIST_TEMPLATE.reduce((sum, cat) => sum + cat.items.length, 0),
  });
}
