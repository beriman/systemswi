// GET /api/email — List emails
// GET /api/email/[id] — Get single email
// POST /api/email/send — Send email
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import fs from "fs";

const TOKEN_PATH = "/home/ubuntu/.hermes/google_token.json";

function getGmailClient() {
  const content = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
  const oauth2 = new google.auth.OAuth2(
    content.client_id,
    content.client_secret,
    "http://localhost:1"
  );
  oauth2.setCredentials({
    refresh_token: content.refresh_token,
    access_token: content.token,
    token_type: "Bearer",
    expiry_date: content.expiry,
  });
  return google.gmail({ version: "v1", auth: oauth2 });
}

function isAuthError(err: unknown): boolean {
  const msg = String(err);
  return msg.includes("invalid_grant") || msg.includes("Unauthorized") || msg.includes("401") || msg.includes("403");
}

function parseMessage(msg: any): any {
  const headers = msg.payload?.headers || [];
  const headerMap: Record<string, string> = {};
  for (const h of headers) {
    headerMap[h.name.toLowerCase()] = h.value;
  }
  return {
    id: msg.id,
    threadId: msg.threadId,
    from: headerMap["from"] || "",
    to: headerMap["to"] || "",
    subject: headerMap["subject"] || "(no subject)",
    date: headerMap["date"] || "",
    snippet: msg.snippet || "",
    labelIds: msg.labelIds || [],
  };
}

// GET /api/email — list emails
export async function GET(req: NextRequest) {
  try {
    const gmail = getGmailClient();
    const url = new URL(req.url);
    const maxResults = parseInt(url.searchParams.get("max") || "25", 10);
    const query = url.searchParams.get("q") || "";
    const label = url.searchParams.get("label") || "";

    const params: any = { userId: "me", maxResults };
    if (query) params.q = query;
    if (label) params.labelIds = [label];

    const result = await gmail.users.messages.list(params);
    const messages = await Promise.all(
      (result.data.messages || []).map(async (m: any) => {
        const full = await gmail.users.messages.get({
          userId: "me", id: m.id, format: "metadata",
          metadataHeaders: ["From", "To", "Subject", "Date"],
        });
        return parseMessage(full.data);
      })
    );

    return NextResponse.json({
      messages,
      total: result.data.resultSizeEstimate || messages.length,
      nextPageToken: result.data.nextPageToken || null,
      source: "Gmail API",
      sourceStatus: "live",
    });
  } catch (error) {
    if (isAuthError(error)) {
      return NextResponse.json({
        messages: [],
        source: "Gmail API",
        sourceStatus: "blocked",
        error: "Google OAuth token tidak valid. Re-auth diperlukan.",
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to fetch emails", details: String(error) }, { status: 500 });
  }
}

// POST /api/email/send — send email
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, body: emailBody, cc, bcc } = body;

    if (!to || !subject || !emailBody) {
      return NextResponse.json({ error: "to, subject, body are required" }, { status: 400 });
    }

    const gmail = getGmailClient();

    const lines = [
      `To: ${to}`,
      cc ? `Cc: ${cc}` : null,
      bcc ? `Bcc: ${bcc}` : null,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      emailBody,
    ].filter(Boolean).join("\r\n");

    const encoded = Buffer.from(lines).toString("base64url");

    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encoded },
    });

    return NextResponse.json({
      success: true,
      messageId: result.data.id,
      threadId: result.data.threadId,
      source: "Gmail API",
    }, { status: 201 });
  } catch (error) {
    if (isAuthError(error)) {
      return NextResponse.json({
        error: "Google OAuth token tidak valid",
        sourceStatus: "blocked",
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to send email", details: String(error) }, { status: 500 });
  }
}
