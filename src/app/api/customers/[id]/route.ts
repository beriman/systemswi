// GET /api/customers/[id] — customer detail + interactions
// PUT /api/customers/[id] — update customer
import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, googleWorkspaceWriteBlockedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readRange, updateRow } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const text = (value: unknown) => String(value ?? "").trim();
const numberValue = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(/[^\d.-]/g, "")) || 0;
  return 0;
};
const normalizeWa = (value: unknown) => text(value).replace(/[^\d+]/g, "");

function safeConsent(value: unknown): "TBA" | "yes" | "no" {
  const v = text(value).toLowerCase();
  if (["yes", "ya", "true", "consent"].includes(v)) return "yes";
  if (["no", "tidak", "false"].includes(v)) return "no";
  return "TBA";
}

function segmentFromPurchases(count: number): "vip" | "loyal" | "regular" | "new" {
  if (count >= 10) return "vip";
  if (count >= 5) return "loyal";
  if (count >= 2) return "regular";
  return "new";
}

function parseCustomers(rows: string[][]) {
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row, index) => ({
    id: text(row[0]),
    name: text(row[1]),
    whatsapp: normalizeWa(row[2]),
    segment: text(row[3]) || "new",
    interest: text(row[4]) || "TBA",
    source: text(row[5]) || "TBA",
    consent: safeConsent(row[6]),
    lastContact: text(row[7]) || "TBA",
    totalPurchases: numberValue(row[8]),
    clv: numberValue(row[9]),
    recommendedFormula: text(row[10]) || "TBA",
    notes: text(row[11]),
    updatedAt: text(row[12]),
    rowNumber: index + 2,
  })).filter((c) => c.id && c.name);
}

function parseInteractions(rows: string[][]) {
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row) => ({
    timestamp: text(row[0]),
    interactionId: text(row[1]),
    customerId: text(row[2]),
    name: text(row[3]),
    type: text(row[4]) || "note",
    channel: text(row[5]) || "WhatsApp",
    summary: text(row[6]),
    value: numberValue(row[7]),
    followUpDate: text(row[8]) || "TBA",
    pic: text(row[9]) || "TBA",
  })).filter((i) => i.interactionId);
}

function customerRow(customer: {
  id: string; name: string; whatsapp: string; segment: string;
  interest: string; source: string; consent: string; lastContact: string;
  totalPurchases: number; clv: number; recommendedFormula: string;
  notes: string; updatedAt: string;
}) {
  return [
    customer.id, customer.name, customer.whatsapp, customer.segment,
    customer.interest, customer.source, customer.consent, customer.lastContact,
    customer.totalPurchases, customer.clv, customer.recommendedFormula,
    customer.notes, customer.updatedAt,
  ];
}

// ── GET customer detail ──
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [customerRows, interactionRows] = await Promise.all([
      readRange("Customer_Master!A1:M1000"),
      readRange("Customer_Interactions!A1:J1000"),
    ]);

    const customers = parseCustomers(customerRows);
    const customer = customers.find(
      (c) => c.id.toLowerCase() === id.toLowerCase() ||
             c.whatsapp === normalizeWa(id)
    );

    if (!customer) {
      return NextResponse.json(
        { error: `Customer ${id} tidak ditemukan` },
        { status: 404 }
      );
    }

    const allInteractions = parseInteractions(interactionRows);
    const interactions = allInteractions.filter(
      (i) => i.customerId.toLowerCase() === customer.id.toLowerCase()
    );

    return NextResponse.json({
      source: "Google Sheets: Customer_Master + Customer_Interactions",
      customer,
      interactions,
      interactionCount: interactions.length,
      totalValue: interactions.reduce((sum, i) => sum + i.value, 0),
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Customer_Master", error),
        customer: null,
        interactions: [],
      });
    }
    return NextResponse.json(
      { error: "Gagal membaca customer detail", details: String(error) },
      { status: 500 }
    );
  }
}

// ── PUT update customer ──
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const customerRows = await readRange("Customer_Master!A1:M1000");
    const customers = parseCustomers(customerRows);
    const existing = customers.find(
      (c) => c.id.toLowerCase() === id.toLowerCase() ||
             c.whatsapp === normalizeWa(id)
    );

    if (!existing) {
      return NextResponse.json(
        { error: `Customer ${id} tidak ditemukan` },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const totalPurchases = Math.max(
      numberValue(body.totalPurchases), existing.totalPurchases
    );
    const clv = Math.max(numberValue(body.clv), existing.clv);

    const updated = {
      id: existing.id,
      name: text(body.name) || existing.name,
      whatsapp: normalizeWa(body.whatsapp) || existing.whatsapp,
      segment: text(body.segment) || segmentFromPurchases(totalPurchases),
      interest: text(body.interest) || existing.interest || "TBA",
      source: text(body.source) || existing.source || "TBA",
      consent: safeConsent(body.consent || existing.consent),
      lastContact: text(body.lastContact) || now.slice(0, 10),
      totalPurchases,
      clv,
      recommendedFormula: text(body.recommendedFormula) || existing.recommendedFormula || "TBA",
      notes: text(body.notes) || existing.notes || "",
      updatedAt: now,
    };

    await updateRow("CustomerMaster", existing.rowNumber, customerRow(updated));

    return NextResponse.json({
      success: true,
      source: "Google Sheets: Customer_Master",
      customer: updated,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource("Google Sheets: Customer_Master", error),
        error: "Google OAuth perlu re-auth",
      }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Gagal update customer", details: String(error) },
      { status: 500 }
    );
  }
}
