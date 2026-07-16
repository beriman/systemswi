// Compliance Tracking — Phase 2.4
// Daily: Check BPOM expiry → Check Halal cert → Check OSS status → Alert if expiring
//
// Compliance: Agent tracks & alerts only — human must renew certificates.
// This module is READ-ANALYZE-ALERT (no direct sheet writes).

import { readRange } from "@/lib/sheets/sheets-real";

// ── Types ──────────────────────────────────────────────────────────

export interface BPOMEntry {
  productName: string;
  registrationNumber: string;
  issueDate: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: "valid" | "expiring_soon" | "expired";
}

export interface HalalCertEntry {
  productName: string;
  certNumber: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: "valid" | "expiring_soon" | "expired";
}

export interface ComplianceReport {
  timestamp: string;
  bpom: BPOMEntry[];
  halal: HalalCertEntry[];
  register: ComplianceRegisterReminder[];
  totalAlerts: number;
  expired: number;
  expiringSoon: number;
  valid: number;
}

export interface ComplianceRegisterReminder {
  id: string;
  area: string;
  obligation: string;
  period: string;
  dueDate: string;
  status: string;
  owner: string;
  sourceProof: string;
  riskLevel: string;
  notes: string;
  daysUntilDue: number;
  reminderStage: "overdue" | "H-1" | "H-3" | "H-7" | "missing_proof";
}

// ── Helpers ────────────────────────────────────────────────────────

const text = (v: unknown) => String(v ?? "").trim();

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Try DD/MM/YYYY or YYYY-MM-DD
  const ddmmyyyy = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    return new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
  }
  const yyyymmdd = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (yyyymmdd) {
    const [, yyyy, mm, dd] = yyyymmdd;
    return new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function daysUntil(dateStr: string): number {
  const d = parseDate(dateStr);
  if (!d) return 9999;
  return Math.floor((d.getTime() - Date.now()) / 86400000);
}

function certStatus(daysUntilExpiry: number): "valid" | "expiring_soon" | "expired" {
  if (daysUntilExpiry <= 0) return "expired";
  if (daysUntilExpiry <= 30) return "expiring_soon";
  return "valid";
}

function registerReminderStage(days: number): ComplianceRegisterReminder["reminderStage"] | null {
  if (days < 0) return "overdue";
  if (days <= 1) return "H-1";
  if (days <= 3) return "H-3";
  if (days <= 7) return "H-7";
  return null;
}

// ── Read BPOM from Compliance_Checks or Product_Batches ────────────

async function readBPOMEntries(): Promise<BPOMEntry[]> {
  // Try Compliance_Checks first (columns may contain BPOM data)
  const rows = await readRange("Compliance_Checks!A1:L1000");
  const entries: BPOMEntry[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row.some((c) => c && c.trim())) continue;

    const productName = text(row[0]);
    const regNumber = text(row[1]) || text(row[2]);
    const issueDate = text(row[3]) || text(row[4]);
    const expiryDate = text(row[5]) || text(row[6]);

    if (!productName || !regNumber) continue;
    if (!expiryDate) continue;

    const dte = daysUntil(expiryDate);
    entries.push({
      productName,
      registrationNumber: regNumber,
      issueDate,
      expiryDate,
      daysUntilExpiry: dte,
      status: certStatus(dte),
    });
  }

  return entries;
}

// ── Read Halal from Legal_Compliance ───────────────────────────────

async function readHalalEntries(): Promise<HalalCertEntry[]> {
  const rows = await readRange("Legal_Compliance!A1:H16");
  const entries: HalalCertEntry[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row.some((c) => c && c.trim())) continue;

    const productName = text(row[0]);
    const certNumber = text(row[1]);
    const issuer = text(row[2]);
    const issueDate = text(row[3]);
    const expiryDate = text(row[4]);

    if (!productName || !certNumber) continue;
    if (!expiryDate) continue;

    const dte = daysUntil(expiryDate);
    entries.push({
      productName,
      certNumber,
      issuer,
      issueDate,
      expiryDate,
      daysUntilExpiry: dte,
      status: certStatus(dte),
    });
  }

  return entries;
}

// ── Read GCG Compliance_Register for LKPM/BPJSKS/BPJSKT/Tax/Legal reminders ──

