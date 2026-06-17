// GET/POST /api/crm — Unified CRM: customers + tenants + sponsors + WhatsApp preview
import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { appendRows, readRange } from "@/lib/sheets/sheets-real";
import { appendSwiMemoryLog } from "@/lib/google/audit-log";

export const runtime = "nodejs";

const SOURCE = "Google Sheets: Customer_Master + Customer_Interactions + Event_Tenants + Event_Sponsors";

// ── Helpers ──
const text = (v: unknown) => String(v ?? "").trim();
const num = (v: unknown) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") return Number(v.replace(/[^\d.-]/g, "")) || 0;
  return 0;
};
const today = () => new Date().toISOString().slice(0, 10);

// ── Types ──
type CrmContact = {
  id: string;
  type: "customer" | "tenant" | "sponsor";
  name: string;
  whatsapp: string;
  email: string;
  segment: string;
  status: string;
  source: string;
  totalValue: number;
  lastContact: string;
  followUpDate: string;
  notes: string;
  eventId?: string;
  boothNumber?: string;
  tier?: string;
  paymentStatus?: string;
};

type CrmSummary = {
  totalContacts: number;
  customers: number;
  tenants: number;
  sponsors: number;
  overdueFollowUps: number;
  dueTodayFollowUps: number;
  upcomingFollowUps: number;
  totalValue: number;
  byType: Record<string, number>;
  bySegment: Record<string, number>;
  byStatus: Record<string, number>;
};

// ── Read customers from Google Sheets ──
async function readCustomersFromSheets(): Promise<CrmContact[]> {
  try {
    const rows = await readRange("Customer_Master!A2:Z500").catch(() => [] as string[][]);
    if (!rows || rows.length === 0) return [];
    return rows.filter(r => r[0] && r[1]).map((r, i) => ({
      id: text(r[0]) || `cust-${i}`,
      type: "customer" as const,
      name: text(r[1]),
      whatsapp: text(r[2]),
      email: text(r[3]),
      segment: text(r[4]) || "new",
      status: text(r[5]) || "active",
      source: text(r[6]) || "manual",
      totalValue: num(r[7]),
      lastContact: text(r[8]),
      followUpDate: text(r[9]),
      notes: text(r[10]),
    }));
  } catch { return []; }
}

// ── Read interactions for follow-up data ──
async function readInteractions(): Promise<Record<string, string>> {
  try {
    const rows = await readRange("Customer_Interactions!A2:Z500").catch(() => [] as string[][]);
    const map: Record<string, string> = {};
    for (const r of rows) {
      const cid = text(r[2]);
      const followUp = text(r[8]);
      if (cid && followUp) map[cid] = followUp;
    }
    return map;
  } catch { return {}; }
}

// ── Read tenants from Google Sheets ──
async function readTenantsFromSheets(): Promise<CrmContact[]> {
  try {
    const rows = await readRange("Event_Tenants!A2:Z500").catch(() => [] as string[][]);
    if (!rows || rows.length === 0) return [];
    return rows.filter(r => r[0] && r[2]).map((r, i) => ({
      id: text(r[0]) || `tenant-${i}`,
      type: "tenant" as const,
      name: text(r[2]),
      whatsapp: text(r[5]) || text(r[4]),
      email: text(r[4]),
      segment: "tenant",
      status: normalizePaymentStatus(text(r[10])),
      source: "event",
      totalValue: num(r[9]),
      lastContact: text(r[12]),
      followUpDate: "",
      notes: text(r[13]),
      eventId: text(r[1]),
      boothNumber: text(r[6]),
      paymentStatus: text(r[10]),
    }));
  } catch { return []; }
}

// ── Read sponsors from Google Sheets ──
async function readSponsorsFromSheets(): Promise<CrmContact[]> {
  try {
    const rows = await readRange("Event_Sponsors!A2:Z500").catch(() => [] as string[][]);
    if (!rows || rows.length === 0) return [];
    return rows.filter(r => r[0] && r[2]).map((r, i) => ({
      id: text(r[0]) || `sponsor-${i}`,
      type: "sponsor" as const,
      name: text(r[2]),
      whatsapp: text(r[5]) || text(r[4]),
      email: text(r[4]),
      segment: "sponsor",
      status: normalizePaymentStatus(text(r[11])),
      source: "event",
      totalValue: num(r[7]) + num(r[10]),
      lastContact: text(r[12]),
      followUpDate: "",
      notes: text(r[14]),
      eventId: text(r[1]),
      tier: text(r[6]),
      paymentStatus: text(r[11]),
    }));
  } catch { return []; }
}

function normalizePaymentStatus(v: string): string {
  const s = v.toLowerCase();
  if (["paid", "lunas", "completed"].includes(s)) return "paid";
  if (["partial", "sebagian", "dp"].includes(s)) return "partial";
  if (["invoice-sent", "invoice", "tagihan"].includes(s)) return "invoice-sent";
  if (["cancelled", "batal"].includes(s)) return "cancelled";
  return "pending";
}

