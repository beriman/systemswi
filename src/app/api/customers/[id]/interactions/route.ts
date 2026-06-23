import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { appendRows, readRange } from "@/lib/sheets/sheets-real";
import { appendSwiMemoryLog } from "@/lib/google/audit-log";
import { ensureCustomerTables } from "@/lib/customer/init-db";

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

const SOURCE = "SQLite + Google Sheets: Customer_Master + Customer_Interactions";
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

// ── SQLite helpers ──
function getDbSafe(): any {
  try {
    const Database = require("better-sqlite3");
    const path = require("path");
    const fs = require("fs");
    const dbDir = path.join(process.cwd(), ".data");
    const dbPath = path.join(dbDir, "systemswi.db");
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    ensureCustomerTables(db);
    return db;
  } catch {
    return null;
  }
}

function readFromSqlite(): { customers: Customer[]; interactions: Interaction[] } | null {
  const db = getDbSafe();
  if (!db) return null;
  try {
    const custRows = db.prepare("SELECT * FROM customers ORDER BY updated_at DESC").all();
    const intRows = db.prepare("SELECT * FROM customer_interactions ORDER BY created_at DESC").all();
    const customers: Customer[] = custRows.map((r: any) => ({
      id: r.id,
      name: r.name,
      whatsapp: r.whatsapp || "",
      segment: r.segment || "new",
      interest: r.interest || "TBA",
      source: r.source || "TBA",
      consent: r.consent || "TBA",
      lastContact: r.last_contact || "TBA",
      totalPurchases: r.total_purchases || 0,
      clv: r.clv || 0,
      recommendedFormula: r.recommended_formula || "TBA",
      notes: r.notes || "",
      updatedAt: r.updated_at || "",
      rowNumber: 0,
    }));
    const interactions: Interaction[] = intRows.map((r: any) => ({
      timestamp: r.created_at || "",
      interactionId: r.interaction_id,
      customerId: r.customer_id,
      name: r.name,
      type: r.type || "note",
      channel: r.channel || "WhatsApp",
      summary: r.summary || "",
      value: r.value || 0,
      followUpDate: r.follow_up_date || "TBA",
      pic: r.pic || "TBA",
    }));
    return { customers, interactions };
  } catch {
    return null;
  } finally {
    try { db.close(); } catch { /* ignore */ }
  }
}

function writeCustomerToSqlite(customer: Omit<Customer, "rowNumber">) {
  const db = getDbSafe();
  if (!db) return false;
  try {
    const existing = db.prepare("SELECT id FROM customers WHERE id = ? OR whatsapp = ?").get(customer.id, customer.whatsapp);
    if (existing) {
      db.prepare(`UPDATE customers SET name=?, whatsapp=?, segment=?, interest=?, source=?, consent=?, last_contact=?, total_purchases=?, clv=?, recommended_formula=?, notes=?, updated_at=? WHERE id=?`)
        .run(customer.name, customer.whatsapp, customer.segment, customer.interest, customer.source, customer.consent, customer.lastContact, customer.totalPurchases, customer.clv, customer.recommendedFormula, customer.notes, customer.updatedAt, customer.id);
    } else {
      db.prepare(`INSERT INTO customers (id, name, whatsapp, segment, interest, source, consent, last_contact, total_purchases, clv, recommended_formula, notes, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run(customer.id, customer.name, customer.whatsapp, customer.segment, customer.interest, customer.source, customer.consent, customer.lastContact, customer.totalPurchases, customer.clv, customer.recommendedFormula, customer.notes, customer.updatedAt);
    }
    return true;
  } catch {
    return false;
  } finally {
    try { db.close(); } catch { /* ignore */ }
  }
}

function writeInteractionToSqlite(interaction: Interaction) {
  const db = getDbSafe();
  if (!db) return false;
  try {
    db.prepare(`INSERT OR REPLACE INTO customer_interactions (interaction_id, customer_id, name, type, channel, summary, value, follow_up_date, pic) VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(interaction.interactionId, interaction.customerId, interaction.name, interaction.type, interaction.channel, interaction.summary, interaction.value, interaction.followUpDate, interaction.pic);
    return true;
  } catch {
    return false;
  } finally {
    try { db.close(); } catch { /* ignore */ }
  }
}

// ── Google Sheets fallback ──
async function readCrmFromSheets() {
  const [customerRows, interactionRows] = await Promise.all([
    readRange("Customer_Master!A1:M1000"),
    readRange("Customer_Interactions!A1:J1000"),
  ]);
  return {
    customers: parseCustomers(customerRows),
    interactions: parseInteractions(interactionRows),
  };
}

async function readCrm() {
  const sqliteData = readFromSqlite();
  if (sqliteData && (sqliteData.customers.length > 0 || sqliteData.interactions.length > 0)) {
    return { ...sqliteData, sourceStatus: "live" as const, source: "SQLite (local DB)" };
  }
  try {
    const sheetsData = await readCrmFromSheets();
    return { ...sheetsData, sourceStatus: "live" as const, source: "Google Sheets" };
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return { customers: [], interactions: [], sourceStatus: "degraded" as const, source: "Google Sheets (blocked)" };
    }
    throw error;
  }
}

// ── GET /api/customers/[id]/interactions — history ──
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { customers, interactions, sourceStatus, source } = await readCrm();

    const customer = customers.find((c) => c.id === id);
    if (!customer) {
      return NextResponse.json({ error: "Customer tidak ditemukan" }, { status: 404 });
    }

    const customerInteractions = interactions
      .filter((ix) => ix.customerId === id)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return NextResponse.json({
      source,
      sourceStatus,
      customerId: id,
      customerName: customer.name,
      interactions: customerInteractions,
      total: customerInteractions.length,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        interactions: [],
      });
    }
    return NextResponse.json({ error: "Gagal membaca interactions", details: String(error) }, { status: 500 });
  }
}

// ── POST /api/customers/[id]/interactions ── log interaction ──
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { customers, interactions } = await readCrm();

    const customer = customers.find((c) => c.id === id);
    if (!customer) {
      return NextResponse.json({ error: "Customer tidak ditemukan" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const interactionId = makeInteractionId(interactions);
    const value = numberValue(body.value);
    const interaction: Interaction = {
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

    // Write to SQLite
    writeInteractionToSqlite(interaction);

    // Try Google Sheets
    let sheetsOk = false;
    try {
      await appendRows("CustomerInteractions", [[
        now, interactionId, customer.id, customer.name,
        interaction.type, interaction.channel, interaction.summary,
        value, interaction.followUpDate, interaction.pic,
      ]]);
      sheetsOk = true;
    } catch {
      // Non-fatal
    }

    // Update customer CLV & purchases
    const updated: Omit<Customer, "rowNumber"> = {
      ...customer,
      totalPurchases: customer.totalPurchases + (value > 0 ? 1 : 0),
      clv: customer.clv + value,
      segment: segmentFromPurchases(customer.totalPurchases + (value > 0 ? 1 : 0)),
      lastContact: now.slice(0, 10),
      updatedAt: now,
    };
    writeCustomerToSqlite(updated);

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
      customer: updated,
      auditStatus,
      sheets: sheetsOk,
    }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        sourceStatus: "blocked",
        source: SOURCE,
        error: "Google Workspace OAuth perlu re-auth sebelum mencatat interaction.",
        details: String(error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Gagal mencatat interaction", details: String(error) }, { status: 500 });
  }
}
