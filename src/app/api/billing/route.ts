// GET /api/billing — Accounts receivable & billing center
import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { EVENT_SHEETS, readEventSheet } from "@/lib/event/sheets";

function parseAmount(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const normalized = value.replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
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

export async function GET() {
  try {
    const [tenantRows, sponsorRows] = await Promise.all([
      readEventSheet(EVENT_SHEETS.Tenants).catch(() => []),
      readEventSheet(EVENT_SHEETS.Sponsors).catch(() => []),
    ]);

    const tenants = tenantRows.slice(1).filter((row) => row[0]).map(toTenant);
    const sponsors = sponsorRows.slice(1).filter((row) => row[0]).map(toSponsor);

    // Outstanding = unpaid/partial tenants + sponsors
    const unpaidTenants = tenants.filter((t) => ["prospect", "follow-up", "invoice-sent", "partial"].includes(t.paymentStatus));
    const unpaidSponsors = sponsors.filter((s) => ["prospect", "follow-up", "invoice-sent", "partial"].includes(s.paymentStatus));

    const tenantOutstanding = unpaidTenants.reduce((sum, t) => sum + Math.max(t.fee - t.paymentAmount, 0), 0);
    const sponsorOutstanding = unpaidSponsors.reduce((sum, s) => sum + s.sponsorshipAmount + s.inKindValue, 0);

    // Build line items for billing
    const tenantLineItems = unpaidTenants.map((t) => ({
      type: "tenant" as const,
      id: t.id,
      eventId: t.eventId,
      name: t.brandName,
      contact: t.contactPerson,
      email: t.email,
      phone: t.phone,
      description: `Booth ${t.boothNumber} (${t.boothSize}) — ${t.packageType}`,
      totalAmount: t.fee,
      paidAmount: t.paymentAmount,
      outstandingAmount: Math.max(t.fee - t.paymentAmount, 0),
      status: t.paymentStatus,
      contractDate: t.contractDate,
      notes: t.notes,
    }));

    const sponsorLineItems = unpaidSponsors.map((s) => ({
      type: "sponsor" as const,
      id: s.id,
      eventId: s.eventId,
      name: s.companyName,
      contact: s.contactPerson,
      email: s.email,
      phone: s.phone,
      description: `Sponsor ${s.tier}${s.inKind ? ` + In-Kind: ${s.inKindDescription}` : ""}`,
      totalAmount: s.sponsorshipAmount + s.inKindValue,
      paidAmount: 0,
      outstandingAmount: s.sponsorshipAmount + s.inKindValue,
      status: s.paymentStatus,
      contractDate: s.contractDate,
      notes: s.notes,
    }));

    const allLineItems = [...tenantLineItems, ...sponsorLineItems].sort(
      (a, b) => b.outstandingAmount - a.outstandingAmount
    );

    return NextResponse.json({
      source: "Google Sheets: Event_Tenants + Event_Sponsors",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      summary: {
        totalOutstanding: tenantOutstanding + sponsorOutstanding,
        tenantOutstanding,
        sponsorOutstanding,
        unpaidTenantCount: unpaidTenants.length,
        unpaidSponsorCount: unpaidSponsors.length,
        totalUnpaidItems: allLineItems.length,
        totalTenantRevenue: tenants.reduce((s, t) => s + t.fee, 0),
        totalSponsorRevenue: sponsors.reduce((s, sp) => s + sp.sponsorshipAmount + sp.inKindValue, 0),
        collectedTenant: tenants.reduce((s, t) => s + t.paymentAmount, 0),
        collectionRate: tenants.reduce((s, t) => s + t.fee, 0) > 0
          ? Math.round((tenants.reduce((s, t) => s + t.paymentAmount, 0) / tenants.reduce((s, t) => s + t.fee, 0)) * 100)
          : 100,
      },
      lineItems: allLineItems,
      byStatus: {
        prospect: allLineItems.filter((i) => i.status === "prospect").length,
        "follow-up": allLineItems.filter((i) => i.status === "follow-up").length,
        "invoice-sent": allLineItems.filter((i) => i.status === "invoice-sent").length,
        partial: allLineItems.filter((i) => i.status === "partial").length,
      },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Event_Tenants + Event_Sponsors", error),
        summary: {
          totalOutstanding: 0,
          tenantOutstanding: 0,
          sponsorOutstanding: 0,
          unpaidTenantCount: 0,
          unpaidSponsorCount: 0,
          totalUnpaidItems: 0,
          totalTenantRevenue: 0,
          totalSponsorRevenue: 0,
          collectedTenant: 0,
          collectionRate: 100,
        },
        lineItems: [],
        byStatus: { prospect: 0, "follow-up": 0, "invoice-sent": 0, partial: 0 },
      });
    }
    return NextResponse.json(
      { error: "Failed to fetch billing data", details: String(error) },
      { status: 500 }
    );
  }
}
