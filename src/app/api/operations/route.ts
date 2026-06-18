import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readRanges, appendRows, readRange } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

type WorkflowStep = {
  id: string;
  label: string;
  description: string;
  status: "ready" | "attention" | "blocked" | "draft";
  source: string;
  metric: string;
  metricValue: number | string;
  nextAction: string;
  href: string;
};

type CadenceItem = {
  id: string;
  agenda: string;
  owner: string;
  cadence: string;
  prepSource: string;
  output: string;
  href: string;
};

type DivisionKpi = {
  id: string;
  division: string;
  owner: string;
  health: "ready" | "attention" | "blocked" | "draft";
  primaryMetric: string;
  primaryValue: number | string;
  secondaryMetric: string;
  secondaryValue: number | string;
  source: string;
  nextAction: string;
  href: string;
};

type WorkflowAction = {
  id: string;
  timestamp: string;
  stepId: string;
  stepLabel: string;
  action: string;
  reference: string;
  status: "executed" | "failed" | "skipped";
  detail: string;
};

const SOURCE = "Google Sheets: Cash_Harian, Event_Tenants, Event_Sponsors, Event_Budget, Inventory_Master, Inventory_Movements, Purchase_Orders, Goods_Receipts, Brand_Production, Brand_Sales, Compliance_Checks, Product_Batches, QC_Checklist, Shared_Resources";

const WORKFLOW_ACTION_LOG_SHEET = "Workflow_Actions";

const ranges = [
  "Cash_Harian!A1:I1000",
  "Event_Tenants!A1:O1000",
  "Event_Sponsors!A1:O1000",
  "Event_Budget!A1:L1000",
  "Inventory_Master!A1:O1000",
  "Inventory_Movements!A1:J1000",
  "Purchase_Orders!A1:N1000",
  "Goods_Receipts!A1:M1000",
  "Brand_Production!A1:T1000",
  "Brand_Sales!A1:N1000",
  "Compliance_Checks!A1:L1000",
  "Product_Batches!A1:M1000",
  "QC_Checklist!A1:I1000",
  "Shared_Resources!A1:J1000",
];

const weeklyCadence: CadenceItem[] = [
  {
    id: "finance-event-commercial",
    agenda: "Finance + Event Commercial Pipeline",
    owner: "Finance + Event PIC",
    cadence: "Senin 09.00 — review cash position, tenant/sponsor invoice, outstanding payment, dan budget event.",
    prepSource: "Rekening_Koran, Cash_Harian, Event_Tenants, Event_Sponsors, Event_Budget, Alerts",
    output: "Daftar invoice/follow-up sponsor/tenant dan keputusan budget minggu berjalan.",
    href: "/reports",
  },
  {
    id: "ops-inventory-procurement",
    agenda: "Operations + Inventory + Procurement",
    owner: "COO / Ops Lead",
    cadence: "Selasa 10.00 — review low stock, open PO, receiving/QC, dan reorder plan.",
    prepSource: "Inventory_Master, Purchase_Orders, Goods_Receipts, QC_Checklist",
    output: "Prioritas PO/receiving/QC dan PIC proof URL untuk setiap movement.",
    href: "/operations",
  },
  {
    id: "production-compliance-crm",
    agenda: "Production + Compliance + CRM",
    owner: "Production + Compliance + Store/CRM",
    cadence: "Rabu 15.00 — review batch produksi, compliance/QC release, sales rows, consent, dan follow-up customer.",
    prepSource: "Brand_Production, Product_Batches, Compliance_Checks, Brand_Sales, Customer_Interactions",
    output: "Batch yang boleh lanjut jual, batch perlu review, dan daftar follow-up manual consent-safe.",
    href: "/compliance",
  },
];

function text(value: unknown) {
  return String(value ?? "").trim();
}

function num(value: unknown) {
  if (typeof value === "number") return value;
  return Number(text(value).replace(/[^\d.-]/g, "")) || 0;
}

function rowsOnly(rows: string[][] = []) {
  return rows.slice(1).filter((row) => row.some((cell) => text(cell)));
}

function statusFromInventory(qty: number, minimum: number) {
  if (qty <= 0) return "blocked";
  if (minimum > 0 && qty <= minimum) return "attention";
  return "ready";
}

function latestRows(rows: string[][], limit = 5) {
  return rowsOnly(rows)
    .slice(-limit)
    .reverse()
    .map((row) => row.map(text));
}

function paymentOutstanding(row: string[]) {
  const joined = row.map(text).join(" ").toLowerCase();
  const amount = row.reduce((max, cell) => Math.max(max, num(cell)), 0);
  const paidLike = joined.includes("paid") || joined.includes("lunas") || joined.includes("settled");
  return paidLike ? 0 : amount;
}

