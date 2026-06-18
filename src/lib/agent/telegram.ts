// Telegram Bot Integration for SWI Agent
// Supports: alerts, approval requests (inline keyboard), health reports

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || ""; // Default chat for alerts
const TELEGRAM_APPROVAL_CHAT_ID = process.env.TELEGRAM_APPROVAL_CHAT_ID || TELEGRAM_CHAT_ID;

function getTelegramApiUrl(method: string): string {
  return `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`;
}

async function sendTelegramRequest(method: string, body: Record<string, unknown>): Promise<any> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("[Telegram] TELEGRAM_BOT_TOKEN not set, skipping send");
    return { ok: false, warning: "TELEGRAM_BOT_TOKEN not configured" };
  }

  const url = getTelegramApiUrl(method);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json();
}

// ── Send plain text message ──
export async function sendTelegramMessage(
  text: string,
  chatId: string = TELEGRAM_CHAT_ID
): Promise<any> {
  return sendTelegramRequest("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
}

// ── Send alert with severity emoji ──
export async function sendTelegramAlert(params: {
  title: string;
  detail: string;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  actionUrl?: string;
  chatId?: string;
}): Promise<any> {
  const emoji = { critical: "🔴", high: "🟠", medium: "🟡", low: "🔵" }[params.severity];
  const text = `${emoji} <b>[${params.category.toUpperCase()}] ${params.title}</b>\n\n${params.detail}${
    params.actionUrl ? `\n\n🔗 ${params.actionUrl}` : ""
  }`;
  return sendTelegramMessage(text, params.chatId);
}

// ── Send approval request with inline keyboard ──
export async function sendTelegramApproval(params: {
  approvalId: string;
  title: string;
  description: string;
  amount?: number;
  agentAction: string;
  chatId?: string;
}): Promise<any> {
  const amountText = params.amount
    ? `\n💰 <b>Amount:</b> Rp ${params.amount.toLocaleString("id-ID")}`
    : "";
  const text = `⚠️ <b>APPROVAL REQUIRED</b>\n\n📋 <b>${params.title}</b>\n${amountText}\n\n📝 ${params.description}\n\n🤖 <b>Agent Action:</b> ${params.agentAction}`;

  return sendTelegramRequest("sendMessage", {
    chat_id: params.chatId || TELEGRAM_APPROVAL_CHAT_ID,
    text,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ APPROVE", callback_data: `approve:${params.approvalId}` },
          { text: "❌ REJECT", callback_data: `reject:${params.approvalId}` },
        ],
      ],
    },
  });
}

// ── Answer callback query (after button press) ──
export async function answerCallbackQuery(
  callbackQueryId: string,
  text: string
): Promise<any> {
  return sendTelegramRequest("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: true,
  });
}

// ── Edit message after approval/rejection ──
export async function editMessageText(
  messageId: number,
  chatId: string,
  newText: string
): Promise<any> {
  return sendTelegramRequest("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text: newText,
    parse_mode: "HTML",
  });
}

// ── Send health check report ──
export async function sendHealthReport(report: {
  status: "healthy" | "degraded" | "critical";
  checks: { name: string; status: "ok" | "warn" | "fail"; detail: string }[];
  timestamp: string;
}): Promise<any> {
  const emoji = { healthy: "🟢", degraded: "🟡", critical: "🔴" }[report.status];
  let text = `${emoji} <b>SWI Agent Health Report</b>\n📅 ${report.timestamp}\n\n`;

  for (const check of report.checks) {
    const checkEmoji = { ok: "✅", warn: "⚠️", fail: "❌" }[check.status];
    text += `${checkEmoji} <b>${check.name}</b>: ${check.detail}\n`;
  }

  text += `\n📊 <b>Overall: ${report.status.toUpperCase()}</b>`;
  return sendTelegramMessage(text);
}

// ── Check if Telegram is configured ──
export function isTelegramConfigured(): boolean {
  return !!TELEGRAM_BOT_TOKEN && !!TELEGRAM_CHAT_ID;
}
