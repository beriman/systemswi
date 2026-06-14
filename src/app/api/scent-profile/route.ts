import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type MoodKey = "fresh" | "elegant" | "playful" | "heritage" | "calm" | "bold";
type IntensityKey = "soft" | "medium" | "strong";

type Question = {
  id: string;
  label: string;
  type: "select" | "multi" | "text";
  required?: boolean;
  options?: Array<{ value: string; label: string; profile?: MoodKey }>;
};

type ScentArchetype = {
  id: MoodKey;
  title: string;
  brandFit: string;
  notes: string[];
  recommendedFormula: string;
  operatorNotes: string;
};

const QUESTIONS: Question[] = [
  {
    id: "occasion",
    label: "Dipakai untuk apa?",
    type: "select",
    required: true,
    options: [
      { value: "daily", label: "Harian / kantor", profile: "fresh" },
      { value: "event", label: "Event / malam", profile: "elegant" },
      { value: "creative", label: "Hangout / kreatif", profile: "playful" },
      { value: "gift", label: "Hadiah / oleh-oleh", profile: "heritage" },
    ],
  },
  {
    id: "preferredFamily",
    label: "Keluarga aroma favorit",
    type: "multi",
    required: true,
    options: [
      { value: "citrus", label: "Citrus / segar", profile: "fresh" },
      { value: "floral", label: "Floral / clean", profile: "calm" },
      { value: "woody", label: "Woody / earthy", profile: "elegant" },
      { value: "spicy", label: "Spicy / bold", profile: "bold" },
      { value: "gourmand", label: "Manis / edible", profile: "playful" },
      { value: "local", label: "Nusantara / herbal", profile: "heritage" },
    ],
  },
  {
    id: "intensity",
    label: "Intensitas yang diinginkan",
    type: "select",
    required: true,
    options: [
      { value: "soft", label: "Soft — tidak menyengat" },
      { value: "medium", label: "Medium — terasa tapi aman" },
      { value: "strong", label: "Strong — statement scent" },
    ],
  },
  {
    id: "avoid",
    label: "Aroma yang dihindari / alergi / catatan sensitif",
    type: "text",
  },
  {
    id: "customerName",
    label: "Nama customer / kode sesi",
    type: "text",
  },
  {
    id: "whatsapp",
    label: "WhatsApp customer (opsional, untuk simpan dataset dengan consent)",
    type: "text",
  },
  {
    id: "consent",
    label: "Consent follow-up / CRM (yes/no/TBA)",
    type: "select",
    options: [
      { value: "TBA", label: "TBA — belum dikonfirmasi" },
      { value: "yes", label: "Yes — customer setuju follow-up" },
      { value: "no", label: "No — jangan follow-up" },
    ],
  },
];