function buildDivisionKpis(data: Record<string, string[][]>): DivisionKpi[] {
  const cash = rowsOnly(data["Cash_Harian!A1:I1000"]);
  const tenants = rowsOnly(data["Event_Tenants!A1:O1000"]);
  const sponsors = rowsOnly(data["Event_Sponsors!A1:O1000"]);
  const budget = rowsOnly(data["Event_Budget!A1:L1000"]);
  const inventory = rowsOnly(data["Inventory_Master!A1:O1000"]);
  const purchaseOrders = rowsOnly(data["Purchase_Orders!A1:N1000"]);
  const receipts = rowsOnly(data["Goods_Receipts!A1:M1000"]);
  const production = rowsOnly(data["Brand_Production!A1:T1000"]);
  const sales = rowsOnly(data["Brand_Sales!A1:N1000"]);
  const customers = rowsOnly(data["Customer_Master!A1:M1000"] || []);
  const compliance = rowsOnly(data["Compliance_Checks!A1:L1000"]);
  const batches = rowsOnly(data["Product_Batches!A1:M1000"]);
  const qc = rowsOnly(data["QC_Checklist!A1:I1000"]);

  const cashIn = cash.reduce((sum, row) => sum + num(row[4]), 0);
  const cashOut = cash.reduce((sum, row) => sum + num(row[5]), 0);
  const tenantOutstanding = tenants.reduce((sum, row) => sum + paymentOutstanding(row), 0);
  const sponsorOutstanding = sponsors.reduce((sum, row) => sum + paymentOutstanding(row), 0);
  const overBudget = budget.filter((row) => {
    const planned = Math.max(num(row[3]), num(row[4]), num(row[5]));
    const actual = Math.max(num(row[6]), num(row[7]), num(row[8]));
    return planned > 0 && actual > planned;
  }).length;
  const stockAlerts = inventory.filter((row) => statusFromInventory(num(row[5]), num(row[6])) !== "ready").length;
  const openPo = purchaseOrders.filter((row) => {
    const status = `${text(row[8])} ${text(row[10])} ${text(row[11])}`.toLowerCase();
    return !status.includes("complete") && !status.includes("closed") && !status.includes("selesai");
  }).length;
  const qcPending = receipts.filter((row) => {
    const status = `${text(row[7])} ${text(row[8])}`.toLowerCase();
    return status.includes("pending") || status.includes("failed") || status.includes("review") || !status;
  }).length + qc.filter((row) => {
    const result = text(row[5]).toLowerCase();
    return result.includes("failed") || result.includes("review") || result.includes("pending") || !result;
  }).length;
  const complianceReview = compliance.filter((row) => {
    const status = text(row[5]).toLowerCase();
    return status.includes("review") || status.includes("draft") || status.includes("failed") || status.includes("tba");
  }).length + batches.filter((row) => {
    const status = `${text(row[7])} ${text(row[8])}`.toLowerCase();
    return status.includes("pending") || status.includes("review") || status.includes("draft") || status.includes("incomplete") || !status;
  }).length;

  return [
    { id: "finance", division: "Finance", owner: "Finance Lead", health: cash.length ? (cashIn - cashOut < 0 ? "attention" : "ready") : "draft", primaryMetric: "Net cash rows", primaryValue: cashIn - cashOut, secondaryMetric: "Cash rows", secondaryValue: cash.length, source: "Cash_Harian", nextAction: cash.length ? "Rekonsiliasi bank mingguan sebelum report eksternal." : "Input transaksi harian atau re-auth Google Workspace jika degraded.", href: "/finance" },
    { id: "events", division: "Event Commercial", owner: "Event PIC / Wapiq", health: tenantOutstanding + sponsorOutstanding > 0 || overBudget > 0 ? "attention" : tenants.length + sponsors.length > 0 ? "ready" : "draft", primaryMetric: "Outstanding pipeline", primaryValue: tenantOutstanding + sponsorOutstanding, secondaryMetric: "Over-budget rows", secondaryValue: overBudget, source: "Event_Tenants + Event_Sponsors + Event_Budget", nextAction: "Follow-up invoice/payment tenant-sponsor dan review budget event sebelum komit vendor.", href: "/events" },
    { id: "operations", division: "Inventory + Procurement", owner: "COO / Ops Lead", health: stockAlerts + openPo + qcPending > 0 ? "attention" : inventory.length ? "ready" : "draft", primaryMetric: "Stock/PO/QC issues", primaryValue: stockAlerts + openPo + qcPending, secondaryMetric: "Inventory SKUs", secondaryValue: inventory.length, source: "Inventory_Master + Purchase_Orders + Goods_Receipts", nextAction: "Prioritaskan low stock, PO terbuka, dan receiving QC sebelum produksi.", href: "/inventory" },
    { id: "production", division: "Production + Compliance", owner: "Production / Compliance PIC", health: complianceReview > 0 ? "attention" : production.length ? "ready" : "draft", primaryMetric: "Compliance/batch review", primaryValue: complianceReview, secondaryMetric: "Production rows", secondaryValue: production.length, source: "Brand_Production + Compliance_Checks + Product_Batches + QC_Checklist", nextAction: "Release batch hanya setelah QC/compliance dan traceability lengkap.", href: "/compliance" },
    { id: "crm", division: "Sales + CRM", owner: "Store/CRM PIC", health: sales.length > 0 ? (customers.length === 0 ? "attention" : "ready") : "draft", primaryMetric: "Sales / CRM rows", primaryValue: `${sales.length} / ${customers.length}`, secondaryMetric: "CRM source", secondaryValue: customers.length ? "Google Sheets" : "SQLite (Sheets unavailable)", source: "Brand_Sales + CRM (SQLite primary)", nextAction: customers.length === 0 ? "Customer_Master sheet tidak tersedia di Google Sheets. CRM menggunakan SQLite sebagai primary source." : "Sinkronkan pembeli ke CRM dengan consent jelas, lalu follow-up manual via WhatsApp preview.", href: "/customers" },
  ];
}

