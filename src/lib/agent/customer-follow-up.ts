// Customer Follow-up — Phase 2.5
// Agent detects inactive customers → Draft WhatsApp message → Schedule send
//
// Compliance: Agent drafts message only — human must review before sending.
// This module is READ-ANALYZE-DRAFT (no direct WhatsApp sends).

import { readRange } from "@/lib/sheets/sheets-real";

// ── Types ──────────────────────────────────────────────────────────

export interface CustomerInfo {
  id: string;
  name: string;
  company: string;
  whatsapp: string;
  email: string;
  segment: string;
  lastPurchaseDate: string;
  totalPurchases: number;
  clv: number;
  daysSinceLastPurchase: number;
  status: "active" | "inactive" | "dormant" | "churned";
}

export interface CustomerInteraction {
  date: string;
  customerId: string;
  type: string;
  notes: string;
  outcome: string;
}

export interface FollowUpDraft {
  customer: CustomerInfo;
  messageType: "reactivation" | "check_in" | "promo" | "thank_you";
  message: string;
  suggestedDate: string;
  priority: "high" | "medium" | "low";
}

export interface FollowUpReport {
  timestamp: string;
  customers: CustomerInfo[];
  drafts: FollowUpDraft[];
  inactiveCount: number;
  dormantCount: number;
  churnedCount: number;
  totalDrafts: number;
}

// ── Helpers ────────────────────────────────────────────────────────

const text = (v: unknown) => String(v ?? "").trim();
const num = (v: unknown) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v !== "string") return 0;
  const p = Number(v.replace(/[^\d.-]/g, ""));
  return Number.isFinite(p) ? p : 0;
};

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const ddmmyyyy = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    return new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
  }
  const yyyymmdd = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (yyyymmdd) {
    const [, yyyy, mm, dd] = yyyymmdd;
    return new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function daysSince(dateStr: string): number {
  const d = parseDate(dateStr);
  if (!d) return 9999;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function customerStatus(daysSinceLast: number): "active" | "inactive" | "dormant" | "churned" {
  if (daysSinceLast <= 30) return "active";
  if (daysSinceLast <= 90) return "inactive";
  if (daysSinceLast <= 180) return "dormant";
  return "churned";
}

// ── Read Customers ─────────────────────────────────────────────────

async function readCustomers(): Promise<CustomerInfo[]> {
  const rows = await readRange("Customer_Master!A1:M1000");
  const customers: CustomerInfo[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row.some((c) => c && c.trim())) continue;

    const id = text(row[0]);
    const name = text(row[1]);
    const company = text(row[2]);
    if (!id || !name) continue;

    const whatsapp = text(row[3]);
    const email = text(row[4]);
    const segment = text(row[5]) || "regular";
    const lastPurchase = text(row[6]);
    const totalPurchases = num(row[7]);
    const clv = num(row[8]);
    const dsl = daysSince(lastPurchase);

    customers.push({
      id,
      name,
      company,
      whatsapp,
      email,
      segment,
      lastPurchaseDate: lastPurchase,
      totalPurchases,
      clv,
      daysSinceLastPurchase: dsl,
      status: customerStatus(dsl),
    });
  }

  return customers;
}

// ── Read Interactions ──────────────────────────────────────────────

async function readInteractions(): Promise<CustomerInteraction[]> {
  const rows = await readRange("Customer_Interactions!A1:J1000");
  const interactions: CustomerInteraction[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row.some((c) => c && c.trim())) continue;

    interactions.push({
      date: text(row[0]),
      customerId: text(row[1]),
      type: text(row[2]),
      notes: text(row[3]),
      outcome: text(row[4]),
    });
  }

  return interactions;
}

// ── Generate Follow-up Messages ────────────────────────────────────

