// Procurement Auto — Phase 2.1
// Stock alert → Draft PO → Approve → Send to supplier → Track delivery → QC → Update inventory
//
// Compliance: Agent drafts PO only — human must approve before sending to supplier.
// This module is READ-ANALYZE-DRAFT (no direct PO writes without approval).

import { readRange } from "@/lib/sheets/sheets-real";

// eslint-disable-next-line @typescript-eslint/no-explicit-any

// ── Types ──────────────────────────────────────────────────────────

export interface LowStockItem {
  id: string;
  name: string;
  qty: number;
  min: number;
  reorder: number;
  unit: string;
  status: "empty" | "critical" | "low";
  preferredSupplier?: string;
  lastPurchasePrice?: number;
}

export interface SupplierInfo {
  id: string;
  name: string;
  contact: string;
  email: string;
  whatsapp: string;
  address: string;
  leadTimeDays: number;
  paymentTerms: string;
  rating: number;
  itemSupplied: string[];
}

export interface PODraft {
  id: string;
  date: string;
  supplier: SupplierInfo;
  items: POItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  status: "draft" | "pending_approval" | "approved" | "sent" | "received" | "qc_passed" | "qc_failed";
  deliveryDate: string;
  notes: string;
  approvalId?: string;
}

export interface POItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  total: number;
}

export interface ProcurementReport {
  timestamp: string;
  lowStockItems: LowStockItem[];
  poDrafts: PODraft[];
  totalDrafts: number;
  totalValue: number;
  needsApproval: number;
  suppliersContacted: string[];
}

// ── Helpers ────────────────────────────────────────────────────────

const text = (v: unknown) => String(v ?? "").trim();
const num = (v: unknown) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v !== "string") return 0;
  const p = Number(v.replace(/[^\d.-]/g, ""));
  return Number.isFinite(p) ? p : 0;
};

function stockStatus(qty: number, min: number): "ok" | "low" | "critical" | "empty" {
  if (qty <= 0) return "empty";
  if (qty <= min * 0.5) return "critical";
  if (qty <= min) return "low";
  return "ok";
}

// ── Read Inventory ─────────────────────────────────────────────────

export async function getLowStockItems(): Promise<LowStockItem[]> {
  const rows = await readRange("Inventory_Master!A1:O1000");
  const items: LowStockItem[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row.some((c) => c && c.trim())) continue;

    const itemId = text(row[0]) || text(row[1]);
    const name = text(row[2]);
    if (!itemId || !name) continue;

    const qty = num(row[5]);
    const min = num(row[6]);
    const reorder = num(row[7]) || Math.max(min * 2, 10);
    const unit = text(row[4]) || "unit";
    const status = stockStatus(qty, min);

    if (status === "ok") continue;

    // Column 8-9 may contain preferred supplier and last price (depends on sheet layout)
    const preferredSupplier = text(row[8]) || undefined;
    const lastPurchasePrice = num(row[9]) || undefined;

    items.push({
      id: itemId,
      name,
      qty,
      min,
      reorder,
      unit,
      status,
      preferredSupplier,
      lastPurchasePrice,
    });
  }

  return items;
}

// ── Read Suppliers ─────────────────────────────────────────────────

export async function getSuppliers(): Promise<SupplierInfo[]> {
  const rows = await readRange("Supplier_Master!A1:J1000");
  const suppliers: SupplierInfo[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row.some((c) => c && c.trim())) continue;

    const id = text(row[0]);
    const name = text(row[1]);
    if (!id || !name) continue;

    suppliers.push({
      id,
      name,
      contact: text(row[2]),
      email: text(row[3]),
      whatsapp: text(row[4]),
      address: text(row[5]),
      leadTimeDays: num(row[6]) || 7,
      paymentTerms: text(row[7]) || "30 days",
      rating: num(row[8]) || 3,
      itemSupplied: text(row[9]).split(",").map((s) => s.trim()).filter(Boolean),
    });
  }

  return suppliers;
}

// ── Match supplier to item ─────────────────────────────────────────

function findSupplierForItem(
  item: LowStockItem,
  suppliers: SupplierInfo[]
): SupplierInfo | undefined {
  // 1. Try preferred supplier from inventory
  if (item.preferredSupplier) {
    const found = suppliers.find(
      (s) =>
        s.name.toLowerCase().includes(item.preferredSupplier!.toLowerCase()) ||
        s.id === item.preferredSupplier
    );
    if (found) return found;
  }

  // 2. Try matching by item name in supplier's supplied items
  const nameMatch = suppliers.find((s) =>
    s.itemSupplied.some((si) => item.name.toLowerCase().includes(si.toLowerCase()))
  );
  if (nameMatch) return nameMatch;

  // 3. Return first supplier as fallback (general supplier)
  return suppliers[0];
}