function buildWorkflow(data: Record<string, string[][]>) {
  const inventory = rowsOnly(data["Inventory_Master!A1:O1000"]);
  const movements = rowsOnly(data["Inventory_Movements!A1:J1000"]);
  const purchaseOrders = rowsOnly(data["Purchase_Orders!A1:N1000"]);
  const receipts = rowsOnly(data["Goods_Receipts!A1:M1000"]);
  const production = rowsOnly(data["Brand_Production!A1:T1000"]);
  const sales = rowsOnly(data["Brand_Sales!A1:N1000"]);
  const customers = rowsOnly(data["Customer_Master!A1:M1000"] || []);
  const compliance = rowsOnly(data["Compliance_Checks!A1:L1000"]);
  const batches = rowsOnly(data["Product_Batches!A1:M1000"]);
  const qc = rowsOnly(data["QC_Checklist!A1:I1000"]);

  const stockAlerts = inventory.filter((row) => statusFromInventory(num(row[5]), num(row[6])) !== "ready");
  const openPo = purchaseOrders.filter((row) => {
    const status = `${text(row[8])} ${text(row[10])} ${text(row[11])}`.toLowerCase();
    return !status.includes("complete") && !status.includes("closed") && !status.includes("selesai");
  });
  const qcPendingReceipts = receipts.filter((row) => {
    const status = `${text(row[7])} ${text(row[8])}`.toLowerCase();
    return status.includes("pending") || status.includes("failed") || status.includes("review") || !status;
  });
  const productionNeedsQc = production.filter((row) => {
    const status = `${text(row[14])} ${text(row[16])} ${text(row[17])}`.toLowerCase();
    return status.includes("pending") || status.includes("review") || status.includes("draft") || !status;
  });
  const complianceNeedsReview = compliance.filter((row) => {
    const status = text(row[5]).toLowerCase();
    return status.includes("review") || status.includes("draft") || status.includes("failed") || status.includes("tba");
  });
  const batchesNeedsTraceability = batches.filter((row) => {
    const status = `${text(row[7])} ${text(row[8])}`.toLowerCase();
    return status.includes("pending") || status.includes("review") || status.includes("draft") || status.includes("incomplete") || !status;
  });
  const qcIssues = qc.filter((row) => {
    const result = text(row[5]).toLowerCase();
    return result.includes("failed") || result.includes("review") || result.includes("pending") || !result;
  });
  const customersNoConsent = customers.filter((row) => {
    const consent = `${text(row[5])} ${text(row[10])}`.toLowerCase();
    return consent && !consent.includes("yes") && !consent.includes("ya") && !consent.includes("opt-in");
  });

  const steps: WorkflowStep[] = [
    {
      id: "po",
      label: "PO / Restock",
      description: "Supplier → purchase order → jadwal bayar/terima barang.",
      status: openPo.length > 0 ? "attention" : "ready",
      source: "Purchase_Orders",
      metric: "Open PO",
      metricValue: openPo.length,
      nextAction: openPo.length > 0 ? "Review PO terbuka dan follow-up supplier/payment." : "Buat PO baru hanya jika reorder plan membutuhkan stok.",
      href: "/procurement",
    },
    {
      id: "receive",
      label: "Receive + QC Barang",
      description: "Barang datang → receiving → QC intake → inventory sync.",
      status: qcPendingReceipts.length > 0 ? "attention" : "ready",
      source: "Goods_Receipts",
      metric: "QC receipt pending/review",
      metricValue: qcPendingReceipts.length,
      nextAction: qcPendingReceipts.length > 0 ? "Selesaikan QC receipt sebelum stok dipakai produksi." : "Siap menerima barang masuk berikutnya.",
      href: "/procurement",
    },
    {
      id: "inventory",
      label: "Inventory Ready",
      description: "Bahan baku/packaging/merch → minimum stock alert → movement proof.",
      status: stockAlerts.length > 0 ? "attention" : "ready",
      source: "Inventory_Master + Inventory_Movements",
      metric: "Low/critical/empty stock",
      metricValue: stockAlerts.length,
      nextAction: stockAlerts.length > 0 ? "Cek reorder plan dan buat PO untuk item kritis." : "Stock tidak menunjukkan alert kritis di data saat ini.",
      href: "/inventory",
    },
    {
      id: "produce",
      label: "Produksi + Batch",
      description: "Bahan → formula → batch → HPP → finished stock.",
      status: productionNeedsQc.length > 0 ? "attention" : production.length > 0 ? "ready" : "draft",
      source: "Brand_Production + Product_Batches",
      metric: "Batch perlu QC/review",
      metricValue: productionNeedsQc.length + batchesNeedsTraceability.length,
      nextAction: production.length > 0 ? "Lengkapi QC dan traceability batch sebelum selling." : "Catat batch produksi pertama via modul Produksi/Compliance.",
      href: "/production",
    },
    {
      id: "compliance",
      label: "Compliance / QC Final",
      description: "Formula check → allergen label draft → checklist QC → release decision.",
      status: complianceNeedsReview.length + qcIssues.length > 0 ? "attention" : "ready",
      source: "Compliance_Checks + QC_Checklist",
      metric: "Compliance/QC review",
      metricValue: complianceNeedsReview.length + qcIssues.length,
      nextAction: "Pastikan semua formula/batch berstatus reviewed sebelum dijual sebagai produk final.",
      href: "/compliance",
    },
    {
      id: "sell",
      label: "Jual + CRM",
      description: "Sale → customer profile → consent → follow-up WhatsApp manual.",
      status: sales.length > 0 ? (customersNoConsent.length > 0 ? "attention" : "ready") : "draft",
      source: "Brand_Sales + Customer_Master",
      metric: "Sales rows / CRM rows",
      metricValue: `${sales.length} / ${customers.length}`,
      nextAction: sales.length > customers.length ? "Sinkronkan pembeli ke CRM dengan consent jelas." : "Gunakan Customer/Automation untuk follow-up manual yang consent-safe.",
      href: "/customers",
    },
    {
      id: "report",
      label: "Report Executive",
      description: "Operasi → alerts → laporan mingguan/bulanan/investor.",
      status: "ready",
      source: "Alerts + Reports generator",
      metric: "Recent movements",
      metricValue: movements.length,
      nextAction: "Generate report setelah data transaksi, stok, produksi, dan CRM masuk.",
      href: "/reports",
    },
  ];

  const attention = steps.filter((step) => step.status === "attention").length;
  const blocked = steps.filter((step) => step.status === "blocked").length;
  const ready = steps.filter((step) => step.status === "ready").length;

  return {
    source: SOURCE,
    generatedAt: new Date().toISOString(),
    summary: {
      totalSteps: steps.length,
      ready,
      attention,
      blocked,
      draft: steps.filter((step) => step.status === "draft").length,
      stockAlerts: stockAlerts.length,
      openPo: openPo.length,
      qcPending: qcPendingReceipts.length + productionNeedsQc.length + qcIssues.length,
      productionRows: production.length,
      salesRows: sales.length,
      customerRows: customers.length,
    },
    steps,
    recentActivity: {
      inventoryMovements: latestRows(data["Inventory_Movements!A1:J1000"]),
      purchaseOrders: latestRows(data["Purchase_Orders!A1:N1000"]),
      production: latestRows(data["Brand_Production!A1:T1000"]),
      sales: latestRows(data["Brand_Sales!A1:N1000"]),
    },
    crossDivisionKpis: buildDivisionKpis(data),
    weeklyCadence,
    guardrails: [
      "Google Sheets tetap source of truth; halaman ini tidak mengarang angka jika OAuth degraded.",
      "Jangan release batch produk final sebelum Compliance/QC review selesai.",
      "WhatsApp follow-up tetap preview/manual dan consent-gated.",
      "Proof URL/reference harus dipakai untuk PO, receiving, movement, dan transaksi finance.",
    ],
    sharedResources: buildSharedResources(data),
  };
}