function generateMessage(customer: CustomerInfo): { type: FollowUpDraft["messageType"]; message: string } {
  switch (customer.status) {
    case "churned":
      return {
        type: "reactivation",
        message: `Halo ${customer.name}, kami merindukan Anda! 😊 Sebagai pelanggan setia, kami punya penawaran spesial untuk Anda. Mau tahu info terbaru dari SWI?`,
      };
    case "dormant":
      return {
        type: "check_in",
        message: `Halo ${customer.name}, lama tidak berhubungan! 👋 Kami ingin tahu kabarnya. Ada yang bisa kami bantu terkait kebutuhan parfum/brand Anda?`,
      };
    case "inactive":
      return {
        type: "promo",
        message: `Hai ${customer.name}! 🎉 Kami punya koleksi baru yang mungkin Anda suka. Cek katalog terbaru kami ya!`,
      };
    default:
      return {
        type: "thank_you",
        message: `Terima kasih ${customer.name} sudah menjadi bagian dari keluarga SWI! 🙏`,
      };
  }
}

// ── Run Follow-up Analysis ─────────────────────────────────────────

export async function runCustomerFollowUp(): Promise<FollowUpReport> {
  const customers = await readCustomers();
  const timestamp = new Date().toISOString();

  const inactiveCustomers = customers.filter((c) => c.status !== "active");
  const drafts: FollowUpDraft[] = [];

  for (const customer of inactiveCustomers) {
    // Skip if no whatsapp or email
    if (!customer.whatsapp && !customer.email) continue;

    const { type, message } = generateMessage(customer);
    const priority =
      customer.status === "churned" && customer.clv > 50_000_000
        ? "high"
        : customer.status === "dormant"
          ? "medium"
          : "low";

    const suggestedDate = new Date(Date.now() + 86400000).toISOString().split("T")[0]; // Tomorrow

    drafts.push({
      customer,
      messageType: type,
      message,
      suggestedDate,
      priority,
    });
  }

  // Sort by priority (high first) then by CLV descending
  drafts.sort((a, b) => {
    const prio = { high: 0, medium: 1, low: 2 };
    if (prio[a.priority] !== prio[b.priority]) return prio[a.priority] - prio[b.priority];
    return b.customer.clv - a.customer.clv;
  });

  return {
    timestamp,
    customers,
    drafts,
    inactiveCount: customers.filter((c) => c.status === "inactive").length,
    dormantCount: customers.filter((c) => c.status === "dormant").length,
    churnedCount: customers.filter((c) => c.status === "churned").length,
    totalDrafts: drafts.length,
  };
}

// ── Format for Telegram ────────────────────────────────────────────

export function formatFollowUpForTelegram(report: FollowUpReport): string {
  if (report.totalDrafts === 0) {
    return `✅ <b>Customer Follow-up</b>\n📅 ${new Date(report.timestamp).toLocaleString("id-ID")}\n\nSemua customer aktif. Tidak ada follow-up needed.`;
  }

  let text = `📬 <b>CUSTOMER FOLLOW-UP</b>\n📅 ${new Date(report.timestamp).toLocaleString("id-ID")}\n\n`;
  text += `📊 Status: ${report.inactiveCount} inactive | ${report.dormantCount} dormant | ${report.churnedCount} churned\n`;
  text += `📝 <b>${report.totalDrafts} draft pesan</b> siap review\n\n`;

  for (const draft of report.drafts.slice(0, 5)) {
    const emoji = draft.priority === "high" ? "🔴" : draft.priority === "medium" ? "🟠" : "🟡";
    text += `${emoji} <b>${draft.customer.name}</b> (${draft.customer.company})\n`;
    text += `   Status: ${draft.customer.status} | CLV: Rp ${draft.customer.clv.toLocaleString("id-ID")}\n`;
    text += `   📱 ${draft.customer.whatsapp}\n`;
    text += `   💬 "${draft.message.slice(0, 80)}..."\n\n`;
  }

  if (report.drafts.length > 5) {
    text += `...dan ${report.drafts.length - 5} draft lainnya\n`;
  }

  text += `\n⚠️ <i>Agent hanya draft — manusia harus review sebelum kirim via WhatsApp</i>`;
  return text;
}
