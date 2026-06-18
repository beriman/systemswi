// Invoice Generation — reads POs + supplier/customer data from Google Sheets
// Generates invoice drafts, sends via Telegram for human approval
// Compliance: Agent drafts only — human must approve before sending to vendor/customer

import { readRange } from "@/lib/sheets/sheets-real";

// ── Types ──────────────────────────────────────────────────────────

export type InvoiceType = "vendor" | "customer";
export type InvoiceStatus = "draft" | "pending_approval" | "approved" | "sent" | "rejected";

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface InvoiceDraft {
  id: string;
  type: InvoiceType;
  date: string;
  dueDate: string;
  invoiceNumber: string;
  // Party (vendor or customer)
  partyId: string;
  partyName: string;
  partyAddress: string;
  partyContact: string;
  partyEmail: string;
  // Source PO reference
  poId: string;
  poDate: string;
  // Items
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number; // PPN 11% default
  taxAmount: number;
  grandTotal: number;
  // Status
  status: InvoiceStatus;
  notes: string;
  // SWI company info
  swiCompanyName: string;
  swiCompanyAddress: string;
  swiCompanyPhone: string;
  swiCompanyEmail: string;
  swiNpwp: string;
}

export interface InvoiceGenerationResult {
  invoices: InvoiceDraft[];
  summary: {
    totalDrafted: number;
    vendorInvoices: number;
    customerInvoices: number;
    totalValue: number;
    pendingApproval: number;
  };
}

// ── SWI Company Info (PT Sensasi Wangi Indonesia) ─────────────────

const SWI_COMPANY = {
  name: "PT Sensasi Wangi Indonesia",
  address: "Jl. Kemang Raya No. 15, Jakarta Selatan 12730, Indonesia",
  phone: "+62 21 719 8888",
  email: "finance@systemswi.com",
  npwp: "01.234.567.8-091.000",
};

// ── Helpers ────────────────────────────────────────────────────────

const text = (value: unknown) => String(value ?? "").trim();
const num = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

function generateInvoiceNumber(type: InvoiceType, date: string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const prefix = type === "vendor" ? "VCI" : "CSI"; // Vendor Invoice / Customer Invoice
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${year}${month}-${rand}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── Sheet Parsers ──────────────────────────────────────────────────

function parsePurchaseOrders(rows: string[][]) {
  return rows
    .slice(1)
    .filter((row) => row.some(Boolean))
    .map((row) => ({
      id: text(row[0]),
      date: text(row[1]),
      supplierId: text(row[2]),
      supplierName: text(row[3]),
      itemId: text(row[4]),
      itemName: text(row[5]),
      quantity: num(row[6]),
      unit: text(row[7]) || "unit",
      unitCost: num(row[8]),
      total: num(row[9]),
      status: text(row[10]) as string,
      expectedDate: text(row[11]),
      proofUrl: text(row[12]),
      notes: text(row[13]),
    }))
    .filter((po) => po.id);
}

function parseSuppliers(rows: string[][]) {
  return rows
    .slice(1)
    .filter((row) => row.some(Boolean))
    .map((row) => ({
      id: text(row[0]),
      name: text(row[1]),
      category: text(row[2]),
      contact: text(row[3]),
      channel: text(row[4]),
      leadTimeDays: num(row[5]),
      rating: num(row[6]),
      status: text(row[7]),
      lastPo: text(row[8]),
      notes: text(row[9]),
    }))
    .filter((s) => s.id && s.name);
}

function parseCustomers(rows: string[][]) {
  return rows
    .slice(1)
    .filter((row) => row.some(Boolean))
    .map((row) => ({
      id: text(row[0]),
      name: text(row[1]),
      company: text(row[2]),
      email: text(row[3]),
      phone: text(row[4]),
      address: text(row[5]),
      segment: text(row[6]),
      consent: text(row[7]),
      clv: num(row[8]),
      lastContact: text(row[9]),
      notes: text(row[10]),
      created: text(row[11]),
    }))
    .filter((c) => c.id && c.name);
}

// ── Core: Generate Invoices from POs ──────────────────────────────

/**
 * Generate vendor invoices from received Purchase Orders.
 * Vendor invoice = bill from supplier → SWI pays supplier.
 * We create an invoice draft for POs with status "received" that
 * haven't been invoiced yet.
 */
function generateVendorInvoices(
  pos: ReturnType<typeof parsePurchaseOrders>,
  suppliers: ReturnType<typeof parseSuppliers>
): InvoiceDraft[] {
  // Only generate invoices for received/partial POs
  const eligiblePos = pos.filter((po) => ["received", "partial"].includes(po.status));

  // Group POs by supplier
  const bySupplier = new Map<string, typeof eligiblePos>();
  for (const po of eligiblePos) {
    const existing = bySupplier.get(po.supplierId) || [];
    existing.push(po);
    bySupplier.set(po.supplierId, existing);
  }

  const invoices: InvoiceDraft[] = [];

  bySupplier.forEach((supplierPos, supplierId) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!supplier) return;

    // Group by date (one invoice per supplier per day)
    const byDate: Record<string, typeof supplierPos> = {};
    for (const po of supplierPos) {
      if (!byDate[po.date]) byDate[po.date] = [];
      byDate[po.date].push(po);
    }

    for (const date of Object.keys(byDate)) {
      const datePos = byDate[date];
      const invoiceNumber = generateInvoiceNumber("vendor", date);
      const items: InvoiceItem[] = datePos.map((po) => ({
        description: po.itemName,
        quantity: po.quantity,
        unit: po.unit,
        unitPrice: po.unitCost,
        total: po.total,
      }));

      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const taxRate = 0.11; // PPN 11%
      const taxAmount = Math.round(subtotal * taxRate);
      const grandTotal = subtotal + taxAmount;

      const poIds = datePos.map((po) => po.id).join(", ");

      invoices.push({
        id: `inv-vendor-${invoiceNumber}`,
        type: "vendor",
        date,
        dueDate: addDays(date, 30), // Net 30 default
        invoiceNumber,
        partyId: supplier.id,
        partyName: supplier.name,
        partyAddress: supplier.notes || "Alamat supplier — lihat Supplier_Master",
        partyContact: supplier.contact,
        partyEmail: supplier.channel || "",
        poId: poIds,
        poDate: date,
        items,
        subtotal,
        taxRate,
        taxAmount,
        grandTotal,
        status: "draft",
        notes: `Auto-generated from PO: ${poIds}`,
        swiCompanyName: SWI_COMPANY.name,
        swiCompanyAddress: SWI_COMPANY.address,
        swiCompanyPhone: SWI_COMPANY.phone,
        swiCompanyEmail: SWI_COMPANY.email,
        swiNpwp: SWI_COMPANY.npwp,
      });
    }
  });

  return invoices;
}