function buildSharedResources(data: Record<string, string[][]>) {
  const rows = rowsOnly(data["Shared_Resources!A1:J1000"]);
  return rows.map((row) => ({
    id: text(row[0]) || `sr-${Date.now().toString(36)}`,
    name: text(row[2]) || "TBA",
    category: (text(row[3]) || "marketing") as "marketing" | "admin" | "finance" | "tech" | "hr",
    description: text(row[4]) || "",
    owner: text(row[5]) || "",
    divisions: text(row[6]).split(",").map((d) => d.trim()).filter(Boolean),
    cost: num(row[7]),
    frequency: (text(row[8]) || "monthly") as "one-time" | "monthly" | "quarterly" | "annual",
    status: (text(row[9]) || "active") as "active" | "paused" | "review",
    url: text(row[10]) || "",
    notes: text(row[11]) || "",
  }));
}

// ── Execute workflow step: write to Google Sheets ──

type ExecuteRequestBody = {
  action: "execute_step";
  stepId: string;
  reference?: string;
  payload?: Record<string, unknown>;
};

async function logWorkflowAction(action: WorkflowAction): Promise<void> {
  try {
    await appendRows(WORKFLOW_ACTION_LOG_SHEET, [[
      action.timestamp,
      action.stepId,
      action.stepLabel,
      action.action,
      action.reference,
      action.status,
      action.detail,
    ]]);
  } catch {
    // Non-blocking: if log sheet doesn't exist or write fails, don't fail the main action
  }
}

