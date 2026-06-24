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

function parseCustomers(rows: string[][]): Customer[] {
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row, index) => ({
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
    const rows = db.prepare("SELECT * FROM customers ORDER BY updated_at DESC").all();
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

async function readCustomersFromSheets(): Promise<Customer[]> {
  const rows = await readRange("Customer_Master!A1:M1000");
  return parseCustomers(rows);
}

async function getCustomers(): Promise<{ customers: Customer[]; source: string; sourceStatus: string }> {
  // Try SQLite first
  const sqliteCustomers = readCustomersFromSqlite();
  if (sqliteCustomers && sqliteCustomers.length > 0) {
    return { customers: sqliteCustomers, source: "SQLite (local DB)", sourceStatus: "live" };
  }
  // Fallback to Google Sheets
  try {
    const sheetsCustomers = await readCustomersFromSheets();
    return { customers: sheetsCustomers, source: "Google Sheets", sourceStatus: "live" };
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return { customers: [], source: "Google Sheets (blocked)", sourceStatus: "degraded" };
    }
    throw error;
  }
}

function segmentCriteria(segment: CustomerSegment): string {
  switch (segment) {
    case "vip": return "≥10 purchases";
    case "loyal": return "5–9 purchases";
    case "regular": return "2–4 purchases";
    case "new": return "0–1 purchases";
  }
}

// ── GET /api/customers/segments ──
export async function GET() {
  try {
    const { customers, source, sourceStatus } = await getCustomers();

    const segments = {
      vip: { count: 0, customers: [] as Customer[], totalClv: 0, criteria: segmentCriteria("vip") },
      loyal: { count: 0, customers: [] as Customer[], totalClv: 0, criteria: segmentCriteria("loyal") },
      regular: { count: 0, customers: [] as Customer[], totalClv: 0, criteria: segmentCriteria("regular") },
      new: { count: 0, customers: [] as Customer[], totalClv: 0, criteria: segmentCriteria("new") },
    };

    for (const customer of customers) {
      const seg = segments[customer.segment] || segments.new;
      seg.count += 1;
      seg.customers.push(customer);
      seg.totalClv += customer.clv;
    }

    // Sort each segment by CLV descending
    for (const seg of Object.values(segments)) {
      seg.customers.sort((a, b) => b.clv - a.clv);
    }

    const totalCustomers = customers.length;
    const totalClv = customers.reduce((sum, c) => sum + c.clv, 0);
    const bySegment = customers.reduce<Record<string, number>>((acc, c) => {
      acc[c.segment] = (acc[c.segment] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      source,
      sourceStatus,
      totalCustomers,
      totalClv,
      segments,
      bySegment,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        totalCustomers: 0,
        totalClv: 0,
        segments: null,
        bySegment: {},
      });
    }
    return NextResponse.json(
      { error: "Gagal membaca segmentasi customer", details: String(error) },
      { status: 500 }
    );
  }
}
