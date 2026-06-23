// GET /api/customers/segments — segmentation summary
import { NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readRange } from "@/lib/sheets/sheets-real";

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

export async function GET() {
  try {
    const customerRows = await readRange("Customer_Master!A1:M1000");
    const customers = parseCustomers(customerRows);

    const segments = {
      vip: customers.filter((c) => c.segment === "vip"),
      loyal: customers.filter((c) => c.segment === "loyal"),
      regular: customers.filter((c) => c.segment === "regular"),
      new: customers.filter((c) => c.segment === "new"),
    };

    const totalClv = customers.reduce((sum, c) => sum + c.clv, 0);

    return NextResponse.json({
      source: "Google Sheets: Customer_Master",
      totalCustomers: customers.length,
      segments: {
        vip: {
          count: segments.vip.length,
          customers: segments.vip.sort((a, b) => b.clv - a.clv),
          totalClv: segments.vip.reduce((sum, c) => sum + c.clv, 0),
          criteria: "≥10 purchases",
        },
        loyal: {
          count: segments.loyal.length,
          customers: segments.loyal.sort((a, b) => b.clv - a.clv),
          totalClv: segments.loyal.reduce((sum, c) => sum + c.clv, 0),
          criteria: "5-9 purchases",
        },
        regular: {
          count: segments.regular.length,
          customers: segments.regular.sort((a, b) => b.clv - a.clv),
          totalClv: segments.regular.reduce((sum, c) => sum + c.clv, 0),
          criteria: "2-4 purchases",
        },
        new: {
          count: segments.new.length,
          customers: segments.new.sort((a, b) => b.clv - a.clv),
          totalClv: segments.new.reduce((sum, c) => sum + c.clv, 0),
          criteria: "0-1 purchases",
        },
      },
      totalClv,
      bySegment: {
        vip: segments.vip.length,
        loyal: segments.loyal.length,
        regular: segments.regular.length,
        new: segments.new.length,
      },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Customer_Master", error),
        totalCustomers: 0,
        segments: { vip: { count: 0, customers: [] }, loyal: { count: 0, customers: [] }, regular: { count: 0, customers: [] }, new: { count: 0, customers: [] } },
      });
    }
    return NextResponse.json(
      { error: "Gagal membaca segmentasi customer", details: String(error) },
      { status: 500 }
    );
  }
}
