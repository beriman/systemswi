import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type WhatsAppTemplateType = "faq" | "broadcast" | "customer_sync";

type WhatsAppTemplate = {
  id: string;
  type: WhatsAppTemplateType;
  title: string;
  useCase: string;
  defaultAudience: string;
  requiredFields: string[];
  body: string;
};

type FaqItem = {
  id: string;
  category: "jam_buka" | "lokasi" | "harga_kelas" | "produk";
  question: string;
  answer: string;
  templateId: string;
};

const FAQ_KNOWLEDGE_BASE: FaqItem[] = [
  {
    id: "faq-hours",
    category: "jam_buka",
    question: "Jam buka SWI Store TIM kapan?",
    answer:
      "Jam operasional SWI Store TIM harus dikonfirmasi admin/operator pada hari kunjungan. Gunakan bahasa TBA jika jadwal belum diverifikasi agar tidak memberi info yang keliru.",
    templateId: "faq-store-hours",
  },
  {
    id: "faq-location",
    category: "lokasi",
    question: "Lokasi SWI Store di mana?",
    answer:
      "SWI Store berada di area Taman Ismail Marzuki, Jakarta. Detail titik temu/ruangan tetap dikonfirmasi admin sebelum customer datang.",
    templateId: "faq-store-location",
  },
  {
    id: "faq-class-pricing",
    category: "harga_kelas",
    question: "Berapa harga kelas parfumer?",
    answer:
      "Harga kelas parfumer belum dipublish sebagai angka final di sistem. Operator harus mengirim paket/harga terbaru yang sudah diverifikasi, bukan mengarang angka.",
    templateId: "faq-class-pricing",
  },
  {
    id: "faq-products",
    category: "produk",
    question: "Produk apa saja yang tersedia?",
    answer:
      "Produk/brand yang bisa ditawarkan: L'Arc~en~Scent, Nuscentza, Pixel Potion, serta merchandise TIM jika stok sudah divalidasi. Ketersediaan stok dan harga harus dicek admin sebelum invoice.",
    templateId: "faq-products",
  },
];

const TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "faq-store-hours",
    type: "faq",
    title: "FAQ Jam Buka Store",
    useCase: "Balasan cepat untuk pertanyaan jam buka/lokasi SWI Store TIM.",
    defaultAudience: "Customer retail / calon peserta kelas",
    requiredFields: ["namaCustomer"],
    body:
      "Halo {{namaCustomer}}, terima kasih sudah menghubungi Sensasi Wangi Indonesia.\n\nSWI Store berada di area Taman Ismail Marzuki, Jakarta. Untuk jam operasional terbaru dan jadwal kelas parfumer, tim kami akan konfirmasi ulang sebelum kunjungan agar informasinya akurat.\n\nApakah Kakak ingin info produk, kelas parfumer, atau jadwal event Fragrantions?",
  },
  {
    id: "faq-store-location",
    type: "faq",
    title: "FAQ Lokasi Store TIM",
    useCase: "Balasan cepat lokasi/titik temu dengan guardrail konfirmasi detail sebelum kunjungan.",
    defaultAudience: "Customer retail / peserta kelas / tamu event",
    requiredFields: ["namaCustomer"],
    body:
      "Halo {{namaCustomer}}, SWI Store berada di area Taman Ismail Marzuki, Jakarta.\n\nUntuk titik temu/ruangan yang paling akurat, admin akan konfirmasi ulang sebelum Kakak datang. Jika Kakak mau, kirim rencana tanggal/jam kunjungan supaya tim kami bisa bantu arahkan.",
  },
  {
    id: "faq-class-pricing",
    type: "faq",
    title: "FAQ Harga Kelas Parfumer",
    useCase: "Jawaban aman untuk pertanyaan harga kelas tanpa mengarang angka yang belum diverifikasi.",
    defaultAudience: "Calon peserta kelas parfumer / komunitas",
    requiredFields: ["namaCustomer", "jenisKelas"],
    body:
      "Halo {{namaCustomer}}, terima kasih tertarik dengan kelas {{jenisKelas}} dari SWI.\n\nPaket dan harga final akan kami kirim setelah admin memverifikasi jadwal, kapasitas, dan fasilitas kelas terbaru. Kami tidak ingin memberi angka yang belum final.\n\nBoleh info jumlah peserta dan target tanggalnya?",
  },
  {
    id: "faq-products",
    type: "faq",
    title: "FAQ Produk & Stok",
    useCase: "Jawaban produk dengan reminder cek stok/harga sebelum invoice.",
    defaultAudience: "Customer retail / reseller / tenant",
    requiredFields: ["namaCustomer", "minatProduk"],
    body:
      "Halo {{namaCustomer}}, untuk {{minatProduk}}, SWI memiliki lini L'Arc~en~Scent, Nuscentza, Pixel Potion, dan merchandise TIM tertentu.\n\nKetersediaan stok, batch, dan harga final akan dicek admin dulu sebelum invoice/booking dibuat. Apakah Kakak mencari parfum, kelas experience, atau merchandise?",
  },
  {
    id: "broadcast-event-followup",
    type: "broadcast",
    title: "Broadcast Follow-up Event Fragrantions",
    useCase: "Follow-up prospek tenant/sponsor tanpa mengirim otomatis.",
    defaultAudience: "Prospek tenant, sponsor, komunitas, dan media partner",
    requiredFields: ["namaKontak", "namaEvent", "deadline"],
    body:
      "Halo {{namaKontak}}, salam wangi dari SWI.\n\nKami sedang menyiapkan {{namaEvent}} dan membuka slot kolaborasi tenant/sponsor. Jika berkenan, kami bisa kirimkan paket kerja sama dan kebutuhan booth/deliverables.\n\nTarget konfirmasi internal: {{deadline}}. Apakah Kakak bersedia kami follow-up hari ini?",
  },
  {
    id: "broadcast-restock",
    type: "broadcast",
    title: "Broadcast Restock Produk",
    useCase: "Notifikasi restock produk/merchandise setelah inventory divalidasi operator.",
    defaultAudience: "Customer opt-in dan reseller",
    requiredFields: ["namaProduk", "cta"],
    body:
      "Kabar wangi dari SWI ✨\n\n{{namaProduk}} sudah/akan restock. Stok dan harga final tetap mengikuti validasi admin sebelum invoice dibuat.\n\n{{cta}}",
  },
  {
    id: "customer-sync-intake",
    type: "customer_sync",
    title: "Customer Database Intake",
    useCase: "Format input manual untuk sinkronisasi customer database/CRM.",
    defaultAudience: "Admin store / sales",
    requiredFields: ["namaCustomer", "nomorWa", "minat", "sumber"],
    body:
      "CUSTOMER INTAKE\nNama: {{namaCustomer}}\nWhatsApp: {{nomorWa}}\nMinat: {{minat}}\nSumber: {{sumber}}\nConsent follow-up: TBA/Ya/Tidak\nCatatan: TBA",
  },
];

