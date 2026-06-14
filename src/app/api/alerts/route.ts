import { NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";
import { EVENT_SHEETS, readEventSheet } from "@/lib/event/sheets";

export const runtime = "nodejs";

type Severity = "critical" | "high" | "medium" | "low";
type AlertCategory = "inventory" | "event" | "finance" | "procurement" | "compliance";

type AlertItem = {
  id: string;
  category: AlertCategory;
  severity: Severity;
  title: string;
  detail: string;
  owner: string;
  dueDate?: string;
  amount?: number;
  source: string;
  actionUrl: string;
};

const text = (value: unknown) => String(value ?? "").trim();
const amount = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

function daysUntil(dateText: string) {
  if (!dateText || dateText.toUpperCase() === "TBA") return null;
  const date = new Date(`${dateText}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((date.getTime() - start.getTime()) / 86400000);
}

function stockStatus(qty: number, minimumQty: number) {
  if (qty <= 0) return "empty";
  if (qty <= minimumQty * 0.5) return "critical";
  if (qty <= minimumQty) return "low";
  return "ok";
}

function inventoryAlerts(rows: string[][]): AlertItem[] {
  return rows.slice(1).filter((row) => row.some(Boolean)).flatMap((row) => {
    const itemId = text(row[0]) || text(row[1]);
    const name = text(row[2]);
    if (!itemId || !name) return [];
    const qty = amount(row[5]);
    const min = amount(row[6]);
    const reorder = amount(row[7]);
    const unit = text(row[4]) || "unit";
    const status = stockStatus(qty, min);
    if (status === "ok") return [];
    return [{
      id: `inventory-${itemId}`,
      category: "inventory" as const,
      severity: status === "empty" || status === "critical" ? "critical" as const : "high" as const,
      title: `${name} stock ${status}`,
      detail: `Qty ${qty} ${unit}; minimum ${min} ${unit}; reorder disarankan ${reorder || min} ${unit}.`,
      owner: text(row[9]) || "Procurement/Produksi",
      source: "Inventory_Master",
      actionUrl: "/inventory",
    }];
  });
}

function tenantAlerts(rows: string[][]): AlertItem[] {
  return rows.slice(1).filter((row) => row[0]).flatMap((row) => {
    const fee = amount(row[9]);
    const paid = amount(row[11]);
    const status = text(row[10]) || "prospect";
    const outstanding = Math.max(fee - paid, 0);
    if (status === "paid" || status === "cancelled" || outstanding <= 0) return [];
    return [{
      id: `tenant-${text(row[0])}`,
      category: "event" as const,
      severity: status === "invoice-sent" || status === "partial" ? "high" as const : "medium" as const,
      title: `Tenant belum lunas: ${text(row[2]) || "TBA"}`,
      detail: `Status ${status}; outstanding Rp${outstanding.toLocaleString("id-ID")}; booth ${text(row[6]) || "TBA"}.`,
      owner: text(row[3]) || "Event Commercial",
      amount: outstanding,
      source: "Event_Tenants",
      actionUrl: "/events",
    }];
  });
}

function sponsorAlerts(rows: string[][]): AlertItem[] {
  return rows.slice(1).filter((row) => row[0]).flatMap((row) => {
    const pledged = amount(row[7]);
    const status = text(row[11]) || "prospect";
    if (status === "paid" || status === "cancelled" || pledged <= 0) return [];
    return [{
      id: `sponsor-${text(row[0])}`,
      category: "event" as const,
      severity: status === "invoice-sent" || status === "partial" ? "high" as const : "medium" as const,
      title: `Sponsor follow-up: ${text(row[2]) || "TBA"}`,
      detail: `Tier ${text(row[6]) || "TBA"}; status ${status}; komitmen Rp${pledged.toLocaleString("id-ID")}.`,
      owner: text(row[3]) || "Event Commercial",
      amount: pledged,
      source: "Event_Sponsors",
      actionUrl: "/events",
    }];
  });
}

function eventTimelineAlerts(rows: string[][]): AlertItem[] {
  return rows.slice(1).filter((row) => row[0]).flatMap((row) => {
    const completed = ["true", "done", "yes", "selesai"].includes(text(row[5]).toLowerCase());
    const due = text(row[4]);
    const days = daysUntil(due);
    if (completed || days === null || days > 14) return [];
    const overdue = days < 0;
    return [{
      id: `timeline-${text(row[0])}`,
      category: "event" as const,
      severity: overdue ? "critical" as const : days <= 3 ? "high" as const : "medium" as const,
      title: `${overdue ? "Overdue" : "Deadline dekat"}: ${text(row[3]) || text(row[2]) || "Milestone event"}`,
      detail: `${text(row[2]) || "Phase"} jatuh tempo ${due}${overdue ? ` (${Math.abs(days)} hari lewat)` : ` (${days} hari lagi)`}.`,
      owner: "Event/PIC",
      dueDate: due,
      source: "Event_Timeline",
      actionUrl: "/events",
    }];
  });
}

function eventBudgetAlerts(rows: string[][]): AlertItem[] {
  return rows.slice(1).filter((row) => row[0]).flatMap((row) => {
    const planned = amount(row[4]);
    const actual = amount(row[5]);
    if (planned <= 0 || actual <= planned) return [];
    const over = actual - planned;
    return [{
      id: `budget-${text(row[0])}`,
      category: "finance" as const,
      severity: actual > planned * 1.25 ? "critical" as const : "high" as const,
      title: `Over budget: ${text(row[3]) || text(row[2]) || "Event item"}`,
      detail: `Actual Rp${actual.toLocaleString("id-ID")} vs budget Rp${planned.toLocaleString("id-ID")} (selisih Rp${over.toLocaleString("id-ID")}).`,
      owner: "Finance/Event",
      amount: over,
      source: "Event_Budget",
      actionUrl: "/events",
    }];
  });
}

function shareholderName(row: string[]) {
  return row
    .slice(0, 4)
    .map(text)
    .find((cell) => /[A-Za-zÀ-ž]/.test(cell) && !/pemegang|nama|status|total/i.test(cell)) || "";
}

function shareholderAlerts(rows: string[][]): AlertItem[] {
  return rows.slice(1).filter((row) => row.some(Boolean)).flatMap((row, index) => {
    const name = shareholderName(row);
    const obligation = Math.max(amount(row[4]), amount(row[5]));
    const paid = amount(row[6]);
    const remaining = amount(row[7]) || Math.max(obligation - paid, 0);
    if (!name || remaining <= 0 || obligation <= 0) return [];
    return [{
      id: `shareholder-${index}-${name}`,
      category: "finance" as const,
      severity: remaining >= obligation * 0.5 ? "high" as const : "medium" as const,
      title: `Setoran saham outstanding: ${name}`,
      detail: `Sisa kewajiban Rp${remaining.toLocaleString("id-ID")}; sudah setor Rp${paid.toLocaleString("id-ID")}.`,
      owner: "Direksi/Finance",
      amount: remaining,
      source: "PemegangSaham",
      actionUrl: "/finance",
    }];
  });
}

function procurementAlerts(poRows: string[][], receiptRows: string[][]): AlertItem[] {
  const poAlerts = poRows.slice(1).filter((row) => row.some(Boolean)).flatMap((row) => {
    const poId = text(row[0]);
    const status = text(row[10]).toLowerCase() || "draft";
    if (!poId || ["received", "cancelled", "closed"].includes(status)) return [];
    const expectedDate = text(row[11]);
    const days = daysUntil(expectedDate);
    const total = amount(row[9]);
    const overdue = days !== null && days < 0;
    const dueSoon = days !== null && days <= 7;
    if (!overdue && !dueSoon && status !== "partial") return [];
    return [{
      id: `procurement-po-${poId}`,
      category: "procurement" as const,
      severity: overdue ? "high" as const : "medium" as const,
      title: `${overdue ? "PO overdue" : "PO perlu follow-up"}: ${poId}`,
      detail: `${text(row[5]) || "Item TBA"} dari ${text(row[3]) || "Supplier TBA"}; status ${status}; ETA ${expectedDate || "TBA"}${days !== null ? (overdue ? ` (${Math.abs(days)} hari lewat)` : ` (${days} hari lagi)`) : ""}.`,
      owner: "Procurement/Operations",
      dueDate: expectedDate || undefined,
      amount: total || undefined,
      source: "Purchase_Orders",
      actionUrl: "/procurement",
    }];
  });

  const qcAlerts = receiptRows.slice(1).filter((row) => row.some(Boolean)).flatMap((row) => {
    const receiptId = text(row[1]);
    const result = text(row[7]).toLowerCase() || "pending";
    if (!receiptId || !["failed", "pending", "needs_review"].includes(result)) return [];
    return [{
      id: `procurement-qc-${receiptId}`,
      category: "procurement" as const,
      severity: result === "failed" ? "high" as const : "medium" as const,
      title: `${result === "failed" ? "QC receiving gagal" : "QC receiving pending"}: ${receiptId}`,
      detail: `${text(row[4]) || text(row[5]) || "Item TBA"}; qty ${amount(row[6]).toLocaleString("id-ID")}; PO ${text(row[2]) || "TBA"}. ${text(row[8]) || "Perlu review QC sebelum stok dipakai."}`,
      owner: text(row[10]) || "QC/Procurement",
      source: "Goods_Receipts",
      actionUrl: "/procurement",
    }];
  });

  return [...poAlerts, ...qcAlerts];
}

function complianceAlerts(checkRows: string[][], batchRows: string[][], qcRows: string[][]): AlertItem[] {
  const checkAlerts = checkRows.slice(1).filter((row) => row.some(Boolean)).flatMap((row) => {
    const formulaId = text(row[1]);
    const status = text(row[5]).toLowerCase() || "draft";
    const riskScore = amount(row[6]);
    if (!formulaId || status === "passed") return [];
    return [{
      id: `compliance-check-${formulaId}`,
      category: "compliance" as const,
      severity: status === "blocked" || riskScore >= 75 ? "critical" as const : "medium" as const,
      title: `Compliance formula perlu review: ${text(row[2]) || formulaId}`,
      detail: `Produk ${text(row[3]) || "TBA"}; status ${status}; IFRA ${text(row[4]) || "TBA"}; risk score ${riskScore}. ${text(row[7]) || "Butuh verifikasi SDS/COA/BPOM sebelum release."}`,
      owner: text(row[9]) || "Compliance/QC",
      source: "Compliance_Checks",
      actionUrl: "/compliance",
    }];
  });

  const batchAlerts = batchRows.slice(1).filter((row) => row.some(Boolean)).flatMap((row) => {
    const batchId = text(row[1]);
    const qcStatus = text(row[7]).toLowerCase() || "pending";
    const traceability = text(row[8]).toLowerCase() || "draft";
    if (!batchId || (qcStatus === "passed" && ["complete", "completed", "done"].includes(traceability))) return [];
    return [{
      id: `compliance-batch-${batchId}`,
      category: "compliance" as const,
      severity: qcStatus === "failed" ? "critical" as const : "medium" as const,
      title: `Batch traceability belum lengkap: ${batchId}`,
      detail: `${text(row[2]) || "Product TBA"}; QC ${qcStatus}; traceability ${traceability}; inventory ref ${text(row[9]) || "TBA"}.`,
      owner: text(row[11]) || "Produksi/QC",
      dueDate: text(row[4]) || undefined,
      source: "Product_Batches",
      actionUrl: "/compliance",
    }];
  });

  const qcAlerts = qcRows.slice(1).filter((row) => row.some(Boolean)).flatMap((row) => {
    const checklistId = text(row[1]);
    const result = text(row[5]).toLowerCase() || "needs_review";
    if (!checklistId || result === "passed") return [];
    return [{
      id: `compliance-qc-${checklistId}`,
      category: "compliance" as const,
      severity: result === "failed" ? "high" as const : "medium" as const,
      title: `QC checklist perlu tindakan: ${text(row[2]) || checklistId}`,
      detail: `${text(row[3]) || "Stage TBA"} — ${text(row[4]) || "Item QC"}; result ${result}. ${text(row[8]) || "Lengkapi evidence/review QC."}`,
      owner: text(row[6]) || "QC",
      source: "QC_Checklist",
      actionUrl: "/compliance",
    }];
  });

  return [...checkAlerts, ...batchAlerts, ...qcAlerts];
}

function sortAlerts(alerts: AlertItem[]) {
  const weight: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  return [...alerts].sort((a, b) => weight[b.severity] - weight[a.severity] || (b.amount || 0) - (a.amount || 0));
}

export async function GET() {
  try {
    const [
      inventoryRows,
      tenantRows,
      sponsorRows,
      timelineRows,
      budgetRows,
      shareholderRows,
      poRows,
      receiptRows,
      complianceRows,
      batchRows,
      qcRows,
    ] = await Promise.all([
      readRange("Inventory_Master!A1:O1000").catch(() => []),
      readEventSheet(EVENT_SHEETS.Tenants).catch(() => []),
      readEventSheet(EVENT_SHEETS.Sponsors).catch(() => []),
      readEventSheet(EVENT_SHEETS.Timeline).catch(() => []),
      readEventSheet(EVENT_SHEETS.Budget).catch(() => []),
      readRange("PemegangSaham!A1:I100").catch(() => []),
      readRange("Purchase_Orders!A1:N1000").catch(() => []),
      readRange("Goods_Receipts!A1:M1000").catch(() => []),
      readRange("Compliance_Checks!A1:L1000").catch(() => []),
      readRange("Product_Batches!A1:M1000").catch(() => []),
      readRange("QC_Checklist!A1:I1000").catch(() => []),
    ]);

    const alerts = sortAlerts([
      ...inventoryAlerts(inventoryRows),
      ...tenantAlerts(tenantRows),
      ...sponsorAlerts(sponsorRows),
      ...eventTimelineAlerts(timelineRows),
      ...eventBudgetAlerts(budgetRows),
      ...shareholderAlerts(shareholderRows),
      ...procurementAlerts(poRows, receiptRows),
      ...complianceAlerts(complianceRows, batchRows, qcRows),
    ]);

    const bySeverity = alerts.reduce<Record<Severity, number>>((acc, alert) => {
      acc[alert.severity] += 1;
      return acc;
    }, { critical: 0, high: 0, medium: 0, low: 0 });

    const byCategory = alerts.reduce<Record<string, number>>((acc, alert) => {
      acc[alert.category] = (acc[alert.category] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      source: "Google Sheets: Inventory_Master, Event_* sheets, PemegangSaham, Purchase_Orders, Goods_Receipts, Compliance_Checks, Product_Batches, QC_Checklist",
      generatedAt: new Date().toISOString(),
      summary: {
        total: alerts.length,
        actionable: alerts.filter((alert) => alert.severity !== "low").length,
        bySeverity,
        byCategory,
      },
      alerts,
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal membaca alert system", details: String(error) }, { status: 500 });
  }
}