const ARCHETYPES: Record<MoodKey, ScentArchetype> = {
  fresh: {
    id: "fresh",
    title: "Fresh Daily Clean",
    brandFit: "Nuscentza / kelas basic parfumer",
    notes: ["citrus", "green tea", "clean musk"],
    recommendedFormula: "DRAFT-FRESH-DAILY — perlu validasi formula oleh perfumer",
    operatorNotes: "Cocok sebagai starting brief untuk parfum harian, office-safe, dan customer baru.",
  },
  elegant: {
    id: "elegant",
    title: "Elegant Woody Floral",
    brandFit: "L'Arc~en~Scent",
    notes: ["woody amber", "soft floral", "musk"],
    recommendedFormula: "DRAFT-ELEGANT-WOODY — perlu validasi IFRA/allergen sebelum produksi",
    operatorNotes: "Arahkan ke opsi premium, event malam, atau signature scent personal.",
  },
  playful: {
    id: "playful",
    title: "Playful Pop Gourmand",
    brandFit: "Pixel Potion",
    notes: ["fruity", "gourmand", "sparkling accord"],
    recommendedFormula: "DRAFT-PLAYFUL-POP — cocok untuk eksperimen, tetap perlu stability check",
    operatorNotes: "Gunakan untuk audience muda, konten interaktif, dan activation booth.",
  },
  heritage: {
    id: "heritage",
    title: "Nusantara Heritage",
    brandFit: "Nuscentza",
    notes: ["local botanical", "warm spice", "soft woods"],
    recommendedFormula: "DRAFT-HERITAGE-NUSANTARA — bahan lokal harus diverifikasi COA/SDS",
    operatorNotes: "Cocok untuk souvenir, cerita budaya, dan Fragrantions experience.",
  },
  calm: {
    id: "calm",
    title: "Soft Calm Floral Musk",
    brandFit: "L'Arc~en~Scent / Nuscentza",
    notes: ["soft floral", "powdery musk", "tea"],
    recommendedFormula: "DRAFT-CALM-FLORAL — gunakan dosis konservatif sampai diuji kulit/kain",
    operatorNotes: "Arah aman untuk customer yang tidak suka parfum menyengat.",
  },
  bold: {
    id: "bold",
    title: "Bold Spicy Statement",
    brandFit: "L'Arc~en~Scent / Pixel Potion",
    notes: ["spice", "amber", "resin"],
    recommendedFormula: "DRAFT-BOLD-SPICE — wajib review allergen dan batas IFRA",
    operatorNotes: "Tawarkan sebagai statement scent, bukan rekomendasi default untuk ruang sempit.",
  },
};

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function scorePayload(payload: Record<string, unknown>) {
  const scores: Record<MoodKey, number> = { fresh: 0, elegant: 0, playful: 0, heritage: 0, calm: 0, bold: 0 };

  for (const question of QUESTIONS) {
    const values = question.type === "multi" ? asArray(payload[question.id]) : [text(payload[question.id])];
    for (const value of values) {
      const option = question.options?.find((item) => item.value === value);
      if (option?.profile) scores[option.profile] += question.id === "occasion" ? 3 : 2;
    }
  }

  const intensity = text(payload.intensity) as IntensityKey;
  if (intensity === "soft") scores.calm += 2;
  if (intensity === "medium") {
    scores.fresh += 1;
    scores.elegant += 1;
  }
  if (intensity === "strong") {
    scores.bold += 2;
    scores.elegant += 1;
  }

  const avoid = text(payload.avoid).toLowerCase();
  if (avoid.includes("manis") || avoid.includes("sweet")) scores.playful -= 2;
  if (avoid.includes("spicy") || avoid.includes("pedas")) scores.bold -= 2;
  if (avoid.includes("floral") || avoid.includes("bunga")) scores.calm -= 1;

  const ranked = (Object.keys(scores) as MoodKey[])
    .sort((a, b) => scores[b] - scores[a])
    .map((key) => ({ ...ARCHETYPES[key], score: scores[key] }));

  return {
    primary: ranked[0],
    alternatives: ranked.slice(1, 3),
    scores,
  };
}

export async function GET() {
  return NextResponse.json({
    source: "systemswi heuristic v1 (read-only, no auto-write)",
    sourceStatus: "live",
    guardrails: [
      "Rekomendasi adalah brief awal, bukan formula produksi final.",
      "Jangan klaim IFRA/BPOM/allergen aman sebelum review compliance dan data SDS/COA.",
      "Jika dipakai untuk customer, simpan hasil final ke Customer CRM hanya setelah consent jelas.",
    ],
    questions: QUESTIONS,
    archetypes: Object.values(ARCHETYPES),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const missing = QUESTIONS
      .filter((question) => question.required)
      .filter((question) => question.type === "multi" ? asArray(body[question.id]).length === 0 : !text(body[question.id]))
      .map((question) => question.id);

    if (missing.length) {
      return NextResponse.json({ error: "Field wajib belum lengkap", missing }, { status: 400 });
    }

    const recommendation = scorePayload(body);
    const primary = recommendation.primary;
    const customerName = text(body.customerName) || "TBA";
    const whatsapp = text(body.whatsapp);
    return NextResponse.json({
      success: true,
      sessionId: `SP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      customerName,
      inputs: {
        occasion: text(body.occasion),
        preferredFamily: asArray(body.preferredFamily),
        intensity: text(body.intensity),
        avoid: text(body.avoid) || "TBA",
        whatsapp: whatsapp || "TBA",
        consent: text(body.consent) || "TBA",
      },
      recommendation,
      datasetDraft: {
        canSaveToCrm: Boolean(customerName && customerName !== "TBA" && whatsapp),
        customerName,
        whatsapp: whatsapp || "TBA",
        consent: text(body.consent) || "TBA",
        interest: `${primary.title} / ${primary.brandFit}`,
        recommendedFormula: primary.recommendedFormula,
        source: "AI Scent Profile / Store Kiosk",
        summary: `Scent profile draft: ${primary.title}; notes=${primary.notes.join(", ")}; intensity=${text(body.intensity)}; avoid=${text(body.avoid) || "TBA"}`,
        guardrail: "Save hanya jika customer memberi consent jelas; hasil tetap draft dan perlu review perfumer/compliance.",
      },
      nextActions: [
        "Review dengan perfumer sebelum mixing.",
        "Jika akan diproduksi, catat formula di Compliance dan jalankan IFRA/allergen checklist.",
        "Jika customer consent jelas, klik Save to CRM Dataset untuk mencatat preferensi ke Customer CRM.",
      ],
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal membuat scent profile", details: String(error) }, { status: 500 });
  }
}