// ── Draft POs from low stock ───────────────────────────────────────

export async function draftProcurementPOs(): Promise<ProcurementReport> {
  const [lowStockItems, suppliers] = await Promise.all([
    getLowStockItems(),
    getSuppliers(),
  ]);

  const timestamp = new Date().toISOString();
  const poDrafts: PODraft[] = [];
  const suppliersContacted = new Set<string>();

  // Group items by supplier
  const itemsBySupplier = new Map<string, { item: LowStockItem; supplier: SupplierInfo }[]>();

  for (const item of lowStockItems) {
    const supplier = findSupplierForItem(item, suppliers);
    if (!supplier) continue;

    const key = supplier.id;
    if (!itemsBySupplier.has(key)) itemsBySupplier.set(key, []);
    itemsBySupplier.get(key)!.push({ item, supplier });
  }

  // Create one PO draft per supplier
  let poCounter = 1;
  const supplierGroups = Array.from(itemsBySupplier.values());
  for (const group of supplierGroups) {
    const supplier = group[0].supplier;
    const date = new Date().toISOString().split("T")[0];
    const deliveryDate = new Date(Date.now() + supplier.leadTimeDays * 86400000)
      .toISOString()
      .split("T")[0];

    const items: POItem[] = group.map(({ item }) => {
      const estimatedPrice = item.lastPurchasePrice || 0;
      const qty = item.reorder;
      return {
        itemId: item.id,
        itemName: item.name,
        quantity: qty,
        unit: item.unit,
        estimatedUnitPrice: estimatedPrice,
        total: qty * estimatedPrice,
      };
    });

    const subtotal = items.reduce((sum, it) => sum + it.total, 0);
    const taxRate = 0.11; // PPN 11%
    const taxAmount = subtotal * taxRate;
    const grandTotal = subtotal + taxAmount;

    const po: PODraft = {
      id: `PO-DRAFT-${date}-${String(poCounter++).padStart(3, "0")}`,
      date,
      supplier,
      items,
      subtotal,
      taxRate,
      taxAmount,
      grandTotal,
      status: "draft",
      deliveryDate,
      notes: `Auto-drafted by HemuHemu/OWL for ${items.length} low-stock items. Supplier lead time: ${supplier.leadTimeDays} days.`,
    };

    poDrafts.push(po);
    suppliersContacted.add(supplier.name);
  }

  return {
    timestamp,
    lowStockItems,
    poDrafts,
    totalDrafts: poDrafts.length,
    totalValue: poDrafts.reduce((sum, po) => sum + po.grandTotal, 0),
    needsApproval: poDrafts.length,
    suppliersContacted: Array.from(suppliersContacted),
  };
}

// ── Format for Telegram ────────────────────────────────────────────

export function formatProcurementForTelegram(report: ProcurementReport): string {
  if (report.totalDrafts === 0) {
    return `✅ <b>Procurement Check</b>\n📅 ${new Date(report.timestamp).toLocaleString("id-ID")}\n\nSemua stok aman. Tidak ada PO yang perlu dibuat.`;
  }

  let text = `📦 <b>PROCUREMENT AUTO — Draft PO</b>\n📅 ${new Date(report.timestamp).toLocaleString("id-ID")}\n\n`;
  text += `⚠️ <b>${report.lowStockItems.length} item stok rendah</b>\n`;
  text += `📋 <b>${report.totalDrafts} draft PO</b> perlu approval\n`;
  text += `💰 Total nilai: <b>Rp ${report.totalValue.toLocaleString("id-ID")}</b>\n\n`;

  for (const po of report.poDrafts.slice(0, 5)) {
    text += `📄 <b>${po.id}</b>\n`;
    text += `   Supplier: ${po.supplier.name}\n`;
    text += `   Items: ${po.items.length} item\n`;
    text += `   Total: Rp ${po.grandTotal.toLocaleString("id-ID")}\n`;
    text += `   Est. Delivery: ${po.deliveryDate}\n\n`;
  }

  if (report.poDrafts.length > 5) {
    text += `...dan ${report.poDrafts.length - 5} PO lainnya\n\n`;
  }

  text += `⚠️ <i>Agent hanya draft — manusia harus approve sebelum kirim ke supplier</i>`;
  return text;
}
