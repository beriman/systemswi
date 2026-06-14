import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { appendRows, readRange, updateRow } from "@/lib/sheets/sheets-real";
import { appendSwiMemoryLog } from "@/lib/google/audit-log";

export const runtime = "nodejs";

type CustomerSegment = "new" | "regular" | "loyal" | "vip";
type ConsentStatus = "TBA" | "yes" | "no";

type Customer = {
  id: string;
  name: string;
  whatsapp: string;
  segment: CustomerSegment;
  interest: string;
  source: string;
  consent: ConsentStatus;
  lastContact: string;
  totalPurchases: number;
  clv: number;
  recommendedFormula: string;
  notes: string;
  updatedAt: string;
  rowNumber: number;
};

type Interaction = {
  timestamp: string;
  interactionId: string;
  customerId: string;
  name: string;
  type: string;
  channel: string;
  summary: string;
  value: number;
  followUpDate: string;
  pic: string;
};

const SOURCE = "Google Sheets: Customer_Master + Customer_Interactions";
const text = (value: unknown) => String(value ?? "").trim();
const numberValue = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(/[^\d.-]/g, "")) || 0;
  return 0;
};
const normalizeWa = (value: unknown) => text(value).replace(/[^\d+]/g, "");

function segmentFromPurchases(count: number): CustomerSegment {
  if (count >= 10) return "vip";
  if (count >= 5) return "loyal";
  if (count >= 2) return "regular";
  return "new";
}

function safeConsent(value: unknown): ConsentStatus {
  const v = text(value).toLowerCase();
  if (["yes", "ya", "true", "consent"].includes(v)) return "yes";
  if (["no", "tidak", "false"].includes(v)) return "no";
  return "TBA";
}

function makeCustomerId(name: string, whatsapp: string, existing: Customer[]) {
  const phone = normalizeWa(whatsapp).replace(/^\+?62/, "0");
  const phoneTail = phone.slice(-4);
  const slug = name.toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 6) || "CUST";
  const base = `CUST-${slug}${phoneTail ? `-${phoneTail}` : ""}`;
  const duplicateCount = existing.filter((customer) => customer.id.startsWith(base)).length;
  return duplicateCount ? `${base}-${duplicateCount + 1}` : base;
}

function makeInteractionId(existing: Interaction[]) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const sameDay = existing.filter((interaction) => interaction.interactionId.includes(today)).length + 1;
  return `CI-${today}-${String(sameDay).padStart(3, "0")}`;
}

function parseCustomers(rows: string[][]): Customer[] {
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row, index) => ({
    id: text(row[0]),
    name: text(row[1]),
    whatsapp: normalizeWa(row[2]),
    segment: (text(row[3]) as CustomerSegment) || "new",
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
  })).filter((customer) => customer.id && customer.name);
}

function parseInteractions(rows: string[][]): Interaction[] {
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
  })).filter((interaction) => interaction.interactionId);
}

function summarize(customers: Customer[], interactions: Interaction[]) {
  return {
    totalCustomers: customers.length,
    consentedCustomers: customers.filter((customer) => customer.consent === "yes").length,
    needsConsentReview: customers.filter((customer) => customer.consent !== "yes").length,
    totalClv: customers.reduce((sum, customer) => sum + customer.clv, 0),
    bySegment: customers.reduce<Record<string, number>>((acc, customer) => {
      acc[customer.segment] = (acc[customer.segment] || 0) + 1;
      return acc;
    }, {}),
    recentInteractions: interactions.slice(-10).reverse(),
  };
}

function customerRow(customer: Omit<Customer, "rowNumber">) {
  return [
    customer.id,
    customer.name,
    customer.whatsapp,
    customer.segment,
    customer.interest,
    customer.source,
    customer.consent,
    customer.lastContact,
    customer.totalPurchases,
    customer.clv,
    customer.recommendedFormula,
    customer.notes,
    customer.updatedAt,
  ];
}

async function readCrm() {
  const [customerRows, interactionRows] = await Promise.all([
    readRange("Customer_Master!A1:M1000"),
    readRange("Customer_Interactions!A1:J1000"),
  ]);
  return {
    customers: parseCustomers(customerRows),
    interactions: parseInteractions(interactionRows),
  };
}