async function executeStep(
  stepId: string,
  reference: string,
  payload: Record<string, unknown> | undefined,
  workflow: ReturnType<typeof buildWorkflow>,
): Promise<{ success: boolean; detail: string; sheetWrites: string[] }> {
  const timestamp = new Date().toISOString();
  const sheetWrites: string[] = [];
  const ref = reference || "TBA";

  switch (stepId) {
    case "po": {
      // Create a new PO draft row in Purchase_Orders
      const poNumber = `PO-${Date.now().toString(36).toUpperCase()}`;
      const supplier = text(payload?.supplier) || "TBA";
      const item = text(payload?.item) || "TBA";
      const qty = num(payload?.qty) || 0;
      const unitPrice = num(payload?.unitPrice) || 0;
      const total = qty * unitPrice;
      const dueDate = text(payload?.dueDate) || "";
      const notes = text(payload?.notes) || ref;

      await appendRows("Purchase_Orders", [[
        poNumber,
        timestamp.slice(0, 10),
        supplier,
        item,
        qty,
        unitPrice,
        total,
        "Draft",
        dueDate,
        "",
        "Open",
        "",
        notes,
        "",
        "",
      ]]);
      sheetWrites.push(`Purchase_Orders: appended ${poNumber}`);
      return { success: true, detail: `PO ${poNumber} berhasil dibuat. Total: Rp ${total.toLocaleString("id-ID")}. Status: Open.`, sheetWrites };
    }

    case "receive": {
      // Create a receiving row in Goods_Receipts
      const receiptNumber = `RCV-${Date.now().toString(36).toUpperCase()}`;
      const poRef = text(payload?.poNumber) || ref;
      const item = text(payload?.item) || "TBA";
      const qtyReceived = num(payload?.qtyReceived) || 0;
      const qcStatus = text(payload?.qcStatus) || "Pending";
      const qcNotes = text(payload?.qcNotes) || "";
      const warehouse = text(payload?.warehouse) || "TBA";

      await appendRows("Goods_Receipts", [[
        receiptNumber,
        timestamp.slice(0, 10),
        poRef,
        item,
        qtyReceived,
        warehouse,
        "",
        qcStatus,
        qcNotes,
        "",
        "",
        "",
        "",
      ]]);
      sheetWrites.push(`Goods_Receipts: appended ${receiptNumber}`);
      return { success: true, detail: `Receiving ${receiptNumber} tercatat. QC: ${qcStatus}. Item: ${item} (${qtyReceived}).`, sheetWrites };
    }

    case "inventory": {
      // Create an inventory movement row
      const movementId = `MOV-${Date.now().toString(36).toUpperCase()}`;
      const item = text(payload?.item) || "TBA";
      const movementType = text(payload?.movementType) || "Adjustment";
      const qty = num(payload?.qty) || 0;
      const warehouse = text(payload?.warehouse) || "TBA";
      const notes = text(payload?.notes) || ref;

      await appendRows("Inventory_Movements", [[
        movementId,
        timestamp.slice(0, 10),
        item,
        movementType,
        qty,
        warehouse,
        "",
        "",
        notes,
        "",
      ]]);
      sheetWrites.push(`Inventory_Movements: appended ${movementId}`);
      return { success: true, detail: `Movement ${movementId} tercatat. ${movementType}: ${item} (${qty}).`, sheetWrites };
    }

    case "produce": {
      // Create a production batch row
      const batchNumber = `BATCH-${Date.now().toString(36).toUpperCase()}`;
      const product = text(payload?.product) || "TBA";
      const brand = text(payload?.brand) || "TBA";
      const batchSize = num(payload?.batchSize) || 0;
      const formula = text(payload?.formula) || "TBA";
      const hpp = num(payload?.hpp) || 0;

      await appendRows("Brand_Production", [[
        batchNumber,
        timestamp.slice(0, 10),
        brand,
        product,
        formula,
        batchSize,
        hpp,
        batchSize > 0 && hpp > 0 ? (hpp / batchSize) : 0,
        "",
        "",
        "",
        "",
        "In Progress",
        "",
        "",
        "Pending",
        "",
        "",
        "",
        "",
      ]]);
      sheetWrites.push(`Brand_Production: appended ${batchNumber}`);

      // Also create a Product_Batches traceability row
      await appendRows("Product_Batches", [[
        batchNumber,
        product,
        brand,
        timestamp.slice(0, 10),
        batchSize,
        formula,
        "",
        "Pending",
        "Incomplete",
        "",
        "",
        "",
        "",
      ]]);
      sheetWrites.push(`Product_Batches: appended ${batchNumber}`);

      return { success: true, detail: `Batch ${batchNumber} tercatat. Produk: ${product} (${batchSize} unit). QC: Pending.`, sheetWrites };
    }

    case "compliance": {
      // Create a compliance check row
      const checkId = `COMP-${Date.now().toString(36).toUpperCase()}`;
      const product = text(payload?.product) || "TBA";
      const checkType = text(payload?.checkType) || "Formula Check";
      const result = text(payload?.result) || "Review";
      const notes = text(payload?.notes) || ref;

      await appendRows("Compliance_Checks", [[
        checkId,
        product,
        checkType,
        timestamp.slice(0, 10),
        "",
        result,
        notes,
        "",
        "",
        "",
        "",
        "",
      ]]);
      sheetWrites.push(`Compliance_Checks: appended ${checkId}`);

      // If QC checklist is provided, also add to QC_Checklist
      const qcResult = text(payload?.qcResult) || "";
      if (qcResult) {
        const qcId = `QC-${Date.now().toString(36).toUpperCase()}`;
        await appendRows("QC_Checklist", [[
          qcId,
          text(payload?.batchNumber) || "TBA",
          product,
          text(payload?.stage) || "Final",
          timestamp.slice(0, 10),
          qcResult,
          notes,
          "",
          "",
        ]]);
        sheetWrites.push(`QC_Checklist: appended ${qcId}`);
      }

      return { success: true, detail: `Compliance ${checkId} tercatat. Check: ${checkType}. Result: ${result}.`, sheetWrites };
    }

    case "sell": {
      // Create a sales row + customer interaction
      const saleId = `SALE-${Date.now().toString(36).toUpperCase()}`;
      const product = text(payload?.product) || "TBA";
      const brand = text(payload?.brand) || "TBA";
      const qty = num(payload?.qty) || 0;
      const unitPrice = num(payload?.unitPrice) || 0;
      const total = qty * unitPrice;
      const channel = text(payload?.channel) || "Store";

      await appendRows("Brand_Sales", [[
        saleId,
        timestamp.slice(0, 10),
        brand,
        product,
        qty,
        unitPrice,
        total,
        channel,
        "",
        "",
        "",
        "",
      ]]);
      sheetWrites.push(`Brand_Sales: appended ${saleId}`);

      // If customer info provided, add to Customer_Interactions
      const customerName = text(payload?.customerName);
      if (customerName && customerName !== "TBA") {
        const interactionId = `INT-${Date.now().toString(36).toUpperCase()}`;
        await appendRows("Customer_Interactions", [[
          interactionId,
          timestamp.slice(0, 10),
          customerName,
          text(payload?.customerPhone) || "",
          text(payload?.customerEmail) || "",
          "Purchase",
          saleId,
          total,
          text(payload?.consent) || "No",
          "",
        ]]);
        sheetWrites.push(`Customer_Interactions: appended ${interactionId}`);
      }

      return { success: true, detail: `Sale ${saleId} tercatat. ${product}: ${qty} × Rp ${unitPrice.toLocaleString("id-ID")} = Rp ${total.toLocaleString("id-ID")}. Channel: ${channel}.`, sheetWrites };
    }

    case "report": {
      // Report step doesn't write — it's a navigation to /reports
      return { success: true, detail: "Navigasi ke /reports untuk generate laporan.", sheetWrites };
    }

    default:
      return { success: false, detail: `Step "${stepId}" tidak dikenal.`, sheetWrites };
  }
}