/**
 * Generate customer invoices from billing data (Event tenants/sponsors).
 * Customer invoice = SWI bills customer for booth/sponsorship.
 */
function generateCustomerInvoices(
  customers: ReturnType<typeof parseCustomers>
): InvoiceDraft[] {
  // For now, generate placeholder customer invoices from customers
  // who have no recent invoices (based on billing route logic)
  // In Phase 2, this will be driven by Event_Tenants + Event_Sponsors sheets
  const invoices: InvoiceDraft[] = [];

  // Find customers with "prospect" or "follow-up" status that need invoicing
  const needsInvoice = customers.filter(
    (c) => c.segment && ["prospect", "follow-up", "invoice-sent"].includes(c.segment.toLowerCase())
  );

  for (const customer of needsInvoice.slice(0, 10)) {
    const date = new Date().toISOString().slice(0, 10);
    const invoiceNumber = generateInvoiceNumber("customer", date);

    // Default booth fee — in Phase 2 this comes from Event_Tenants
    const boothFee = 5_000_000; // Rp 5jt default
    const taxRate = 0.11;
    const taxAmount = Math.round(boothFee * taxRate);
    const grandTotal = boothFee + taxAmount;

    invoices.push({
      id: `inv-customer-${invoiceNumber}`,
      type: "customer",
      date,
      dueDate: addDays(date, 14), // Net 14 for customers
      invoiceNumber,
      partyId: customer.id,
      partyName: customer.name,
      partyAddress: customer.address || "Alamat customer — lihat Customer_Master",
      partyContact: customer.phone,
      partyEmail: customer.email,
      poId: "N/A", // Customer invoices don't have PO reference
      poDate: date,
      items: [
        {
          description: `Booth Fee — ${customer.company || customer.name}`,
          quantity: 1,
          unit: "lot",
          unitPrice: boothFee,
          total: boothFee,
        },
      ],
      subtotal: boothFee,
      taxRate,
      taxAmount,
      grandTotal,
      status: "draft",
      notes: `Auto-generated for customer: ${customer.name} (${customer.segment})`,
      swiCompanyName: SWI_COMPANY.name,
      swiCompanyAddress: SWI_COMPANY.address,
      swiCompanyPhone: SWI_COMPANY.phone,
      swiCompanyEmail: SWI_COMPANY.email,
      swiNpwp: SWI_COMPANY.npwp,
    });
  }

  return invoices;
}

