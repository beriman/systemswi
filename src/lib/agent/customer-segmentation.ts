// Phase 3.4 — Customer Segmentation (RFM Analysis)
// Reads Customer_Master + Customer_Interactions, performs RFM analysis,
// assigns segment labels, and writes results back.

import { readRange, writeRange } from "@/lib/sheets/sheets-real";
import { logAgentActionSafe } from "./audit";
import { sendTelegramMessage, isTelegramConfigured } from "./telegram";

// ── Types ──────────────────────────────────────────────────────────
export interface CustomerRFM {
  customerId: string;
  customerName: string;
  recency: number; // days since last purchase
  frequency: number; // number of purchases
  monetary: number; // total spend
  rScore: number; // 1-5
  fScore: number; // 1-5
  mScore: number; // 1-5
  rfmScore: number; // sum of R+F+M
  segment: CustomerSegment;
  clv: number; // customer lifetime value estimate
  lastPurchaseDate: string;
  avgOrderValue: number;
}

export type CustomerSegment =
  | "Champions"       // R=5, F=5, M=5 — best customers
  | "Loyal Customers" // F=4-5, M=4-5 — buy often & spend
  | "Potential Loyal" // R=3-4, F=2-3 — recent with potential
  | "New Customers"   // R=5, F=1-2 — first-time buyers
  | "Promising"       // R=4, F=1-2 — recent but low frequency
  | "Need Attention"  // R=3, F=3-4 — declining from good
  | "About to Sleep"  // R=2, F=2-3 — at risk of churning
  | "At Risk"         // R=1-2, F=4-5 — were good but gone
  | "Hibernating"     // R=1-2, F=1-2, M=1-2 — low activity
  | "Lost";           // R=1, F=1 — completely inactive

export interface SegmentationResult {
  customers: CustomerRFM[];
  segmentCounts: Record<CustomerSegment, number>;
  totalCustomers: number;
  totalRevenue: number;
  avgCLV: number;
  topSegment: string;
  generatedAt: string;
}

// ── Main function ──────────────────────────────────────────────────
export async function performRFMSegmentation(): Promise<SegmentationResult> {
  const timestamp = new Date().toISOString();

  // 1. Read customer data
  const customerRows = await readRange("Customer_Master!A1:M1000");
  const interactionRows = await readRange("Customer_Interactions!A1:J1000");

  // 2. Parse customers
  const customers = parseCustomerRFM(customerRows, interactionRows);

  if (customers.length === 0) {
    const emptyCounts = getEmptySegmentCounts();
    const result: SegmentationResult = {
      customers: [],
      segmentCounts: emptyCounts,
      totalCustomers: 0,
      totalRevenue: 0,
      avgCLV: 0,
      topSegment: "N/A",
      generatedAt: timestamp,
    };
    await logAgentActionSafe({
      timestamp,
      agent: "HemuHemu/OWL",
      action: "Customer RFM Segmentation",
      target: "Customer_Master + Customer_Interactions",
      status: "success",
      humanApproved: "n/a",
      notes: "No customer data found",
    });
    return result;
  }

  // 3. Score RFM using quintiles
  scoreRFM(customers);

  // 4. Assign segments
  for (const c of customers) {
    c.segment = assignSegment(c.rScore, c.fScore, c.mScore);
    c.rfmScore = c.rScore + c.fScore + c.mScore;

    // Estimate CLV: avg order value × frequency × 24 months
    c.avgOrderValue = c.frequency > 0 ? c.monetary / c.frequency : 0;
    c.clv = c.avgOrderValue * c.frequency * 12; // 12-month projection
  }

  // 5. Sort by RFM score descending
  customers.sort((a, b) => b.rfmScore - a.rfmScore);

  // 6. Calculate segment counts
  const segmentCounts = getEmptySegmentCounts();
  for (const c of customers) {
    segmentCounts[c.segment]++;
  }

  const totalRevenue = customers.reduce((s, c) => s + c.monetary, 0);
  const avgCLV = customers.length > 0
    ? customers.reduce((s, c) => s + c.clv, 0) / customers.length
    : 0;

  // Find top segment
  let topSegment = "N/A";
  let topCount = 0;
  for (const [seg, count] of Object.entries(segmentCounts)) {
    if (count > topCount) {
      topCount = count;
      topSegment = seg;
    }
  }

  const result: SegmentationResult = {
    customers,
    segmentCounts,
    totalCustomers: customers.length,
    totalRevenue,
    avgCLV: Math.round(avgCLV),
    topSegment,
    generatedAt: timestamp,
  };

  // 7. Write results
  await writeSegmentationResults(result);

  // 8. Log & notify
  await logAgentActionSafe({
    timestamp,
    agent: "HemuHemu/OWL",
    action: "Customer RFM Segmentation",
    target: "Customer_Master + Customer_Interactions",
    status: "success",
    humanApproved: "n/a",
    notes: `${customers.length} customers segmented. Top: ${topSegment} (${topCount}). Champions: ${segmentCounts["Champions"]}. At Risk: ${segmentCounts["At Risk"] + segmentCounts["About to Sleep"]}`,
  });

  if (isTelegramConfigured()) {
    await sendTelegramMessage(formatSegmentationForTelegram(result));
  }

  return result;
}

