import { NextRequest, NextResponse } from "next/server";
import { generateDocumentContent, getTemplateByType, getAllTemplates } from "@/lib/document";
import type { DocumentType } from "@/lib/document";
import { readRange } from "@/lib/sheets/sheets-real";
import { EVENT_SHEETS, readEventSheet } from "@/lib/event/sheets";

export const runtime = "nodejs";

type SheetContext = {
  financeRows: number;
  tenantRows: number;
  sponsorRows: number;
  inventoryRows: number;
  notes: string[];
};

const text = (value: unknown) => String(value ?? "").trim();
const amount = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

function isDocumentType(value: string): value is DocumentType {
  return Boolean(getTemplateByType(value as DocumentType));
}

function validateRequired(type: DocumentType, data: Record<string, string>) {
  const template = getTemplateByType(type);
  if (!template) return ["Template not found"];
  return template.fields
    .filter((field) => field.required && !text(data[field.id]))
    .map((field) => `${field.label} wajib diisi`);
}

async function readContext(): Promise<SheetContext> {
  const [finance, tenants, sponsors, inventory] = await Promise.all([
    readRange("Laporan_Bulanan!A1:P16").catch(() => []),
    readEventSheet(EVENT_SHEETS.Tenants).catch(() => []),
    readEventSheet(EVENT_SHEETS.Sponsors).catch(() => []),
    readRange("Inventory_Master!A1:O1000").catch(() => []),
  ]);

  const unpaidTenants = tenants.slice(1).filter((row) => {
    const fee = amount(row[9]);
    const paid = amount(row[11]);
    return text(row[10]) !== "paid" && Math.max(fee - paid, 0) > 0;
  }).length;

  const followUpSponsors = sponsors.slice(1).filter((row) => {
    const status = text(row[11]) || "prospect";
    return !["paid", "cancelled"].includes(status) && amount(row[7]) > 0;
  }).length;

  const lowStock = inventory.slice(1).filter((row) => {
    const qty = amount(row[5]);
    const min = amount(row[6]);
    return text(row[0]) && min > 0 && qty <= min;
  }).length;

  return {
    financeRows: Math.max(finance.length - 1, 0),
    tenantRows: Math.max(tenants.length - 1, 0),
    sponsorRows: Math.max(sponsors.length - 1, 0),
    inventoryRows: Math.max(inventory.length - 1, 0),
    notes: [
      `Finance source: Laporan_Bulanan (${Math.max(finance.length - 1, 0)} data rows).`,
      `Commercial source: Event_Tenants ${Math.max(tenants.length - 1, 0)} rows; ${unpaidTenants} tenant belum lunas.`,
      `Sponsor source: Event_Sponsors ${Math.max(sponsors.length - 1, 0)} rows; ${followUpSponsors} sponsor perlu follow-up.`,
      `Inventory source: Inventory_Master ${Math.max(inventory.length - 1, 0)} rows; ${lowStock} item low/critical.`,
    ],
  };
}

function appendContext(content: string, context: SheetContext) {
  return `${content.trim()}\n\n---\n\n## SYSTEMSWI DATA CONTEXT\n${context.notes.map((note) => `- ${note}`).join("\n")}\n\nSumber angka tetap Google Sheets; angka TBA/0 harus diverifikasi PIC sebelum dokumen dikirim eksternal.\n`;
}

export async function GET() {
  return NextResponse.json({
    source: "systemswi document generator",
    generatedAt: new Date().toISOString(),
    templates: getAllTemplates(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawType = text(body.type);
    const data = (body.data || {}) as Record<string, string>;

    if (!rawType || !isDocumentType(rawType)) {
      return NextResponse.json({ error: "type tidak valid", supportedTypes: getAllTemplates().map((t) => t.type) }, { status: 400 });
    }

    const missing = validateRequired(rawType, data);
    if (missing.length) {
      return NextResponse.json({ error: "Data belum lengkap", missing }, { status: 400 });
    }

    const context = await readContext();
    const content = appendContext(generateDocumentContent(rawType, data, text(body.letterNumber)), context);
    const template = getTemplateByType(rawType);

    return NextResponse.json({
      success: true,
      source: "Google Sheets context + systemswi template",
      generatedAt: new Date().toISOString(),
      document: {
        id: `doc-${Date.now()}`,
        type: rawType,
        title: template?.name || rawType,
        content,
        letterNumber: text(body.letterNumber),
        createdAt: new Date().toISOString(),
        createdBy: "systemswi",
      },
      context,
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal generate dokumen", details: String(error) }, { status: 500 });
  }
}
