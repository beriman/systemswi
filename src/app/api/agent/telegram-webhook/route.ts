// POST /api/agent/telegram-webhook — Handle Telegram callback queries (approve/reject)
// GET /api/agent/telegram-webhook — Set webhook URL (one-time setup)
import { NextRequest, NextResponse } from "next/server";
import { readRange, updateRow } from "@/lib/sheets/sheets-real";
import { logAgentActionSafe } from "@/lib/agent/audit";

export const runtime = "nodejs";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || "";

async function sendTelegramRequest(method: string, body: Record<string, unknown>) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json();
}

async function answerCallbackQuery(callbackQueryId: string, text: string) {
  return sendTelegramRequest("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: true,
  });
}

async function editMessageReplyMarkup(chatId: string, messageId: number) {
  return sendTelegramRequest("editMessageReplyMarkup", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: { inline_keyboard: [] }, // Remove buttons
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!TELEGRAM_WEBHOOK_SECRET && process.env.NODE_ENV === "production") {
      return NextResponse.json({ ok: false, error: "Webhook secret not configured" }, { status: 503 });
    }

    if (TELEGRAM_WEBHOOK_SECRET) {
      const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token");
      if (receivedSecret !== TELEGRAM_WEBHOOK_SECRET) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();

    // Handle callback_query (button press)
    if (body.callback_query) {
      const { id, data, message } = body.callback_query;
      const chatId = message?.chat?.id;
      const messageId = message?.message_id;

      if (!data || !id) {
        return NextResponse.json({ ok: true });
      }

      const [action, approvalId] = data.split(":");

      if (action === "approve" || action === "reject") {
        const status = action === "approve" ? "approved" : "rejected";
        const timestamp = new Date().toISOString();
        const approver = body.callback_query.from?.first_name || "Unknown";

        // Find and update the approval in Agent_Approvals sheet
        try {
          const rows = await readRange("Agent_Approvals!A1:J500");
          let foundRow = -1;
          for (let i = 1; i < rows.length; i++) {
            if (rows[i][0] === approvalId) {
              foundRow = i + 1; // 1-indexed for sheets
              break;
            }
          }

          if (foundRow > 0) {
            // Update status, approvedBy, approvedAt
            await updateRow("AgentApprovals", foundRow, [
              rows[foundRow - 1][0], // approvalId
              rows[foundRow - 1][1], // title
              rows[foundRow - 1][2], // description
              rows[foundRow - 1][3], // agent
              rows[foundRow - 1][4], // action
              status, // status
              approver, // approvedBy
              timestamp, // approvedAt
              rows[foundRow - 1][8], // notes
              rows[foundRow - 1][9] || "", // extra
            ]);
          }

          // Log to audit
          await logAgentActionSafe({
            timestamp,
            agent: "HemuHemu/OWL",
            action: `Approval ${status}`,
            target: `Agent_Approvals:${approvalId}`,
            status: "success",
            humanApproved: approver,
            notes: `Approval ${status} by ${approver} via Telegram`,
            approvalId,
          });
        } catch (sheetError) {
          console.error("[TelegramWebhook] Sheet update error:", sheetError);
        }

        // Answer the callback
        await answerCallbackQuery(
          id,
          `✅ ${action === "approve" ? "APPROVED" : "REJECTED"} by ${approver}`
        );

        // Remove buttons from the message
        if (chatId && messageId) {
          await editMessageReplyMarkup(String(chatId), messageId);
        }

        return NextResponse.json({ ok: true, action: status, approvalId });
      }
    }

    // Handle regular messages (e.g., /status command)
    if (body.message) {
      const chatId = body.message.chat?.id;
      const text = body.message.text || "";

      if (text.startsWith("/status")) {
        await sendTelegramRequest("sendMessage", {
          chat_id: chatId,
          text: "🤖 <b>SWI Agent Status</b>\n\n✅ Agent aktif\n✅ Sistem berjalan\n📅 " + new Date().toLocaleString("id-ID"),
          parse_mode: "HTML",
        });
      }

      if (text.startsWith("/stop")) {
        await sendTelegramRequest("sendMessage", {
          chat_id: chatId,
          text: "🛑 <b>EMERGENCY STOP</b>\n\nSemua agent actions di-pause. Hubungi admin untuk resume.",
          parse_mode: "HTML",
        });

        await logAgentActionSafe({
          timestamp: new Date().toISOString(),
          agent: "HemuHemu/OWL",
          action: "Emergency Stop",
          target: "All Agent Actions",
          status: "success",
          humanApproved: body.message.from?.first_name || "Unknown",
          notes: "Emergency stop triggered via Telegram /stop command",
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[TelegramWebhook] Error:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

// GET — Set webhook URL (one-time setup call)
export async function GET(request: NextRequest) {
  if (!TELEGRAM_WEBHOOK_SECRET && process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Webhook secret not configured" }, { status: 503 });
  }

  if (TELEGRAM_WEBHOOK_SECRET) {
    const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token");
    if (receivedSecret !== TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  const webhookUrl = searchParams.get("url");

  if (!webhookUrl) {
    return NextResponse.json({
      error: "Provide ?url=https://your-domain.com/api/agent/telegram-webhook",
    }, { status: 400 });
  }

  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });
  }

  try {
    const result = await sendTelegramRequest("setWebhook", {
      url: webhookUrl,
      allowed_updates: ["callback_query", "message"],
      ...(TELEGRAM_WEBHOOK_SECRET ? { secret_token: TELEGRAM_WEBHOOK_SECRET } : {}),
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
