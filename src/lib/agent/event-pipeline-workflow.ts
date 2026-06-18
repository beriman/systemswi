// Event Pipeline Workflow — Phase 2.2
// New tenant inquiry → Draft agreement → Send → Track payment → Update Event_Tenants
//
// Compliance: Agent drafts agreement only — human must sign.
// This module extends the Phase 1 event-pipeline with workflow tracking.

import { readRange } from "@/lib/sheets/sheets-real";

// ── Types ──────────────────────────────────────────────────────────

export interface EventTenant {
  id: string;
  eventId: string;
  eventName: string;
  companyName: string;
  contactName: string;
  whatsapp: string;
  email: string;
  boothNumber: string;
  boothFee: number;
  paymentStatus: "pending" | "partial" | "paid" | "cancelled" | "invoice-sent";
  pipelineStage: "inquiry" | "quoted" | "confirmed" | "paid" | "completed" | "cancelled";
  lastContact: string;
  daysSinceContact: number;
  needsFollowUp: boolean;
}

export interface EventSponsor {
  id: string;
  eventId: string;
  eventName: string;
  companyName: string;
  contactName: string;
  whatsapp: string;
  email: string;
  tier: string;
  sponsorshipValue: number;
  paymentStatus: "pending" | "partial" | "paid" | "cancelled" | "invoice-sent";
}

export interface AgreementDraft {
  tenant: EventTenant;
  eventType: string;
  boothFee: number;
  terms: string[];
  validUntil: string;
  status: "draft" | "pending_approval" | "sent" | "signed" | "rejected";
}

export interface EventPipelineReport {
  timestamp: string;
  tenants: EventTenant[];
  sponsors: EventSponsor[];
  agreementDrafts: AgreementDraft[];
  overduePayments: EventTenant[];
  followUpNeeded: EventTenant[];
  totalTenants: number;
  totalSponsors: number;
  totalAgreementDrafts: number;
  totalOverdue: number;
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
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function daysSince(dateStr: string): number {
  const d = parseDate(dateStr);
  if (!d) return 0;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

// ── Read Event Tenants ─────────────────────────────────────────────

async function readEventTenants(): Promise<EventTenant[]> {
  const rows = await readRange("Event_Tenants!A1:Z500");
  const tenants: EventTenant[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row.some((c) => c && c.trim())) continue;

    const id = text(row[0]);
    const eventId = text(row[1]);
    const eventName = text(row[2]);
    const companyName = text(row[3]);
    if (!id || !companyName) continue;

    const lastContact = text(row[10]) || text(row[9]);
    const dsc = daysSince(lastContact);

    tenants.push({
      id,
      eventId,
      eventName,
      companyName,
      contactName: text(row[4]),
      whatsapp: text(row[5]),
      email: text(row[6]),
      boothNumber: text(row[7]),
      boothFee: num(row[8]),
      paymentStatus: (text(row[11]) || "pending") as EventTenant["paymentStatus"],
      pipelineStage: (text(row[12]) || "inquiry") as EventTenant["pipelineStage"],
      lastContact,
      daysSinceContact: dsc,
      needsFollowUp: dsc > 7 && text(row[11]) !== "paid",
    });
  }

  return tenants;
}

// ── Read Event Sponsors ────────────────────────────────────────────

async function readEventSponsors(): Promise<EventSponsor[]> {
  const rows = await readRange("Event_Sponsors!A1:Z500");
  const sponsors: EventSponsor[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row.some((c) => c && c.trim())) continue;

    const id = text(row[0]);
    const eventId = text(row[1]);
    const companyName = text(row[3]);
    if (!id || !companyName) continue;

    sponsors.push({
      id,
      eventId,
      eventName: text(row[2]),
      companyName,
      contactName: text(row[4]),
      whatsapp: text(row[5]),
      email: text(row[6]),
      tier: text(row[7]) || "standard",
      sponsorshipValue: num(row[8]),
      paymentStatus: (text(row[9]) || "pending") as EventSponsor["paymentStatus"],
    });
  }

  return sponsors;
}

