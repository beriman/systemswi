// POST /api/customers/seed — seed sample customer data
// Body: { force?: boolean }
import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceWriteBlockedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readRange, appendRows, writeRange } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

// ── Sample Data ──

const SAMPLE_CUSTOMERS = [
  // 3 VIP customers (≥10 purchases)
  ["CUST-ANDRA-001", "Andra Kusuma", "6281211110001", "vip", "Kelas Parfumer Lanjutan", "WhatsApp", "yes", "2026-06-15", "15", "12500000", "Fragrantia Noir", "Suka aroma woody, sudah ikut 3 batch kelas", "2026-06-15T10:00:00.000Z"],
  ["CUST-DIANA-002", "Diana Putri", "6281222220002", "vip", "Produk SWI / Fragrantions", "Instagram", "yes", "2026-06-18", "12", "9800000", "Pixel Potion Body Mist", "Reseller aktif, order tiap bulan", "2026-06-18T14:30:00.000Z"],
  ["CUST-BAGAS-003", "Bagas Pratama", "6281333330003", "vip", "Corporate Gift / Workshop", "Event", "yes", "2026-06-20", "18", "15200000", "L'Arc~en~Scent EDP", "Perusahaan banyak order untuk gift", "2026-06-20T09:00:00.000Z"],
  // 4 Regular customers (2-4 purchases)
  ["CUST-SINTA-004", "Sinta Maharani", "6281444440004", "regular", "Kelas Parfumer Pemula", "WhatsApp", "yes", "2026-05-20", "3", "2100000", "Fragrantia Bloom", "Minat buat parfum sendiri", "2026-05-20T16:00:00.000Z"],
  ["CUST-REZA-005", "Reza Firmansyah", "6281555550005", "regular", "Produk SWI", "Tokopedia", "yes", "2026-05-25", "4", "3500000", "Nuscentza EDP", "Belanja di Tokopedia, repeat order", "2026-05-25T11:00:00.000Z"],
  ["CUST-PUTRI-006", "Putri Wulandari", "6281666660006", "regular", "Buku & Merchandise", "Shopee", "TBA", "2026-06-01", "2", "1800000", "TBA", "Beli buku Parfumer's Story", "2026-06-01T08:00:00.000Z"],
  ["CUST-FAJAR-007", "Fajar Nugroho", "6281777770007", "regular", "Kelas Parfumer Umum", "Instagram", "yes", "2026-06-10", "3", "2750000", "Nuscentza EDT", "Ikut kelas di Jakarta", "2026-06-10T13:00:00.000Z"],
  // 3 New customers (0-1 purchases)
  ["CUST-RINA-008", "Rina Susanti", "6281888880008", "new", "Kelas Parfumer", "WhatsApp", "TBA", "TBA", "0", "0", "TBA", "Baru tanya info kelas, belum daftar", "2026-06-22T10:00:00.000Z"],
  ["CUST-DONI-009", "Doni Saputra", "6281999990009", "new", "Produk SWI", "TikTok", "TBA", "2026-06-21", "1", "350000", "Pixel Potion Sample", "Beli sample dari TikTok Shop", "2026-06-21T15:00:00.000Z"],
  ["CUST-ANISA-010", "Anisa Rahma", "6281112223330", "new", "Fragrantions Expo", "Event", "no", "TBA", "0", "0", "TBA", "Visit booth di expo, minta kartu nama", "2026-06-19T12:00:00.000Z"],
];