function interpolate(template: string, values: Record<string, unknown>) {
  return template.replace(/{{(.*?)}}/g, (_, key: string) => {
    const value = String(values[key.trim()] ?? "").trim();
    return value || "TBA";
  });
}

function normalizePhone(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("62")) return digits;
  return digits;
}

function findFaqAnswer(value: unknown) {
  const query = String(value ?? "").toLowerCase();
  if (!query.trim()) return null;

  const keywordMap: Array<[FaqItem["category"], string[]]> = [
    ["jam_buka", ["jam", "buka", "operasional", "open", "tutup"]],
    ["lokasi", ["lokasi", "alamat", "dimana", "di mana", "maps", "tim"]],
    ["harga_kelas", ["harga", "biaya", "kelas", "workshop", "parfumer"]],
    ["produk", ["produk", "stok", "parfum", "merch", "larc", "nuscentza", "pixel"]],
  ];

  const matchedCategory = keywordMap.find(([, keywords]) => keywords.some((keyword) => query.includes(keyword)))?.[0];
  if (matchedCategory) return FAQ_KNOWLEDGE_BASE.find((item) => item.category === matchedCategory) || null;
  return FAQ_KNOWLEDGE_BASE[0];
}

export async function GET() {
  return NextResponse.json({
    success: true,
    source: "systemswi WhatsApp automation templates (no message is sent by this API)",
    sourceStatus: "ok",
    generatedAt: new Date().toISOString(),
    templates: TEMPLATES,
    faqKnowledgeBase: FAQ_KNOWLEDGE_BASE,
    guardrails: [
      "API hanya membuat preview/link; tidak mengirim WhatsApp otomatis.",
      "Gunakan TBA untuk data yang belum diverifikasi.",
      "Customer broadcast harus hanya untuk kontak opt-in/consented.",
      "Harga kelas, stok, dan jam operasional wajib diverifikasi operator sebelum dikirim manual.",
    ],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (String(body?.action || "") === "faq_answer") {
      const faq = findFaqAnswer(body?.query);
      if (!faq) {
        return NextResponse.json({ error: "query FAQ wajib diisi" }, { status: 400 });
      }
      const template = TEMPLATES.find((item) => item.id === faq.templateId);
      const values = (body?.values || {}) as Record<string, unknown>;
      const message = template ? interpolate(template.body, values) : faq.answer;
      const phone = normalizePhone(values.nomorWa || body?.nomorWa);
      const waLink = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : null;

      return NextResponse.json(
        {
          success: true,
          source: "systemswi WhatsApp FAQ knowledge base (preview only)",
          sourceStatus: "ok",
          faq,
          template: template ? { id: template.id, type: template.type, title: template.title } : null,
          answer: faq.answer,
          message,
          waLink,
          note: "FAQ preview dibuat; belum ada pesan yang dikirim otomatis. Verifikasi jadwal, harga, stok, dan consent sebelum kirim manual.",
          generatedAt: new Date().toISOString(),
        },
        { status: 201 },
      );
    }

    const templateId = String(body?.templateId || "").trim();
    const template = TEMPLATES.find((item) => item.id === templateId);
    if (!template) {
      return NextResponse.json({ error: "templateId tidak valid" }, { status: 400 });
    }

    const values = (body?.values || {}) as Record<string, unknown>;
    const missing = template.requiredFields.filter((field) => !String(values[field] ?? "").trim());
    if (missing.length > 0) {
      return NextResponse.json({ error: "field wajib belum lengkap", missing }, { status: 400 });
    }

    const message = interpolate(template.body, values);
    const phone = normalizePhone(values.nomorWa || body?.nomorWa);
    const waLink = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : null;

    return NextResponse.json(
      {
        success: true,
        source: "systemswi WhatsApp automation preview",
        sourceStatus: "ok",
        template: { id: template.id, type: template.type, title: template.title },
        message,
        waLink,
        note: "Preview dibuat; belum ada pesan yang dikirim otomatis.",
        generatedAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: "Gagal membuat preview WhatsApp", details: String(error) }, { status: 500 });
  }
}
