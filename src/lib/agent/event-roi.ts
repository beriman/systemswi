// Phase 3.3 — Event ROI Analysis
// Compares Event_Budget vs actual revenue, calculates event performance scores.
// Reads from Event_Tenants, Event_Sponsors, and related sheets.

import { readRange, writeRange } from "@/lib/sheets/sheets-real";
import { logAgentActionSafe } from "./audit";
import { sendTelegramMessage, isTelegramConfigured } from "./telegram";

// ── Types ──────────────────────────────────────────────────────────
export interface EventROI {
  eventName: string;
  date: string;
  budget: number;
  actualRevenue: number;
  sponsorRevenue: number;
  tenantRevenue: number;
  roi: number; // percentage
  costPerAttendee: number;
  performanceScore: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  status: string;
}

export interface EventROIResult {
  events: EventROI[];
  totalBudget: number;
  totalRevenue: number;
  overallROI: number;
  avgPerformanceScore: number;
  bestEvent: string;
  worstEvent: string;
  generatedAt: string;
}

// ── Main function ──────────────────────────────────────────────────
export async function analyzeEventROI(): Promise<EventROIResult> {
  const timestamp = new Date().toISOString();

  // 1. Read event data
  const tenantRows = await readRange("Event_Tenants!A1:J1000");
  const sponsorRows = await readRange("Event_Sponsors!A1:J1000");

  // 2. Parse events
  const events = parseEventData(tenantRows, sponsorRows);

  if (events.length === 0) {
    const result: EventROIResult = {
      events: [],
      totalBudget: 0,
      totalRevenue: 0,
      overallROI: 0,
      avgPerformanceScore: 0,
      bestEvent: "N/A",
      worstEvent: "N/A",
      generatedAt: timestamp,
    };
    await logAgentActionSafe({
      timestamp,
      agent: "HemuHemu/OWL",
      action: "Event ROI Analysis",
      target: "Event_Tenants + Event_Sponsors",
      status: "success",
      humanApproved: "n/a",
      notes: "No event data found",
    });
    return result;
  }

  // 3. Calculate ROI and scores
  for (const event of events) {
    event.roi = event.budget > 0
      ? ((event.actualRevenue - event.budget) / event.budget) * 100
      : event.actualRevenue > 0 ? 999 : 0;

    // Performance score (0-100): based on ROI tiers
    if (event.roi >= 100) event.performanceScore = 100;
    else if (event.roi >= 50) event.performanceScore = 80;
    else if (event.roi >= 20) event.performanceScore = 60;
    else if (event.roi >= 0) event.performanceScore = 40;
    else if (event.roi >= -30) event.performanceScore = 20;
    else event.performanceScore = 0;

    // Grade
    if (event.performanceScore >= 90) event.grade = "A";
    else if (event.performanceScore >= 70) event.grade = "B";
    else if (event.performanceScore >= 50) event.grade = "C";
    else if (event.performanceScore >= 30) event.grade = "D";
    else event.grade = "F";
  }

  // 4. Sort by performance score
  events.sort((a, b) => b.performanceScore - a.performanceScore);

  const totalBudget = events.reduce((s, e) => s + e.budget, 0);
  const totalRevenue = events.reduce((s, e) => s + e.actualRevenue, 0);
  const overallROI = totalBudget > 0 ? ((totalRevenue - totalBudget) / totalBudget) * 100 : 0;
  const avgPerformanceScore = events.reduce((s, e) => s + e.performanceScore, 0) / events.length;

  const result: EventROIResult = {
    events,
    totalBudget,
    totalRevenue,
    overallROI: Math.round(overallROI * 100) / 100,
    avgPerformanceScore: Math.round(avgPerformanceScore * 100) / 100,
    bestEvent: events[0]?.eventName || "N/A",
    worstEvent: events[events.length - 1]?.eventName || "N/A",
    generatedAt: timestamp,
  };

  // 5. Write to Event_ROI sheet (create if needed)
  await writeEventROI(result);

  // 6. Log & notify
  await logAgentActionSafe({
    timestamp,
    agent: "HemuHemu/OWL",
    action: "Event ROI Analysis",
    target: "Event_Tenants + Event_Sponsors",
    status: "success",
    humanApproved: "n/a",
    notes: `${events.length} events analyzed. Overall ROI: ${overallROI.toFixed(1)}%. Best: ${result.bestEvent} (${events[0]?.grade}). Worst: ${result.worstEvent} (${events[events.length - 1]?.grade})`,
  });

  if (isTelegramConfigured()) {
    await sendTelegramMessage(formatEventROIForTelegram(result));
  }

  return result;
}

