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

function sortAlerts(alerts: AlertItem[]) {
  const weight: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  return [...alerts].sort((a, b) => weight[b.severity] - weight[a.severity] || (b.amount || 0) - (a.amount || 0));
}

export async function GET() {
  try {
    const [inventoryRows, tenantRows, sponsorRows, timelineRows, budgetRows, shareholderRows] = await Promise.all([
      readRange("Inventory_Master!A1:O1000").catch(() => []),
      readEventSheet(EVENT_SHEETS.Tenants).catch(() => []),
      readEventSheet(EVENT_SHEETS.Sponsors).catch(() => []),
      readEventSheet(EVENT_SHEETS.Timeline).catch(() => []),
      readEventSheet(EVENT_SHEETS.Budget).catch(() => []),
      readRange("PemegangSaham!A1:I100").catch(() => []),
    ]);

    const alerts = sortAlerts([
      ...inventoryAlerts(inventoryRows),
      ...tenantAlerts(tenantRows),
      ...sponsorAlerts(sponsorRows),
      ...eventTimelineAlerts(timelineRows),
      ...eventBudgetAlerts(budgetRows),
      ...shareholderAlerts(shareholderRows),
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
      source: "Google Sheets: Inventory_Master, Event_* sheets, PemegangSaham",
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