// ── Parse customer data ────────────────────────────────────────────
function parseCustomerRFM(customerRows: string[][], interactionRows: string[][]): CustomerRFM[] {
  const customers: CustomerRFM[] = [];
  const now = new Date();

  const num = (v: unknown) => {
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    if (typeof v !== "string") return 0;
    const p = Number(v.replace(/[^\d.-]/g, ""));
    return Number.isFinite(p) ? p : 0;
  };

  // Parse Customer_Master
  for (let i = 1; i < customerRows.length; i++) {
    const row = customerRows[i];
    if (!row || row.length < 3) continue;

    // Find customer name and ID
    let customerName = "";
    let customerId = "";

    for (let j = 0; j < Math.min(row.length, 3); j++) {
      const val = String(row[j] || "").trim();
      if (val) {
        if (!customerId) customerId = val;
        else if (!customerName) customerName = val;
      }
    }

    if (!customerName) customerName = customerId;
    if (!customerName) continue;

    // Find CLV or total spend column
    let clv = 0;
    for (let j = 1; j < row.length; j++) {
      const n = num(row[j]);
      if (n > 1000) { // likely a monetary value
        clv = Math.max(clv, n);
      }
    }

    customers.push({
      customerId: customerId || `CUST-${i}`,
      customerName,
      recency: 0, // will be calculated from interactions
      frequency: 0,
      monetary: clv,
      rScore: 0,
      fScore: 0,
      mScore: 0,
      rfmScore: 0,
      segment: "Hibernating",
      clv,
      lastPurchaseDate: "",
      avgOrderValue: 0,
    });
  }

  // Enrich with interaction data
  for (let i = 1; i < interactionRows.length; i++) {
    const row = interactionRows[i];
    if (!row || row.length < 3) continue;

    // Find customer reference in interaction
    let customerRef = "";
    let interactionDate = "";
    let amount = 0;

    for (let j = 0; j < row.length; j++) {
      const val = String(row[j] || "").trim();
      if (!val) continue;

      // Check if it looks like a date
      if (/^\d{4}-\d{2}-\d{2}/.test(val) || /^\d{2}\/\d{2}\/\d{4}/.test(val)) {
        if (!interactionDate) interactionDate = val;
        continue;
      }

      // Check if it's numeric
      const n = num(val);
      if (n > 1000 && amount === 0) {
        amount = n;
        continue;
      }

      // Otherwise it might be a customer name/reference
      if (!customerRef && val.length > 2) {
        customerRef = val;
      }
    }

    if (!customerRef) continue;

    // Match to existing customer (fuzzy match)
    const customer = customers.find((c) =>
      c.customerName.toLowerCase().includes(customerRef.toLowerCase()) ||
      customerRef.toLowerCase().includes(c.customerName.toLowerCase())
    );

    if (customer) {
      customer.frequency++;
      if (amount > 0) customer.monetary += amount;

      if (interactionDate) {
        const d = new Date(interactionDate);
        if (!isNaN(d.getTime())) {
          const daysSince = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
          if (customer.recency === 0 || daysSince < customer.recency) {
            customer.recency = daysSince;
            customer.lastPurchaseDate = interactionDate;
          }
        }
      }
    }
  }

  // For customers without interactions, estimate recency from CLV
  for (const c of customers) {
    if (c.recency === 0 && c.monetary > 0) {
      c.recency = 90; // default: 90 days ago
    }
  }

  return customers;
}

// ── Score RFM using quintiles ──────────────────────────────────────
function scoreRFM(customers: CustomerRFM[]): void {
  if (customers.length < 5) {
    // Too few customers — assign median scores
    for (const c of customers) {
      c.rScore = 3;
      c.fScore = 3;
      c.mScore = 3;
    }
    return;
  }

  // Sort for scoring
  const byRecency = [...customers].sort((a, b) => a.recency - b.recency); // lower recency = better
  const byFrequency = [...customers].sort((a, b) => b.frequency - a.frequency); // higher = better
  const byMonetary = [...customers].sort((a, b) => b.monetary - a.monetary); // higher = better

  const n = customers.length;
  const quintileSize = Math.ceil(n / 5);

  // Assign R scores (recency: lower days = higher score)
  for (let i = 0; i < byRecency.length; i++) {
    const score = Math.min(5, Math.floor(i / quintileSize) + 1);
    byRecency[i].rScore = 6 - score; // invert: most recent = 5
  }

  // Assign F scores (frequency: higher = higher score)
  for (let i = 0; i < byFrequency.length; i++) {
    const score = Math.min(5, Math.floor(i / quintileSize) + 1);
    byFrequency[i].fScore = score;
  }

  // Assign M scores (monetary: higher = higher score)
  for (let i = 0; i < byMonetary.length; i++) {
    const score = Math.min(5, Math.floor(i / quintileSize) + 1);
    byMonetary[i].mScore = score;
  }
}

