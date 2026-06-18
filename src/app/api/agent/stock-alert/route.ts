// GET /api/agent/stock-alert — Check inventory and return low stock items
// POST /api/agent/stock-alert — Check + send alerts via Telegram
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";
import { sendTelegramAlert, sendTelegramMessage, isTelegramConfigured } from "@/lib/agent";
import { logAgentActionSafe } from "@/lib/agent/audit";

export const runtime = "nodejs";

const text = (value: unknown) => String(value ?? "").trim();
const amount = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

function stockStatus(qty: number, minimumQty: number) {
  if (qty <= 0) return "empty";
  if (qty <= minimumQty * 0.5) return "critical";
  if (qty <= minimumQty) return "low";
  return "ok";
}

export async function GET() {
  try {
    const rows = await readRange("Inventory_Master!A1:O1000");
    const alerts = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row.some((cell) => cell && cell.trim())) continue;

      const itemId = text(row[0]) || text(row[1]);
      const name = text(row[2]);
      if (!itemId || !name) continue;

      const qty = amount(row[5]);
      const min = amount(row[6]);
      const reorder = amount(row[7]);
      const unit = text(row[4]) || "unit";
      const status = stockStatus(qty, min);

      if (status !== "ok") {
        alerts.push({
          id: itemId,
          name,
          qty,
          min,
          reorder,
          unit,
          status,
          severity: status === "empty" || status === "critical" ? "critical" : "high",
        });
      }
    }

    return NextResponse.json({
      source: "Google Sheets: Inventory_Master",
      alerts,
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === "critical").length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check stock", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const rows = await readRange("Inventory_Master!A1:O1000");
    const alerts = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row.some((cell) => cell && cell.trim())) continue;

      const itemId = text(row[0]) || text(row[1]);
      const name = text(row[2]);
      if (!itemId || !name) continue;

      const qty = amount(row[5]);
      const min = amount(row[6]);
      const reorder = amount(row[7]);
      const unit = text(row[4]) || "unit";
      const status = stockStatus(qty, min);

      if (status !== "ok") {
        alerts.push({
          id: itemId,
          name,
          qty,
          min,
          reorder,
          unit,
          status,
          severity: status === "empty" || status === "critical" ? "critical" : "high",
        });
      }
    }

    let telegramSent = false;
    if (isTelegramConfigured() && alerts.length > 0) {
      // Send summary
      const criticalCount = alerts.filter((a) => a.severity === "critical").length;
      const summaryText = `📦 <b>Stock Alert Report</b>
📅 ${new Date().toLocaleString("id-ID")}

⚠️ <b>${alerts.length} item perlu perhatian</b>
🔴 Critical/Empty: ${criticalCount}
🟠 Low Stock: ${alerts.length - criticalCount}

${alerts
  .slice(0, 10)
  .map((a) => {
    const emoji = a.severity === "critical" ? "🔴" : "🟠";
    return `${emoji} <b>${a.name}</b>: ${a.qty} ${a.unit} (min: ${a.min})`;
  })
  .join("\n")}

${alerts.length > 10 ? `\n...dan ${alerts.length - 10} item lainnya` : ""}`;

      await sendTelegramMessage(summaryText);
      telegramSent = true;
    }

    await logAgentActionSafe({
      timestamp: new Date().toISOString(),
      agent: "HemuHemu/OWL",
      action: "Stock Alert Check",
      target: "Inventory_Master",
      status: alerts.length > 0 ? "success" : "success",
      humanApproved: "n/a",
      notes: `${alerts.length} items below minimum stock`,
    });

    return NextResponse.json({
      alerts,
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === "critical").length,
      telegramSent,
      telegramConfigured: isTelegramConfigured(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check stock", details: String(error) },
      { status: 500 }
    );
  }
}