// ── Draft Agreement ────────────────────────────────────────────────

function draftAgreement(tenant: EventTenant): AgreementDraft {
  const validUntil = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

  return {
    tenant,
    eventType: tenant.eventName,
    boothFee: tenant.boothFee,
    terms: [
      `Booth number: ${tenant.boothNumber}`,
      `Biaya booth: Rp ${tenant.boothFee.toLocaleString("id-ID")}`,
      `Pembayaran: 50% DP, 50% H-7 event`,
      `Cancellation: H-3 refund 50%`,
      `Liability: SWI tidak bertanggung jawab atas kehilangan barang tenant`,
    ],
    validUntil,
    status: "draft",
  };
}

// ── Run Event Pipeline ─────────────────────────────────────────────

export async function runEventPipelineWorkflow(): Promise<EventPipelineReport> {
  const [tenants, sponsors] = await Promise.all([readEventTenants(), readEventSponsors()]);

  const timestamp = new Date().toISOString();

  // Find tenants that need follow-up
  const followUpNeeded = tenants.filter((t) => t.needsFollowUp);

  // Find overdue payments (confirmed but not paid, last contact > 14 days)
  const overduePayments = tenants.filter(
    (t) => t.pipelineStage === "confirmed" && t.paymentStatus === "pending" && t.daysSinceContact > 14
  );

  // Draft agreements for new inquiries
  const newInquiries = tenants.filter((t) => t.pipelineStage === "inquiry");
  const agreementDrafts = newInquiries.map(draftAgreement);

  return {
    timestamp,
    tenants,
    sponsors,
    agreementDrafts,
    overduePayments,
    followUpNeeded,
    totalTenants: tenants.length,
    totalSponsors: sponsors.length,
    totalAgreementDrafts: agreementDrafts.length,
    totalOverdue: overduePayments.length,
  };
}

// ── Format for Telegram ────────────────────────────────────────────

export function formatEventPipelineForTelegram(report: EventPipelineReport): string {
  let text = `🎪 <b>EVENT PIPELINE WORKFLOW</b>\n📅 ${new Date(report.timestamp).toLocaleString("id-ID")}\n\n`;

  text += `📊 <b>Overview:</b>\n`;
  text += `   Tenants: ${report.totalTenants} | Sponsors: ${report.totalSponsors}\n`;
  text += `   New Inquiries: ${report.totalAgreementDrafts}\n`;
  text += `   Overdue Payments: ${report.totalOverdue}\n`;
  text += `   Follow-up Needed: ${report.followUpNeeded.length}\n\n`;

  if (report.agreementDrafts.length > 0) {
    text += `📄 <b>Draft Agreements (${report.agreementDrafts.length}):</b>\n`;
    for (const draft of report.agreementDrafts.slice(0, 3)) {
      text += `   📝 ${draft.tenant.companyName} — ${draft.tenant.eventName}\n`;
      text += `      Booth: ${draft.tenant.boothNumber} | Rp ${draft.boothFee.toLocaleString("id-ID")}\n`;
      text += `      Valid until: ${draft.validUntil}\n`;
    }
    text += `\n`;
  }

  if (report.overduePayments.length > 0) {
    text += `🔴 <b>Overdue Payments (${report.overduePayments.length}):</b>\n`;
    for (const tenant of report.overduePayments.slice(0, 3)) {
      text += `   ⚠️ ${tenant.companyName} — Rp ${tenant.boothFee.toLocaleString("id-ID")}\n`;
      text += `      Last contact: ${tenant.daysSinceContact} hari lalu\n`;
    }
    text += `\n`;
  }

  if (report.followUpNeeded.length > 0) {
    text += `📬 <b>Follow-up Needed (${report.followUpNeeded.length}):</b>\n`;
    for (const tenant of report.followUpNeeded.slice(0, 3)) {
      text += `   📱 ${tenant.contactName} (${tenant.companyName}) — ${tenant.daysSinceContact} hari\n`;
    }
    text += `\n`;
  }

  text += `⚠️ <i>Agent hanya draft — manusia harus approve & tandatangani</i>`;
  return text;
}
