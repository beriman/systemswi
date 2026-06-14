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

export async function GET() {
  return NextResponse.json({
    success: true,
    source: "systemswi WhatsApp automation templates (no message is sent by this API)",
    sourceStatus: "ok",
    generatedAt: new Date().toISOString(),
    templates: TEMPLATES,
    guardrails: [
      "API hanya membuat preview/link; tidak mengirim WhatsApp otomatis.",
      "Gunakan TBA untuk data yang belum diverifikasi.",
      "Customer broadcast harus hanya untuk kontak opt-in/consented.",
    ],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
