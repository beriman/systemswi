import { NextRequest, NextResponse } from "next/server";
import { isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readRange } from "@/lib/sheets/sheets-real";

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
};

const SOURCE = "SQLite + Google Sheets: Customer_Master";
const text = (value: unknown) => String(value ?? "").trim();
const numberValue = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(/[^\d.-]/g, "")) || 0;
  return 0;
};

function parseCustomers(rows: string[][]): Customer[] {
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row) => ({
    id: text(row[0]),
    name: text(row[1]),
    whatsapp: text(row[2]).replace(/[^\d+]/g, ""),
    segment: (text(row[3]) as CustomerSegment) || "new",
    interest: text(row[4]) || "TBA",
    source: text(row[5]) || "TBA",
    consent: text(row[6]) || "TBA",
    lastContact: text(row[7]) || "TBA",
    totalPurchases: numberValue(row[8]),
    clv: numberValue(row[9]),
    recommendedFormula: text(row[10]) || "TBA",
    notes: text(row[11]),
    updatedAt: text(row[12]),
  })).filter((customer) => customer.id && customer.name);
}

// ── SQLite helper ───────────────────────────────────────────────
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

function readCustomersFromSqlite(): Customer[] {
  const db = getDbSafe();
  if (!db) return [];
  try {
    const rows = db.prepare("SELECT * FROM customers ORDER BY clv DESC").all();
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
    }));
  } catch {
    return [];
  } finally {
    try { db.close(); } catch { /* ignore */ }
  }
}

function readCustomersFromSheets(): Promise<Customer[]> {
  return readRange("Customer_Master!A1:M1000").then(parseCustomers);
}

async function readCustomers(): Promise<{ customers: Customer[]; source: string; sourceStatus: "live" | "degraded" }> {
  // Try SQLite first
  const sqliteCustomers = readCustomersFromSqlite();
  if (sqliteCustomers.length > 0) {
    return { customers: sqliteCustomers, source: "SQLite (local DB)", sourceStatus: "live" };
  }

  // Fallback to Google Sheets
  try {
    const sheetsCustomers = await readCustomersFromSheets();
    if (sheetsCustomers.length > 0) {
      return { customers: sheetsCustomers, source: "Google Sheets", sourceStatus: "live" };
    }
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return {
        customers: sqliteCustomers,
        source: "SQLite (fallback)",
        sourceStatus: sqliteCustomers.length > 0 ? "live" : "degraded",
      };
    }
    throw error;
  }

  return { customers: [], source: "none", sourceStatus: "live" };
}

// ── Segment criteria ────────────────────────────────────────────
const SEGMENT_CRITERIA: Record<CustomerSegment, string> = {
  vip: "≥10 purchases OR CLV ≥ Rp 50.000.000",
  loyal: "5–9 purchases OR CLV Rp 10–50 juta",
  regular: "2–4 purchases OR CLV Rp 2–10 juta",
  new: "0–1 purchases, CLV < Rp 2 juta",
};

// ── GET: Segmentation summary ───────────────────────────────────
export async function GET() {
  try {
    const { customers, source, sourceStatus } = await readCustomers();

    const totalCustomers = customers.length;
    const totalClv = customers.reduce((sum, c) => sum + c.clv, 0);

    // Group by segment
    const bySegment: Record<CustomerSegment, Customer[]> = {
      vip: [],
      loyal: [],
      regular: [],
      new: [],
    };

    for (const c of customers) {
      const seg = c.segment as CustomerSegment;
      if (bySegment[seg]) {
        bySegment[seg].push(c);
      } else {
        bySegment.new.push(c);
      }
    }

    // Build segment summary
    const segments = {
      vip: {
        count: bySegment.vip.length,
        customers: bySegment.vip,
        totalClv: bySegment.vip.reduce((s, c) => s + c.clv, 0),
        criteria: SEGMENT_CRITERIA.vip,
      },
      loyal: {
        count: bySegment.loyal.length,
        customers: bySegment.loyal,
        totalClv: bySegment.loyal.reduce((s, c) => s + c.clv, 0),
        criteria: SEGMENT_CRITERIA.loyal,
      },
      regular: {
        count: bySegment.regular.length,
        customers: bySegment.regular,
        totalClv: bySegment.regular.reduce((s, c) => s + c.clv, 0),
        criteria: SEGMENT_CRITERIA.regular,
      },
      new: {
        count: bySegment.new.length,
        customers: bySegment.new,
        totalClv: bySegment.new.reduce((s, c) => s + c.clv, 0),
        criteria: SEGMENT_CRITERIA.new,
      },
    };

    return NextResponse.json({
      source,
      sourceStatus,
      totalCustomers,
      totalClv,
      segments,
      bySegment: {
        vip: bySegment.vip.length,
        loyal: bySegment.loyal.length,
        regular: bySegment.regular.length,
        new: bySegment.new.length,
      },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        sourceStatus: "degraded",
        source: SOURCE,
        error: "Google Workspace OAuth perlu re-auth",
        totalCustomers: 0,
        totalClv: 0,
        segments: null,
        bySegment: { vip: 0, loyal: 0, regular: 0, new: 0 },
      });
    }
    return NextResponse.json({ error: "Gagal membaca segmentasi", details: String(error) }, { status: 500 });
  }
}
