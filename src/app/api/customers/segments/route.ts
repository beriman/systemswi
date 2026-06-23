import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readRange } from "@/lib/sheets/sheets-real";
import { ensureCustomerTables } from "@/lib/customer/init-db";

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

const SOURCE = "SQLite + Google Sheets: Customer_Master";
const text = (value: unknown) => String(value ?? "").trim();
const numberValue = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(/[^\d.-]/g, "")) || 0;
  return 0;
};
const normalizeWa = (value: unknown) => text(value).replace(/[^\d+]/g, "");

function parseCustomers(rows: string[][]): Customer[] {
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row, index) => ({
    id: text(row[0]),
    name: text(row[1]),
    whatsapp: normalizeWa(row[2]),
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
    rowNumber: index + 2,
  })).filter((customer) => customer.id && customer.name);
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

function readCustomersFromSqlite(): Customer[] | null {
  const db = getDbSafe();
  if (!db) return null;
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
      rowNumber: 0,
    }));
  } catch {
    return null;
  } finally {
    try { db.close(); } catch { /* ignore */ }
  }
}

async function readCustomers() {
  const sqliteCustomers = readCustomersFromSqlite();
  if (sqliteCustomers && sqliteCustomers.length > 0) {
    return { customers: sqliteCustomers, sourceStatus: "live" as const, source: "SQLite (local DB)" };
  }
  try {
    const rows = await readRange("Customer_Master!A1:M1000");
    return { customers: parseCustomers(rows), sourceStatus: "live" as const, source: "Google Sheets" };
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return { customers: [], sourceStatus: "degraded" as const, source: "Google Sheets (blocked)" };
    }
    throw error;
  }
}

// ── GET /api/customers/segments ──
export async function GET() {
  try {
    const { customers, sourceStatus, source } = await readCustomers();

    const segmentCriteria: Record<string, string> = {
      vip: "≥10 purchases · CLV ≥ Rp2.000.000",
      loyal: "5–9 purchases · CLV ≥ Rp1.000.000",
      regular: "2–4 purchases · CLV ≥ Rp500.000",
      new: "0–1 purchases · Baru terdaftar",
    };

    const segments = {
      vip: { count: 0, customers: [] as Customer[], totalClv: 0, criteria: segmentCriteria.vip },
      loyal: { count: 0, customers: [] as Customer[], totalClv: 0, criteria: segmentCriteria.loyal },
      regular: { count: 0, customers: [] as Customer[], totalClv: 0, criteria: segmentCriteria.regular },
      new: { count: 0, customers: [] as Customer[], totalClv: 0, criteria: segmentCriteria.new },
    };

    for (const customer of customers) {
      const seg = segments[customer.segment] || segments.new;
      seg.count++;
      seg.customers.push(customer);
      seg.totalClv += customer.clv;
    }

    // Sort each segment by CLV descending
    for (const seg of Object.values(segments)) {
      seg.customers.sort((a, b) => b.clv - a.clv);
    }

    const bySegment: Record<string, number> = {};
    for (const [key, val] of Object.entries(segments)) {
      bySegment[key] = val.count;
    }

    return NextResponse.json({
      source,
      sourceStatus,
      totalCustomers: customers.length,
      totalClv: customers.reduce((sum, c) => sum + c.clv, 0),
      segments,
      bySegment,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        totalCustomers: 0,
        totalClv: 0,
        segments: {},
        bySegment: {},
      });
    }
    return NextResponse.json({ error: "Gagal membaca segments", details: String(error) }, { status: 500 });
  }
}