const SAMPLE_INTERACTIONS = [
  // Andra (VIP)
  ["2026-01-15T10:00:00.000Z", "CI-20260115-001", "CUST-ANDRA-001", "Andra Kusuma", "purchase", "WhatsApp", "Order Fragrantia Noir 3 biji", "1050000", "TBA", "HemuHemu/OWL"],
  ["2026-03-20T14:00:00.000Z", "CI-20260320-002", "CUST-ANDRA-001", "Andra Kusuma", "purchase", "WhatsApp", "Order 2x EDP untuk corporate gift", "3000000", "TBA", "HemuHemu/OWL"],
  ["2026-06-15T10:00:00.000Z", "CI-20260615-003", "CUST-ANDRA-001", "Andra Kusuma", "follow_up", "WhatsApp", "Tanya minat ikut kelas lanjutan batch 4", "0", "2026-07-01", "HemuHemu/OWL"],
  // Diana (VIP)
  ["2026-02-10T09:00:00.000Z", "CI-20260210-001", "CUST-DIANA-002", "Diana Putri", "purchase", "Direct", "Reseller order 10x body mist", "5000000", "TBA", "HemuHemu/OWL"],
  ["2026-04-05T11:00:00.000Z", "CI-20260405-002", "CUST-DIANA-002", "Diana Putri", "purchase", "Direct", "Restock 8x body mist", "4000000", "2026-07-15", "HemuHemu/OWL"],
  ["2026-06-18T14:30:00.000Z", "CI-20260618-003", "CUST-DIANA-002", "Diana Putri", "follow_up", "WhatsApp", "Follow-up pembayaran dan jadwal kirim", "0", "2026-06-25", "HemuHemu/OWL"],
  // Bagas (VIP)
  ["2026-01-08T09:00:00.000Z", "CI-20260108-001", "CUST-BAGAS-003", "Bagas Pratama", "purchase", "Event", "Corporate gift order 20x EDP", "10000000", "TBA", "HemuHemu/OWL"],
  ["2026-06-20T09:00:00.000Z", "CI-20260620-002", "CUST-BAGAS-003", "Bagas Pratama", "inquiry", "WhatsApp", "Tanya harga workshop untuk karyawan", "0", "2026-06-28", "HemuHemu/OWL"],
  // Sinta (Regular)
  ["2026-03-15T16:00:00.000Z", "CI-20260315-001", "CUST-SINTA-004", "Sinta Maharani", "purchase", "WhatsApp", "Daftar kelas parfumer pemula", "1500000", "TBA", "HemuHemu/OWL"],
  ["2026-05-20T16:00:00.000Z", "CI-20260520-002", "CUST-SINTA-004", "Sinta Maharani", "follow_up", "WhatsApp", "Follow-up setelah kelas, tarik minat lanjutan", "0", "2026-06-30", "HemuHemu/OWL"],
  // Reza (Regular)
  ["2026-02-20T10:00:00.000Z", "CI-20260220-001", "CUST-REZA-005", "Reza Firmansyah", "purchase", "Tokopedia", "Beli Nuscentza EDP", "320000", "TBA", "HemuHemu/OWL"],
  ["2026-05-25T11:00:00.000Z", "CI-20260525-002", "CUST-REZA-005", "Reza Firmansyah", "purchase", "Tokopedia", "Repeat order 2x Nuscentza EDP", "640000", "TBA", "HemuHemu/OWL"],
  // Rina (New)
  ["2026-06-22T10:00:00.000Z", "CI-20260622-001", "CUST-RINA-008", "Rina Susanti", "inquiry", "WhatsApp", "Tanya info kelas parfumer, harga, jadwal", "0", "2026-06-29", "HemuHemu/OWL"],
  // Doni (New)
  ["2026-06-21T15:00:00.000Z", "CI-20260621-001", "CUST-DONI-009", "Doni Saputra", "purchase", "TikTok", "Beli sample pouch Pixel Potion", "350000", "TBA", "HemuHemu/OWL"],
  // Anisa (New)
  ["2026-06-19T12:00:00.000Z", "CI-20260619-001", "CUST-ANISA-010", "Anisa Rahma", "meeting", "Event", "Visit booth Fragrantions, minta info produk", "0", "2026-06-26", "HemuHemu/OWL"],
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const force = body.force === true;

    // Check existing data
    const [existingCustomers, existingInteractions] = await Promise.all([
      readRange("Customer_Master!A2:M1000"),
      readRange("Customer_Interactions!A2:J1000"),
    ]);

    const hasCustomers = existingCustomers.some((row) => row.some(Boolean));
    const hasInteractions = existingInteractions.some((row) => row.some(Boolean));

    if (!force && hasCustomers && hasInteractions) {
      return NextResponse.json({
        message: "Data sudah ada. Gunakan { force: true } untuk overwrite.",
        customers: existingCustomers.filter((r) => r.some(Boolean)).length,
        interactions: existingInteractions.filter((r) => r.some(Boolean)).length,
      });
    }

    if (force) {
      // Clear existing data rows (keep headers)
      if (hasCustomers) {
        await writeRange(
          `Customer_Master!A2:M${existingCustomers.length + 1}`,
          Array(existingCustomers.length).fill(Array(13).fill(""))
        );
      }
      if (hasInteractions) {
        await writeRange(
          `Customer_Interactions!A2:J${existingInteractions.length + 1}`,
          Array(existingInteractions.length).fill(Array(10).fill(""))
        );
      }
    }

    // Write sample data
    await Promise.all([
      appendRows("CustomerMaster", SAMPLE_CUSTOMERS),
      appendRows("CustomerInteractions", SAMPLE_INTERACTIONS),
    ]);

    return NextResponse.json({
      message: `Seed selesai: ${SAMPLE_CUSTOMERS.length} customers, ${SAMPLE_INTERACTIONS.length} interactions.`,
      customersSeeded: SAMPLE_CUSTOMERS.length,
      interactionsSeeded: SAMPLE_INTERACTIONS.length,
      force,
      breakdown: {
        vip: SAMPLE_CUSTOMERS.filter((c) => c[3] === "vip").length,
        regular: SAMPLE_CUSTOMERS.filter((c) => c[3] === "regular").length,
        new: SAMPLE_CUSTOMERS.filter((c) => c[3] === "new").length,
      },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource("Google Sheets: Customer_Master + Customer_Interactions", error),
        error: "Google OAuth perlu re-auth",
      }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Gagal seed data", details: String(error) },
      { status: 500 }
    );
  }
}
