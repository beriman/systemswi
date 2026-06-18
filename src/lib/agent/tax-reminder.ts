// Agent Tax Reminder — reads Tax_Calendar + Pajak_Tracking, sends H-3 reminders via Telegram
// Compliance: Agent only sends reminders, human must file & pay

import { readRanges } from "@/lib/sheets/sheets-real";
import { sendTelegramMessage, sendTelegramAlert } from "@/lib/agent/telegram";
import { logAgentActionSafe } from "@/lib/agent/audit";

export interface TaxReminder {
  id: string;
  taxType: string;
  period: string;
  dueDate: string;
  daysUntilDue: number;
  amount: string;
  status: string;
  source: "calendar" | "pajak_tracking";
}

export interface TaxReminderReport {
  reminders: TaxReminder[];
  totalUpcoming: number;
  totalOverdue: number;
  timestamp: string;
}

function parseCalendarRows(rows: string[][]): TaxReminder[] {
  // Headers: ID, Tax Type, Period, Due Date, Status, Amount, Notes, Created
  if (rows.length <= 1) return [];
  return rows
    .slice(1)
    .filter((row) => row.some((cell) => String(cell).trim()))
    .map((row) => {
      const id = row[0] || "";
      const taxType = row[1] || "";
      const period = row[2] || "";
      const dueDate = row[3] || "";
      const status = row[4] || "";
      const amount = row[5] || "0";
      const notes = row[6] || "";

      let daysUntilDue = 9999;
      if (dueDate) {
        try {
          const due = new Date(dueDate);
          const now = new Date();
          daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        } catch {
          daysUntilDue = 9999;
        }
      }

      return { id, taxType, period, dueDate, daysUntilDue, amount, status, source: "calendar" as const };
    });
}

function parsePajakRows(rows: string[][]): TaxReminder[] {
  // Headers: Jenis Pajak, Keterangan, Nominal, Jatuh Tempo, Status, Bukti Bayar, Deadline, Notes
  if (rows.length <= 1) return [];
  return rows
    .slice(1)
    .filter((row) => row.some((cell) => String(cell).trim()))
    .map((row, idx) => {
      const taxType = row[0] || "";
      const keterangan = row[1] || "";
      const nominal = row[2] || "0";
      const jatuhTempo = row[3] || "";
      const status = row[4] || "";
      const deadline = row[6] || jatuhTempo; // fallback to jatuh tempo if deadline empty

      let daysUntilDue = 9999;
      const dateStr = deadline || jatuhTempo;
      if (dateStr && dateStr !== "Bertahap" && dateStr !== "Sesuai event" && dateStr !== "Sesuai periode") {
        try {
          const due = new Date(dateStr);
          const now = new Date();
          daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        } catch {
          daysUntilDue = 9999;
        }
      }

      return {
        id: `PAJAK-${idx + 1}`,
        taxType: `${taxType} — ${keterangan}`.trim(),
        period: jatuhTempo,
        dueDate: deadline || jatuhTempo,
        daysUntilDue,
        amount: nominal,
        status,
        source: "pajak_tracking" as const,
      };
    });
}

export async function getTaxReminders(): Promise<TaxReminderReport> {
  const now = new Date();
  const reminders: TaxReminder[] = [];

  // Read Tax_Calendar
  try {
    const calData = await readRanges(["Tax_Calendar!A1:Z1000"]);
    const calRows = calData["Tax_Calendar!A1:Z1000"] || [];
    const calReminders = parseCalendarRows(calRows);
    reminders.push(...calReminders);
  } catch (err) {
    console.warn("[TaxReminder] Failed to read Tax_Calendar:", String(err).slice(0, 100));
  }

  // Read Pajak_Tracking
  try {
    const pajakData = await readRanges(["Pajak_Tracking!A1:H500"]);
    const pajakRows = pajakData["Pajak_Tracking!A1:H500"] || [];
    const pajakReminders = parsePajakRows(pajakRows);
    reminders.push(...pajakReminders);
  } catch (err) {
    console.warn("[TaxReminder] Failed to read Pajak_Tracking:", String(err).slice(0, 100));
  }

  // Filter: only upcoming (0-3 days) and overdue (past due, not completed)
  const actionable = reminders.filter((r) => {
    if (r.status === "completed" || r.status === "✅ Done" || r.status === "Lunas") return false;
    return r.daysUntilDue <= 3;
  });

  // Sort by days until due (overdue first, then upcoming)
  actionable.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  const totalOverdue = actionable.filter((r) => r.daysUntilDue < 0).length;
  const totalUpcoming = actionable.filter((r) => r.daysUntilDue >= 0).length;

  return {
    reminders: actionable,
    totalUpcoming,
    totalOverdue,
    timestamp: now.toISOString(),
  };
}

