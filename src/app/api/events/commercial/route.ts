// GET/POST /api/events/commercial — Tenant & sponsor commercial pipeline for Fragrantions
import { NextRequest, NextResponse } from "next/server";
import {
  EVENT_SHEETS,
  appendEventRows,
  ensureEventSheet,
  readEventSheet,
  writeEventSheet,
} from "@/lib/event/sheets";

const TENANT_HEADERS = [
  "ID", "Event ID", "Brand Name", "Contact Person", "Email", "Phone",
  "Booth Number", "Booth Size", "Package Type", "Fee", "Payment Status",
  "Payment Amount", "Contract Date", "Notes", "Created"
];

const SPONSOR_HEADERS = [
  "ID", "Event ID", "Company Name", "Contact Person", "Email", "Phone",
  "Tier", "Sponsorship Amount", "In-Kind", "In-Kind Description", "In-Kind Value",
  "Payment Status", "Contract Date", "Logo URL", "Notes", "Created"
];

function parseAmount(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const normalized = value.replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStatus(status: unknown): string {
  const allowed = new Set(["prospect", "follow-up", "invoice-sent", "partial", "paid", "cancelled"]);
  const value = String(status || "prospect").toLowerCase();
  return allowed.has(value) ? value : "prospect";
}

function toTenant(row: string[]) {
  return {
    id: row[0] || "",
    eventId: row[1] || "",
    brandName: row[2] || "",
    contactPerson: row[3] || "",
    email: row[4] || "",
    phone: row[5] || "",
    boothNumber: row[6] || "TBA",
    boothSize: row[7] || "TBA",
    packageType: row[8] || "standard",
    fee: parseAmount(row[9]),
    paymentStatus: row[10] || "prospect",
    paymentAmount: parseAmount(row[11]),
    contractDate: row[12] || "",
    notes: row[13] || "",
    created: row[14] || "",
  };
}

function toSponsor(row: string[]) {
  return {
    id: row[0] || "",
    eventId: row[1] || "",
    companyName: row[2] || "",
    contactPerson: row[3] || "",
    email: row[4] || "",
    phone: row[5] || "",
    tier: row[6] || "bronze",
    sponsorshipAmount: parseAmount(row[7]),
    inKind: String(row[8] || "false").toLowerCase() === "true",
    inKindDescription: row[9] || "",
    inKindValue: parseAmount(row[10]),
    paymentStatus: row[11] || "prospect",
    contractDate: row[12] || "",
    logoUrl: row[13] || "",
    notes: row[14] || "",
    created: row[15] || "",
  };
}

async function ensureCommercialSheets() {
  await ensureEventSheet(EVENT_SHEETS.Tenants, TENANT_HEADERS);
  await ensureEventSheet(EVENT_SHEETS.Sponsors, SPONSOR_HEADERS);
}

async function readCommercialData() {
  await ensureCommercialSheets();
  const [tenantRows, sponsorRows] = await Promise.all([
    readEventSheet(EVENT_SHEETS.Tenants).catch(() => []),
    readEventSheet(EVENT_SHEETS.Sponsors).catch(() => []),
  ]);

  const tenants = tenantRows.slice(1).filter((row) => row[0]).map(toTenant);
  const sponsors = sponsorRows.slice(1).filter((row) => row[0]).map(toSponsor);

  const tenantRevenue = tenants.reduce((sum, t) => sum + t.paymentAmount, 0);
  const sponsorRevenue = sponsors.reduce((sum, s) => sum + s.sponsorshipAmount + s.inKindValue, 0);
  const outstanding =
    tenants.reduce((sum, t) => sum + Math.max(t.fee - t.paymentAmount, 0), 0) +
    sponsors.reduce((sum, s) => sum + (s.paymentStatus === "paid" ? 0 : s.sponsorshipAmount), 0);

  return {
    tenants,
    sponsors,
    summary: {
      tenantCount: tenants.length,
      sponsorCount: sponsors.length,
      paidTenants: tenants.filter((t) => t.paymentStatus === "paid").length,
      paidSponsors: sponsors.filter((s) => s.paymentStatus === "paid").length,
      tenantRevenue,
      sponsorRevenue,
      commercialRevenue: tenantRevenue + sponsorRevenue,
      outstanding,
      followUpsDue: [...tenants, ...sponsors].filter((item) => ["prospect", "follow-up", "invoice-sent", "partial"].includes(item.paymentStatus)).length,
    },
  };
}

async function syncEventCommercialRollups(eventId: string) {
  const [eventsRows, tenantRows, sponsorRows] = await Promise.all([
    readEventSheet(EVENT_SHEETS.Events).catch(() => []),
    readEventSheet(EVENT_SHEETS.Tenants).catch(() => []),
    readEventSheet(EVENT_SHEETS.Sponsors).catch(() => []),
  ]);

  if (eventsRows.length <= 1) return;

  const tenants = tenantRows.slice(1).filter((row) => row[1] === eventId).map(toTenant);
  const sponsors = sponsorRows.slice(1).filter((row) => row[1] === eventId).map(toSponsor);
  const tenantRevenue = tenants.reduce((sum, t) => sum + t.paymentAmount, 0);
  const sponsorRevenue = sponsors.reduce((sum, s) => sum + s.sponsorshipAmount + s.inKindValue, 0);
  const now = new Date().toISOString().split("T")[0];

  const updated = eventsRows.map((row, index) => {
    if (index === 0 || row[0] !== eventId) return row;
    const next = [...row];
    while (next.length < 22) next.push("");
    next[14] = String(tenantRevenue + sponsorRevenue);
    next[15] = String(tenants.length);
    next[16] = String(sponsors.length);
    next[21] = now;
    return next;
  });

  await writeEventSheet(EVENT_SHEETS.Events, updated);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const data = await readCommercialData();

    if (!eventId) return NextResponse.json(data);

    const tenants = data.tenants.filter((tenant) => tenant.eventId === eventId);
    const sponsors = data.sponsors.filter((sponsor) => sponsor.eventId === eventId);
    return NextResponse.json({
      tenants,
      sponsors,
      summary: {
        tenantCount: tenants.length,
        sponsorCount: sponsors.length,
        tenantRevenue: tenants.reduce((sum, t) => sum + t.paymentAmount, 0),
        sponsorRevenue: sponsors.reduce((sum, s) => sum + s.sponsorshipAmount + s.inKindValue, 0),
        outstanding:
          tenants.reduce((sum, t) => sum + Math.max(t.fee - t.paymentAmount, 0), 0) +
          sponsors.reduce((sum, s) => sum + (s.paymentStatus === "paid" ? 0 : s.sponsorshipAmount), 0),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch commercial pipeline", details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureCommercialSheets();
    const body = await req.json();
    const eventId = String(body.eventId || "").trim();
    const kind = String(body.kind || "tenant").toLowerCase();
    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const now = new Date().toISOString().split("T")[0];

    if (kind === "tenant") {
      const id = `tenant-${Date.now()}`;
      const row = [
        id,
        eventId,
        body.brandName || "TBA",
        body.contactPerson || "",
        body.email || "",
        body.phone || "",
        body.boothNumber || "TBA",
        body.boothSize || "TBA",
        body.packageType || "standard",
        parseAmount(body.fee),
        normalizeStatus(body.paymentStatus),
        parseAmount(body.paymentAmount),
        body.contractDate || "",
        body.notes || "",
        now,
      ];
      await appendEventRows(EVENT_SHEETS.Tenants, [row]);
      await syncEventCommercialRollups(eventId);
      return NextResponse.json({ success: true, kind, id }, { status: 201 });
    }

    if (kind === "sponsor") {
      const id = `sponsor-${Date.now()}`;
      const row = [
        id,
        eventId,
        body.companyName || "TBA",
        body.contactPerson || "",
        body.email || "",
        body.phone || "",
        body.tier || "bronze",
        parseAmount(body.sponsorshipAmount),
        body.inKind ? "true" : "false",
        body.inKindDescription || "",
        parseAmount(body.inKindValue),
        normalizeStatus(body.paymentStatus),
        body.contractDate || "",
        body.logoUrl || "",
        body.notes || "",
        now,
      ];
      await appendEventRows(EVENT_SHEETS.Sponsors, [row]);
      await syncEventCommercialRollups(eventId);
      return NextResponse.json({ success: true, kind, id }, { status: 201 });
    }

    return NextResponse.json({ error: "kind must be tenant or sponsor" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save commercial pipeline item", details: String(error) }, { status: 500 });
  }
}