async function readComplianceRegisterReminders(): Promise<ComplianceRegisterReminder[]> {
  const rows = await readRange("Compliance_Register!A1:J1000").catch(() => [] as string[][]);
  const reminders: ComplianceRegisterReminder[] = [];
  const closedStatuses = new Set(["submitted", "paid", "complete", "completed", "done", "closed"]);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row.some((cell) => text(cell))) continue;

    const id = text(row[0]);
    const dueDate = text(row[4]);
    const status = text(row[5]) || "Not Started";
    const sourceProof = text(row[7]);
    if (!id) continue;

    const days = dueDate ? daysUntil(dueDate) : 9999;
    const isClosed = closedStatuses.has(status.toLowerCase());
    const stage = isClosed && !sourceProof
      ? "missing_proof"
      : dueDate
        ? registerReminderStage(days)
        : null;
    if (!stage) continue;

    reminders.push({
      id,
      area: text(row[1]) || "Compliance",
      obligation: text(row[2]) || "Kewajiban compliance",
      period: text(row[3]) || "TBA",
      dueDate,
      status,
      owner: text(row[6]) || "Compliance/Finance",
      sourceProof,
      riskLevel: text(row[8]) || "TBA",
      notes: text(row[9]),
      daysUntilDue: days,
      reminderStage: stage,
    });
  }

  return reminders.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

// ── Run Compliance Check ───────────────────────────────────────────

export async function runComplianceCheck(): Promise<ComplianceReport> {
  const [bpom, halal, register] = await Promise.all([
    readBPOMEntries(),
    readHalalEntries(),
    readComplianceRegisterReminders(),
  ]);

  const expired = [...bpom.filter((b) => b.status === "expired"), ...halal.filter((h) => h.status === "expired")].length;
  const expiringSoon = [...bpom.filter((b) => b.status === "expiring_soon"), ...halal.filter((h) => h.status === "expiring_soon")].length;
  const valid = [...bpom.filter((b) => b.status === "valid"), ...halal.filter((h) => h.status === "valid")].length;

  return {
    timestamp: new Date().toISOString(),
    bpom,
    halal,
    register,
    totalAlerts: expired + expiringSoon + register.length,
    expired,
    expiringSoon,
    valid,
  };
}

// ── Format for Telegram ────────────────────────────────────────────

export function formatComplianceForTelegram(report: ComplianceReport): string {
  if (report.totalAlerts === 0) {
    return `✅ <b>Compliance Check</b>\n📅 ${new Date(report.timestamp).toLocaleString("id-ID")}\n\nSemua sertifikat valid. Tidak ada yang akan expire.`;
  }

  let text = `⚠️ <b>COMPLIANCE ALERT</b>\n📅 ${new Date(report.timestamp).toLocaleString("id-ID")}\n\n`;

  if (report.expired > 0) {
    text += `🔴 <b>${report.expired} EXPIRED:</b>\n`;
    const expiredItems = [...report.bpom.filter((b) => b.status === "expired"), ...report.halal.filter((h) => h.status === "expired")];
    for (const item of expiredItems.slice(0, 5)) {
      text += `   ❌ ${item.productName} — Expired: ${item.expiryDate}\n`;
    }
    text += `\n`;
  }

  if (report.expiringSoon > 0) {
    text += `🟡 <b>${report.expiringSoon} EXPIRING SOON (≤30 hari):</b>\n`;
    const expiringItems = [...report.bpom.filter((b) => b.status === "expiring_soon"), ...report.halal.filter((h) => h.status === "expiring_soon")];
    for (const item of expiringItems.slice(0, 5)) {
      text += `   ⏰ ${item.productName} — ${item.daysUntilExpiry} hari lagi (${item.expiryDate})\n`;
    }
    text += `\n`;
  }

  if (report.register.length > 0) {
    text += `📋 <b>${report.register.length} GCG COMPLIANCE REGISTER REMINDER:</b>\n`;
    for (const item of report.register.slice(0, 8)) {
      const timing = item.reminderStage === "overdue"
        ? `${Math.abs(item.daysUntilDue)} hari overdue`
        : item.reminderStage === "missing_proof"
          ? "selesai tanpa proof URL"
          : item.reminderStage;
      text += `   • ${item.area} — ${item.obligation} (${item.period}) due ${item.dueDate || "TBA"} / ${timing}; owner ${item.owner}; proof ${item.sourceProof ? "ada" : "Belum dicatat"}\n`;
    }
    text += `\n`;
  }

  text += `📊 Valid: ${report.valid} | Expiring: ${report.expiringSoon} | Expired: ${report.expired} | Register reminders: ${report.register.length}\n`;
  text += `\n⚠️ <i>Agent hanya track — manusia harus perpanjangkan sertifikat/menyelesaikan kewajiban GCG; tidak ada status/proof fiktif.</i>`;
  return text;
}