function formatReminderText(reminders: TaxReminder[]): string {
  if (reminders.length === 0) {
    return "✅ <b>Tax Reminder Check</b>\n\nTidak ada pajak yang jatuh tempo dalam 3 hari ke depan. Semua clear! 🎉";
  }

  let text = "📋 <b>TAX REMINDER — H-3</b>\n\n";

  const overdue = reminders.filter((r) => r.daysUntilDue < 0);
  const dueToday = reminders.filter((r) => r.daysUntilDue === 0);
  const dueSoon = reminders.filter((r) => r.daysUntilDue > 0 && r.daysUntilDue <= 3);

  if (overdue.length > 0) {
    text += `🔴 <b>OVERDUE (${overdue.length}):</b>\n`;
    for (const r of overdue) {
      text += `  • ${r.taxType}\n`;
      text += `    📅 Jatuh tempo: ${r.dueDate} (${Math.abs(r.daysUntilDue)} hari lalu)\n`;
      if (r.amount && r.amount !== "0") {
        text += `    💰 Nominal: Rp ${Number(r.amount).toLocaleString("id-ID")}\n`;
      }
      text += `\n`;
    }
  }

  if (dueToday.length > 0) {
    text += `🟠 <b>HARI INI (${dueToday.length}):</b>\n`;
    for (const r of dueToday) {
      text += `  • ${r.taxType}\n`;
      text += `    📅 Jatuh tempo: HARI INI\n`;
      if (r.amount && r.amount !== "0") {
        text += `    💰 Nominal: Rp ${Number(r.amount).toLocaleString("id-ID")}\n`;
      }
      text += `\n`;
    }
  }

  if (dueSoon.length > 0) {
    text += `🟡 <b>H-1 s/d H-3 (${dueSoon.length}):</b>\n`;
    for (const r of dueSoon) {
      text += `  • ${r.taxType}\n`;
      text += `    📅 Jatuh tempo: ${r.dueDate} (${r.daysUntilDue} hari lagi)\n`;
      if (r.amount && r.amount !== "0") {
        text += `    💰 Nominal: Rp ${Number(r.amount).toLocaleString("id-ID")}\n`;
      }
      text += `\n`;
    }
  }

  text += `⚠️ <i>Agent hanya mengingatkan. Pelaporan & pembayaran tetap oleh manusia.</i>`;
  return text;
}

export async function runTaxReminderCheck(): Promise<{
  sent: boolean;
  report: TaxReminderReport;
  message: string;
}> {
  const report = await getTaxReminders();
  const message = formatReminderText(report.reminders);

  // Always send report (even if no reminders — daily check is useful)
  let sent = false;
  try {
    await sendTelegramMessage(message);
    sent = true;
  } catch (err) {
    console.error("[TaxReminder] Failed to send Telegram:", err);
  }

  // Log to audit
  await logAgentActionSafe({
    agent: "tax-reminder",
    action: "tax_reminder_check",
    target: "Tax_Calendar + Pajak_Tracking",
    status: "success",
    humanApproved: "n/a",
    notes: `Found ${report.totalOverdue} overdue, ${report.totalUpcoming} upcoming (H-3). Sent: ${sent}`,
    timestamp: report.timestamp,
  });

  // Send individual alerts for overdue items
  if (report.totalOverdue > 0) {
    const overdue = report.reminders.filter((r) => r.daysUntilDue < 0);
    for (const item of overdue) {
      try {
        await sendTelegramAlert({
          title: `PAJAK OVERDUE: ${item.taxType}`,
          detail: `Jatuh tempo ${Math.abs(item.daysUntilDue)} hari lalu (${item.dueDate})${item.amount && item.amount !== "0" ? `\nNominal: Rp ${Number(item.amount).toLocaleString("id-ID")}` : ""}`,
          severity: "high",
          category: "tax",
        });
      } catch {
        // continue on individual alert failure
      }
    }
  }

  return { sent, report, message };
}