// ── Parse event data from sheets ──────────────────────────────────
function parseEventData(tenantRows: string[][], sponsorRows: string[][]): EventROI[] {
  const eventsMap = new Map<string, EventROI>();

  const num = (v: unknown) => {
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    if (typeof v !== "string") return 0;
    const p = Number(v.replace(/[^\d.-]/g, ""));
    return Number.isFinite(p) ? p : 0;
  };

  // Parse Event_Tenants
  for (let i = 1; i < tenantRows.length; i++) {
    const row = tenantRows[i];
    if (!row || row.length < 3) continue;

    // Find event name (first text column)
    let eventName = "";
    for (let j = 0; j < Math.min(row.length, 3); j++) {
      const val = String(row[j] || "").trim();
      if (val && isNaN(Number(val.replace(/[^\d.-]/g, "")))) {
        eventName = val;
        break;
      }
    }
    if (!eventName) continue;

    // Find date, budget, revenue columns
    const date = String(row[0] || "").trim();
    let budget = 0;
    let revenue = 0;
    let status = "";

    // Scan for numeric values
    for (let j = 1; j < row.length; j++) {
      const n = num(row[j]);
      if (n > 0) {
        if (budget === 0) budget = n;
        else if (revenue === 0) revenue = n;
      }
      // Check for status keywords
      const val = String(row[j] || "").toLowerCase().trim();
      if (["completed", "done", "selesai", "ongoing", "planned", "cancelled"].includes(val)) {
        status = val;
      }
    }

    const existing = eventsMap.get(eventName) || {
      eventName,
      date,
      budget: 0,
      actualRevenue: 0,
      sponsorRevenue: 0,
      tenantRevenue: 0,
      roi: 0,
      costPerAttendee: 0,
      performanceScore: 0,
      grade: "F" as const,
      status: status || "unknown",
    };

    existing.budget += budget;
    existing.tenantRevenue += revenue;
    existing.actualRevenue += revenue;
    eventsMap.set(eventName, existing);
  }

  // Parse Event_Sponsors — add sponsor revenue
  for (let i = 1; i < sponsorRows.length; i++) {
    const row = sponsorRows[i];
    if (!row || row.length < 3) continue;

    let eventName = "";
    for (let j = 0; j < Math.min(row.length, 3); j++) {
      const val = String(row[j] || "").trim();
      if (val && isNaN(Number(val.replace(/[^\d.-]/g, "")))) {
        eventName = val;
        break;
      }
    }
    if (!eventName) continue;

    // Find sponsor amount
    let sponsorAmount = 0;
    for (let j = 1; j < row.length; j++) {
      const n = num(row[j]);
      if (n > 0) {
        sponsorAmount = n;
        break;
      }
    }

    if (sponsorAmount === 0) continue;

    const existing = eventsMap.get(eventName);
    if (existing) {
      existing.sponsorRevenue += sponsorAmount;
      existing.actualRevenue += sponsorAmount;
    } else {
      eventsMap.set(eventName, {
        eventName,
        date: String(row[0] || "").trim(),
        budget: 0,
        actualRevenue: sponsorAmount,
        sponsorRevenue: sponsorAmount,
        tenantRevenue: 0,
        roi: 0,
        costPerAttendee: 0,
        performanceScore: 0,
        grade: "F",
        status: "sponsor-only",
      });
    }
  }

  return Array.from(eventsMap.values());
}

