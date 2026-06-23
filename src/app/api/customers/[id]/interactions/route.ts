// GET /api/customers/[id]/interactions — interaction history for a customer
// POST /api/customers/[id]/interactions — log new interaction for a customer
import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, googleWorkspaceWriteBlockedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readRange, appendRows, updateRow } from "@/lib/sheets/sheets-real";
import { appendSwiMemoryLog } from "@/lib/google/audit-log";

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

function makeInteractionId(existing: { interactionId: string }[]) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const sameDay = existing.filter((i) => i.interactionId.includes(today)).length + 1;
  return `CI-${today}-${String(sameDay).padStart(3, "0")}`;
}

// ── GET interaction history ──
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const interactionRows = await readRange("Customer_Interactions!A1:J1000");
    const allInteractions = parseInteractions(interactionRows);

    // Try to find by customerId first, then by whatsapp
    const customerRows = await readRange("Customer_Master!A1:M1000");
    const customers = parseCustomers(customerRows);
    const customer = customers.find(
      (c) => c.id.toLowerCase() === id.toLowerCase() ||
             c.whatsapp === normalizeWa(id)
    );

    const customerId = customer?.id || id;
    const interactions = allInteractions
      .filter((i) => i.customerId.toLowerCase() === customerId.toLowerCase())
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return NextResponse.json({
      source: "Google Sheets: Customer_Interactions",
      customerId,
      customerName: customer?.name || null,
      interactions,
      totalInteractions: interactions.length,
      totalValue: interactions.reduce((sum, i) => sum + i.value, 0),
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Customer_Interactions", error),
        interactions: [],
      });
    }
    return NextResponse.json(
      { error: "Gagal membaca interaction history", details: String(error) },
      { status: 500 }
    );
  }
}

// ── POST log interaction ──
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const now = new Date().toISOString();

    // Find customer
    const customerRows = await readRange("Customer_Master!A1:M1000");
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

    const interactionRows = await readRange("Customer_Interactions!A1:J1000");
    const allInteractions = parseInteractions(interactionRows);
    const interactionId = makeInteractionId(allInteractions);
    const value = numberValue(body.value);

    const interaction = {
      timestamp: now,
      interactionId,
      customerId: customer.id,
      name: customer.name,
      type: text(body.type) || "follow_up",
      channel: text(body.channel) || "WhatsApp",
      summary: text(body.summary) || "TBA",
      value,
      followUpDate: text(body.followUpDate) || "TBA",
      pic: text(body.pic) || "HemuHemu/OWL",
    };

    // Write to Google Sheets
    await appendRows("CustomerInteractions", [[
      now, interactionId, customer.id, customer.name,
      interaction.type, interaction.channel, interaction.summary,
      value, interaction.followUpDate, interaction.pic,
    ]]);

    // Update customer totals
    const updatedCustomer = {
      ...customer,
      totalPurchases: customer.totalPurchases + (value > 0 ? 1 : 0),
      clv: customer.clv + value,
      segment: segmentFromPurchases(customer.totalPurchases + (value > 0 ? 1 : 0)),
      lastContact: now.slice(0, 10),
      updatedAt: now,
    };

    await updateRow("CustomerMaster", customer.rowNumber, [
      updatedCustomer.id, updatedCustomer.name, updatedCustomer.whatsapp,
      updatedCustomer.segment, updatedCustomer.interest, updatedCustomer.source,
      updatedCustomer.consent, updatedCustomer.lastContact,
      updatedCustomer.totalPurchases, updatedCustomer.clv,
      updatedCustomer.recommendedFormula, updatedCustomer.notes,
      updatedCustomer.updatedAt,
    ]);

    // Audit log
    let auditStatus = "ok";
    try {
      await appendSwiMemoryLog({
        action: "Customer Interaction",
        target: `Customer_Interactions:${interactionId}`,
        summary: `${interaction.type} untuk ${customer.name}; value=${value}; channel=${interaction.channel}`,
      });
    } catch (auditError) {
      auditStatus = `failed: ${String(auditError)}`;
    }

    return NextResponse.json({
      success: true,
      interaction,
      customer: updatedCustomer,
      auditStatus,
    }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource("Google Sheets: Customer_Interactions", error),
        error: "Google OAuth perlu re-auth",
      }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Gagal mencatat interaction", details: String(error) },
      { status: 500 }
    );
  }
}