// ── Assign segment based on RFM scores ─────────────────────────────
function assignSegment(r: number, f: number, m: number): CustomerSegment {
  if (r >= 4 && f >= 4 && m >= 4) return "Champions";
  if (f >= 4 && m >= 4) return "Loyal Customers";
  if (r >= 3 && f >= 2 && f <= 3) return "Potential Loyal";
  if (r >= 4 && f <= 2) return "New Customers";
  if (r >= 3 && f <= 2) return "Promising";
  if (r === 3 && f >= 3) return "Need Attention";
  if (r <= 2 && f >= 2 && f <= 3) return "About to Sleep";
  if (r <= 2 && f >= 4) return "At Risk";
  if (r <= 2 && f <= 2 && m <= 2) return "Hibernating";
  if (r <= 1 && f <= 1) return "Lost";
  return "Hibernating";
}

// ── Empty segment counts ───────────────────────────────────────────
function getEmptySegmentCounts(): Record<CustomerSegment, number> {
  return {
    "Champions": 0,
    "Loyal Customers": 0,
    "Potential Loyal": 0,
    "New Customers": 0,
    "Promising": 0,
    "Need Attention": 0,
    "About to Sleep": 0,
    "At Risk": 0,
    "Hibernating": 0,
    "Lost": 0,
  };
}

// ── Write results ──────────────────────────────────────────────────
async function writeSegmentationResults(result: SegmentationResult): Promise<void> {
  const rows: (string | number)[][] = [];

  rows.push(["CUSTOMER RFM SEGMENTATION", "", "", "", "", "", "", "", "", ""]);
  rows.push(["Generated", result.generatedAt, "", "", "", "", "", "", "", ""]);
  rows.push(["", "", "", "", "", "", "", "", "", ""]);

  // Segment summary
  rows.push(["SEGMENT", "Count", "%", "", "", "", "", "", "", ""]);
  for (const [seg, count] of Object.entries(result.segmentCounts)) {
    const pct = result.totalCustomers > 0 ? ((count / result.totalCustomers) * 100).toFixed(1) : "0";
    rows.push([seg, count, `${pct}%`, "", "", "", "", "", "", ""]);
  }
  rows.push(["TOTAL", result.totalCustomers, "100%", "", "", "", "", "", "", ""]);
  rows.push(["", "", "", "", "", "", "", "", "", ""]);

  // Customer detail table
  rows.push(["Name", "Segment", "R", "F", "M", "RFM", "Recency(d)", "Frequency", "Monetary", "CLV"]);

  for (const c of result.customers.slice(0, 200)) {
    rows.push([
      c.customerName,
      c.segment,
      c.rScore,
      c.fScore,
      c.mScore,
      c.rfmScore,
      c.recency,
      c.frequency,
      c.monetary,
      c.clv,
    ]);
  }

  try {
    await writeRange("Customer_Master!A1:J210", rows);
  } catch (e) {
    console.error("[RFMSegmentation] Failed to write to sheet:", e);
  }
}

// ── Format for Telegram ────────────────────────────────────────────
export function formatSegmentationForTelegram(result: SegmentationResult): string {
  const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  let text = `👥 <b>Customer Segmentation (RFM Analysis)</b>\n`;
  text += `📅 ${new Date(result.generatedAt).toLocaleDateString("id-ID")}\n`;
  text += `📊 Total Customers: <b>${result.totalCustomers}</b>\n`;
  text += `💰 Total Revenue: ${fmt(result.totalRevenue)}\n`;
  text += `📈 Avg CLV: ${fmt(result.avgCLV)}\n\n`;

  // Segment breakdown
  text += `🏷️ <b>Segment Breakdown:</b>\n`;

  const emojiMap: Record<string, string> = {
    "Champions": "🏆",
    "Loyal Customers": "💎",
    "Potential Loyal": "🌟",
    "New Customers": "🆕",
    "Promising": "✨",
    "Need Attention": "⚠️",
    "About to Sleep": "😴",
    "At Risk": "🚨",
    "Hibernating": "💤",
    "Lost": "❌",
  };

  for (const [seg, count] of Object.entries(result.segmentCounts)) {
    if (count === 0) continue;
    const pct = result.totalCustomers > 0 ? ((count / result.totalCustomers) * 100).toFixed(1) : "0";
    const emoji = emojiMap[seg] || "📊";
    text += `  ${emoji} <b>${seg}</b>: ${count} (${pct}%)\n`;
  }

  // Action items
  const atRisk = result.segmentCounts["At Risk"] + result.segmentCounts["About to Sleep"];
  if (atRisk > 0) {
    text += `\n🚨 <b>Action Required:</b> ${atRisk} customers at risk of churning!\n`;
    text += `  💡 Kirim re-engagement campaign atau personal outreach.\n`;
  }

  const champions = result.segmentCounts["Champions"];
  if (champions > 0) {
    text += `\n🏆 <b>Champions:</b> ${champions} pelanggan terbaik — pertahankan dengan loyalty program.\n`;
  }

  return text;
}