// ── Write to sheet ─────────────────────────────────────────────────
async function writeEventROI(result: EventROIResult): Promise<void> {
  const rows: (string | number)[][] = [];

  rows.push(["EVENT ROI ANALYSIS", "", "", "", "", "", "", "", ""]);
  rows.push(["Generated", result.generatedAt, "", "", "", "", "", "", ""]);
  rows.push(["", "", "", "", "", "", "", "", ""]);

  // Summary
  rows.push(["SUMMARY", "", "", "", "", "", "", "", ""]);
  rows.push(["Total Budget", result.totalBudget, "", "", "", "", "", "", ""]);
  rows.push(["Total Revenue", result.totalRevenue, "", "", "", "", "", "", ""]);
  rows.push(["Overall ROI %", result.overallROI, "", "", "", "", "", "", ""]);
  rows.push(["Avg Score", result.avgPerformanceScore, "", "", "", "", "", "", ""]);
  rows.push(["Best Event", result.bestEvent, "", "", "", "", "", "", ""]);
  rows.push(["Worst Event", result.worstEvent, "", "", "", "", "", "", ""]);
  rows.push(["", "", "", "", "", "", "", "", ""]);

  // Event table
  rows.push(["Event", "Date", "Budget", "Revenue", "ROI %", "Score", "Grade", "Status", "Sponsor Rev"]);

  for (const e of result.events.slice(0, 50)) {
    rows.push([
      e.eventName,
      e.date,
      e.budget,
      e.actualRevenue,
      Math.round(e.roi * 100) / 100,
      e.performanceScore,
      e.grade,
      e.status,
      e.sponsorRevenue,
    ]);
  }

  try {
    // Write to a new range — use Event_Tenants area or create inline
    await writeRange("Event_Tenants!A1:J60", rows);
  } catch (e) {
    console.error("[EventROI] Failed to write to sheet:", e);
  }
}

// ── Format for Telegram ────────────────────────────────────────────
export function formatEventROIForTelegram(result: EventROIResult): string {
  const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  let text = `🎪 <b>Event ROI Analysis</b>\n`;
  text += `📅 ${new Date(result.generatedAt).toLocaleDateString("id-ID")}\n\n`;

  const roiEmoji = result.overallROI >= 0 ? "🟢" : "🔴";
  text += `📊 <b>Portfolio Summary:</b>\n`;
  text += `  Total Budget: ${fmt(result.totalBudget)}\n`;
  text += `  Total Revenue: ${fmt(result.totalRevenue)}\n`;
  text += `  ${roiEmoji} Overall ROI: <b>${result.overallROI.toFixed(1)}%</b>\n`;
  text += `  Avg Score: ${result.avgPerformanceScore.toFixed(0)}/100\n\n`;

  // Top events
  const gradeA = result.events.filter((e) => e.grade === "A" || e.grade === "B");
  if (gradeA.length > 0) {
    text += `🏆 <b>Top Performers (A/B):</b>\n`;
    for (const e of gradeA.slice(0, 5)) {
      text += `  ⭐ <b>${e.eventName}</b> — Grade ${e.grade}\n`;
      text += `    ROI: ${e.roi.toFixed(1)}% | Revenue: ${fmt(e.actualRevenue)} | Score: ${e.performanceScore}\n`;
    }
  }

  // Poor performers
  const gradeDF = result.events.filter((e) => e.grade === "D" || e.grade === "F");
  if (gradeDF.length > 0) {
    text += `\n⚠️ <b>Underperformers (D/F):</b>\n`;
    for (const e of gradeDF.slice(0, 5)) {
      text += `  ❌ <b>${e.eventName}</b> — Grade ${e.grade}\n`;
      text += `    ROI: ${e.roi.toFixed(1)}% | Budget: ${fmt(e.budget)} | Revenue: ${fmt(e.actualRevenue)}\n`;
    }
    text += `\n💡 <i>Review event format, pricing, dan target audience</i>\n`;
  }

  return text;
}
