// GET /api/invoice — List invoices from Google Sheets
// POST /api/invoice — Create invoice record + optional PDF to Drive
// DELETE /api/invoice — Remove invoice row
import { NextRequest, NextResponse } from "next/server";
import { readRange, writeRange, appendRows, updateRow, deleteRow, getAuth } from "@/lib/sheets/sheets-real";
import { google } from "googleapis";
import { appendSwiMemoryLog } from "@/lib/google/audit-log";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError, googleWorkspaceWriteBlockedSource } from "@/lib/api/google-workspace-error";

const SHEET = "Invoices";
const HEADER = [
  "id", "invoiceNumber", "invoiceDate", "dueDate",
  "customerName", "customerAddress", "customerEmail", "customerPhone",
  "items", "subtotal", "tax", "total",
  "paymentStatus", "proofUrl", "notes", "createdAt",
];
const RANGE = "Invoices!A1:P1000";

function parseAmount(v: any): number {
  if (typeof v === "number") return v;
  if (!v) return 0;
  return Number(String(v).replace(/[^\d.-]/g, "")) || 0;
}

function fmtIdr(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

async function ensureSheet() {
  try {
    await readRange("Invoices!A1:P1");
  } catch {
    // Sheet doesn't exist yet — create it with header
    await writeRange("Invoices!A1:P1", [HEADER]);
  }
}

async function listInvoices(): Promise<any[]> {
  const rows = await readRange(RANGE);
  if (!rows || rows.length <= 1) return [];
  const data = rows.slice(1).filter((r) => r[0]);
  return data.map((r) => ({
    id: r[0] || "",
    invoiceNumber: r[1] || "",
    invoiceDate: r[2] || "",
    dueDate: r[3] || "",
    customerName: r[4] || "",
    customerAddress: r[5] || "",
    customerEmail: r[6] || "",
    customerPhone: r[7] || "",
    items: r[8] || "",
    subtotal: parseAmount(r[9]),
    tax: parseAmount(r[10]),
    total: parseAmount(r[11]),
    paymentStatus: r[12] || "draft",
    proofUrl: r[13] || "",
    notes: r[14] || "",
    createdAt: r[15] || "",
  }));
}

async function appendAudit(invoice: { id: string; invoiceNumber: string; customerName: string; total: number; action: string }) {
  try {
    await appendSwiMemoryLog({
      actor: "Hermes/HemuHemu",
      action: invoice.action,
      target: `Invoice ${invoice.invoiceNumber}`,
      summary: `${invoice.action} — ${invoice.customerName} — ${fmtIdr(invoice.total)} — id=${invoice.id}`,
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}

export async function GET() {
  try {
    const invoices = await listInvoices();
    return NextResponse.json({
      source: "Google Sheets: Invoices",
      sourceStatus: "live",
      count: invoices.length,
      invoices,
      summary: {
        total: invoices.length,
        paid: invoices.filter((i) => i.paymentStatus === "paid").length,
        unpaid: invoices.filter((i) => ["draft", "sent", "partial", "overdue"].includes(i.paymentStatus)).length,
        totalAmount: invoices.reduce((s, i) => s + i.total, 0),
        totalOutstanding: invoices
          .filter((i) => ["sent", "partial", "overdue"].includes(i.paymentStatus))
          .reduce((s, i) => s + i.total, 0),
      },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        source: "Google Sheets: Invoices",
        sourceStatus: "degraded",
        warning: "Google Workspace OAuth token is expired. Data may be stale.",
        invoices: [],
        summary: { total: 0, paid: 0, unpaid: 0, totalAmount: 0, totalOutstanding: 0 },
      });
    }
    return NextResponse.json({ error: "Failed to fetch invoices", details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = new Date().toISOString().split("T")[0];
    const id = `inv-${Date.now()}`;

    // Compute totals
    const items = Array.isArray(body.items) ? body.items : [];
    const subtotal = items.reduce((s: number, it: any) => s + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0);
    const taxRate = Number(body.taxRate) || 0.11;
    const tax = Math.round(subtotal * taxRate);
    const total = subtotal + tax;

    const row = [
      id,
      body.invoiceNumber || `INV-${now.replace(/-/g, "")}-${id.slice(-4)}`,
      body.invoiceDate || now,
      body.dueDate || "",
      body.customerName || "TBA",
      body.customerAddress || "",
      body.customerEmail || "",
      body.customerPhone || "",
      items.map((it: any) => `${it.description} x${it.qty}@${it.unitPrice}`).join("; "),
      body.subtotal || subtotal,
      body.tax || tax,
      body.total || total,
      body.paymentStatus || "draft",
      body.proofUrl || "",
      body.notes || "",
      now,
    ];

    await ensureSheet();
    await appendRows(SHEET, [row]);

    // Audit log
    await appendAudit({
      id,
      invoiceNumber: row[1],
      customerName: row[4],
      total: row[11],
      action: "Invoice created",
    });

    return NextResponse.json({
      success: true,
      source: "Google Sheets: Invoices",
      sourceStatus: "live",
      invoice: {
        id,
        invoiceNumber: row[1],
        invoiceDate: row[2],
        dueDate: row[3],
        customerName: row[4],
        subtotal: row[9],
        tax: row[10],
        total: row[11],
        paymentStatus: row[12],
        proofUrl: row[13],
      },
    }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource("Google Sheets: Invoices", error),
        error: "Google Workspace OAuth expired — cannot save invoice",
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to create invoice", details: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id query param required" }, { status: 400 });
    }

    // Find row
    const rows = await readRange(RANGE);
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ error: "No invoices found" }, { status: 404 });
    }
    let rowIdx = -1;
    for (let i = 1; i < rows.length; i++) {
      if ((rows[i][0] || "") === id) { rowIdx = i; break; }
    }
    if (rowIdx === -1) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const invoiceNumber = rows[rowIdx][1] || "unknown";
    const customerName = rows[rowIdx][4] || "TBA";
    const total = parseAmount(rows[rowIdx][11]);

    await deleteRow(SHEET, rowIdx + 1); // 1-indexed

    await appendAudit({
      id,
      invoiceNumber,
      customerName,
      total,
      action: "Invoice deleted",
    });

    return NextResponse.json({
      success: true,
      source: "Google Sheets: Invoices",
      sourceStatus: "live",
      deleted: { id, invoiceNumber },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource("Google Sheets: Invoices", error),
        error: "Google Workspace OAuth expired — cannot delete invoice",
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to delete invoice", details: String(error) }, { status: 500 });
  }
}
