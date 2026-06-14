import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type MoodKey = "fresh" | "elegant" | "playful" | "heritage" | "calm" | "bold";
type IntensityKey = "soft" | "medium" | "strong";

type ScoreSignal = {
  source: string;
  profile: MoodKey;
  points: number;
  reason: string;
};

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
  bestFor: string[];
  avoidIf: string[];
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
    id: "impression",
    label: "Kesan yang ingin muncul (opsional)",
    type: "select",
    options: [
      { value: "professional", label: "Profesional / rapi", profile: "fresh" },
      { value: "luxury", label: "Mewah / dewasa", profile: "elegant" },
      { value: "friendly", label: "Ceria / mudah didekati", profile: "playful" },
      { value: "grounded", label: "Natural / membumi", profile: "heritage" },
      { value: "comfort", label: "Tenang / nyaman", profile: "calm" },
      { value: "memorable", label: "Berani / mudah diingat", profile: "bold" },
    ],
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
    bestFor: ["daily wear", "kantor", "customer baru", "ruang indoor"],
    avoidIf: ["customer mencari parfum malam yang sangat tahan lama", "menghindari citrus"],
  },
  elegant: {
    id: "elegant",
    title: "Elegant Woody Floral",
    brandFit: "L'Arc~en~Scent",
    notes: ["woody amber", "soft floral", "musk"],
    recommendedFormula: "DRAFT-ELEGANT-WOODY — perlu validasi IFRA/allergen sebelum produksi",
    operatorNotes: "Arahkan ke opsi premium, event malam, atau signature scent personal.",
    bestFor: ["event malam", "signature scent", "premium gift", "B2B hamper"],
    avoidIf: ["customer sensitif terhadap amber/wood berat", "ingin aroma sangat ringan"],
  },
  playful: {
    id: "playful",
    title: "Playful Pop Gourmand",
    brandFit: "Pixel Potion",
    notes: ["fruity", "gourmand", "sparkling accord"],
    recommendedFormula: "DRAFT-PLAYFUL-POP — cocok untuk eksperimen, tetap perlu stability check",
    operatorNotes: "Gunakan untuk audience muda, konten interaktif, dan activation booth.",
    bestFor: ["hangout", "booth activation", "content creator", "gift playful"],
    avoidIf: ["customer tidak suka manis/gourmand", "setting formal konservatif"],
  },
  heritage: {
    id: "heritage",
    title: "Nusantara Heritage",
    brandFit: "Nuscentza",
    notes: ["local botanical", "warm spice", "soft woods"],
    recommendedFormula: "DRAFT-HERITAGE-NUSANTARA — bahan lokal harus diverifikasi COA/SDS",
    operatorNotes: "Cocok untuk souvenir, cerita budaya, dan Fragrantions experience.",
    bestFor: ["souvenir", "narasi Nusantara", "event budaya", "gift corporate"],
    avoidIf: ["bahan lokal belum ada COA/SDS", "customer menghindari herbal/spice"],
  },
  calm: {
    id: "calm",
    title: "Soft Calm Floral Musk",
    brandFit: "L'Arc~en~Scent / Nuscentza",
    notes: ["soft floral", "powdery musk", "tea"],
    recommendedFormula: "DRAFT-CALM-FLORAL — gunakan dosis konservatif sampai diuji kulit/kain",
    operatorNotes: "Arah aman untuk customer yang tidak suka parfum menyengat.",
    bestFor: ["customer sensitif", "daily soft", "kelas basic", "hadiah aman"],
    avoidIf: ["customer menghindari floral/bunga", "butuh statement scent kuat"],
  },
  bold: {
    id: "bold",
    title: "Bold Spicy Statement",
    brandFit: "L'Arc~en~Scent / Pixel Potion",
    notes: ["spice", "amber", "resin"],
    recommendedFormula: "DRAFT-BOLD-SPICE — wajib review allergen dan batas IFRA",
    operatorNotes: "Tawarkan sebagai statement scent, bukan rekomendasi default untuk ruang sempit.",
    bestFor: ["statement scent", "event outdoor/malam", "customer percaya diri", "eksperimen premium"],
    avoidIf: ["ruang kecil/kantor konservatif", "customer sensitif spice/resin"],
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
  const signals: ScoreSignal[] = [];

  function add(profile: MoodKey, points: number, source: string, reason: string) {
    scores[profile] += points;
    signals.push({ profile, points, source, reason });
  }

  for (const question of QUESTIONS) {
    const values = question.type === "multi" ? asArray(payload[question.id]) : [text(payload[question.id])];
    for (const value of values) {
      const option = question.options?.find((item) => item.value === value);
      if (option?.profile) {
        const points = question.id === "occasion" ? 3 : question.id === "impression" ? 2 : 2;
        add(option.profile, points, question.id, `${question.label}: ${option.label}`);
      }
    }
  }

  const intensity = text(payload.intensity) as IntensityKey;
  if (intensity === "soft") add("calm", 2, "intensity", "Soft cocok dengan profile calm/floral musk yang tidak menyengat");
  if (intensity === "medium") {
    add("fresh", 1, "intensity", "Medium tetap aman untuk daily fresh");
    add("elegant", 1, "intensity", "Medium cukup untuk arah woody/elegant tanpa terlalu berat");
  }
  if (intensity === "strong") {
    add("bold", 2, "intensity", "Strong mengarah ke statement scent");
    add("elegant", 1, "intensity", "Strong juga cocok untuk event/premium woody amber");
  }

  const avoid = text(payload.avoid).toLowerCase();
  if (avoid.includes("manis") || avoid.includes("sweet")) add("playful", -2, "avoid", "Customer menghindari manis/sweet; kurangi gourmand/playful");
  if (avoid.includes("spicy") || avoid.includes("pedas")) add("bold", -2, "avoid", "Customer menghindari spicy/pedas; kurangi bold spice");
  if (avoid.includes("floral") || avoid.includes("bunga")) add("calm", -1, "avoid", "Customer menghindari floral/bunga; kurangi calm floral");
  if (avoid.includes("citrus") || avoid.includes("jeruk")) add("fresh", -1, "avoid", "Customer menghindari citrus/jeruk; kurangi fresh citrus");
  if (avoid.includes("amber") || avoid.includes("woody") || avoid.includes("kayu")) add("elegant", -1, "avoid", "Customer menghindari amber/woody/kayu; kurangi elegant woody");

  const ranked = (Object.keys(scores) as MoodKey[])
    .sort((a, b) => scores[b] - scores[a])
    .map((key) => ({ ...ARCHETYPES[key], score: scores[key] }));

  const topScore = ranked[0]?.score ?? 0;
  const secondScore = ranked[1]?.score ?? 0;
  const positivePoints = signals.filter((signal) => signal.points > 0).reduce((sum, signal) => sum + signal.points, 0) || 1;
  const confidence = Math.max(35, Math.min(95, Math.round(((topScore - secondScore + topScore) / positivePoints) * 55 + 35)));
  const riskFlags = [
    avoid ? `Catatan avoid/alergi perlu dicek manual: ${text(payload.avoid)}` : "Alergi/sensitivitas belum dikonfirmasi — tulis TBA dan tanya ulang sebelum mixing.",
    intensity === "strong" ? "Intensitas strong: wajib review IFRA/allergen dan uji kenyamanan sebelum dipakai di ruang sempit." : "Gunakan dosis konservatif sampai customer mencium blotter/sample.",
    "Formula tetap DRAFT — belum boleh diklaim BPOM/IFRA/allergen-safe tanpa data compliance.",
  ];

  return {
    primary: ranked[0],
    alternatives: ranked.slice(1, 3),
    scores,
    confidence,
    scoringDetails: signals.sort((a, b) => b.points - a.points),
    riskFlags,
    formulaBrief: {
      accordDirection: ranked[0].notes.join(" + "),
      concentrationDraft: intensity === "soft" ? "EDT/low EDP draft — TBA %" : intensity === "strong" ? "EDP draft — TBA %, review batas IFRA" : "balanced EDP draft — TBA %",
      validationRequired: ["perfumer review", "blotter test", "skin/fabric test", "IFRA/allergen checklist", "COA/SDS bahan"],
    },
  };
}

export async function GET() {
  return NextResponse.json({
    source: "systemswi heuristic v2 (transparent scoring, read-only, no auto-write)",
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
        impression: text(body.impression) || "TBA",
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
        summary: `Scent profile draft: ${primary.title}; confidence=${recommendation.confidence}%; notes=${primary.notes.join(", ")}; intensity=${text(body.intensity)}; impression=${text(body.impression) || "TBA"}; avoid=${text(body.avoid) || "TBA"}`,
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