export async function GET() {
  try {
    const { customers, interactions } = await readCrm();
    return NextResponse.json({
      source: SOURCE,
      sourceStatus: "live",
      customers,
      interactions,
      summary: summarize(customers, interactions),
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        customers: [],
        interactions: [],
        summary: summarize([], []),
      });
    }
    return NextResponse.json({ error: "Gagal membaca customer CRM", details: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = text(body.action) || "upsert-customer";

    if (!["upsert-customer", "record-interaction"].includes(action)) {
      return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (action === "upsert-customer") {
      const name = text(body.name);
      const whatsapp = normalizeWa(body.whatsapp);
      if (!name || !whatsapp) {
        return NextResponse.json({ error: "Nama dan WhatsApp wajib diisi" }, { status: 400 });
      }
      const { customers, interactions } = await readCrm();
      const existing = customers.find((customer) => customer.whatsapp === whatsapp || customer.id === text(body.id));
      const totalPurchases = Math.max(numberValue(body.totalPurchases), existing?.totalPurchases || 0);
      const clv = Math.max(numberValue(body.clv), existing?.clv || 0);
      const nextCustomer: Omit<Customer, "rowNumber"> = {
        id: existing?.id || text(body.id) || makeCustomerId(name, whatsapp, customers),
        name,
        whatsapp,
        segment: (text(body.segment) as CustomerSegment) || segmentFromPurchases(totalPurchases),
        interest: text(body.interest) || existing?.interest || "TBA",
        source: text(body.source) || existing?.source || "TBA",
        consent: safeConsent(body.consent || existing?.consent),
        lastContact: text(body.lastContact) || now.slice(0, 10),
        totalPurchases,
        clv,
        recommendedFormula: text(body.recommendedFormula) || existing?.recommendedFormula || "TBA",
        notes: text(body.notes) || existing?.notes || "",
        updatedAt: now,
      };

      if (existing) {
        await updateRow("CustomerMaster", existing.rowNumber, customerRow(nextCustomer));
      } else {
        await appendRows("CustomerMaster", [customerRow(nextCustomer)]);
      }

      const interactionId = makeInteractionId(interactions);
      await appendRows("CustomerInteractions", [[
        now,
        interactionId,
        nextCustomer.id,
        nextCustomer.name,
        "customer_sync",
        "WhatsApp/Manual",
        text(body.summary) || `Customer ${existing ? "updated" : "created"} dari systemswi CRM`,
        0,
        text(body.followUpDate) || "TBA",
        text(body.pic) || "HemuHemu/OWL",
      ]]);

      let auditStatus = "ok";
      try {
        await appendSwiMemoryLog({
          action: "Customer CRM Sync",
          target: `Customer_Master:${nextCustomer.id}`,
          summary: `${existing ? "Updated" : "Created"} customer ${nextCustomer.name}; consent=${nextCustomer.consent}; source=${nextCustomer.source}`,
        });
      } catch (auditError) {
        auditStatus = `failed: ${String(auditError)}`;
      }

      return NextResponse.json({ success: true, customer: nextCustomer, interactionId, auditStatus }, { status: 201 });
    }

    const customerId = text(body.customerId);
    if (!customerId && !normalizeWa(body.whatsapp)) {
      return NextResponse.json({ error: "customerId atau WhatsApp wajib diisi" }, { status: 400 });
    }
    const { customers, interactions } = await readCrm();
    const customer = customers.find((item) => item.id === customerId || item.whatsapp === normalizeWa(body.whatsapp));
    if (!customer) {
      return NextResponse.json({ error: "Customer tidak ditemukan; sinkronkan customer dulu" }, { status: 400 });
    }
    const interactionId = makeInteractionId(interactions);
    const value = numberValue(body.value);
    await appendRows("CustomerInteractions", [[
      now,
      interactionId,
      customer.id,
      customer.name,
      text(body.type) || "follow_up",
      text(body.channel) || "WhatsApp",
      text(body.summary) || "TBA",
      value,
      text(body.followUpDate) || "TBA",
      text(body.pic) || "HemuHemu/OWL",
    ]]);

    const updated: Omit<Customer, "rowNumber"> = {
      ...customer,
      totalPurchases: customer.totalPurchases + (value > 0 ? 1 : 0),
      clv: customer.clv + value,
      segment: segmentFromPurchases(customer.totalPurchases + (value > 0 ? 1 : 0)),
      lastContact: now.slice(0, 10),
      updatedAt: now,
    };
    await updateRow("CustomerMaster", customer.rowNumber, customerRow(updated));

    let auditStatus = "ok";
    try {
      await appendSwiMemoryLog({
        action: "Customer Interaction",
        target: `Customer_Interactions:${interactionId}`,
        summary: `${text(body.type) || "follow_up"} untuk ${customer.name}; value=${value}; channel=${text(body.channel) || "WhatsApp"}`,
      });
    } catch (auditError) {
      auditStatus = `failed: ${String(auditError)}`;
    }

    return NextResponse.json({ success: true, customer: updated, interactionId, auditStatus }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        sourceStatus: "blocked",
        source: SOURCE,
        error: "Google Workspace OAuth perlu re-auth sebelum menulis customer CRM.",
        details: String(error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Gagal menyimpan customer CRM", details: String(error) }, { status: 500 });
  }
}