// ── Main Export ────────────────────────────────────────────────────

export async function generateInvoices(): Promise<InvoiceGenerationResult> {
  const [poRows, supplierRows, customerRows] = await Promise.all([
    readRange("Purchase_Orders!A1:N1000"),
    readRange("Supplier_Master!A1:J1000"),
    readRange("Customer_Master!A1:M1000"),
  ]);

  const pos = parsePurchaseOrders(poRows);
  const suppliers = parseSuppliers(supplierRows);
  const customers = parseCustomers(customerRows);

  const vendorInvoices = generateVendorInvoices(pos, suppliers);
  const customerInvoices = generateCustomerInvoices(customers);

  const allInvoices = [...vendorInvoices, ...customerInvoices];

  const totalValue = allInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

  return {
    invoices: allInvoices,
    summary: {
      totalDrafted: allInvoices.length,
      vendorInvoices: vendorInvoices.length,
      customerInvoices: customerInvoices.length,
      totalValue,
      pendingApproval: allInvoices.filter((i) => i.status === "draft").length,
    },
  };
}

// ── Format for Telegram ────────────────────────────────────────────

export function formatInvoiceForTelegram(inv: InvoiceDraft): string {
  const typeEmoji = inv.type === "vendor" ? "📥" : "📤";
  const typeLabel = inv.type === "vendor" ? "VENDOR INVOICE" : "CUSTOMER INVOICE";

  const itemsText = inv.items
    .map(
      (item, i) =>
        `  ${i + 1}. ${item.description}\n     ${item.quantity} ${item.unit} × Rp ${item.unitPrice.toLocaleString("id-ID")} = Rp ${item.total.toLocaleString("id-ID")}`
    )
    .join("\n");

  return `${typeEmoji} <b>${typeLabel}</b>
📋 <b>No:</b> ${inv.invoiceNumber}
📅 <b>Tanggal:</b> ${inv.date}
⏰ <b>Jatuh Tempo:</b> ${inv.dueDate}

🏢 <b>Dari:</b>
${inv.swiCompanyName}
${inv.swiCompanyAddress}
📞 ${inv.swiCompanyPhone}
📧 ${inv.swiCompanyEmail}
🆔 NPWP: ${inv.swiNpwp}

👤 <b> Kepada:</b>
${inv.partyName}
${inv.partyAddress}
📞 ${inv.partyContact}
📧 ${inv.partyEmail}

📦 <b>Item:</b>
${itemsText}

💰 <b>Subtotal:</b> Rp ${inv.subtotal.toLocaleString("id-ID")}
🧾 <b>PPN (${(inv.taxRate * 100).toFixed(0)}%):</b> Rp ${inv.taxAmount.toLocaleString("id-ID")}
💳 <b>TOTAL:</b> Rp ${inv.grandTotal.toLocaleString("id-ID")}

📎 <b>Ref PO:</b> ${inv.poId}
📝 <b>Catatan:</b> ${inv.notes}
📊 <b>Status:</b> ${inv.status.toUpperCase()}`;
}

// ── Format summary for Telegram ────────────────────────────────────

export function formatInvoiceSummaryForTelegram(result: InvoiceGenerationResult): string {
  const { summary } = result;

  const topInvoices = result.invoices
    .sort((a, b) => b.grandTotal - a.grandTotal)
    .slice(0, 5)
    .map((inv) => {
      const emoji = inv.type === "vendor" ? "📥" : "📤";
      return `${emoji} <b>${inv.invoiceNumber}</b> — ${inv.partyName}\n   💰 Rp ${inv.grandTotal.toLocaleString("id-ID")}`;
    })
    .join("\n\n");

  return `🧾 <b>Invoice Generation Report</b>
📅 ${new Date().toLocaleString("id-ID")}

📊 <b>Summary:</b>
• Total Drafted: ${summary.totalDrafted}
• Vendor Invoices: ${summary.vendorInvoices}
• Customer Invoices: ${summary.customerInvoices}
• Total Value: Rp ${summary.totalValue.toLocaleString("id-ID")}
• Pending Approval: ${summary.pendingApproval}

🏆 <b>Top 5 by Value:</b>
${topInvoices}

⚠️ Semua invoice menunggu approval via Telegram sebelum dikirim.
✅ Approve = Invoice siap kirim
❌ Reject = Draft dibatalkan`;
}
