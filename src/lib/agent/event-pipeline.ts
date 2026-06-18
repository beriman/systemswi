// Event Pipeline Update — reads CRM data (Customer_Master + Customer_Interactions)
// and Event_Tenants/Event_Sponsors, detects new pipeline opportunities,
// suggests updates, and sends Telegram summary.
//
// Compliance: Agent only drafts suggestions — human must approve any sheet writes.
// This module is READ-ANALYZE-SUGGEST (no direct sheet writes for tenants/sponsors).

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
  lastContact: string;
  notes: string;
  pipelineStage: "inquiry" | "quoted" | "confirmed" | "paid" | "completed" | "cancelled";
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
  lastContact: string;
  notes: string;
  pipelineStage: "prospect" | "pitched" | "negotiating" | "confirmed" | "paid" | "completed";
  daysSinceContact: number;
  needsFollowUp: boolean;
}

export interface CustomerInteraction {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  type: string;
  channel: string;
  summary: string;
  followUpDate: string;
  status: string;
}

export interface EventPipelineReport {
  timestamp: string;
  tenants: {
    total: number;
    byStage: Record<string, number>;
    byPaymentStatus: Record<string, number>;
    needsFollowUp: EventTenant[];
    overduePayment: EventTenant[];
    recentInquiries: EventTenant[];
  };
  sponsors: {
    total: number;
    byStage: Record<string, number>;
    byPaymentStatus: Record<string, number>;
    needsFollowUp: EventSponsor[];
    overduePayment: EventSponsor[];
    recentProspects: EventSponsor[];
  };
  interactions: {
    total: number;
    recent: CustomerInteraction[];
    eventRelated: CustomerInteraction[];
    needsFollowUp: CustomerInteraction[];
  };
  suggestions: string[];
}

// ── Helpers ────────────────────────────────────────────────────────

const text = (v: unknown) => String(v ?? "").trim();
const num = (v: unknown) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v !== "string") return 0;
  const p = Number(v.replace(/[^\d.-]/g, ""));
  return Number.isFinite(p) ? p : 0;
};
const today = () => new Date().toISOString().slice(0, 10);