// ── Read workflow action log ──

async function readWorkflowLog(): Promise<{ id: string; timestamp: string; stepId: string; stepLabel: string; action: string; reference: string; status: string; detail: string }[]> {
  try {
    const rows = await readRange("Workflow_Actions!A1:H500");
    if (!rows || rows.length <= 1) return [];
    return rows.slice(1).filter((row) => row.some((cell) => String(cell).trim())).map((row) => ({
      id: String(row[0] || "").trim(),
      timestamp: String(row[1] || "").trim(),
      stepId: String(row[2] || "").trim(),
      stepLabel: String(row[3] || "").trim(),
      action: String(row[4] || "").trim(),
      reference: String(row[5] || "").trim(),
      status: String(row[6] || "").trim(),
      detail: String(row[7] || "").trim(),
    })).reverse();
  } catch {
    return [];
  }
}

// ── GET: read workflow state ──

export async function GET() {
  try {
    const [data, workflowLog] = await Promise.all([readRanges(ranges), readWorkflowLog()]);
    return NextResponse.json({ ...buildWorkflow(data), workflowLog });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      const emptyData = Object.fromEntries(ranges.map((range) => [range, []]));
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        generatedAt: new Date().toISOString(),
        summary: { totalSteps: 7, ready: 0, attention: 0, blocked: 0, draft: 7, stockAlerts: 0, openPo: 0, qcPending: 0, productionRows: 0, salesRows: 0, customerRows: 0 },
        steps: buildWorkflow(emptyData).steps,
        recentActivity: { inventoryMovements: [], purchaseOrders: [], production: [], sales: [] },
        crossDivisionKpis: buildDivisionKpis(emptyData),
        weeklyCadence,
        guardrails: ["OAuth Google Workspace perlu re-auth; tidak ada data palsu yang ditampilkan."],
        workflowLog: [],
      });
    }
    return NextResponse.json({ error: "Gagal membaca operational workflow", details: String(error) }, { status: 500 });
  }
}