function isFollowUpOverdue(followUpDate: string, todayStr: string): boolean {
  if (!followUpDate) return false;
  return followUpDate < todayStr;
}
function isFollowUpToday(followUpDate: string, todayStr: string): boolean {
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

// ── GET ──
export async function GET(req: NextRequest) {
  try {
    const [customers, tenants, sponsors, interactions] = await Promise.all([
      readCustomersFromSheets(),
      readTenantsFromSheets(),
      readSponsorsFromSheets(),
      readInteractions(),
    ]);

    // Merge follow-up dates from interactions
    const allContacts: CrmContact[] = [...customers, ...tenants, ...sponsors].map(c => {
      const followUpFromInteraction = interactions[c.id];
      if (followUpFromInteraction && !c.followUpDate) {
        return { ...c, followUpDate: followUpFromInteraction };
      }
      return c;
    });

    const todayStr = today();
    const summary: CrmSummary = {
      totalContacts: allContacts.length,
      customers: customers.length,
      tenants: tenants.length,
      sponsors: sponsors.length,
      overdueFollowUps: allContacts.filter(c => isFollowUpOverdue(c.followUpDate, todayStr)).length,
      dueTodayFollowUps: allContacts.filter(c => isFollowUpToday(c.followUpDate, todayStr)).length,
      upcomingFollowUps: allContacts.filter(c => isFollowUpUpcoming(c.followUpDate, todayStr)).length,
      totalValue: allContacts.reduce((s, c) => s + c.totalValue, 0),
      byType: { customer: customers.length, tenant: tenants.length, sponsor: sponsors.length },
      bySegment: {},
      byStatus: {},
    };

    // Build segment/status breakdowns
    for (const c of allContacts) {
      summary.bySegment[c.segment] = (summary.bySegment[c.segment] || 0) + 1;
      summary.byStatus[c.status] = (summary.byStatus[c.status] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      source: SOURCE,
      sourceStatus: "ok",
      contacts: allContacts,
      summary,
      followUps: {
        overdue: allContacts.filter(c => isFollowUpOverdue(c.followUpDate, todayStr)),
        dueToday: allContacts.filter(c => isFollowUpToday(c.followUpDate, todayStr)),
        upcoming: allContacts.filter(c => isFollowUpUpcoming(c.followUpDate, todayStr)),
      },
    });
  } catch (error) {
    const degraded = isGoogleWorkspaceAuthError(error);
    return NextResponse.json({
      success: true,
      source: SOURCE,
      sourceStatus: degraded ? "degraded" : "error",
      warning: degraded
        ? "Google OAuth perlu re-auth. CRM menampilkan data kosong."
        : `Gagal memuat CRM: ${error instanceof Error ? error.message : String(error)}`,
      contacts: [],
      summary: {
        totalContacts: 0, customers: 0, tenants: 0, sponsors: 0,
        overdueFollowUps: 0, dueTodayFollowUps: 0, upcomingFollowUps: 0,
        totalValue: 0, byType: {}, bySegment: {}, byStatus: {},
      },
      followUps: { overdue: [], dueToday: [], upcoming: [] },
    });
  }
}

// ── POST — WhatsApp preview / log communication ──
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "whatsapp-preview") {
      const { contactId, contactName, whatsapp, message, type } = body;
      const wa = text(whatsapp).replace(/[^\d+]/g, "");
      const encodedMsg = encodeURIComponent(text(message));
      const waLink = wa ? `https://wa.me/${wa.replace(/^\+/, "")}?text=${encodedMsg}` : null;

      // Log to audit
      try {
        await appendSwiMemoryLog({
          action: "WhatsApp Preview",
          target: `CRM: ${contactName} (${contactId})`,
          summary: `Preview ${type || "message"} untuk ${contactName}. Link: ${waLink ? "generated" : "no WA number"}.`,
        });
      } catch { /* non-blocking */ }

      return NextResponse.json({
        success: true,
        waLink,
        contactName,
        whatsapp: wa,
        message: text(message),
        note: waLink ? "Klik link untuk membuka WhatsApp." : "Nomor WhatsApp tidak tersedia.",
      });
    }

    if (action === "log-communication") {
      const { contactId, contactName, type, channel, summary: notes, followUpDate } = body;
      try {
        await appendSwiMemoryLog({
          action: "Log Communication",
          target: `CRM: ${contactName} (${contactId})`,
          summary: `${type} via ${channel}. ${notes || ""}. Follow-up: ${followUpDate || "none"}`,
        });
      } catch { /* non-blocking */ }

      return NextResponse.json({
        success: true,
        message: `Communication logged untuk ${contactName}.`,
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