function daysSince(dateStr: string): number {
  if (!dateStr) return 999;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function isFollowUpOverdue(followUpDate: string, todayStr: string): boolean {
  if (!followUpDate) return false;
  return followUpDate < todayStr;
}

function isFollowUpDueToday(followUpDate: string, todayStr: string): boolean {
  if (!followUpDate) return false;
  return followUpDate === todayStr;
}

function isFollowUpUpcoming(followUpDate: string, todayStr: string): boolean {
  if (!followUpDate) return false;
  const d = new Date(followUpDate);
  const t = new Date(todayStr);
  const diff = (d.getTime() - t.getTime()) / (1000 * 60 * 60 * 24);
  return diff > 0 && diff <= 7;
}

// ── Sheet Parsers ──────────────────────────────────────────────────

function parseEventTenants(rows: string[][]): EventTenant[] {
  // Expected columns (based on CRM route usage):
  // A: ID, B: Event_ID, C: Company_Name, D: Contact_Name, E: Email,
  // F: WhatsApp, G: Booth_Number, H: Booth_Fee, I: Amount,
  // J: Payment_Status, K: ?, L: Last_Contact, M: Notes
  return rows
    .filter((r) => r.some((c) => c && c.trim()))
    .map((r) => {
      const lastContact = text(r[12]) || text(r[11]) || "";
      const paymentRaw = text(r[10]).toLowerCase();
      let paymentStatus: EventTenant["paymentStatus"] = "pending";
      if (["paid", "lunas", "completed"].includes(paymentRaw)) paymentStatus = "paid";
      else if (["partial", "sebagian", "dp"].includes(paymentRaw)) paymentStatus = "partial";
      else if (["invoice-sent", "invoice", "tagihan"].includes(paymentRaw)) paymentStatus = "invoice-sent";
      else if (["cancelled", "batal"].includes(paymentRaw)) paymentStatus = "cancelled";

      // Determine pipeline stage from payment status + notes
      let pipelineStage: EventTenant["pipelineStage"] = "inquiry";
      if (paymentStatus === "paid") pipelineStage = "confirmed";
      else if (paymentStatus === "cancelled") pipelineStage = "cancelled";
      else if (paymentStatus === "invoice-sent") pipelineStage = "quoted";
      else if (paymentStatus === "partial") pipelineStage = "confirmed";

      const days = daysSince(lastContact);
      const followUpDate = text(r[13]) || text(r[14]) || "";
      const needsFollowUp = days > 7 || isFollowUpOverdue(followUpDate, today()) || followUpDate === "";

      return {
        id: text(r[0]) || "",
        eventId: text(r[1]) || "",
        eventName: text(r[1]) || "",
        companyName: text(r[2]) || "",
        contactName: text(r[3]) || "",
        whatsapp: text(r[5]) || text(r[4]) || "",
        email: text(r[4]) || "",
        boothNumber: text(r[6]) || "",
        boothFee: num(r[7]) || num(r[8]) || 0,
        paymentStatus,
        lastContact,
        notes: text(r[13]) || text(r[14]) || "",
        pipelineStage,
        daysSinceContact: days,
        needsFollowUp,
      };
    })
    .filter((t) => t.id);
}

function parseEventSponsors(rows: string[][]): EventSponsor[] {
  // Expected columns (based on CRM route usage):
  // A: ID, B: Event_ID, C: Company_Name, D: Contact_Name, E: Email,
  // F: WhatsApp, G: Tier, H: Sponsorship_Value, I: Amount_Received,
  // J: ?, K: Payment_Status, L: Last_Contact, M: Notes
  return rows
    .filter((r) => r.some((c) => c && c.trim()))
    .map((r) => {
      const lastContact = text(r[12]) || text(r[11]) || "";
      const paymentRaw = text(r[11]).toLowerCase();
      let paymentStatus: EventSponsor["paymentStatus"] = "pending";
      if (["paid", "lunas", "completed"].includes(paymentRaw)) paymentStatus = "paid";
      else if (["partial", "sebagian", "dp"].includes(paymentRaw)) paymentStatus = "partial";
      else if (["invoice-sent", "invoice", "tagihan"].includes(paymentRaw)) paymentStatus = "invoice-sent";
      else if (["cancelled", "batal"].includes(paymentRaw)) paymentStatus = "cancelled";

      let pipelineStage: EventSponsor["pipelineStage"] = "prospect";
      if (paymentStatus === "paid") pipelineStage = "confirmed";
      else if (paymentStatus === "cancelled") pipelineStage = "completed";
      else if (paymentStatus === "invoice-sent") pipelineStage = "negotiating";
      else if (paymentStatus === "partial") pipelineStage = "confirmed";

      const days = daysSince(lastContact);
      const followUpDate = text(r[13]) || text(r[14]) || "";
      const needsFollowUp = days > 14 || isFollowUpOverdue(followUpDate, today()) || followUpDate === "";

      return {
        id: text(r[0]) || "",
        eventId: text(r[1]) || "",
        eventName: text(r[1]) || "",
        companyName: text(r[2]) || "",
        contactName: text(r[3]) || "",
        whatsapp: text(r[5]) || text(r[4]) || "",
        email: text(r[4]) || "",
        tier: text(r[6]) || "",
        sponsorshipValue: num(r[7]) || num(r[10]) || 0,
        paymentStatus,
        lastContact,
        notes: text(r[14]) || text(r[13]) || "",
        pipelineStage,
        daysSinceContact: days,
        needsFollowUp,
      };
    })
    .filter((s) => s.id);
}

function parseCustomerInteractions(rows: string[][]): CustomerInteraction[] {
  // Expected columns (based on CRM route usage):
  // A: ID, B: Date, C: Customer_ID, D: Customer_Name, E: Type,
  // F: Channel, G: Summary, H: Follow-up_Date, I: Status
  return rows
    .filter((r) => r.some((c) => c && c.trim()))
    .map((r) => ({
      id: text(r[0]) || "",
      date: text(r[1]) || "",
      customerId: text(r[2]) || "",
      customerName: text(r[3]) || "",
      type: text(r[4]) || "",
      channel: text(r[5]) || "",
      summary: text(r[6]) || "",
      followUpDate: text(r[7]) || "",
      status: text(r[8]) || "",
    }))
    .filter((i) => i.id);
}

// ── Event-related keywords for interaction classification ──────────

const EVENT_KEYWORDS = [
  "event", "pameran", "bazaar", "expo", "booth", "tenant",
  "sponsor", "sponsorship", "pameran", "acara", "gathering",
  "launching", "grand opening", "festival", "fair", "exhibition",
];

function isEventRelatedInteraction(summary: string): boolean {
  const lower = summary.toLowerCase();
  return EVENT_KEYWORDS.some((kw) => lower.includes(kw));
}

// ── Main: Run Event Pipeline Analysis ──────────────────────────────

export async function runEventPipelineAnalysis(): Promise<EventPipelineReport> {
  const timestamp = new Date().toISOString();
  const todayStr = today();

  // Read all relevant sheets
  const [tenantRows, sponsorRows, interactionRows, customerRows] = await Promise.all([
    readRange("Event_Tenants!A2:Z500").catch(() => [] as string[][]),
    readRange("Event_Sponsors!A2:Z500").catch(() => [] as string[][]),
    readRange("Customer_Interactions!A2:Z500").catch(() => [] as string[][]),
    readRange("Customer_Master!A2:M500").catch(() => [] as string[][]),
  ]);

  const tenants = parseEventTenants(tenantRows);
  const sponsors = parseEventSponsors(sponsorRows);
  const interactions = parseCustomerInteractions(interactionRows);

  // Classify interactions
  const eventRelatedInteractions = interactions.filter((i) =>
    isEventRelatedInteraction(i.summary)
  );

  const needsFollowUpInteractions = interactions.filter(
    (i) =>
      isFollowUpOverdue(i.followUpDate, todayStr) ||
      isFollowUpDueToday(i.followUpDate, todayStr) ||
      isFollowUpUpcoming(i.followUpDate, todayStr)
  );

  // Recent interactions (last 7 days)
  const recentInteractions = interactions.filter((i) => {
    const d = new Date(i.date);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  // Tenant analysis
  const tenantByStage: Record<string, number> = {};
  const tenantByPayment: Record<string, number> = {};
  for (const t of tenants) {
    tenantByStage[t.pipelineStage] = (tenantByStage[t.pipelineStage] || 0) + 1;
    tenantByPayment[t.paymentStatus] = (tenantByPayment[t.paymentStatus] || 0) + 1;
  }

  const tenantsNeedingFollowUp = tenants.filter((t) => t.needsFollowUp);
  const overduePaymentTenants = tenants.filter(
    (t) => t.paymentStatus === "pending" || t.paymentStatus === "partial"
  );
  const recentInquiries = tenants.filter(
    (t) => t.pipelineStage === "inquiry" && t.daysSinceContact <= 14
  );

  // Sponsor analysis
  const sponsorByStage: Record<string, number> = {};
  const sponsorByPayment: Record<string, number> = {};
  for (const s of sponsors) {
    sponsorByStage[s.pipelineStage] = (sponsorByStage[s.pipelineStage] || 0) + 1;
    sponsorByPayment[s.paymentStatus] = (sponsorByPayment[s.paymentStatus] || 0) + 1;
  }

  const sponsorsNeedingFollowUp = sponsors.filter((s) => s.needsFollowUp);
  const overduePaymentSponsors = sponsors.filter(
    (s) => s.paymentStatus === "pending" || s.paymentStatus === "partial"
  );
  const recentProspects = sponsors.filter(
    (s) => s.pipelineStage === "prospect" && s.daysSinceContact <= 14
  );

  // Generate suggestions
  const suggestions: string[] = [];

  if (recentInquiries.length > 0) {
    suggestions.push(
      `${recentInquiries.length} tenant inquiry baru perlu follow-up dalam 24-48 jam`
    );
  }
  if (recentProspects.length > 0) {
    suggestions.push(
      `${recentProspects.length} sponsor prospect baru perlu pitch follow-up`
    );
  }
  if (overduePaymentTenants.length > 0) {
    const totalOutstanding = overduePaymentTenants.reduce((s, t) => s + t.boothFee, 0);
    suggestions.push(
      `${overduePaymentTenants.length} tenant belum lunas (total Rp ${totalOutstanding.toLocaleString("id-ID")})`
    );
  }
  if (overduePaymentSponsors.length > 0) {
    const totalOutstanding = overduePaymentSponsors.reduce((s, sp) => s + sp.sponsorshipValue, 0);
    suggestions.push(
      `${overduePaymentSponsors.length} sponsor belum lunas (total Rp ${totalOutstanding.toLocaleString("id-ID")})`
    );
  }
  if (eventRelatedInteractions.length > 0) {
    suggestions.push(
      `${eventRelatedInteractions.length} customer interaction terkait event — bisa di-convert ke tenant/sponsor`
    );
  }
  if (needsFollowUpInteractions.length > 0) {
    suggestions.push(
      `${needsFollowUpInteractions.length} customer interaction perlu follow-up (overdue/due today/upcoming 7 hari)`
    );
  }

  return {
    timestamp,
    tenants: {
      total: tenants.length,
      byStage: tenantByStage,
      byPaymentStatus: tenantByPayment,
      needsFollowUp: tenantsNeedingFollowUp,
      overduePayment: overduePaymentTenants,
      recentInquiries,
    },
    sponsors: {
      total: sponsors.length,
      byStage: sponsorByStage,
      byPaymentStatus: sponsorByPayment,
      needsFollowUp: sponsorsNeedingFollowUp,
      overduePayment: overduePaymentSponsors,
      recentProspects,
    },
    interactions: {
      total: interactions.length,
      recent: recentInteractions,
      eventRelated: eventRelatedInteractions,
      needsFollowUp: needsFollowUpInteractions,
    },
    suggestions,
  };
}

// ── Format for Telegram ────────────────────────────────────────────

export function formatEventPipelineForTelegram(report: EventPipelineReport): string {
  const lines: string[] = [];

  lines.push(`🎪 <b>Event Pipeline Report</b>`);
  lines.push(`📅 ${new Date(report.timestamp).toLocaleString("id-ID")}`);
  lines.push(``);

  // ── Tenants ──
  lines.push(`🏷️ <b>Tenants (${report.tenants.total})</b>`);
  if (report.tenants.byStage) {
    const stageText = Object.entries(report.tenants.byStage)
      .map(([stage, count]) => `  ${stage}: ${count}`)
      .join("\n");
    lines.push(stageText);
  }
  if (report.tenants.byPaymentStatus) {
    const payText = Object.entries(report.tenants.byPaymentStatus)
      .map(([status, count]) => `  ${status}: ${count}`)
      .join("\n");
    lines.push(`<i>Payment:</i>\n${payText}`);
  }
  lines.push(``);

  // ── Sponsors ──
  lines.push(`🤝 <b>Sponsors (${report.sponsors.total})</b>`);
  if (report.sponsors.byStage) {
    const stageText = Object.entries(report.sponsors.byStage)
      .map(([stage, count]) => `  ${stage}: ${count}`)
      .join("\n");
    lines.push(stageText);
  }
  if (report.sponsors.byPaymentStatus) {
    const payText = Object.entries(report.sponsors.byPaymentStatus)
      .map(([status, count]) => `  ${status}: ${count}`)
      .join("\n");
    lines.push(`<i>Payment:</i>\n${payText}`);
  }
  lines.push(``);

  // ── Interactions ──
  lines.push(`💬 <b>Interactions (${report.interactions.total})</b>`);
  lines.push(`  Recent (7d): ${report.interactions.recent.length}`);
  lines.push(`  Event-related: ${report.interactions.eventRelated.length}`);
  lines.push(`  Needs follow-up: ${report.interactions.needsFollowUp.length}`);
  lines.push(``);

  // ── Alerts ──
  if (report.tenants.needsFollowUp.length > 0) {
    lines.push(`⚠️ <b>Tenants Perlu Follow-Up (${report.tenants.needsFollowUp.length})</b>`);
    for (const t of report.tenants.needsFollowUp.slice(0, 5)) {
      lines.push(
        `  • ${t.companyName} (${t.boothNumber || "no booth"}) — ${t.daysSinceContact} hari tidak kontak`
      );
    }
    if (report.tenants.needsFollowUp.length > 5) {
      lines.push(`  ...dan ${report.tenants.needsFollowUp.length - 5} lainnya`);
    }
    lines.push(``);
  }

  if (report.sponsors.needsFollowUp.length > 0) {
    lines.push(`⚠️ <b>Sponsors Perlu Follow-Up (${report.sponsors.needsFollowUp.length})</b>`);
    for (const s of report.sponsors.needsFollowUp.slice(0, 5)) {
      lines.push(
        `  • ${s.companyName} (${s.tier || "no tier"}) — ${s.daysSinceContact} hari tidak kontak`
      );
    }
    if (report.sponsors.needsFollowUp.length > 5) {
      lines.push(`  ...dan ${report.sponsors.needsFollowUp.length - 5} lainnya`);
    }
    lines.push(``);
  }

  // ── Overdue Payments ──
  if (report.tenants.overduePayment.length > 0 || report.sponsors.overduePayment.length > 0) {
    lines.push(`💰 <b>Outstanding Payments</b>`);
    for (const t of report.tenants.overduePayment.slice(0, 3)) {
      lines.push(`  🏷️ ${t.companyName}: Rp ${t.boothFee.toLocaleString("id-ID")} (${t.paymentStatus})`);
    }
    for (const s of report.sponsors.overduePayment.slice(0, 3)) {
      lines.push(`  🤝 ${s.companyName}: Rp ${s.sponsorshipValue.toLocaleString("id-ID")} (${s.paymentStatus})`);
    }
    lines.push(``);
  }

  // ── Suggestions ──
  if (report.suggestions.length > 0) {
    lines.push(`💡 <b>Suggestions:</b>`);
    for (const s of report.suggestions.slice(0, 5)) {
      lines.push(`  • ${s}`);
    }
    lines.push(``);
  }

  lines.push(`📊 <i>Agent: HemuHemu/OWL | Phase 1.6 Event Pipeline</i>`);

  return lines.join("\n");
}