// ── POST: prepare_handoff or execute_step ──

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = text(body.action);

    if (action === "prepare_handoff") {
      const stepId = text(body.stepId);
      const reference = text(body.reference);
      if (!stepId) return NextResponse.json({ error: "stepId wajib diisi" }, { status: 400 });
      let workflow: ReturnType<typeof buildWorkflow>;
      let sourceStatus: "live" | "degraded" = "live";
      let warning: string | undefined;
      try {
        const data = await readRanges(ranges);
        workflow = buildWorkflow(data);
      } catch (error) {
        if (!isGoogleWorkspaceAuthError(error)) throw error;
        const degraded = googleWorkspaceDegradedSource(SOURCE, error);
        workflow = buildWorkflow(Object.fromEntries(ranges.map((range) => [range, []])));
        sourceStatus = "degraded";
        warning = degraded.warning;
      }
      const step = workflow.steps.find((item) => item.id === stepId);
      if (!step) return NextResponse.json({ error: "stepId tidak dikenal" }, { status: 404 });
      return NextResponse.json({
        source: workflow.source,
        sourceStatus,
        warning,
        action: "prepare_handoff",
        step,
        reference: reference || "TBA",
        cadence: weeklyCadence.find((item) => item.href === step.href) || weeklyCadence[1],
        checklist: [
          `Buka ${step.href} dan cocokkan reference: ${reference || "TBA"}`,
          "Pastikan PIC, tanggal, proof URL, dan notes terisi sebelum write.",
          "Jika action menulis ke Sheets/Docs/Drive, audit SWI Memory Log wajib otomatis setelah primary write berhasil.",
        ],
        note: "Handoff disiapkan; eksekusi write dilakukan via action: execute_step.",
      }, { status: 201 });
    }

    if (action === "execute_step") {
      const stepId = text(body.stepId);
      const reference = text(body.reference);
      const payload = body.payload as Record<string, unknown> | undefined;

      if (!stepId) return NextResponse.json({ error: "stepId wajib diisi" }, { status: 400 });

      // Validate stepId
      const validStepIds = ["po", "receive", "inventory", "produce", "compliance", "sell", "report"];
      if (!validStepIds.includes(stepId)) {
        return NextResponse.json({ error: `stepId tidak dikenal. Valid: ${validStepIds.join(", ")}` }, { status: 400 });
      }

      // Read current workflow state
      let workflow: ReturnType<typeof buildWorkflow>;
      let sourceStatus: "live" | "degraded" = "live";
      let warning: string | undefined;
      try {
        const data = await readRanges(ranges);
        workflow = buildWorkflow(data);
      } catch (error) {
        if (!isGoogleWorkspaceAuthError(error)) throw error;
        const degraded = googleWorkspaceDegradedSource(SOURCE, error);
        workflow = buildWorkflow(Object.fromEntries(ranges.map((range) => [range, []])));
        sourceStatus = "degraded";
        warning = degraded.warning;
      }

      const step = workflow.steps.find((item) => item.id === stepId);
      if (!step) return NextResponse.json({ error: "stepId tidak dikenal" }, { status: 404 });

      // Execute the step
      const result = await executeStep(stepId, reference, payload, workflow);

      // Log the action
      const actionLog: WorkflowAction = {
        id: `wf-${Date.now().toString(36)}`,
        timestamp: new Date().toISOString(),
        stepId,
        stepLabel: step.label,
        action: "execute_step",
        reference: reference || "TBA",
        status: result.success ? "executed" : "failed",
        detail: result.detail,
      };
      await logWorkflowAction(actionLog);

      return NextResponse.json({
        source: workflow.source,
        sourceStatus,
        warning,
        action: "execute_step",
        step,
        result: {
          success: result.success,
          detail: result.detail,
          sheetWrites: result.sheetWrites,
        },
        actionLog,
        note: result.success
          ? "Step dieksekusi. Data sudah ditulis ke Google Sheets."
          : "Step gagal dieksekusi. Cek detail untuk info lebih lanjut.",
      }, { status: result.success ? 201 : 422 });
    }

    if (action === "run_full_workflow") {
      // Demo: chain all 7 steps with sample data. OAuth must be active.
      const demoRef = `DEMO-${Date.now().toString(36).toUpperCase()}`;
      const stepResults: Array<{ stepId: string; stepLabel: string; success: boolean; detail: string; sheetWrites: string[] }> = [];
      let anyFailed = false;

      // 1. PO
      const poResult = await executeStep("po", demoRef, {
        supplier: "PT Aroma Nusantara",
        item: "Essential Oil Lavender 100ml",
        qty: 50,
        unitPrice: 75000,
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        notes: "Demo workflow - restock bahan baku",
      }, buildWorkflow(await readRanges(ranges)));
      stepResults.push({ stepId: "po", stepLabel: "PO / Restock", ...poResult });
      if (!poResult.success) anyFailed = true;

      // 2. Receive
      const receiveResult = await executeStep("receive", demoRef, {
        poNumber: poResult.detail.match(/PO [A-Z0-9]+/)?.[0] || "DEMO",
        item: "Essential Oil Lavender 100ml",
        qtyReceived: 50,
        qcStatus: "Pass",
        qcNotes: "Visual & aroma OK",
        warehouse: "Gudang A - Rak B2",
      }, buildWorkflow(await readRanges(ranges)));
      stepResults.push({ stepId: "receive", stepLabel: "Receive + QC Barang", ...receiveResult });
      if (!receiveResult.success) anyFailed = true;

      // 3. Inventory
      const invResult = await executeStep("inventory", demoRef, {
        item: "Essential Oil Lavender 100ml",
        movementType: "In",
        qty: 50,
        warehouse: "Gudang A - Rak B2",
        notes: "Demo workflow - stok masuk dari PO",
      }, buildWorkflow(await readRanges(ranges)));
      stepResults.push({ stepId: "inventory", stepLabel: "Inventory Ready", ...invResult });
      if (!invResult.success) anyFailed = true;

      // 4. Produce
      const prodResult = await executeStep("produce", demoRef, {
        product: "L'Arc~en~Scent - Lavender Dreams EDP 50ml",
        brand: "L'Arc~en~Scent",
        batchSize: 200,
        formula: "LD-2026-001",
        hpp: 12000000,
      }, buildWorkflow(await readRanges(ranges)));
      stepResults.push({ stepId: "produce", stepLabel: "Produksi + Batch", ...prodResult });
      if (!prodResult.success) anyFailed = true;

      // 5. Compliance
      const compResult = await executeStep("compliance", demoRef, {
        product: "L'Arc~en~Scent - Lavender Dreams EDP 50ml",
        checkType: "Formula Check + Allergen",
        result: "Pass",
        notes: "IFRA compliant, allergen label drafted",
        batchNumber: prodResult.detail.match(/BATCH-[A-Z0-9]+/)?.[0] || "DEMO",
        stage: "Final",
        qcResult: "Pass",
      }, buildWorkflow(await readRanges(ranges)));
      stepResults.push({ stepId: "compliance", stepLabel: "Compliance / QC Final", ...compResult });
      if (!compResult.success) anyFailed = true;

      // 6. Sell
      const sellResult = await executeStep("sell", demoRef, {
        product: "L'Arc~en~Scent - Lavender Dreams EDP 50ml",
        brand: "L'Arc~en~Scent",
        qty: 5,
        unitPrice: 350000,
        channel: "Store",
        customerName: "Demo Customer",
        customerPhone: "+6281234567890",
        consent: "Yes",
      }, buildWorkflow(await readRanges(ranges)));
      stepResults.push({ stepId: "sell", stepLabel: "Jual + CRM", ...sellResult });
      if (!sellResult.success) anyFailed = true;

      // 7. Report (navigation hint)
      const reportResult = await executeStep("report", demoRef, {}, buildWorkflow(await readRanges(ranges)));
      stepResults.push({ stepId: "report", stepLabel: "Report Executive", ...reportResult });

      // Log the full workflow run
      const workflowLogId = `wf-full-${Date.now().toString(36)}`;
      await logWorkflowAction({
        id: workflowLogId,
        timestamp: new Date().toISOString(),
        stepId: "full_workflow",
        stepLabel: "Full Workflow Demo",
        action: "run_full_workflow",
        reference: demoRef,
        status: anyFailed ? "failed" : "executed",
        detail: `Full workflow ${anyFailed ? "completed with errors" : "completed successfully"}. Steps: ${stepResults.map((s) => `${s.stepId}=${s.success ? "OK" : "FAIL"}`).join(", ")}`,
      });

      return NextResponse.json({
        source: SOURCE,
        sourceStatus: "live",
        action: "run_full_workflow",
        reference: demoRef,
        success: !anyFailed,
        steps: stepResults,
        totalSteps: stepResults.length,
        completedSteps: stepResults.filter((s) => s.success).length,
        failedSteps: stepResults.filter((s) => !s.success).length,
        workflowLogId,
        note: anyFailed
          ? "Full workflow selesai dengan beberapa step gagal. Cek detail per step."
          : "Full workflow berhasil dijalankan. Semua 7 step tercatat di Google Sheets.",
      }, { status: anyFailed ? 207 : 201 });
    }

    if (action === "add_shared_resource") {
      const name = text(body.name);
      const category = text(body.category) || "marketing";
      const description = text(body.description);
      const owner = text(body.owner);
      const divisions = Array.isArray(body.divisions) ? body.divisions : [];
      const cost = num(body.cost);
      const frequency = text(body.frequency) || "monthly";
      const status = text(body.status) || "active";
      const url = text(body.url);
      const notes = text(body.notes);

      if (!name) return NextResponse.json({ error: "name wajib diisi" }, { status: 400 });

      const resourceId = `sr-${Date.now().toString(36)}`;
      const timestamp = new Date().toISOString().slice(0, 10);

      await appendRows("Shared_Resources", [[
        resourceId,
        timestamp,
        name,
        category,
        description,
        owner,
        divisions.join(", "),
        cost,
        frequency,
        status,
        url,
        notes,
      ]]);

      return NextResponse.json({
        source: SOURCE,
        sourceStatus: "live",
        action: "add_shared_resource",
        resource: { id: resourceId, name, category, description, owner, divisions, cost, frequency, status, url, notes },
        detail: `Shared resource "${name}" ditambahkan ke Shared_Resources sheet.`,
      }, { status: 201 });
    }

    return NextResponse.json({ error: "action tidak dikenal. Gunakan: prepare_handoff, execute_step, run_full_workflow, add_shared_resource" }, { status: 400 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({ ...googleWorkspaceDegradedSource(SOURCE, error), error: "Google Workspace degraded; operasi tidak bisa dilanjutkan sampai re-auth." }, { status: 503 });
    }
    return NextResponse.json({ error: "Gagal memproses request", details: String(error) }, { status: 500 });
  }
}
