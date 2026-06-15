import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readRanges } from "@/lib/sheets/sheets-real";

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

const SOURCE = "Google Sheets: Inventory_Master, Inventory_Movements, Purchase_Orders, Goods_Receipts, Brand_Production, Brand_Sales, Customer_Master, Compliance_Checks, Product_Batches, QC_Checklist";

const ranges = [
  "Inventory_Master!A1:O1000",
  "Inventory_Movements!A1:J1000",
  "Purchase_Orders!A1:N1000",
  "Goods_Receipts!A1:M1000",
  "Brand_Production!A1:T1000",
  "Brand_Sales!A1:N1000",
  "Customer_Master!A1:M1000",
  "Compliance_Checks!A1:L1000",
  "Product_Batches!A1:M1000",
  "QC_Checklist!A1:I1000",
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

function buildWorkflow(data: Record<string, string[][]>) {
  const inventory = rowsOnly(data["Inventory_Master!A1:O1000"]);
  const movements = rowsOnly(data["Inventory_Movements!A1:J1000"]);
  const purchaseOrders = rowsOnly(data["Purchase_Orders!A1:N1000"]);
  const receipts = rowsOnly(data["Goods_Receipts!A1:M1000"]);
  const production = rowsOnly(data["Brand_Production!A1:T1000"]);
  const sales = rowsOnly(data["Brand_Sales!A1:N1000"]);
  const customers = rowsOnly(data["Customer_Master!A1:M1000"]);
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
    guardrails: [
      "Google Sheets tetap source of truth; halaman ini tidak mengarang angka jika OAuth degraded.",
      "Jangan release batch produk final sebelum Compliance/QC review selesai.",
      "WhatsApp follow-up tetap preview/manual dan consent-gated.",
      "Proof URL/reference harus dipakai untuk PO, receiving, movement, dan transaksi finance.",
    ],
  };
}

export async function GET() {
  try {
    const data = await readRanges(ranges);
    return NextResponse.json(buildWorkflow(data));
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        generatedAt: new Date().toISOString(),
        summary: { totalSteps: 7, ready: 0, attention: 0, blocked: 0, draft: 7, stockAlerts: 0, openPo: 0, qcPending: 0, productionRows: 0, salesRows: 0, customerRows: 0 },
        steps: buildWorkflow(Object.fromEntries(ranges.map((range) => [range, []]))).steps,
        recentActivity: { inventoryMovements: [], purchaseOrders: [], production: [], sales: [] },
        guardrails: ["OAuth Google Workspace perlu re-auth; tidak ada data palsu yang ditampilkan."],
      });
    }
    return NextResponse.json({ error: "Gagal membaca operational workflow", details: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.action !== "prepare_handoff") {
      return NextResponse.json({ error: "action wajib prepare_handoff" }, { status: 400 });
    }
    const stepId = text(body.stepId);
    const reference = text(body.reference);
    if (!stepId) return NextResponse.json({ error: "stepId wajib diisi" }, { status: 400 });
    const data = await readRanges(ranges);
    const workflow = buildWorkflow(data);
    const step = workflow.steps.find((item) => item.id === stepId);
    if (!step) return NextResponse.json({ error: "stepId tidak dikenal" }, { status: 404 });
    return NextResponse.json({
      source: workflow.source,
      sourceStatus: "live",
      action: "prepare_handoff",
      step,
      reference: reference || "TBA",
      checklist: [
        `Buka ${step.href} dan cocokkan reference: ${reference || "TBA"}`,
        "Pastikan PIC, tanggal, proof URL, dan notes terisi sebelum write.",
        "Jika action menulis ke Sheets/Docs/Drive, audit SWI Memory Log wajib otomatis setelah primary write berhasil.",
      ],
      note: "Handoff disiapkan; belum ada write otomatis dari endpoint operations v1.",
    }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({ ...googleWorkspaceDegradedSource(SOURCE, error), error: "Google Workspace degraded; handoff hanya bisa disiapkan setelah data sumber terbaca." }, { status: 503 });
    }
    return NextResponse.json({ error: "Gagal menyiapkan handoff", details: String(error) }, { status: 500 });
  }
}
