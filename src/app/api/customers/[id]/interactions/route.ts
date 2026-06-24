import { NextRequest, NextResponse } from "next/server";
import { isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { appendRows } from "@/lib/sheets/sheets-real";
import { appendSwiMemoryLog } from "@/lib/google/audit-log";

export const runtime = "nodejs";

type CustomerSegment = "new" | "regular" | "loyal" | "vip";

type Customer = {
  id: string;
  name: string;
  whatsapp: string;
  segment: CustomerSegment;
  interest: string;
  source: string;
  consent: string;
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

function makeInteractionId(existing: Interaction[]) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const sameDay = existing.filter((interaction) => interaction.interactionId.includes(today)).length + 1;
  return `CI-${today}-${String(sameDay).padStart(3, "0")}`;
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

// ── SQLite helpers ──────────────────────────────────────────────
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
    const { ensureCustomerTables } = require("@/lib/customer/init-db");
    ensureCustomerTables(db);
    return db;
  } catch {
    return null;
  }
}

function readInteractionsFromSqlite(customerId?: string): Interaction[] {
  const db = getDbSafe();
  if (!db) return [];
  try {
    const rows = customerId
      ? db.prepare("SELECT * FROM customer_interactions WHERE customer_id = ? ORDER BY created_at DESC").all(customerId)
      : db.prepare("SELECT * FROM customer_interactions ORDER BY created_at DESC").all();
    return rows.map((r: any) => ({
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
  } catch {
    return [];
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

function readAllCustomersFromSqlite(): Customer[] {
  const db = getDbSafe();
  if (!db) return [];
  try {
    const rows = db.prepare("SELECT * FROM customers").all();
    return rows.map((r: any) => ({
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
  } catch {
    return [];
  } finally {
    try { db.close(); } catch { /* ignore */ }
  }
}

function writeCustomerToSqlite(customer: Omit<Customer, "rowNumber">) {
  const db = getDbSafe();
  if (!db) return false;
  try {
    const existing = db.prepare("SELECT id FROM customers WHERE id = ?").get(customer.id);
    if (existing) {
      db.prepare(`UPDATE customers SET name=?, whatsapp=?, segment=?, interest=?, source=?, consent=?, last_contact=?, total_purchases=?, clv=?, recommended_formula=?, notes=?, updated_at=? WHERE id=?`)
        .run(customer.name, customer.whatsapp, customer.segment, customer.interest, customer.source, customer.consent, customer.lastContact, customer.totalPurchases, customer.clv, customer.recommendedFormula, customer.notes, customer.updatedAt, customer.id);
    } else {
      db.prepare(`INSERT INTO customers (id, name, whatsapp, segment, interest, source, consent, last_contact, total_purchases, clv, recommended_formula, notes, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run(customer.id, customer.whatsapp, customer.segment, customer.interest, customer.source, customer.consent, customer.lastContact, customer.totalPurchases, customer.clv, customer.recommendedFormula, customer.notes, customer.updatedAt, customer.name, customer.id);
    }
    return true;
  } catch {
    return false;
  } finally {
    try { db.close(); } catch { /* ignore */ }
  }
}

// ── GET: List interactions for a customer ────────────────────────
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Try SQLite first
    const sqliteInteractions = readInteractionsFromSqlite(params.id);
    if (sqliteInteractions.length > 0) {
      return NextResponse.json({
        source: "SQLite (local DB)",
        sourceStatus: "live",
        customerId: params.id,
        interactions: sqliteInteractions,
      });
    }

    // Fallback to Google Sheets
    try {
      const { readRange } = await import("@/lib/sheets/sheets-real");
      const rows = await readRange("Customer_Interactions!A1:J1000");
      const all = parseInteractions(rows);
      const filtered = all
        .filter((ix) => ix.customerId === params.id)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

      return NextResponse.json({
        source: "Google Sheets",
        sourceStatus: "live",
        customerId: params.id,
        interactions: filtered,
      });
    } catch (error) {
      if (isGoogleWorkspaceAuthError(error)) {
        return NextResponse.json({
          source: "SQLite (fallback)",
          sourceStatus: sqliteInteractions.length > 0 ? "live" : "degraded",
          customerId: params.id,
          interactions: sqliteInteractions,
          warning: "Google Workspace auth blocked; returning SQLite data only",
        });
      }
      throw error;
    }
  } catch (error) {
    return NextResponse.json({ error: "Gagal membaca interactions", details: String(error) }, { status: 500 });
  }
}

// ── POST: Log new interaction ───────────────────────────────────
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();

    // Read all interactions to generate ID
    const allInteractions = readInteractionsFromSqlite();
    const interactionId = makeInteractionId(allInteractions);

    const customerId = text(body.customerId) || params.id;
    const value = numberValue(body.value);

    const interaction: Interaction = {
      timestamp: now,
      interactionId,
      customerId,
      name: text(body.name) || "Unknown",
      type: text(body.type) || "follow_up",
      channel: text(body.channel) || "WhatsApp",
      summary: text(body.summary) || "TBA",
      value,
      followUpDate: text(body.followUpDate) || "TBA",
      pic: text(body.pic) || "HemuHemu/OWL",
    };

    // If customerId provided explicitly, look up the name
    if (text(body.name) === "" || text(body.name) === "Unknown") {
      const customers = readAllCustomersFromSqlite();
      const found = customers.find((c) => c.id === customerId);
      if (found) interaction.name = found.name;
    }

    // Write to SQLite
    const sqliteOk = writeInteractionToSqlite(interaction);

    // Try Google Sheets
    let sheetsOk = false;
    try {
      await appendRows("CustomerInteractions", [[
        now, interactionId, customerId, interaction.name,
        interaction.type, interaction.channel, interaction.summary,
        value, interaction.followUpDate, interaction.pic,
      ]]);
      sheetsOk = true;
    } catch {
      // Non-fatal
    }

    // Update customer's total purchases & CLV if value > 0
    if (value > 0) {
      const customers = readAllCustomersFromSqlite();
      const customer = customers.find((c) => c.id === customerId);
      if (customer) {
        const updated: Omit<Customer, "rowNumber"> = {
          ...customer,
          totalPurchases: customer.totalPurchases + 1,
          clv: customer.clv + value,
          segment: segmentFromPurchases(customer.totalPurchases + 1),
          lastContact: now.slice(0, 10),
          updatedAt: now,
        };
        writeCustomerToSqlite(updated);
      }
    }

    // Audit log
    let auditStatus = "ok";
    try {
      await appendSwiMemoryLog({
        action: "Customer Interaction",
        target: `Customer_Interactions:${interactionId}`,
        summary: `${interaction.type} for ${interaction.name}; value=${value}; channel=${interaction.channel}; sqlite=${sqliteOk}; sheets=${sheetsOk}`,
      });
    } catch (auditError) {
      auditStatus = `failed: ${String(auditError)}`;
    }

    return NextResponse.json({
      success: true,
      interaction,
      auditStatus,
      sqlite: sqliteOk,
      sheets: sheetsOk,
    }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        sourceStatus: "blocked",
        source: SOURCE,
        error: "Google Workspace OAuth perlu re-auth sebelum menulis interaction.",
        details: String(error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Gagal mencatat interaction", details: String(error) }, { status: 500 });
  }
}
